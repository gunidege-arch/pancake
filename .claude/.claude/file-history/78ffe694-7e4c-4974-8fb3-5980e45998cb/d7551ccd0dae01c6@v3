"""
Top-tier smart scraper v2.
Handles: JSON APIs, RSS/Atom feeds, HTML with structured data extraction,
rotating UAs + languages, per-domain rate limiting, exponential backoff,
content deduplication, cookie persistence.
"""

import asyncio
import hashlib
import json
import random
import re
import time
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
import trafilatura
from bs4 import BeautifulSoup

from ..schemas import SearchResultItem

REQUEST_TIMEOUT = 14.0
MAX_RETRIES = 2

# ── Rotating User-Agents with matching Accept-Language ──
UA_POOL = [
    ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", "zh-CN,zh;q=0.9,en;q=0.8"),
    ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", "zh-CN,zh;q=0.9,en-US;q=0.8"),
    ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36", "en-US,en;q=0.9,zh-CN;q=0.7"),
    ("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0", "zh-CN,zh;q=0.9,en;q=0.7"),
    ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0", "en-US,en;q=0.9"),
    ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "zh-CN,zh;q=0.9"),
    ("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "zh-CN,zh;q=0.9"),
    ("Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36", "zh-CN,zh;q=0.9"),
    ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0", "zh-CN,zh;q=0.9,en;q=0.8"),
    ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", "zh-CN,zh;q=0.9"),
]

# ── Domain rate limiter (requests per second per domain) ──
_domain_last_request: Dict[str, float] = {}
_domain_min_interval = 0.6  # seconds


async def _rate_limit(domain: str):
    now = time.time()
    last = _domain_last_request.get(domain, 0)
    wait = _domain_min_interval - (now - last)
    if wait > 0:
        await asyncio.sleep(wait)
    _domain_last_request[domain] = time.time()


def _rand_headers(url: str) -> dict:
    ua, lang = random.choice(UA_POOL)
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/json,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": lang,
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.google.com/",
        "Cache-Control": "max-age=0",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "document",
    }


# ═══════════════════════════════════════════════════════════
# JSON API TRANSFORMS — known sites → structured JSON APIs
# ═══════════════════════════════════════════════════════════
JSON_API_TRANSFORMS: Dict[str, callable] = {
    "reddit.com":          lambda q: f"https://www.reddit.com/search.json?q={q}&limit=15",
    "old.reddit.com":      lambda q: f"https://www.reddit.com/search.json?q={q}&limit=15",
    "en.wikipedia.org":    lambda q: f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&format=json&srlimit=10",
    "hn.algolia.com":      lambda q: f"https://hn.algolia.com/api/v1/search?query={q}&hitsPerPage=12",
    "stackoverflow.com":   lambda q: f"https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle={q}&site=stackoverflow",
    "github.com":          lambda q: f"https://api.github.com/search/repositories?q={q}&per_page=10",
    "dev.to":              lambda q: f"https://dev.to/search/feed_content?per_page=10&page=0&search_fields={q}",
    "medium.com":          lambda q: f"https://medium.com/search?q={q}&format=json",
}


def _try_json_api(query: str, url: str) -> Optional[str]:
    host = urlparse(url).netloc.lower().replace("www.", "")
    if host in JSON_API_TRANSFORMS:
        return JSON_API_TRANSFORMS[host](query)
    return None


