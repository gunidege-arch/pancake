import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import sources, search, music


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
app.include_router(music.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
