import asyncio
import random
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse, urlunparse

import httpx
import trafilatura
from bs4 import BeautifulSoup

from ..schemas import SearchResultItem

# ---------------------------------------------------------------------------
# HTTP headers — full Chrome 120 fingerprint
# ---------------------------------------------------------------------------
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Sec-CH-UA": '"Google Chrome";v="120", "Not?A_Brand";v="8", "Chromium";v="120"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    "Connection": "keep-alive",
}

REQUEST_TIMEOUT = 12.0


def _build_request_headers(url: str) -> dict:
    """Return browser-like headers with a dynamic Referer.

    The Referer is set to ``https://www.google.com/`` so the request
    appears to originate from a Google search click — this is one of the
    most effective ways to avoid 403 / bot-detection blocks.
    """
    headers = dict(BROWSER_HEADERS)
    headers["Referer"] = "https://www.google.com/"
    return headers


# ---------------------------------------------------------------------------
# Sites that serve empty shells without JS rendering → route to Playwright
# ---------------------------------------------------------------------------
JS_REQUIRED_HOSTS: set = {
    "douyin.com", "www.douyin.com", "live.douyin.com",
    "weibo.com", "www.weibo.com", "m.weibo.cn", "s.weibo.com",
    "xiaohongshu.com", "www.xiaohongshu.com",
    "zhihu.com", "www.zhihu.com",
    "taobao.com", "www.taobao.com",
    "jd.com", "www.jd.com", "item.jd.com",
}

# When the extracted content is unreadable we return this message.
UNSUPPORTED_PREVIEW_MSG = (
    '<div style="text-align:center;padding:2.5rem 1rem;color:#6b7280;">'
    '<p style="font-size:1.1rem;font-weight:600;margin:0 0 0.5rem;">'
    '该源暂不支持直接预览</p>'
    '<p style="font-size:0.85rem;margin:0;">请点击跳转查看原始页面</p>'
    '</div>'
)


def _needs_js_render(url: str) -> bool:
    """Return True if the URL's host is known to require JS rendering."""
    host = urlparse(url).netloc.lower()
    # Strip port if present
    host = host.split(":")[0]
    return host in JS_REQUIRED_HOSTS


