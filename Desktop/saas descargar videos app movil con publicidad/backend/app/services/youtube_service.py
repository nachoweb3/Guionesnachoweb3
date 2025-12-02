import yt_dlp
import os
from typing import Dict
from ..config import get_settings

settings = get_settings()


class YouTubeService:
    def __init__(self):
        self.temp_path = settings.temp_storage_path
        os.makedirs(self.temp_path, exist_ok=True)

    async def download_video(self, url: str) -> Dict:
        """Download video from YouTube and return metadata"""

        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': f'{self.temp_path}/%(id)s.%(ext)s',
            'merge_output_format': 'mp4',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)

                video_id = info['id']
                filepath = ydl.prepare_filename(info)

                # Check duration limit
                duration = info.get('duration', 0)
                if duration > settings.max_video_duration * 2:  # Allow 2x for editing
                    # Still download but warn user
                    pass

                return {
                    'video_id': video_id,
                    'title': info.get('title', 'Unknown'),
                    'duration': duration,
                    'thumbnail': info.get('thumbnail', ''),
                    'filepath': filepath,
                    'original_url': url
                }
        except Exception as e:
            raise Exception(f"Error downloading video: {str(e)}")

    async def get_video_info(self, url: str) -> Dict:
        """Get video information without downloading"""

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                return {
                    'video_id': info['id'],
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'thumbnail': info.get('thumbnail', ''),
                }
        except Exception as e:
            raise Exception(f"Error getting video info: {str(e)}")


youtube_service = YouTubeService()
