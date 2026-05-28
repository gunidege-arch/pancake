"""
Smart scraper: handles HTML, JSON, RSS responses.
Auto-detects response format and extracts content accordingly.
"""

import asyncio
import json
import random
import re
from typing import List, Optional
from urllib.parse import urlparse

import httpx
import trafilatura
from bs4 import BeautifulSoup

from ..schemas import SearchResultItem

REQUEST_TIMEOUT = 12.0

# Rotating User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]


def _ua() -> str:
    return random.choice(USER_AGENTS)


def _headers(url: str) -> dict:
    return {
        "User-Agent": _ua(),
        "Accept": "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://www.google.com/",
        "Cache-Control": "max-age=0",
    }


# ═══════════════════════════════════════════════════════════
# Site-specific URL transformers — convert HTML URLs to JSON APIs
# ═══════════════════════════════════════════════════════════
JSON_API_TRANSFORMS = {
    "reddit.com": lambda q: f"https://www.reddit.com/search.json?q={q}&limit=10",
    "old.reddit.com": lambda q: f"https://www.reddit.com/search.json?q={q}&limit=10",
    "en.wikipedia.org": lambda q: f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&format=json&srlimit=10",
}


def try_json_api(query: str, url: str) -> Optional[str]:
    """If the URL's host has a known JSON API, return the API URL."""
    host = urlparse(url).netloc.lower().replace("www.", "")
    if host in JSON_API_TRANSFORMS:
        return JSON_API_TRANSFORMS[host](query)
    return None


# ═══════════════════════════════════════════════════════════
# JSON response parser
# ═══════════════════════════════════════════════════════════
def _parse_json_response(data: dict, source_id: int, source_name: str) -> List[SearchResultItem]:
    """Try to extract search results from common JSON structures."""
    results: List[SearchResultItem] = []

    # Reddit JSON API
    if "data" in data and "children" in data.get("data", {}):
        for child in data["data"]["children"]:
            post = child.get("data", {})
            results.append(SearchResultItem(
                source_id=source_id, source_name=source_name,
                type="content", success=True,
                title=post.get("title", "")[:200],
                url=f"https://www.reddit.com{post.get('permalink', '')}",
                original_url=f"https://www.reddit.com{post.get('permalink', '')}",
                content=post.get("selftext", "")[:2000] or None,
                thumbnail_url=post.get("thumbnail") if post.get("thumbnail", "").startswith("http") else None,
                resource_type="webpage",
            ))
        return results

    # Wikipedia API
    if "query" in data and "search" in data.get("query", {}):
        for page in data["query"]["search"]:
            title = page.get("title", "")
            results.append(SearchResultItem(
                source_id=source_id, source_name=source_name,
                type="content", success=True,
                title=title,
                url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                original_url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                content=page.get("snippet", "").replace('<span class="searchmatch">', '').replace('</span>', '') or None,
                resource_type="webpage",
            ))
        return results

    # Generic JSON array
    if isinstance(data, list) and len(data) > 0:
        for item in data[:15]:
            if isinstance(item, dict):
                title = str(item.get("title") or item.get("name") or item.get("subject") or "")
                url = str(item.get("url") or item.get("link") or item.get("html_url") or "")
                if title:
                    results.append(SearchResultItem(
                        source_id=source_id, source_name=source_name,
                        type="content", success=True,
                        title=title[:200], url=url or None,
                        original_url=url or None,
                        content=item.get("description") or item.get("body") or item.get("summary") or None,
                        thumbnail_url=item.get("thumbnail") or item.get("image") or None,
                        resource_type="webpage",
                    ))
            if len(results) >= 10:
                break
        return results

    # Generic JSON object with results array
    for key in ("results", "items", "data", "posts", "articles", "hits"):
        if key in data and isinstance(data[key], list):
            for item in data[key][:15]:
                if isinstance(item, dict):
                    title = str(item.get("title") or item.get("name") or item.get("subject") or "")
                    url = str(item.get("url") or item.get("link") or item.get("html_url") or "")
                    if title:
                        results.append(SearchResultItem(
                            source_id=source_id, source_name=source_name,
                            type="content", success=True,
                            title=title[:200], url=url or None,
                            original_url=url or None,
                            content=item.get("description") or item.get("body") or item.get("summary") or None,
                            thumbnail_url=item.get("thumbnail") or item.get("image") or item.get("cover_image") or None,
                            resource_type="webpage",
                        ))
            if results:
                return results

    return results