# ---------------------------------------------------------------------------
# Encoding detection & safe decode
# ---------------------------------------------------------------------------
def _decode_response_bytes(content: bytes, content_type: str = "") -> str:
    """Decode HTTP response bytes with multi-level encoding detection.

    Chinese sites (Douyin, Weibo, etc.) often serve GBK / GB2312 without
    setting the charset in Content-Type, causing httpx to default to UTF-8
    and produce garbled text.  This function tries (in order):

    1. charset from the Content-Type header
    2. ``<meta charset>`` in the HTML head
    3. UTF-8
    4. Common CJK encodings (gbk, gb18030, gb2312, big5, shift_jis, euc-kr)
    5. UTF-8 with replacement characters (last resort)
    """
    if not content:
        return ""

    # 1. Content-Type charset  -------------------------------------------
    if content_type:
        ct_lower = content_type.lower()
        if "charset=" in ct_lower:
            charset = ct_lower.split("charset=")[-1].strip().strip("\"' ;")
            try:
                return content.decode(charset)
            except (LookupError, UnicodeDecodeError):
                pass

    # 2. <meta charset> in the first 4 KB  --------------------------------
    head = content[:4096].decode("ascii", errors="ignore")
    match = re.search(
        r'<meta[^>]+charset=["\']?\s*([a-zA-Z0-9\-_]+)',
        head,
        re.IGNORECASE,
    )
    if match:
        charset = match.group(1).lower()
        # Normalise aliases
        _alias: dict = {"gbk": "gbk", "gb2312": "gbk", "gb18030": "gb18030"}
        charset = _alias.get(charset, charset)
        try:
            return content.decode(charset)
        except (LookupError, UnicodeDecodeError):
            pass

    # 3. UTF-8 (most common)  --------------------------------------------
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        pass

    # 4. Common CJK encodings  -------------------------------------------
    for enc in ("gbk", "gb18030", "gb2312", "big5", "shift_jis", "euc-kr", "euc-jp"):
        try:
            decoded = content.decode(enc)
            # Sanity: replacement-char ratio below 1%
            if decoded.count("�") / max(len(decoded), 1) < 0.01:
                return decoded
        except (UnicodeDecodeError, LookupError):
            continue

    # 5. Desperate fallback  ---------------------------------------------
    return content.decode("utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Garbled / binary data detection
# ---------------------------------------------------------------------------
def _is_unreadable(text: str) -> bool:
    """Return True if *text* appears to be binary garbage or an empty shell."""
    if not text or len(text.strip()) < 80:
        return True

    # Replacement-char ratio > 3%  →  bad decode
    if text.count("�") / max(len(text), 1) > 0.03:
        return True

    # Null bytes in text  →  binary payload
    if "\x00" in text[:4096]:
        return True

    # Extremely high tag-to-text ratio  →  JS shell with no readable content
    tag_chars = text.count("<") + text.count(">")
    if tag_chars / max(len(text), 1) > 0.25:
        stripped = BeautifulSoup(text, "lxml").get_text(separator=" ", strip=True)
        if len(stripped) < 120:
            return True

    return False


# ---------------------------------------------------------------------------
# Playwright browser (lazy singleton) — optional, local-only
# ---------------------------------------------------------------------------
_browser = None
_browser_lock = asyncio.Lock()
_browser_semaphore = asyncio.Semaphore(3)  # limit concurrent browser tabs
_playwright_available = None  # tri-state: None=unchecked, True/False


def _check_playwright_available() -> bool:
    global _playwright_available
    if _playwright_available is None:
        try:
            import playwright  # noqa: F401
            _playwright_available = True
        except ImportError:
            _playwright_available = False
    return _playwright_available


async def _get_browser():
    """Return a shared headless Chromium browser instance."""
    global _browser
    if not _check_playwright_available():
        return None
    if _browser is None:
        async with _browser_lock:
            if _browser is None:
                from playwright.async_api import async_playwright

                pw = await async_playwright().start()
                _browser = await pw.chromium.launch(
                    headless=True,
                    args=["--disable-dev-shm-usage", "--no-sandbox"],
                )
    return _browser


async def _fetch_with_browser(url: str) -> str:
    """Fetch a JS-rendered page using Playwright.  Returns the final HTML."""
    if not _check_playwright_available():
        raise RuntimeError("Playwright is not installed (Vercel/serverless environment)")

    browser = await _get_browser()
    if browser is None:
        raise RuntimeError("Playwright browser could not be started")

    async with _browser_semaphore:
        context = await browser.new_context(
            user_agent=BROWSER_HEADERS["User-Agent"],
            viewport={"width": 1920, "height": 1080},
            locale="zh-CN",
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            await asyncio.sleep(1.5)
            return await page.content()
        finally:
            await context.close()


# ---------------------------------------------------------------------------
# Unified fetch helper
# ---------------------------------------------------------------------------
async def _fetch_html(client: httpx.AsyncClient, url: str) -> str:
    """Fetch page HTML.

    Uses httpx for normal sites and Playwright for sites that require JS
    rendering (Douyin, Weibo, etc.).  Raw bytes are decoded via the
    multi-encoding detection pipeline.
    """
    needs_js = _needs_js_render(url)

    if needs_js:
        if _check_playwright_available():
            try:
                return await _fetch_with_browser(url)
            except Exception as e:
                print(f"[SEARCH WARN] Playwright render failed for '{url}': {e}")
                raise
        else:
            print(f"[SEARCH INFO] JS-rendered host '{url}' but Playwright unavailable — using httpx fallback")

    # Fast path: plain httpx  -------------------------------------------
    await asyncio.sleep(random.uniform(0.3, 1.5))
    resp = await client.get(
        url,
        timeout=REQUEST_TIMEOUT,
        headers=_build_request_headers(url),
    )
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")
    text = _decode_response_bytes(resp.content, content_type)

    # If the result looks like a JS shell, try Playwright as fallback
    if _is_unreadable(text):
        if _check_playwright_available():
            print(f"[SEARCH INFO] httpx returned shell for '{url}', trying Playwright…")
            try:
                text = await _fetch_with_browser(url)
            except Exception as e:
                print(f"[SEARCH WARN] Playwright fallback also failed: {e}")
        else:
            print(f"[SEARCH WARN] httpx returned shell for '{url}' and Playwright is not available")

    return text


# ---------------------------------------------------------------------------
# Video platform detection & embed-url resolution
# ---------------------------------------------------------------------------
VIDEO_PLATFORMS: Dict[str, dict] = {
    "youtube.com": {
        "pattern": re.compile(
            r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})"
        ),
        "embed": "https://www.youtube.com/embed/{video_id}",
        "thumbnail": "https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "label": "YouTube",
    },
    "bilibili.com": {
        "pattern": re.compile(r"bilibili\.com/video/(BV[a-zA-Z0-9]+)"),
        "embed": "https://player.bilibili.com/player.html?bvid={video_id}&page=1",
        "thumbnail": None,
        "label": "Bilibili",
    },
    "vimeo.com": {
        "pattern": re.compile(r"vimeo\.com/(\d+)"),
        "embed": "https://player.vimeo.com/video/{video_id}",
        "thumbnail": None,
        "label": "Vimeo",
    },
    "dailymotion.com": {
        "pattern": re.compile(r"dailymotion\.com/video/([a-zA-Z0-9]+)"),
        "embed": "https://www.dailymotion.com/embed/video/{video_id}",
        "thumbnail": None,
        "label": "Dailymotion",
    },
    "v.qq.com": {
        "pattern": re.compile(r"v\.qq\.com/x/(?:cover/\w+/|page/)?(\w+)"),
        "embed": "https://v.qq.com/txp/iframe/player.html?vid={video_id}",
        "thumbnail": None,
        "label": "腾讯视频",
    },
    "youku.com": {
        "pattern": re.compile(r"youku\.com/v_show/id_([a-zA-Z0-9=]+)"),
        "embed": "https://player.youku.com/embed/{video_id}",
        "thumbnail": None,
        "label": "优酷",
    },
    "iqiyi.com": {
        "pattern": re.compile(r"iqiyi\.com/v_([a-zA-Z0-9]+)"),
        "embed": "https://www.iqiyi.com/common/player.html?v={video_id}",
        "thumbnail": None,
        "label": "爱奇艺",
    },
    "twitch.tv": {
        "pattern": re.compile(r"twitch\.tv/(?:videos/)?(\d+)"),
        "embed": "https://player.twitch.tv/?video={video_id}&parent=localhost",
        "thumbnail": None,
        "label": "Twitch",
    },
    "tiktok.com": {
        "pattern": re.compile(r"tiktok\.com/@[^/]+/video/(\d+)"),
        "embed": "https://www.tiktok.com/embed/v2/{video_id}",
        "thumbnail": None,
        "label": "TikTok",
    },
    "nicovideo.jp": {
        "pattern": re.compile(r"nicovideo\.jp/watch/(sm\d+)"),
        "embed": "https://embed.nicovideo.jp/watch/{video_id}",
        "thumbnail": None,
        "label": "Niconico",
    },
}


