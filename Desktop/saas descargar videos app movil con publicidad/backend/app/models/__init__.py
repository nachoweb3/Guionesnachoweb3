from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime


class VideoDownloadRequest(BaseModel):
    url: HttpUrl


class VideoDownloadResponse(BaseModel):
    video_id: str
    title: str
    duration: float
    thumbnail: str
    download_url: str


class VideoEditRequest(BaseModel):
    video_id: str
    start_time: float
    end_time: float
    text_overlays: Optional[List[dict]] = []
    music_url: Optional[str] = None
    template: Optional[str] = None


class VideoExportRequest(BaseModel):
    video_id: str
    format: str = "mp4"
    resolution: str = "1080x1920"  # Vertical format for TikTok/Reels


class PaymentRequest(BaseModel):
    amount: int
    currency: str = "usd"
    product_type: str  # 'premium', 'hd_export', etc.


class VideoMetadata(BaseModel):
    id: str
    title: str
    duration: float
    created_at: datetime
    user_id: Optional[str] = None
