from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import SearchSource
from ..schemas import SearchResponse
from ..services.search_service import search_all

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SearchSource).order_by(SearchSource.id))
    sources = result.scalars().all()

    source_tuples = [(s.id, s.name, s.search_url_template, s.allow_embed) for s in sources]

    results = await search_all(q, source_tuples)

    return SearchResponse(query=q, results=results)