def _classify_resource(url: str) -> str:
    """Classify a URL as 'video' or 'webpage' based on known video platform domains."""
    lower = url.lower()
    for domain in VIDEO_PLATFORMS:
        if domain in lower:
            return "video"
    return "webpage"


def _get_video_metadata(url: str) -> dict:
    """Return embed_url and thumbnail_url for a known video URL (or empty dict)."""
    lower = url.lower()
    for domain, cfg in VIDEO_PLATFORMS.items():
        if domain in lower:
            m = cfg["pattern"].search(url)
            if m:
                video_id = m.group(1)
                meta: dict = {"embed_url": cfg["embed"].format(video_id=video_id)}
                if cfg["thumbnail"]:
                    meta["thumbnail_url"] = cfg["thumbnail"].format(video_id=video_id)
                return meta
    return {}


def _extract_video_id(url: str, cfg: dict) -> Optional[str]:
    """Try to extract a video ID from *url* using the platform's regex pattern."""
    m = cfg["pattern"].search(url)
    return m.group(1) if m else None


def _find_nearby_thumbnail(element, max_depth: int = 5) -> Optional[str]:
    """Walk up the DOM from *element* looking for a nearby ``<img>`` thumbnail.

    Returns the best ``src`` found (preferring larger / non-icon images), or
    ``None`` if nothing plausible is found within *max_depth* ancestor levels.
    """
    candidates: List[Tuple[int, str]] = []  # (score, url)
    current = element
    for _ in range(max_depth):
        if current is None:
            break
        for img in current.find_all("img", src=True):
            src = (img.get("src") or "").strip()
            if not src or src.startswith("data:"):
                continue
            # Score: prefer images with width/height hints and larger dimensions
            score = 0
            try:
                w = int(img.get("width") or 0)
                h = int(img.get("height") or 0)
                if w >= 120 and h >= 90:
                    score += w * h
            except ValueError:
                pass
            # Bonus: URL contains keywords that suggest a thumbnail
            if any(kw in src.lower() for kw in ("thumb", "cover", "poster", "snapshot", "hdslb", "bfs/archive")):
                score += 10000
            # Penalty: tiny / icon-like
            if any(kw in src.lower() for kw in ("icon", "avatar", "logo", "favicon")):
                score -= 50000
            # Penalty: 1x1 tracking pixels
            if "1x1" in src or "spacer" in src.lower():
                continue
            if score > -1000:
                candidates.append((score, src))
        current = current.parent

    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def _scan_html_for_videos(html: str, base_url: str = "") -> List[dict]:
    """Scan HTML for embeddable video sources.

    Detection strategies (in priority order):

    1. ``<iframe>`` tags whose ``src`` matches a known video platform
    2. ``<a>`` links pointing to known video platform watch pages
    3. ``<meta property="og:video">`` Open Graph video tags
    4. ``<meta name="twitter:player">`` Twitter player cards
    5. ``<script type="application/ld+json">`` VideoObject schema
    6. ``<video>`` / ``<source>`` tags with direct mp4 / webm URLs

    Returns a list of dicts::

        {
            "embed_url": str,       # ready-to-embed iframe URL
            "original_url": str,    # the original watch page URL
            "thumbnail_url": str | None,
            "title": str,
            "platform": str,        # label from VIDEO_PLATFORMS or "direct"
        }
    """
    soup = BeautifulSoup(html, "lxml")
    found: List[dict] = []
    seen_ids: set = set()
    seen_urls: set = set()

    def _add(video_id: str, cfg: dict, original_url: str, title: str = "", thumbnail: Optional[str] = None) -> None:
        key = f"{cfg['label']}:{video_id}"
        if key in seen_ids:
            return
        seen_ids.add(key)
        emb = cfg["embed"].format(video_id=video_id)
        thumb = thumbnail or (cfg["thumbnail"].format(video_id=video_id) if cfg.get("thumbnail") else None)
        found.append({
            "embed_url": emb,
            "original_url": original_url,
            "thumbnail_url": thumb,
            "title": title,
            "platform": cfg["label"],
        })

    # 1. <iframe> tags  -------------------------------------------------
    for iframe in soup.find_all("iframe"):
        src = (iframe.get("src") or "").strip()
        if not src:
            continue
        full_src = urljoin(base_url, src)
        for domain, cfg in VIDEO_PLATFORMS.items():
            if domain in full_src.lower():
                vid = _extract_video_id(full_src, cfg)
                if vid:
                    thumb = _find_nearby_thumbnail(iframe)
                    title = iframe.get("title") or ""
                    _add(vid, cfg, full_src, title=title, thumbnail=thumb)

    # 2. <a> links to video watch pages  ---------------------------------
    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        full_href = urljoin(base_url, href)
        for domain, cfg in VIDEO_PLATFORMS.items():
            if domain in full_href.lower():
                vid = _extract_video_id(full_href, cfg)
                if vid:
                    title = a.get("title") or a.get("aria-label") or a.get_text(strip=True)
                    # If the link text is empty (e.g. thumbnail-only <a>),
                    # search nearby elements for a real title
                    if not title:
                        parent = a.parent
                        for _ in range(4):
                            if parent is None:
                                break
                            for h in parent.find_all(["h1", "h2", "h3", "h4", "a"]):
                                candidate = h.get("title") or h.get_text(strip=True)
                                if candidate and len(candidate) > 2:
                                    title = candidate
                                    break
                            if title:
                                break
                            parent = parent.parent
                    thumb = _find_nearby_thumbnail(a)
                    _add(vid, cfg, full_href, title=title, thumbnail=thumb)

    # 3. Open Graph video meta  ------------------------------------------
    for meta in soup.find_all("meta", property=True):
        prop = meta.get("property", "").lower()
        content = (meta.get("content") or "").strip()
        if prop in ("og:video", "og:video:url", "og:video:secure_url") and content:
            full = urljoin(base_url, content)
            for domain, cfg in VIDEO_PLATFORMS.items():
                if domain in full.lower():
                    vid = _extract_video_id(full, cfg)
                    if vid:
                        thumb = _find_nearby_thumbnail(meta)
                        _add(vid, cfg, full, thumbnail=thumb)

    # 4. Twitter player card  --------------------------------------------
    tw_player = soup.find("meta", attrs={"name": "twitter:player"})
    if tw_player and tw_player.get("content"):
        tw_src = tw_player["content"].strip()
        full = urljoin(base_url, tw_src)
        for domain, cfg in VIDEO_PLATFORMS.items():
            if domain in full.lower():
                vid = _extract_video_id(full, cfg)
                if vid:
                    thumb = _find_nearby_thumbnail(tw_player)
                    _add(vid, cfg, full, thumbnail=thumb)

    # 5. JSON-LD VideoObject  --------------------------------------------
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
        except (ValueError, TypeError):
            continue
        if isinstance(data, dict):
            items = [data] if data.get("@type") == "VideoObject" else data.get("@graph", [])
        elif isinstance(data, list):
            items = [d for d in data if isinstance(d, dict) and d.get("@type") == "VideoObject"]
        else:
            continue
        for item in items:
            embed_url = item.get("embedUrl") or item.get("embedURL") or ""
            content_url = item.get("contentUrl") or item.get("contentURL") or item.get("url") or ""
            candidate = embed_url or content_url
            if not candidate:
                continue
            if isinstance(candidate, list):
                candidate = candidate[0] if candidate else ""
            candidate = str(candidate).strip()
            if not candidate:
                continue
            full = urljoin(base_url, candidate)
            matched = False
            for domain, cfg in VIDEO_PLATFORMS.items():
                if domain in full.lower():
                    vid = _extract_video_id(full, cfg)
                    if vid:
                        _add(vid, cfg, full, title=str(item.get("name", "")))
                        matched = True
                        break
            if not matched and full not in seen_urls:
                seen_urls.add(full)
                found.append({
                    "embed_url": full,
                    "original_url": full,
                    "thumbnail_url": str(item.get("thumbnailUrl", "") or "") or None,
                    "title": str(item.get("name", "")),
                    "platform": "direct",
                })

    # 6. <video> / <source> direct media  --------------------------------
    for video in soup.find_all("video"):
        poster = video.get("poster", "") or None
        for src_el in ([video] + video.find_all("source")):
            src = (src_el.get("src") or "").strip()
            if not src:
                continue
            full = urljoin(base_url, src)
            if full in seen_urls:
                continue
            seen_urls.add(full)
            found.append({
                "embed_url": full,
                "original_url": full,
                "thumbnail_url": poster,
                "title": "",
                "platform": "direct",
            })

    return found


