from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./search_engine.db")

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


BUILTIN_SOURCES = [
    # ── 国内 ──
    {"name": "百度", "url": "https://www.baidu.com/s?wd={query}"},
    {"name": "搜狗", "url": "https://www.sogou.com/web?query={query}"},
    {"name": "360 搜索", "url": "https://www.so.com/s?q={query}"},
    {"name": "必应", "url": "https://www.bing.com/search?q={query}"},
    {"name": "B站", "url": "https://search.bilibili.com/all?keyword={query}", "embed": True},
    {"name": "知乎", "url": "https://www.zhihu.com/search?type=content&q={query}"},
    {"name": "微博", "url": "https://s.weibo.com/weibo?q={query}"},
    {"name": "豆瓣", "url": "https://www.douban.com/search?q={query}"},
    {"name": "CSDN", "url": "https://so.csdn.net/so/search?q={query}"},
    {"name": "掘金", "url": "https://juejin.cn/search?query={query}"},
    {"name": "虎嗅", "url": "https://www.huxiu.com/search.html?s={query}"},
    {"name": "少数派", "url": "https://sspai.com/search/post/{query}"},
    # ── 国际 ──
    {"name": "Google", "url": "https://www.google.com/search?q={query}"},
    {"name": "DuckDuckGo", "url": "https://duckduckgo.com/?q={query}"},
    {"name": "YouTube", "url": "https://www.youtube.com/results?search_query={query}", "embed": True},
    {"name": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Special:Search?search={query}"},
    {"name": "Reddit", "url": "https://www.reddit.com/search/?q={query}"},
    {"name": "GitHub", "url": "https://github.com/search?q={query}"},
    {"name": "StackOverflow", "url": "https://stackoverflow.com/search?q={query}"},
    {"name": "Medium", "url": "https://medium.com/search?q={query}"},
    {"name": "Vimeo", "url": "https://vimeo.com/search?q={query}", "embed": True},
    {"name": "Dailymotion", "url": "https://www.dailymotion.com/search/{query}", "embed": True},
]


async def _seed_builtins():
    from .models import SearchSource
    async with async_session() as session:
        result = await session.execute(
            select(SearchSource).where(SearchSource.is_builtin == True)
        )
        existing = result.scalars().all()
        existing_names = {s.name for s in existing}

        added = False
        for src in BUILTIN_SOURCES:
            if src["name"] not in existing_names:
                session.add(SearchSource(
                    name=src["name"],
                    search_url_template=src["url"],
                    allow_embed=src.get("embed", False),
                    is_builtin=True,
                ))
                added = True

        if added:
            await session.commit()


async def init_db():
    """Create tables and migrate old schema if needed."""
    from .models import SearchSource

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-migrate: add missing columns from old schema
    async with async_session() as session:
        try:
            await session.execute(select(SearchSource.is_builtin).limit(1))
        except Exception:
            # Old database without is_builtin column — drop and recreate
            async with engine.begin() as conn:
                await conn.run_sync(SearchSource.__table__.drop, checkfirst=True)
                await conn.run_sync(Base.metadata.create_all)

    await _seed_builtins()
