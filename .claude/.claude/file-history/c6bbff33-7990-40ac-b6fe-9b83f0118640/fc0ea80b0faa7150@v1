from sqlalchemy import Column, Integer, String, Boolean
from .database import Base


class SearchSource(Base):
    __tablename__ = "search_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    search_url_template = Column(String, nullable=False)
    allow_embed = Column(Boolean, default=False)