def _extract_metadata(html: str) -> dict:
    """Extract og:title / title and og:image / twitter:image from HTML.

    Also checks ``<h1>``, ``<link rel=\"image_src\">``, ``itemprop``
    microdata, and the ``<title>`` tag as fallbacks.
    """
    soup = BeautifulSoup(html, "lxml")
    title = None
    thumbnail = None

    # ── Title extraction ────────────────────────────────────────────
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()

    if not title:
        # Try <h1> — often the video / article title
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    if not title:
        # YouTube uses <meta name="title">
        meta_title = soup.find("meta", attrs={"name": "title"})
        if meta_title and meta_title.get("content"):
            title = meta_title["content"].strip()

    if not title:
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)

    # ── Thumbnail extraction ────────────────────────────────────────
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        thumbnail = og_image["content"]

    if not thumbnail:
        tw_image = soup.find("meta", attrs={"name": "twitter:image"})
        if tw_image and tw_image.get("content"):
            thumbnail = tw_image["content"]

    if not thumbnail:
        # <link rel="image_src">  — common on older / Chinese sites
        link_img = soup.find("link", rel="image_src")
        if link_img and link_img.get("href"):
            thumbnail = link_img["href"]

    if not thumbnail:
        # Schema.org microdata  —  itemtype="VideoObject" thumbnailUrl
        for tag in soup.find_all(attrs={"itemprop": "thumbnailUrl"}):
            src = tag.get("content") or tag.get("src") or tag.get("href")
            if src:
                thumbnail = src.strip()
                break

    if not thumbnail:
        # itemtype="VideoObject" → <meta itemprop="image">
        meta_itemprop_img = soup.find("meta", attrs={"itemprop": "image"})
        if meta_itemprop_img and meta_itemprop_img.get("content"):
            thumbnail = meta_itemprop_img["content"]

    return {"title": title, "thumbnail_url": thumbnail}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _try_embed_friendly_url(url: str) -> str:
    """Attempt to rewrite a URL to a mobile or embed-friendly version."""
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if host in EMBED_FRIENDLY_HOSTS:
        new_host = EMBED_FRIENDLY_HOSTS[host]
        return urlunparse(parsed._replace(netloc=new_host))

    if host.startswith("www."):
        mobile_host = "m." + host[4:]
        return urlunparse(parsed._replace(netloc=mobile_host))

    return url


