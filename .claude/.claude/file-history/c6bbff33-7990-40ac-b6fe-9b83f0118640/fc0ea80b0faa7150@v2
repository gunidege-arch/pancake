from sqlalchemy import Column, Integer, String, Boolean
from .database import Base


class SearchSource(Base):
    __tablename__ = "search_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    search_url_template = Column(String, nullable=False)
    allow_embed = Column(Boolean, default=False)
    is_builtin = Column(Boolean, default=False)
    device_id = Column(String, nullable=True, default=None, index=True)
