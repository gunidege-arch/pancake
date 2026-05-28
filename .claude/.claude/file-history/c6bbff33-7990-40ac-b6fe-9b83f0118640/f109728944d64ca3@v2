from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from ..database import get_db
from ..models import SearchSource
from ..schemas import SearchSourceCreate, SearchSourceUpdate, SearchSourceResponse

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("/", response_model=list[SearchSourceResponse])
async def list_sources(
    device_id: str = Query("", max_length=64),
    db: AsyncSession = Depends(get_db),
):
    """Return only user-added sources for this device (no builtins)."""
    if device_id:
        result = await db.execute(
            select(SearchSource)
            .where(
                and_(
                    SearchSource.is_builtin == False,
                    SearchSource.device_id == device_id,
                )
            )
            .order_by(SearchSource.id)
        )
    else:
        result = await db.execute(
            select(SearchSource)
            .where(SearchSource.is_builtin == False)
            .order_by(SearchSource.id)
        )
    return result.scalars().all()


@router.post("/", response_model=SearchSourceResponse, status_code=201)
async def create_source(data: SearchSourceCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(SearchSource).where(
            and_(
                SearchSource.name == data.name,
                SearchSource.device_id == data.device_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Source '{data.name}' already exists")

    source = SearchSource(
        name=data.name,
        search_url_template=data.search_url_template,
        allow_embed=data.allow_embed,
        device_id=data.device_id,
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
    if source.is_builtin:
        raise HTTPException(status_code=403, detail="Cannot edit built-in sources")

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
async def delete_source(
    source_id: int,
    device_id: str = Query("", max_length=64),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SearchSource).where(SearchSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if source.is_builtin:
        raise HTTPException(status_code=403, detail="Cannot delete built-in sources")
    if source.device_id != device_id:
        raise HTTPException(status_code=403, detail="Not your source")

    await db.delete(source)
    await db.commit()
