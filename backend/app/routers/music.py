import asyncio
import json
import os
from typing import List
from urllib.parse import parse_qs, urlparse
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx

from ..schemas import MusicTrack, MusicSearchResponse

router = APIRouter(prefix="/api/music", tags=["music"])

NODE_API = os.getenv("MUSIC_API_URL", "http://127.0.0.1:3001")

# ── Elysium fallback (used when Node.js is unavailable) ──
METING_API = "https://meting.elysium-stack.cn/api"
METING_SERVERS = [
    {"id": "netease", "name": "网易云"},
    {"id": "kugou", "name": "酷狗"},
]


def _extract_song_id(url_str: str) -> str:
    if not url_str:
        return ""
    try:
        params = parse_qs(urlparse(url_str).query)
        ids = params.get("id", [])
        return ids[0] if ids else ""
    except Exception:
        return ""


async def _try_node_search(q: str) -> List[MusicTrack]:
    """Try Node.js music API server first."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{NODE_API}/search", params={"q": q})
            resp.raise_for_status()
            data = resp.json()
            tracks = []
            for t in data.get("tracks", []):
                t.pop("extra", None)
                tracks.append(MusicTrack(**t))
            return tracks
    except Exception:
        return []


async def _try_node_play(track_id: str) -> dict:
    """Try Node.js music API server for URL resolution."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{NODE_API}/play", params={"id": track_id})
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return {}


async def _fallback_search(q: str) -> List[MusicTrack]:
    """Search via Elysium Meting + QQ Music API."""
    tracks: List[MusicTrack] = []

    async def search_meting(svr: dict):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(METING_API, params={
                    "server": svr["id"], "type": "search", "id": q,
                    "page": 1, "limit": 20,
                })
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list):
                    for item in data:
                        if not isinstance(item, dict):
                            continue
                        title = item.get("title", "")
                        author = item.get("author", "")
                        proxy_url = item.get("url", "")
                        if not title or not proxy_url:
                            continue
                        song_id = _extract_song_id(proxy_url)
                        if not song_id:
                            continue
                        tracks.append(MusicTrack(
                            id=f"{svr['id']}:{song_id}",
                            title=title, artist=author,
                            cover_url=item.get("pic", ""),
                            audio_url=proxy_url, duration=None,
                            source_name=svr["name"],
                        ))
        except Exception:
            pass

    async def search_qq(q_param: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://c.y.qq.com/soso/fcgi-bin/client_search_cp",
                    params={"w": q_param, "format": "json", "n": 20},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                data = resp.json()
                songs = data.get("data", {}).get("song", {}).get("list", [])
                if not isinstance(songs, list):
                    return
                for song in songs:
                    if not isinstance(song, dict):
                        continue
                    songmid = song.get("songmid", "")
                    if not songmid:
                        continue
                    singer_list = song.get("singer", [])
                    artist = "、".join(s.get("name", "") for s in singer_list) if isinstance(singer_list, list) else ""
                    albummid = song.get("albummid", "")
                    cover = f"https://y.gtimg.cn/music/photo_new/T002R300x300M000{albummid}.jpg" if albummid else ""
                    tracks.append(MusicTrack(
                        id=f"tencent:{songmid}",
                        title=song.get("songname", ""), artist=artist,
                        cover_url=cover, audio_url="",
                        duration=song.get("interval", None),
                        source_name="QQ音乐",
                    ))
        except Exception:
            pass

    await asyncio.gather(
        *(search_meting(s) for s in METING_SERVERS),
        search_qq(q),
    )
    return tracks


async def _fallback_play(server: str, song_id: str):
    if server == "netease":
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(METING_API, params={
                    "server": "netease", "type": "song", "id": song_id,
                })
                data = resp.json()
                proxy_url = data[0].get("url", "") if isinstance(data, list) and data else ""
                if proxy_url:
                    resp2 = await client.get(proxy_url)
                    return {"url": str(resp2.url), "br": 0}
        except Exception:
            pass
    elif server == "kugou":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://wwwapi.kugou.com/yy/index.php?r=play/getdata"
                    f"&hash={song_id}&platid=4&album_id="
                    f"&mid=00000000000000000000000000000000",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                data = resp.json()
                if data.get("status") == 1 and data["data"].get("privilege", 10) <= 9:
                    url = data["data"].get("play_backup_url") or data["data"].get("play_url", "")
                    if url:
                        return {"url": url, "br": 0}
        except Exception:
            pass
        # Fallback to Elysium for kugou
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(METING_API, params={
                    "server": "kugou", "type": "song", "id": song_id,
                })
                data = resp.json()
                proxy_url = data[0].get("url", "") if isinstance(data, list) and data else ""
                if proxy_url:
                    resp2 = await client.get(proxy_url)
                    return {"url": str(resp2.url), "br": 0}
        except Exception:
            pass
    elif server == "tencent":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                file = f"M500{song_id}{song_id}.mp3"
                req_data = {
                    "req_0": {
                        "module": "vkey.GetVkeyServer",
                        "method": "CgiGetVkey",
                        "param": {
                            "filename": [file],
                            "guid": "10000",
                            "songmid": [song_id],
                            "songtype": [0],
                            "uin": "0",
                            "loginflag": 1,
                            "platform": "20",
                        },
                    },
                    "loginUin": "0",
                    "comm": {"uin": "0", "format": "json", "ct": 24, "cv": 0},
                }
                resp = await client.get(
                    "https://u.y.qq.com/cgi-bin/musicu.fcg",
                    params={"format": "json", "data": json.dumps(req_data)},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                data = resp.json()
                midurlinfo = data.get("req_0", {}).get("data", {}).get("midurlinfo", [])
                sip = data.get("req_0", {}).get("data", {}).get("sip", [])
                if midurlinfo and len(midurlinfo) > 0:
                    purl = midurlinfo[0].get("purl", "")
                    if purl:
                        base = sip[0] if sip else "https://isure6.stream.qqmusic.qq.com/"
                        return {"url": base + purl, "br": 0}
        except Exception:
            pass
    return {}


# ── Routes ───────────────────────────────────

@router.get("/search", response_model=MusicSearchResponse)
async def search_music(q: str = Query(..., min_length=1)):
    # Try Node.js first, fall back to Elysium
    tracks = await _try_node_search(q)
    if not tracks:
        tracks = await _fallback_search(q)

    seen = set()
    unique = []
    for t in tracks:
        if t.id not in seen:
            seen.add(t.id)
            unique.append(t)

    return MusicSearchResponse(query=q, tracks=unique)


@router.get("/play")
async def play_music(id: str = Query(..., min_length=1)):
    # Try Node.js first
    result = await _try_node_play(id)
    if result.get("url"):
        return result

    # Fallback to Elysium
    parts = id.split(":", 1)
    server = parts[0] if len(parts) == 2 else "netease"
    song_id = parts[1] if len(parts) == 2 else parts[0]

    result = await _fallback_play(server, song_id)
    if result.get("url"):
        return result

    return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)


LXSERVER_URL = os.getenv("LXSERVER_URL", "")


@router.get("/lxserver")
async def get_lxserver_url():
    return {"url": LXSERVER_URL}