def _extract_readable_content(html: str, url: str) -> str:
    """Extract main content from HTML using trafilatura with BeautifulSoup fallback."""
    extracted = trafilatura.extract(
        html,
        output_format="html",
        include_links=True,
        include_images=False,
        include_tables=False,
        url=url,
    )

    if extracted and len(extracted.strip()) > 100:
        return extracted

    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe"]):
        tag.decompose()

    main = soup.find("main") or soup.find("article") or soup.find(role="main") or soup.body
    if main:
        return str(main)

    return "<p>No readable content extracted.</p>"


# ---------------------------------------------------------------------------
# Core search
# ---------------------------------------------------------------------------
async def _search_single(
    source_id: int,
    source_name: str,
    url: str,
    allow_embed: bool,
    client: httpx.AsyncClient,
) -> List[SearchResultItem]:
    """Search a single source.  Returns a **list** — one item per video found."""
    resource_type = _classify_resource(url)

    # ── Video path ────────────────────────────────────────────────────
    if resource_type == "video":
        return await _handle_video_source(source_id, source_name, url, client)

    # ── Embed path (non-video, allow_embed=True) ──────────────────────
    if allow_embed:
        embed_url = _try_embed_friendly_url(url)
        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="embed",
                success=True,
                url=embed_url,
                resource_type="webpage",
                embed_url=embed_url,
                video_url=embed_url,
            )
        ]

    # ── Content path (non-video, allow_embed=False) ───────────────────
    return await _handle_content_source(source_id, source_name, url, client)