# ═══════════════════════════════════════════════════════════
# JSON RESPONSE PARSER
# ═══════════════════════════════════════════════════════════
def _parse_json(data: dict, source_id: int, source_name: str) -> List[SearchResultItem]:
    res: List[SearchResultItem] = []
    d = data  # shorthand

    def _item(title="", url="", content="", thumb=""):
        if title:
            res.append(SearchResultItem(
                source_id=source_id, source_name=source_name,
                type="content", success=True, title=str(title)[:200],
                url=str(url) or None, original_url=str(url) or None,
                content=str(content)[:3000] or None,
                thumbnail_url=str(thumb) if thumb else None,
                resource_type="webpage",
            ))

    # Reddit
    for child in (d.get("data", {}).get("children") or []):
        p = child.get("data", {})
        _item(p.get("title"), f"https://reddit.com{p.get('permalink','')}",
              p.get("selftext", "")[:2000],
              p.get("thumbnail") if str(p.get("thumbnail","")).startswith("http") else "")

    # Wikipedia
    for page in (d.get("query", {}).get("search") or []):
        t = page.get("title", "")
        snippet = (page.get("snippet","")).replace('<span class="searchmatch">','').replace('</span>','')
        _item(t, f"https://en.wikipedia.org/wiki/{t.replace(' ','_')}", snippet)

    # HN Algolia
    for hit in (d.get("hits") or []):
        _item(hit.get("title") or hit.get("story_title"),
              hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
              hit.get("comment_text") or "",
              "")

    # StackExchange
    for item in (d.get("items") or []):
        _item(item.get("title"), item.get("link"), "", item.get("owner",{}).get("profile_image",""))

    # GitHub
    for item in (d.get("items") or []):
        _item(item.get("full_name"), item.get("html_url"), item.get("description"),
              item.get("owner",{}).get("avatar_url",""))

    # Dev.to
    for item in (d.get("result") or d.get("results") or []):
        _item(item.get("title"), item.get("url") or item.get("canonical_url"),
              item.get("description"), item.get("cover_image") or item.get("social_image",""))

    # Generic: array of objects
    arr = d if isinstance(d, list) else None
    if arr is None:
        for key in ("results", "items", "data", "posts", "articles", "hits", "photos", "collections"):
            if isinstance(d.get(key), list):
                arr = d[key]
                break

    if arr and isinstance(arr, list):
        for item in arr[:15]:
            if not isinstance(item, dict): continue
            t = item.get("title") or item.get("name") or item.get("subject") or item.get("full_name") or ""
            u = item.get("url") or item.get("link") or item.get("html_url") or item.get("permalink") or ""
            c = item.get("description") or item.get("body") or item.get("summary") or item.get("excerpt") or item.get("selftext") or ""
            th = item.get("thumbnail") or item.get("image") or item.get("cover_image") or item.get("social_image") or item.get("avatar_url") or ""
            _item(t, u, c, th if str(th).startswith("http") else "")

    return res[:20]


# ═══════════════════════════════════════════════════════════
# RSS / ATOM PARSER
# ═══════════════════════════════════════════════════════════
def _parse_rss(xml_bytes: bytes, source_id: int, source_name: str) -> Optional[List[SearchResultItem]]:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = root.findall(".//item") or root.findall(".//atom:entry", ns)

    if not items:
        return None

    results: List[SearchResultItem] = []
    for item in items[:15]:
        title = (
            item.findtext("title") or
            item.findtext("atom:title", namespaces=ns) or ""
        )
        link = (
            item.findtext("link") or
            (item.find("link") is not None and item.find("link").get("href")) or
            (item.find("atom:link", ns) is not None and item.find("atom:link", ns).get("href")) or ""
        )
        desc = (
            item.findtext("description") or
            item.findtext("atom:summary", namespaces=ns) or ""
        )

        if title:
            results.append(SearchResultItem(
                source_id=source_id, source_name=source_name,
                type="content", success=True, title=title.strip()[:200],
                url=link.strip() or None, original_url=link.strip() or None,
                content=desc.strip()[:3000] or None, resource_type="webpage",
            ))

    return results if results else None


# ═══════════════════════════════════════════════════════════
# HTML EXTRACTION
# ═══════════════════════════════════════════════════════════
def _extract_html(html: str, url: str) -> str:
    extracted = trafilatura.extract(html, output_format="html", include_links=True,
                                    include_images=False, include_tables=False, url=url)
    if extracted and len(extracted.strip()) > 100:
        return extracted
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.find(role="main") or soup.body
    return str(main) if main else ""


