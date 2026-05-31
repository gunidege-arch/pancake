import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .database import init_db
from .routers import sources, search
import httpx


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app = FastAPI(
    title="Aggregated Search Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sources.router)
app.include_router(search.router)


@app.get("/api/health")
async def health():
    try:
        async with httpx.AsyncClient(base_url=LXSERVER_BASE, timeout=5.0) as c:
            await c.get("/")
        lxserver_ok = True
    except Exception:
        lxserver_ok = False
    return {"status": "ok", "lxserver": lxserver_ok}


# ── Proxy unmatched requests to lxserver (internal port 9527) ──
LXSERVER_PORT = int(os.getenv("LXSERVER_PORT", "9527"))
LXSERVER_BASE = f"http://127.0.0.1:{LXSERVER_PORT}"

EXCLUDED_PREFIXES = ("/api/",)


async def _proxy(request: Request):
    client = httpx.AsyncClient(base_url=LXSERVER_BASE, timeout=30.0)
    path = request.url.path
    query = str(request.url.query)
    url = f"{path}?{query}" if query else path
    try:
        r = await client.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items()
                     if k.lower() not in ("host", "content-length")},
            content=await request.body(),
            follow_redirects=True,
        )
        return StreamingResponse(
            r.aiter_bytes(),
            status_code=r.status_code,
            headers={k: v for k, v in r.headers.items()
                     if k.lower() not in ("transfer-encoding", "content-encoding")},
        )
    except httpx.ConnectError:
        return {"detail": "lxserver not running"}, 502
    finally:
        await client.aclose()


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def catch_all(request: Request, path: str):
    return await _proxy(request)
