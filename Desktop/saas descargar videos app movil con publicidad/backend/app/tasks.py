from .celery_app import celery_app
from .services import youtube_service, video_service, storage_service
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name='download_video_task')
def download_video_task(url: str):
    """Background task to download video from YouTube"""
    try:
        result = youtube_service.download_video(url)
        logger.info(f"Video downloaded: {result['video_id']}")
        return result
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        raise


@celery_app.task(name='process_video_task')
def process_video_task(
    filepath: str,
    start_time: float = 0,
    end_time: float = None,
    text_overlays: list = None,
    music_path: str = None,
    to_vertical: bool = True
):
    """Background task to process video"""
    try:
        result = video_service.process_video(
            filepath=filepath,
            start_time=start_time,
            end_time=end_time,
            text_overlays=text_overlays,
            music_path=music_path,
            to_vertical=to_vertical
        )
        logger.info(f"Video processed: {result}")
        return result
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise


@celery_app.task(name='upload_to_storage_task')
def upload_to_storage_task(filepath: str):
    """Background task to upload video to S3"""
    try:
        url = storage_service.upload_file(filepath)
        logger.info(f"Video uploaded to: {url}")
        return url
    except Exception as e:
        logger.error(f"Error uploading to storage: {str(e)}")
        raise