async def _handle_video_source(
    source_id: int,
    source_name: str,
    url: str,
    client: httpx.AsyncClient,
) -> List[SearchResultItem]:
    """Handle a URL classified as a video platform.

    1. Try a direct URL-pattern match (fast, no HTTP).
    2. If that fails, fetch the page and return **every** video found.
    3. Fall back to treating it as regular content.
    """
    # ── 1. Direct pattern match (single video URL) ────────────────────
    video_meta = _get_video_metadata(url)
    if video_meta:
        embed_url = video_meta.get("embed_url", url)
        thumbnail_url = video_meta.get("thumbnail_url")
        title = None

        try:
            resp = await client.get(
                url,
                timeout=REQUEST_TIMEOUT,
                headers=_build_request_headers(url),
            )
            resp.raise_for_status()
            html = _decode_response_bytes(resp.content, resp.headers.get("content-type", ""))
            if not _is_unreadable(html):
                meta = _extract_metadata(html)
                title = meta.get("title")
                if not thumbnail_url:
                    thumbnail_url = meta.get("thumbnail_url")
        except httpx.TimeoutException:
            print(f"[SEARCH ERROR] Timeout fetching video meta '{source_name}' ({url})")
        except httpx.HTTPStatusError as e:
            print(f"[SEARCH ERROR] HTTP {e.response.status_code} fetching video meta '{source_name}' ({url})")
        except Exception as e:
            print(f"[SEARCH ERROR] {type(e).__name__}: {e} fetching video meta '{source_name}' ({url})")

        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="video",
                success=True,
                url=embed_url,
                original_url=url,
                resource_type="video",
                thumbnail_url=thumbnail_url,
                title=title or source_name,
                embed_url=embed_url,
                video_url=embed_url,
            )
        ]

    # ── 2. Pattern failed → fetch page & scan for ALL videos ──────────
    print(f"[SEARCH INFO] Video platform '{source_name}' but no direct pattern match for '{url}', scanning HTML…")
    try:
        html = await _fetch_html(client, url)
    except Exception as e:
        print(f"[SEARCH ERROR] Failed to fetch video page '{source_name}': {e}")
        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="error",
                success=False,
                error=f"无法访问视频页面: {str(e)[:150]}",
            )
        ]

    videos = _scan_html_for_videos(html, url)

    if videos:
        print(f"[SEARCH INFO] Found {len(videos)} video(s) on '{source_name}' — returning all")
        results: List[SearchResultItem] = []
        for v in videos:
            results.append(
                SearchResultItem(
                    source_id=source_id,
                    source_name=source_name,
                    type="video",
                    success=True,
                    url=v["embed_url"],
                    original_url=v.get("original_url", url),
                    resource_type="video",
                    thumbnail_url=v.get("thumbnail_url"),
                    title=v.get("title") or source_name,
                    embed_url=v["embed_url"],
                    video_url=v["embed_url"],
                )
            )
        return results

    # ── 3. No videos found → treat as regular content ────────────────
    print(f"[SEARCH INFO] No videos found in '{source_name}' page, falling back to content extraction")
    return _build_content_result(source_id, source_name, url, html)


