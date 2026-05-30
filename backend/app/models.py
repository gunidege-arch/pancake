from sqlalchemy import Column, Integer, String, Boolean, Text
from .database import Base


class SearchSource(Base):
    __tablename__ = "search_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    search_url_template = Column(String, nullable=False)
    allow_embed = Column(Boolean, default=False)
    is_builtin = Column(Boolean, default=False)
    device_id = Column(String, nullable=True, default=None, index=True)
    source_type = Column(String, nullable=False, default="html")  # "html" | "api"


class MusicSource(Base):
    __tablename__ = "music_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    api_url_template = Column(String, nullable=False)  # URL with {keyword}, {type}, {page} placeholders
    device_id = Column(String, nullable=False, index=True)
    is_builtin = Column(Boolean, default=False)
