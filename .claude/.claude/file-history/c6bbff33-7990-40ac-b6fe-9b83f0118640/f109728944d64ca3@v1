from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import SearchSource
from ..schemas import SearchSourceCreate, SearchSourceUpdate, SearchSourceResponse

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("/", response_model=list[SearchSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SearchSource).order_by(SearchSource.id))
    return result.scalars().all()


@router.post("/", response_model=SearchSourceResponse, status_code=201)
async def create_source(data: SearchSourceCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(SearchSource).where(SearchSource.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Source '{data.name}' already exists")

    source = SearchSource(
        name=data.name,
        search_url_template=data.search_url_template,
        allow_embed=data.allow_embed,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.put("/{source_id}", response_model=SearchSourceResponse)
async def update_source(source_id: int, data: SearchSourceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SearchSource).where(SearchSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if data.name is not None:
        source.name = data.name
    if data.search_url_template is not None:
        source.search_url_template = data.search_url_template
    if data.allow_embed is not None:
        source.allow_embed = data.allow_embed

    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(source_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SearchSource).where(SearchSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    await db.delete(source)
    await db.commit()
