from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from ..database import get_db
from ..models import MusicSource
from ..schemas import MusicSourceCreate, MusicSourceResponse, MusicTrack, MusicSearchResponse

router = APIRouter(prefix="/api/music", tags=["music"])


# ── Sources CRUD ────────────────────────────────────

@router.get("/sources", response_model=List[MusicSourceResponse])
async def list_sources(device_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MusicSource).where(
            (MusicSource.device_id == device_id) | (MusicSource.is_builtin == True)
        )
    )
    return result.scalars().all()


@router.post("/sources", response_model=MusicSourceResponse, status_code=201)
async def create_source(body: MusicSourceCreate, db: AsyncSession = Depends(get_db)):
    source = MusicSource(
        name=body.name,
        api_url_template=body.api_url_template,
        device_id=body.device_id,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/sources/{source_id}", status_code=204)
async def delete_source(source_id: int, device_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MusicSource).where(MusicSource.id == source_id))
    source = result.scalar_one_or_none()
    if source and not source.is_builtin and source.device_id == device_id:
        await db.delete(source)
        await db.commit()


# ── Search ──────────────────────────────────────────

@router.get("/search", response_model=MusicSearchResponse)
async def search_music(
    q: str = Query(..., min_length=1),
    device_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MusicSource).where(
            (MusicSource.device_id == device_id) | (MusicSource.is_builtin == True)
        )
    )
    sources = result.scalars().all()

    tracks: List[MusicTrack] = []

    async with httpx.AsyncClient(timeout=12.0) as client:
        for src in sources:
            try:
                url = src.api_url_template.replace("{keyword}", q)
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

                # Support standard LX Music API format: { list: [{ id, title, artist, ... }] }
                items = data if isinstance(data, list) else data.get("list", data.get("results", data.get("tracks", [])))
                for item in items:
                    if isinstance(item, dict):
                        tracks.append(MusicTrack(
                            id=str(item.get("id", item.get("song_id", ""))),
                            title=item.get("title", item.get("name", item.get("songname", "Unknown"))),
                            artist=item.get("artist", item.get("singer", item.get("author", ""))),
                            album=item.get("album", item.get("albumname")),
                            cover_url=item.get("cover", item.get("img", item.get("pic_url"))),
                            audio_url=item.get("url", item.get("audio_url", item.get("music_url", ""))),
                            duration=item.get("duration", item.get("interval")),
                            source_name=src.name,
                        ))
            except Exception:
                continue

    return MusicSearchResponse(query=q, tracks=tracks)
