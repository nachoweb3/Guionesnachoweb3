from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
import json
import os
from ..models import VideoEditRequest
from ..services import video_service, storage_service
import logging

router = APIRouter(prefix="/api/edit", tags=["edit"])
logger = logging.getLogger(__name__)


@router.post("/process")
async def process_video(
    video_file: UploadFile = File(...),
    start_time: float = Form(0),
    end_time: Optional[float] = Form(None),
    text_overlays: Optional[str] = Form(None),
    music_file: Optional[UploadFile] = File(None),
    to_vertical: bool = Form(True)
):
    """Process video with editing options"""
    try:
        # Save uploaded video temporarily
        video_path = f"/tmp/videos/{video_file.filename}"
        os.makedirs("/tmp/videos", exist_ok=True)

        with open(video_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)

        # Parse text overlays if provided
        overlays = None
        if text_overlays:
            try:
                overlays = json.loads(text_overlays)
            except:
                overlays = None

        # Save music file if provided
        music_path = None
        if music_file:
            music_path = f"/tmp/videos/{music_file.filename}"
            with open(music_path, "wb") as buffer:
                content = await music_file.read()
                buffer.write(content)

        # Process video
        processed_path = await video_service.process_video(
            filepath=video_path,
            start_time=start_time,
            end_time=end_time,
            text_overlays=overlays,
            music_path=music_path,
            to_vertical=to_vertical
        )

        # Upload processed video
        final_url = await storage_service.upload_file(processed_path)

        # Cleanup temporary files
        if os.path.exists(video_path):
            os.remove(video_path)
        if music_path and os.path.exists(music_path):
            os.remove(music_path)
        if os.path.exists(processed_path):
            os.remove(processed_path)

        return {
            "status": "success",
            "video_url": final_url,
            "message": "Video processed successfully"
        }
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trim")
async def trim_video(
    video_file: UploadFile = File(...),
    start_time: float = Form(0),
    end_time: float = Form(60)
):
    """Trim video to specified duration"""
    try:
        # Save uploaded video temporarily
        video_path = f"/tmp/videos/{video_file.filename}"
        os.makedirs("/tmp/videos", exist_ok=True)

        with open(video_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)

        # Trim video
        trimmed_path = await video_service.trim_video(video_path, start_time, end_time)

        # Upload trimmed video
        final_url = await storage_service.upload_file(trimmed_path)

        # Cleanup
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(trimmed_path):
            os.remove(trimmed_path)

        return {
            "status": "success",
            "video_url": final_url
        }
    except Exception as e:
        logger.error(f"Error trimming video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-text")
async def add_text_to_video(
    video_file: UploadFile = File(...),
    text_overlays: str = Form(...)
):
    """Add text overlays to video"""
    try:
        # Save uploaded video
        video_path = f"/tmp/videos/{video_file.filename}"
        os.makedirs("/tmp/videos", exist_ok=True)

        with open(video_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)

        # Parse overlays
        overlays = json.loads(text_overlays)

        # Add text
        processed_path = await video_service.add_text_overlay(video_path, overlays)

        # Upload
        final_url = await storage_service.upload_file(processed_path)

        # Cleanup
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(processed_path):
            os.remove(processed_path)

        return {
            "status": "success",
            "video_url": final_url
        }
    except Exception as e:
        logger.error(f"Error adding text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert-vertical")
async def convert_to_vertical(
    video_file: UploadFile = File(...),
    resolution: str = Form("1080x1920")
):
    """Convert video to vertical format for TikTok/Reels"""
    try:
        # Save uploaded video
        video_path = f"/tmp/videos/{video_file.filename}"
        os.makedirs("/tmp/videos", exist_ok=True)

        with open(video_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)

        # Convert to vertical
        vertical_path = await video_service.convert_to_vertical(video_path, resolution)

        # Upload
        final_url = await storage_service.upload_file(vertical_path)

        # Cleanup
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(vertical_path):
            os.remove(vertical_path)

        return {
            "status": "success",
            "video_url": final_url
        }
    except Exception as e:
        logger.error(f"Error converting to vertical: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
