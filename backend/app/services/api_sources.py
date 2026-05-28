"""Handlers for API-based search sources (Unsplash, Pexels, etc.).

Each handler receives a query string and returns List[SearchResultItem].
API keys are read from environment variables.
"""

import os
from typing import List

import httpx

from ..schemas import SearchResultItem

REQUEST_TIMEOUT = 10.0


def _env(key: str) -> str:
    return os.getenv(key, "")


# ═══════════════════════════════════════════════════════════
# Unsplash
# ═══════════════════════════════════════════════════════════
async def search_unsplash(query: str, source_id: int, source_name: str) -> List[SearchResultItem]:
    key = _env("UNSPLASH_ACCESS_KEY")
    if not key:
        return [SearchResultItem(
            source_id=source_id, source_name=source_name,
            type="error", success=False, error="Unsplash API key not configured",
        )]

    url = f"https://api.unsplash.com/search/photos"
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            resp = await client.get(url, params={"query": query, "per_page": 15}, headers={"Authorization": f"Client-ID {key}"})
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return [SearchResultItem(source_id=source_id, source_name=source_name, type="error", success=False, error=str(e)[:200])]

    results: List[SearchResultItem] = []
    for photo in data.get("results", []):
        results.append(SearchResultItem(
            source_id=source_id,
            source_name=source_name,
            type="content",
            success=True,
            title=photo.get("alt_description") or photo.get("description") or "Untitled",
            url=photo["urls"]["raw"],
            original_url=photo["links"]["html"],
            thumbnail_url=photo["urls"]["thumb"],
            resource_type="webpage",
        ))
    return results


# ═══════════════════════════════════════════════════════════
# Pexels
# ═══════════════════════════════════════════════════════════
async def search_pexels(query: str, source_id: int, source_name: str) -> List[SearchResultItem]:
    key = _env("PEXELS_API_KEY")
    if not key:
        return [SearchResultItem(
            source_id=source_id, source_name=source_name,
            type="error", success=False, error="Pexels API key not configured",
        )]

    url = "https://api.pexels.com/v1/search"
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            resp = await client.get(url, params={"query": query, "per_page": 15}, headers={"Authorization": key})
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return [SearchResultItem(source_id=source_id, source_name=source_name, type="error", success=False, error=str(e)[:200])]

    results: List[SearchResultItem] = []
    for photo in data.get("photos", []):
        results.append(SearchResultItem(
            source_id=source_id,
            source_name=source_name,
            type="content",
            success=True,
            title=photo.get("alt") or f"Photo by {photo.get('photographer', 'Unknown')}",
            url=photo["src"]["original"],
            original_url=photo["url"],
            thumbnail_url=photo["src"]["medium"],
            resource_type="webpage",
        ))
    return results


# ═══════════════════════════════════════════════════════════
# Dispatcher
# ═══════════════════════════════════════════════════════════
API_HANDLERS = {
    "unsplash": search_unsplash,
    "pexels": search_pexels,
}


async def search_api_source(
    api_name: str, query: str, source_id: int, source_name: str
) -> List[SearchResultItem]:
    handler = API_HANDLERS.get(api_name)
    if not handler:
        return [SearchResultItem(
            source_id=source_id, source_name=source_name,
            type="error", success=False, error=f"No handler for API: {api_name}",
        )]
    return await handler(query, source_id, source_name)