async def _handle_content_source(
    source_id: int,
    source_name: str,
    url: str,
    client: httpx.AsyncClient,
) -> List[SearchResultItem]:
    """Handle a non-video URL: fetch, extract content, and scan for embedded videos."""
    try:
        html = await _fetch_html(client, url)
    except httpx.TimeoutException:
        print(f"[SEARCH ERROR] Timeout fetching '{source_name}' ({url})")
        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="error",
                success=False,
                error="Request timed out",
            )
        ]
    except httpx.HTTPStatusError as e:
        print(f"[SEARCH ERROR] HTTP {e.response.status_code} fetching '{source_name}' ({url})")
        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="error",
                success=False,
                error=f"HTTP {e.response.status_code}",
            )
        ]
    except Exception as e:
        print(f"[SEARCH ERROR] {type(e).__name__}: {e} fetching '{source_name}' ({url})")
        return [
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="error",
                success=False,
                error=str(e)[:200],
            )
        ]

    return _build_content_result(source_id, source_name, url, html)


def _build_content_result(
    source_id: int,
    source_name: str,
    url: str,
    html: str,
) -> List[SearchResultItem]:
    """Build result items from fetched HTML.

    - Detects garbled/binary content and returns a clean fallback.
    - Returns the text-content item **plus** one item per embedded video.
    """
    results: List[SearchResultItem] = []

    if _is_unreadable(html):
        results.append(
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="content",
                success=True,
                content=UNSUPPORTED_PREVIEW_MSG,
                original_url=url,
                resource_type="webpage",
                title=source_name,
            )
        )
        return results

    meta = _extract_metadata(html)
    content = _extract_readable_content(html, url)

    # ── Content item ──────────────────────────────────────────────────
    results.append(
        SearchResultItem(
            source_id=source_id,
            source_name=source_name,
            type="content",
            success=True,
            content=content,
            original_url=url,
            resource_type="webpage",
            thumbnail_url=meta.get("thumbnail_url"),
            title=meta.get("title"),
        )
    )

    # ── Embedded video items (one per video found on the page) ────────
    videos = _scan_html_for_videos(html, url)
    for v in videos:
        results.append(
            SearchResultItem(
                source_id=source_id,
                source_name=source_name,
                type="video",
                success=True,
                url=v["embed_url"],
                original_url=v.get("original_url", url),
                resource_type="video",
                thumbnail_url=v.get("thumbnail_url") or meta.get("thumbnail_url"),
                title=v.get("title") or meta.get("title") or source_name,
                embed_url=v["embed_url"],
                video_url=v["embed_url"],
            )
        )

    return results


async def search_all(
    query: str,
    sources: List[Tuple[int, str, str, bool, bool]],
) -> List[SearchResultItem]:
    """Run concurrent searches across all sources."""
    async with httpx.AsyncClient(
        headers=BROWSER_HEADERS,
        follow_redirects=True,
        timeout=httpx.Timeout(REQUEST_TIMEOUT),
    ) as client:
        tasks = [
            _search_single(src_id, src_name, template.replace("{query}", query), allow_embed, client)
            for src_id, src_name, template, allow_embed, _is_builtin in sources
        ]
        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    processed: List[SearchResultItem] = []
    for i, result in enumerate(raw_results):
        if isinstance(result, list):
            # Normal case — _search_single now returns a list
            processed.extend(result)
        elif isinstance(result, SearchResultItem):
            # Legacy single-item return (shouldn't happen, but handle gracefully)
            processed.append(result)
        else:
            # Exception during gather
            processed.append(
                SearchResultItem(
                    source_id=sources[i][0],
                    source_name=sources[i][1],
                    type="error",
                    success=False,
                    error=str(result)[:200],
                )
            )

    return processed