def _extract_meta(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    title = None
    thumb = None
    # OG / Twitter
    for prop in ("og:title", "twitter:title"):
        m = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if m and m.get("content"): title = m["content"].strip()
    if not title:
        h1 = soup.find("h1")
        if h1: title = h1.get_text(strip=True)
    if not title:
        t = soup.find("title")
        if t: title = t.get_text(strip=True)
    # Image
    for prop in ("og:image", "twitter:image"):
        m = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if m and m.get("content"): thumb = m["content"]
    if not thumb:
        img = soup.find("img", src=re.compile(r"https?://"))
        if img: thumb = img["src"]
    # JSON-LD structured data
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            ld = json.loads(script.string or "")
            if isinstance(ld, dict):
                if not thumb and ld.get("thumbnailUrl"): thumb = ld["thumbnailUrl"]
                if not thumb and ld.get("image"):
                    img_val = ld["image"]
                    thumb = img_val[0] if isinstance(img_val, list) else str(img_val)
        except (json.JSONDecodeError, TypeError):
            pass
    return {"title": title, "thumbnail_url": thumb}


# ── Content dedup ──
def _dedup(items: List[SearchResultItem]) -> List[SearchResultItem]:
    seen: set = set()
    out: List[SearchResultItem] = []
    for item in items:
        key = hashlib.md5((item.title or "").encode()).hexdigest()[:12]
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


# ═══════════════════════════════════════════════════════════
# MAIN ENTRY
# ═══════════════════════════════════════════════════════════
async def smart_scrape(
    query: str, url: str, source_id: int, source_name: str,
    client: httpx.AsyncClient,
) -> List[SearchResultItem]:
    api_url = _try_json_api(query, url)
    urls = [api_url, url] if api_url else [url]
    last_err: Optional[str] = None

    for attempt, target in enumerate(urls):
        domain = urlparse(target).netloc
        backoff = 0.5 * (2 ** attempt)

        try:
            await _rate_limit(domain)
            await asyncio.sleep(random.uniform(0.1, 0.5) + backoff)

            resp = await client.get(
                target, timeout=REQUEST_TIMEOUT,
                headers=_rand_headers(target),
            )
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "").lower()
            raw = resp.content

            # ── RSS/Atom ──
            if "xml" in ct or "rss" in ct or "atom" in ct or raw[:5] == b"<?xml":
                rss = _parse_rss(raw, source_id, source_name)
                if rss:
                    return _dedup(rss)

            # ── JSON ──
            if "json" in ct or (raw and raw[:1] in (b"{", b"[")):
                try:
                    data = json.loads(raw)
                    if isinstance(data, str) and data.startswith("") and "{" in data:
                        # Medium's weird JSON prefix
                        data = json.loads(data[data.index("{"):])
                    results = _parse_json(data, source_id, source_name)
                    if results:
                        return _dedup(results)
                except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
                    pass

            # ── HTML ──
            text = _decode(raw, ct)
            if text and len(text) > 80:
                meta = _extract_meta(text)
                content = _extract_html(text, target)
                return [SearchResultItem(
                    source_id=source_id, source_name=source_name,
                    type="content", success=True,
                    title=meta.get("title") or source_name,
                    content=content or None, original_url=target, url=target,
                    thumbnail_url=meta.get("thumbnail_url"),
                    resource_type="webpage",
                )]

        except (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError):
            last_err = "Connection error"
            continue
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (429, 503):
                await asyncio.sleep(backoff * 2)
                continue
            if e.response.status_code >= 500:
                continue
            last_err = f"HTTP {e.response.status_code}"
            break
        except Exception as e:
            last_err = f"{type(e).__name__}: {str(e)[:120]}"
            continue

    return [SearchResultItem(
        source_id=source_id, source_name=source_name,
        type="error", success=False, error=last_err or "Unable to fetch",
    )]


# ── Encoding detection ──
def _decode(content: bytes, ct: str = "") -> str:
    if not content: return ""
    if ct and "charset=" in ct.lower():
        ch = ct.lower().split("charset=")[-1].strip().strip("\"' ;")
        try: return content.decode(ch)
        except: pass
    head = content[:4096].decode("ascii", errors="ignore")
    m = re.search(r'<meta[^>]+charset=["\']?\s*([a-zA-Z0-9\-_]+)', head, re.IGNORECASE)
    if m:
        try: return content.decode(m.group(1).lower())
        except: pass
    try: return content.decode("utf-8")
    except: pass
    for enc in ("gbk", "gb18030", "gb2312", "big5", "shift_jis", "euc-kr"):
        try:
            d = content.decode(enc)
            if d.count("�") / max(len(d), 1) < 0.01: return d
        except: continue
    return content.decode("utf-8", errors="replace")
