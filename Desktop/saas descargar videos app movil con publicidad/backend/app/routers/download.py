from fastapi import APIRouter, HTTPException, BackgroundTasks
from ..models import VideoDownloadRequest, VideoDownloadResponse
from ..services import youtube_service, storage_service
import logging

router = APIRouter(prefix="/api/download", tags=["download"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=VideoDownloadResponse)
async def download_video(request: VideoDownloadRequest):
    """Download video from YouTube URL"""
    try:
        # Download video
        result = await youtube_service.download_video(str(request.url))

        # Upload to S3 (or keep local)
        download_url = await storage_service.upload_file(result['filepath'])

        return VideoDownloadResponse(
            video_id=result['video_id'],
            title=result['title'],
            duration=result['duration'],
            thumbnail=result['thumbnail'],
            download_url=download_url
        )
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/info")
async def get_video_info(url: str):
    """Get video information without downloading"""
    try:
        info = await youtube_service.get_video_info(url)
        return info
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
