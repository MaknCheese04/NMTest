import asyncio
import json
import os
import re
import uuid
from datetime import datetime, timezone

import requests
from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.concurrency import run_in_threadpool

try:
    from backend.deps import db, require_completed
except ModuleNotFoundError:
    from deps import db, require_completed

weekly_router = APIRouter(prefix="/api/music")
_locks: dict = {}
PROMPT = """You are a music chart researcher. For the region "{region}", list what people there are listening to most this week ({week}).
Return ONLY JSON:
{{"top_songs": [{{"title": str, "artist": str, "genre": str}}] (15 items, real popular songs, mix of current hits and local favourites),
 "top_genres": [{{"name": str, "description": str (one sentence), "songs": [{{"title": str, "artist": str}}] (8 real songs of that genre, prefer artists from or popular in the region)}}] (5 genres, most popular first)}}"""


def week_id() -> str:
    y, w, _ = datetime.now(timezone.utc).isocalendar()
    return f"{y}-W{w:02d}"


async def ask_llm(region: str) -> dict:
    chat = LlmChat(api_key=os.environ.get("EMERGENT_LLM_KEY"), session_id=f"weekly-{uuid.uuid4()}",
                   system_message="You answer with strict JSON only.").with_model("openai", "gpt-5.4-mini")
    out = ""
    async for ev in chat.stream_message(UserMessage(text=PROMPT.format(region=region, week=week_id()))):
        if isinstance(ev, TextDelta):
            out += ev.content
        elif isinstance(ev, StreamDone):
            break
    match = re.search(r"\{.*\}", out, re.S)
    data = json.loads(match.group(0)) if match else {}
    clean = lambda s: {"title": str(s.get("title", ""))[:120], "artist": str(s.get("artist", ""))[:120]}
    return {
        "top_songs": [{**clean(s), "genre": str(s.get("genre", ""))[:40]} for s in data.get("top_songs", [])[:20] if s.get("title")],
        "top_genres": [{"name": str(g.get("name", ""))[:40], "description": str(g.get("description", ""))[:240],
                        "songs": [clean(s) for s in g.get("songs", [])[:10] if s.get("title")]}
                       for g in data.get("top_genres", [])[:6] if g.get("name")],
    }


async def weekly_lists(region_key: str, label: str) -> dict:
    wk = week_id()
    doc = await db.region_weekly.find_one({"region_key": region_key}, {"_id": 0})
    if doc and doc.get("week") == wk:
        return doc
    lock = _locks.setdefault(region_key, asyncio.Lock())
    async with lock:
        doc = await db.region_weekly.find_one({"region_key": region_key}, {"_id": 0})
        if doc and doc.get("week") == wk:
            return doc
        try:
            data = await ask_llm(label)
        except Exception:
            data = None
        if not data or not data["top_songs"]:
            if doc:
                return doc
            raise HTTPException(502, "This week's lists aren't ready yet. Please try again in a moment.")
        doc = {"region_key": region_key, "week": wk, "updated_at": datetime.now(timezone.utc).isoformat(), **data}
        await db.region_weekly.update_one({"region_key": region_key}, {"$set": doc}, upsert=True)
        return doc


def youtube_search(query: str) -> dict | None:
    key = os.environ.get("YOUTUBE_API_KEY")
    if key:
        r = requests.get("https://www.googleapis.com/youtube/v3/search", timeout=10, params={
            "key": key, "q": query, "part": "snippet", "type": "video", "maxResults": 1, "videoEmbeddable": "true"})
        r.raise_for_status()
        items = r.json().get("items", [])
        return {"video_id": items[0]["id"]["videoId"], "video_title": items[0]["snippet"]["title"]} if items else None
    r = requests.get("https://www.youtube.com/results", params={"search_query": query}, timeout=10,
                     headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9"})
    r.raise_for_status()
    ids = re.findall(r'"videoRenderer":\{"videoId":"([\w-]{11})"', r.text)
    titles = re.findall(r'"videoRenderer":\{"videoId":"[\w-]{11}".*?"title":\{"runs":\[\{"text":"(.*?)"\}', r.text)
    return {"video_id": ids[0], "video_title": titles[0] if titles else query} if ids else None


def _walk(node, out):
    if isinstance(node, dict):
        vr = node.get("videoRenderer")
        if isinstance(vr, dict) and vr.get("videoId"):
            title = "".join(r.get("text", "") for r in vr.get("title", {}).get("runs", []))
            owner = "".join(r.get("text", "") for r in vr.get("ownerText", {}).get("runs", []))
            out.append({"video_id": vr["videoId"], "title": title, "channel": owner})
        for v in node.values():
            _walk(v, out)
    elif isinstance(node, list):
        for v in node:
            _walk(v, out)


def youtube_search_many(query: str, limit: int = 15) -> list:
    r = requests.get("https://www.youtube.com/results", params={"search_query": query}, timeout=10,
                     headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9"})
    r.raise_for_status()
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", r.text, re.S)
    out: list = []
    if m:
        try:
            _walk(json.loads(m.group(1)), out)
        except ValueError:
            pass
    seen, res = set(), []
    for v in out:
        if v["video_id"] not in seen:
            seen.add(v["video_id"])
            res.append({**v, "thumbnail": f"https://i.ytimg.com/vi/{v['video_id']}/mqdefault.jpg"})
    return res[:limit]


@weekly_router.get("/video")
async def find_video(artist: str = Query(..., max_length=120), title: str = Query(..., max_length=120),
                     profile: dict = Depends(require_completed)):
    key = f"{artist.lower()}|{title.lower()}"
    hit = await db.yt_cache.find_one({"key": key}, {"_id": 0})
    if hit:
        return hit
    try:
        found = await run_in_threadpool(youtube_search, f"{artist} {title} official music video")
    except requests.RequestException:
        found = None
    if not found:
        raise HTTPException(404, "No video found for this song.")
    doc = {"key": key, **found, "thumbnail": f"https://i.ytimg.com/vi/{found['video_id']}/mqdefault.jpg"}
    await db.yt_cache.update_one({"key": key}, {"$set": doc}, upsert=True)
    return doc
