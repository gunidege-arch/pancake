import asyncio
from typing import List
from urllib.parse import parse_qs, urlparse
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx

from ..schemas import MusicTrack, MusicSearchResponse

router = APIRouter(prefix="/api/music", tags=["music"])

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


@router.get("/search", response_model=MusicSearchResponse)
async def search_music(q: str = Query(..., min_length=1)):
    tracks: List[MusicTrack] = []

    async def search_meting(svr: dict):
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
                            title=title,
                            artist=author,
                            cover_url=item.get("pic", ""),
                            audio_url=proxy_url,
                            duration=None,
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
                        title=song.get("songname", ""),
                        artist=artist,
                        cover_url=cover,
                        audio_url="",
                        duration=song.get("interval", None),
                        source_name="QQ音乐",
                    ))
        except Exception:
            pass

    await asyncio.gather(
        *(search_meting(s) for s in METING_SERVERS),
        search_qq(q),
    )

    seen = set()
    unique = []
    for t in tracks:
        if t.id not in seen:
            seen.add(t.id)
            unique.append(t)

    return MusicSearchResponse(query=q, tracks=unique)


@router.get("/play")
async def play_music(id: str = Query(..., min_length=1)):
    parts = id.split(":", 1)
    server = parts[0] if len(parts) == 2 else "netease"
    song_id = parts[1] if len(parts) == 2 else parts[0]

    if server == "netease":
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                # Get fresh proxy URL via type=song (includes auth)
                resp = await client.get(METING_API, params={
                    "server": "netease",
                    "type": "song",
                    "id": song_id,
                })
                data = resp.json()
                proxy_url = data[0].get("url", "") if isinstance(data, list) and data else ""
                if not proxy_url:
                    return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)
                # Follow proxy redirect to get final audio URL
                resp2 = await client.get(proxy_url)
                return {"url": str(resp2.url), "br": 0}
        except Exception:
            return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)

    if server == "kugou":
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                # type=song may fail, try type=url with auth extracted from song lookup
                resp = await client.get(METING_API, params={
                    "server": "kugou",
                    "type": "song",
                    "id": song_id,
                })
                if resp.status_code == 200:
                    data = resp.json()
                    proxy_url = data[0].get("url", "") if isinstance(data, list) and data else ""
                    if proxy_url:
                        resp2 = await client.get(proxy_url)
                        if resp2.status_code == 200:
                            return {"url": str(resp2.url), "br": 0}
                # Fallback: try direct type=url (may return 401)
                resp3 = await client.get(METING_API, params={
                    "server": "kugou",
                    "type": "url",
                    "id": song_id,
                })
                if resp3.status_code == 200:
                    return {"url": str(resp3.url), "br": 0}
                return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)
        except Exception:
            return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)

    if server == "tencent":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://u.y.qq.com/cgi-bin/musicu.fcg",
                    params={
                        "format": "json",
                        "data": f'{{"req_0":{{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{{"guid":"0","songmid":["{song_id}"],"songtype":[0],"uin":"0","loginflag":1,"platform":"20"}}}}}}',
                    },
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                data = resp.json()
                midurlinfo = data.get("req_0", {}).get("data", {}).get("midurlinfo", [])
                if midurlinfo and len(midurlinfo) > 0:
                    purl = midurlinfo[0].get("purl", "")
                    if purl:
                        return {"url": f"https://isure6.stream.qqmusic.qq.com/{purl}", "br": 0}
                return JSONResponse({"url": "", "error": "无法获取QQ音乐播放地址"}, status_code=502)
        except Exception:
            return JSONResponse({"url": "", "error": "获取播放地址失败"}, status_code=502)

    return JSONResponse({"url": "", "error": "未知音源"}, status_code=400)
