import asyncio
from typing import List
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx

from ..schemas import MusicTrack, MusicSearchResponse

router = APIRouter(prefix="/api/music", tags=["music"])

METING_API = "https://api.injahow.cn/meting/"

SERVERS = [
    {"id": "netease", "name": "网易云"},
    {"id": "tencent", "name": "QQ音乐"},
    {"id": "kugou", "name": "酷狗"},
]


def _build_cover(server: str, pic_id: str) -> str:
    """Build cover URL from Meting API pic_id."""
    if not pic_id:
        return ""
    if server == "netease":
        return f"https://p2.music.126.net/{pic_id}/{pic_id}.jpg"
    if server == "tencent":
        return f"https://y.gtimg.cn/music/photo_new/T002R300x300M000{pic_id}.jpg"
    if server == "kugou" and pic_id:
        return pic_id if pic_id.startswith("http") else f"https://imge.kugou.com/{pic_id}"
    return ""


@router.get("/search", response_model=MusicSearchResponse)
async def search_music(q: str = Query(..., min_length=1)):
    tracks: List[MusicTrack] = []

    async def search_server(svr: dict):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(METING_API, params={
                    "server": svr["id"],
                    "type": "search",
                    "id": q,
                    "page": 1,
                    "limit": 20,
                })
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list):
                    for item in data:
                        if not isinstance(item, dict):
                            continue
                        sid = str(item.get("id", item.get("song_id", item.get("songid", ""))))
                        if not sid:
                            continue
                        tracks.append(MusicTrack(
                            id=f"{svr['id']}:{sid}",
                            title=item.get("name", item.get("title", item.get("songname", "Unknown"))),
                            artist="、".join(item.get("artist", item.get("artists", []))) if isinstance(item.get("artist"), list) else item.get("artist", item.get("singer", item.get("author", ""))),
                            album=item.get("album", item.get("albumname", item.get("album_name"))),
                            cover_url=_build_cover(svr["id"], item.get("pic_id", item.get("picid", ""))) or item.get("pic", item.get("cover", "")),
                            audio_url="",  # resolved on-demand via /play
                            duration=item.get("duration", item.get("interval")),
                            source_name=svr["name"],
                        ))
        except Exception:
            pass

    await asyncio.gather(*(search_server(s) for s in SERVERS))

    # Dedup by id
    seen = set()
    unique = []
    for t in tracks:
        if t.id not in seen:
            seen.add(t.id)
            unique.append(t)

    return MusicSearchResponse(query=q, tracks=unique)


@router.get("/play")
async def play_music(id: str = Query(..., min_length=1)):
    """Resolve playable audio URL for a track."""
    parts = id.split(":", 1)
    server = parts[0] if len(parts) == 2 else "netease"
    song_id = parts[1] if len(parts) == 2 else parts[0]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(METING_API, params={
                "server": server,
                "type": "url",
                "id": song_id,
            })
            resp.raise_for_status()
            data = resp.json()
            url = data.get("url", "") if isinstance(data, dict) else ""
            return {"url": url, "br": data.get("br", 0) if isinstance(data, dict) else 0}
    except Exception:
        return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)
