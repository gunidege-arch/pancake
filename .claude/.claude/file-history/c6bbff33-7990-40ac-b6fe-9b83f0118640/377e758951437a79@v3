from typing import List, Optional
from pydantic import BaseModel, Field


class SearchSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    search_url_template: str = Field(..., min_length=1, max_length=500)
    allow_embed: bool = False
    device_id: str = Field(..., min_length=1, max_length=64)


class SearchSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    search_url_template: Optional[str] = Field(None, min_length=1, max_length=500)
    allow_embed: Optional[bool] = None


class SearchSourceResponse(BaseModel):
    id: int
    name: str
    search_url_template: str
    allow_embed: bool
    is_builtin: bool = False

    model_config = {"from_attributes": True}


class SearchResultItem(BaseModel):
    source_id: int
    source_name: str
    type: str  # "embed" | "content" | "video" | "error"
    success: bool
    url: Optional[str] = None
    content: Optional[str] = None
    original_url: Optional[str] = None
    error: Optional[str] = None
    resource_type: Optional[str] = None  # "video" | "webpage"
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    embed_url: Optional[str] = None
    video_url: Optional[str] = None
    is_builtin: bool = False


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