# ═══════════════════════════════════════════════════════════
# HTML content extractor
# ═══════════════════════════════════════════════════════════
def _extract_html_content(html: str, url: str) -> str:
    """Extract readable content from HTML."""
    extracted = trafilatura.extract(
        html, output_format="html", include_links=True,
        include_images=False, include_tables=False, url=url,
    )
    if extracted and len(extracted.strip()) > 100:
        return extracted

    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.find(role="main") or soup.body
    return str(main) if main else "<p>No readable content.</p>"


def _extract_og_meta(html: str) -> dict:
    """Extract Open Graph / meta title and thumbnail from HTML."""
    soup = BeautifulSoup(html, "lxml")
    title = None
    thumbnail = None

    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    if not title:
        h1 = soup.find("h1")
        if h1: title = h1.get_text(strip=True)
    if not title:
        t = soup.find("title")
        if t: title = t.get_text(strip=True)

    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        thumbnail = og_img["content"]

    return {"title": title, "thumbnail_url": thumbnail}


# ═══════════════════════════════════════════════════════════
# Main smart scraper entry point
# ═══════════════════════════════════════════════════════════
async def smart_scrape(
    query: str, url: str, source_id: int, source_name: str,
    client: httpx.AsyncClient,
) -> List[SearchResultItem]:
    """
    Smart scraper: detects response format and parses accordingly.
    - Tries JSON API for known sites first
    - If HTML → trafilatura + BeautifulSoup
    - If JSON → structural parsing
    - Retries once on failure
    """
    # Try JSON API transform for known sites
    api_url = try_json_api(query, url)
    urls_to_try = [api_url, url] if api_url else [url]

    last_error: Optional[str] = None

    for attempt, target_url in enumerate(urls_to_try):
        try:
            await asyncio.sleep(random.uniform(0.2, 0.8))  # jitter
            resp = await client.get(target_url, timeout=REQUEST_TIMEOUT, headers=_headers(target_url))
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "").lower()
            raw = resp.content

            # ── JSON response ──
            if "json" in content_type or (raw and raw[:1] == b"{"):
                try:
                    data = json.loads(raw)
                    results = _parse_json_response(data, source_id, source_name)
                    if results:
                        return results
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass  # not actually JSON, fall through to HTML

            # ── HTML response ──
            text = _decode_response(raw, content_type)
            if not text or len(text) < 80:
                continue

            meta = _extract_og_meta(text)
            content_html = _extract_html_content(text, target_url)

            return [SearchResultItem(
                source_id=source_id, source_name=source_name,
                type="content", success=True,
                title=meta.get("title") or source_name,
                content=content_html,
                original_url=target_url,
                url=target_url,
                thumbnail_url=meta.get("thumbnail_url"),
                resource_type="webpage",
            )]

        except httpx.TimeoutException:
            last_error = "Request timed out"
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code}"
        except Exception as e:
            last_error = f"{type(e).__name__}: {str(e)[:150]}"

    return [SearchResultItem(
        source_id=source_id, source_name=source_name,
        type="error", success=False, error=last_error or "Unknown error",
    )]


# ── Encoding detection (same as original) ──
def _decode_response(content: bytes, content_type: str = "") -> str:
    if not content: return ""
    if content_type and "charset=" in content_type.lower():
        charset = content_type.lower().split("charset=")[-1].strip().strip("\"' ;")
        try: return content.decode(charset)
        except (LookupError, UnicodeDecodeError): pass
    head = content[:4096].decode("ascii", errors="ignore")
    match = re.search(r'<meta[^>]+charset=["\']?\s*([a-zA-Z0-9\-_]+)', head, re.IGNORECASE)
    if match:
        try: return content.decode(match.group(1).lower())
        except (LookupError, UnicodeDecodeError): pass
    try: return content.decode("utf-8")
    except UnicodeDecodeError: pass
    for enc in ("gbk", "gb18030", "gb2312", "big5", "shift_jis"):
        try:
            d = content.decode(enc)
            if d.count("�") / max(len(d), 1) < 0.01: return d
        except: continue
    return content.decode("utf-8", errors="replace")
