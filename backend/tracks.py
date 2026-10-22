import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

try:
    from backend.deps import db, require_level
    from backend.storage import APP_NAME, get_object, put_object
except ModuleNotFoundError:
    from deps import db, require_level
    from storage import APP_NAME, get_object, put_object

tracks_router = APIRouter(prefix="/api/tracks")

AUDIO_TYPES = {"audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav",
               "audio/wave": "wav", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac",
               "audio/ogg": "ogg", "audio/flac": "flac", "audio/x-flac": "flac"}
IMAGE_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_AUDIO = 25 * 1024 * 1024
MAX_IMAGE = 5 * 1024 * 1024


class Track(BaseModel):
    id: str
    title: str
    artist_name: str
    location: str
    has_cover: bool
    created_at: str
    mine: bool


def track_out(doc: dict, user_id: str) -> Track:
    return Track(id=doc["id"], title=doc["title"], artist_name=doc["artist_name"], location=doc.get("location", ""),
                 has_cover=bool(doc.get("cover_path")), created_at=doc["created_at"], mine=doc["user_id"] == user_id)


async def _store(file: UploadFile, types: dict, limit: int, kind: str, user_id: str):
    if file.content_type not in types:
        raise HTTPException(400, f"Unsupported {kind} file type.")
    data = await file.read()
    if not data or len(data) > limit:
        raise HTTPException(400, f"{kind.capitalize()} must be under {limit // (1024 * 1024)} MB.")
    path = f"{APP_NAME}/tracks/{user_id}/{uuid.uuid4()}.{types[file.content_type]}"
    result = await run_in_threadpool(put_object, path, data, file.content_type)
    return result["path"], file.content_type


@tracks_router.post("", response_model=Track)
async def upload_track(
    title: str = Form(...),
    location: str = Form(""),
    audio: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None),
    profile: dict = Depends(require_level(3)),
):
    title = title.strip()
    if not title or len(title) > 100:
        raise HTTPException(400, "Give your track a title (max 100 characters).")
    audio_path, audio_type = await _store(audio, AUDIO_TYPES, MAX_AUDIO, "audio", profile["user_id"])
    doc = {
        "id": str(uuid.uuid4()), "user_id": profile["user_id"],
        "artist_name": profile.get("username") or profile.get("display_name") or "Artist",
        "title": title, "location": location.strip()[:120],
        "audio_path": audio_path, "audio_type": audio_type, "cover_path": None, "cover_type": None,
        "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if cover is not None and cover.filename:
        doc["cover_path"], doc["cover_type"] = await _store(cover, IMAGE_TYPES, MAX_IMAGE, "cover", profile["user_id"])
    await db.tracks.insert_one(doc)
    return track_out(doc, profile["user_id"])


@tracks_router.get("", response_model=list[Track])
async def list_tracks(profile: dict = Depends(require_level(1))):
    docs = await db.tracks.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [track_out(d, profile["user_id"]) for d in docs]


@tracks_router.get("/mine", response_model=list[Track])
async def my_tracks(profile: dict = Depends(require_level(3))):
    docs = await db.tracks.find({"user_id": profile["user_id"], "is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [track_out(d, profile["user_id"]) for d in docs]


async def _get(track_id: str) -> dict:
    doc = await db.tracks.find_one({"id": track_id, "is_deleted": False}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Track not found")
    return doc


@tracks_router.get("/{track_id}/audio")
async def track_audio(track_id: str, profile: dict = Depends(require_level(1))):
    doc = await _get(track_id)
    data, ctype = await run_in_threadpool(get_object, doc["audio_path"])
    return Response(content=data, media_type=doc.get("audio_type") or ctype)


@tracks_router.get("/{track_id}/cover")
async def track_cover(track_id: str, profile: dict = Depends(require_level(1))):
    doc = await _get(track_id)
    if not doc.get("cover_path"):
        raise HTTPException(404, "No cover")
    data, ctype = await run_in_threadpool(get_object, doc["cover_path"])
    return Response(content=data, media_type=doc.get("cover_type") or ctype,
                    headers={"Cache-Control": "private, max-age=600"})


@tracks_router.delete("/{track_id}")
async def delete_track(track_id: str, profile: dict = Depends(require_level(3))):
    result = await db.tracks.update_one({"id": track_id, "user_id": profile["user_id"], "is_deleted": False},
                                        {"$set": {"is_deleted": True}})
    if result.matched_count == 0:
        raise HTTPException(404, "Track not found")
    return {"ok": True}
