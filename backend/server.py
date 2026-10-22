import logging
import math
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / ".env")

try:
    from backend.clerk_auth import clerk_router, require_user
    from backend.storage import APP_NAME, get_object, init_storage, put_object
except ModuleNotFoundError:
    from clerk_auth import clerk_router, require_user
    from storage import APP_NAME, get_object, init_storage, put_object

logger = logging.getLogger("newmusiq")
logging.basicConfig(level=logging.INFO)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

TRACK_KEY = "golden-moon"
PHOTO_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Profile(BaseModel):
    user_id: str
    email: str = ""
    display_name: str = ""
    country: str = ""
    state: str = ""
    zip_code: str = ""
    has_photo: bool = False
    completed: bool = False


class Comment(BaseModel):
    id: str
    display_name: str
    message: str
    created_at: str
    pending: bool


class CommentIn(BaseModel):
    message: str = Field(min_length=1, max_length=600)


def profile_out(doc: Optional[dict], user_id: str) -> Profile:
    if not doc:
        return Profile(user_id=user_id)
    return Profile(
        user_id=user_id,
        email=doc.get("email", ""),
        display_name=doc.get("display_name", ""),
        country=doc.get("country", ""),
        state=doc.get("state", ""),
        zip_code=doc.get("zip_code", ""),
        has_photo=bool(doc.get("photo_path")),
        completed=bool(doc.get("completed")),
    )


def comment_out(doc: dict) -> Comment:
    return Comment(
        id=doc["id"],
        display_name=doc["display_name"],
        message=doc["message"],
        created_at=doc["created_at"],
        pending=doc["status"] == "pending",
    )


@api_router.get("/")
async def root():
    return {"message": "NewMusiq API"}


@api_router.get("/me", response_model=Profile)
async def get_me(user: dict = Depends(require_user)):
    doc = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return profile_out(doc, user["user_id"])


@api_router.put("/me", response_model=Profile)
async def update_me(
    display_name: str = Form(...),
    country: str = Form(...),
    state: str = Form(...),
    zip_code: str = Form(...),
    email: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    user: dict = Depends(require_user),
):
    fields = {k: v.strip() for k, v in {
        "display_name": display_name, "country": country, "state": state, "zip_code": zip_code,
    }.items()}
    if not all(fields.values()):
        raise HTTPException(status_code=400, detail="Complete all fields to continue.")
    if len(fields["display_name"]) > 60 or len(fields["zip_code"]) > 12:
        raise HTTPException(status_code=400, detail="Some fields are too long.")

    update = {**fields, "email": email.strip()[:200], "completed": True, "updated_at": now_iso()}
    if photo is not None and photo.filename:
        if photo.content_type not in PHOTO_TYPES:
            raise HTTPException(status_code=400, detail="Photo must be PNG, JPG or WEBP.")
        data = await photo.read()
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=400, detail="Photo must be under 5 MB.")
        path = f"{APP_NAME}/avatars/{user['user_id']}/{uuid.uuid4()}.{PHOTO_TYPES[photo.content_type]}"
        result = await run_in_threadpool(put_object, path, data, photo.content_type)
        update["photo_path"] = result["path"]
        update["photo_type"] = photo.content_type

    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": update, "$setOnInsert": {"user_id": user["user_id"], "created_at": now_iso()}},
        upsert=True,
    )
    doc = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return profile_out(doc, user["user_id"])


@api_router.get("/me/photo")
async def get_my_photo(user: dict = Depends(require_user)):
    doc = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not doc or not doc.get("photo_path"):
        raise HTTPException(status_code=404, detail="No photo")
    data, content_type = await run_in_threadpool(get_object, doc["photo_path"])
    return Response(content=data, media_type=doc.get("photo_type", content_type),
                    headers={"Cache-Control": "private, max-age=300"})


@api_router.get("/comments", response_model=list[Comment])
async def list_comments(user: dict = Depends(require_user)):
    query = {"track_key": TRACK_KEY, "$or": [{"status": "approved"}, {"user_id": user["user_id"], "status": "pending"}]}
    docs = await db.comments.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    return [comment_out(d) for d in docs]


@api_router.post("/comments", response_model=Comment)
async def create_comment(body: CommentIn, user: dict = Depends(require_user)):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Write a comment before sending.")
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile or not profile.get("display_name"):
        raise HTTPException(status_code=400, detail="Finish your profile before commenting.")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "display_name": profile["display_name"],
        "message": message,
        "track_key": TRACK_KEY,
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.comments.insert_one(doc)
    return comment_out(doc)


def nominatim_search(q: str) -> list:
    resp = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"format": "jsonv2", "limit": "1", "q": q},
        headers={"Accept-Language": "en", "User-Agent": "NewMusiq/1.0"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


@api_router.get("/geo/search")
async def geo_search(q: str = Query(..., min_length=2, max_length=120)):
    try:
        matches = await run_in_threadpool(nominatim_search, q.strip())
    except requests.RequestException:
        return {"ok": False, "error": "Location search is unavailable right now."}
    if not matches:
        return {"ok": False, "error": "No matching location was found."}
    m = matches[0]
    lat, lon = float(m["lat"]), float(m["lon"])
    try:
        south, north, west, east = (float(x) for x in m.get("boundingbox", []))
        lat_span = abs(north - south)
        raw_lon = abs(east - west)
        lon_span = min(raw_lon, 360 - raw_lon)
    except ValueError:
        lat_span = lon_span = 0
    import math
    visible = max(lat_span, lon_span * math.cos(math.radians(lat)))
    distance = min(3.2, max(1.38, 1.35 + visible / 25))
    label = (m.get("display_name") or q).split(",")[0]
    return {"ok": True, "location": {"cameraDistance": distance, "label": label, "latitude": lat, "longitude": lon}}


app.include_router(api_router)
app.include_router(clerk_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.profiles.create_index("user_id", unique=True)
    await db.comments.create_index([("track_key", 1), ("created_at", -1)])
    try:
        await run_in_threadpool(init_storage)
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
