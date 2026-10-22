import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

try:
    from backend.clerk_auth import require_user
except ModuleNotFoundError:
    from clerk_auth import require_user

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

PLANS = {
    "standard": {"name": "Standard Listener", "price": 4.99, "level": 1, "lookup_key": "nm_standard_monthly",
                 "features": ["Listen to music from around the world", "Interactive globe explorer"]},
    "pro": {"name": "Pro Listener", "price": 9.99, "level": 2, "lookup_key": "nm_pro_monthly",
            "features": ["Everything in Standard", "Commentary service", "Chat with listeners and artists",
                         "Comment on the music you hear"]},
    "artist": {"name": "Artist", "price": 14.99, "level": 3, "lookup_key": "nm_artist_monthly",
               "features": ["Everything in Pro", "Upload and publish your own music", "Artist Studio"]},
}


def plan_level(profile: dict | None) -> int:
    plan = PLANS.get((profile or {}).get("plan") or "")
    return plan["level"] if plan else 0


async def current_profile(user: dict = Depends(require_user)) -> dict:
    doc = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return doc or {"user_id": user["user_id"]}


def require_level(level: int):
    needed = next(p["name"] for p in PLANS.values() if p["level"] == level)

    async def check(profile: dict = Depends(current_profile)) -> dict:
        if plan_level(profile) < level:
            raise HTTPException(status_code=403, detail=f"This needs the {needed} plan.")
        return profile
    return check
