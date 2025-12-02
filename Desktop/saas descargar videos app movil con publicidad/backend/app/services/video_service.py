import os
from typing import Optional, List, Dict
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
from moviepy.video.fx import resize, crop
from ..config import get_settings
import uuid

settings = get_settings()


class VideoService:
    def __init__(self):
        self.temp_path = settings.temp_storage_path
        os.makedirs(self.temp_path, exist_ok=True)

    async def trim_video(self, filepath: str, start_time: float, end_time: float) -> str:
        """Trim video to specified duration"""
        try:
            clip = VideoFileClip(filepath)

            # Ensure duration is within limits
            max_duration = min(end_time - start_time, settings.max_video_duration)
            end_time = start_time + max_duration

            trimmed = clip.subclip(start_time, end_time)

            output_path = f"{self.temp_path}/{uuid.uuid4()}_trimmed.mp4"
            trimmed.write_videofile(output_path, codec='libx264', audio_codec='aac')

            clip.close()
            trimmed.close()

            return output_path
        except Exception as e:
            raise Exception(f"Error trimming video: {str(e)}")

    async def add_text_overlay(self, filepath: str, text_overlays: List[Dict]) -> str:
        """Add text overlays to video"""
        try:
            clip = VideoFileClip(filepath)
            clips_to_composite = [clip]

            for overlay in text_overlays:
                text = overlay.get('text', '')
                position = overlay.get('position', ('center', 'bottom'))
                start = overlay.get('start', 0)
                duration = overlay.get('duration', clip.duration)
                fontsize = overlay.get('fontsize', 50)
                color = overlay.get('color', 'white')

                txt_clip = TextClip(
                    text,
                    fontsize=fontsize,
                    color=color,
                    font='Arial-Bold',
                    stroke_color='black',
                    stroke_width=2
                ).set_position(position).set_start(start).set_duration(duration)

                clips_to_composite.append(txt_clip)

            final_clip = CompositeVideoClip(clips_to_composite)

            output_path = f"{self.temp_path}/{uuid.uuid4()}_text.mp4"
            final_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')

            clip.close()
            final_clip.close()

            return output_path
        except Exception as e:
            raise Exception(f"Error adding text overlay: {str(e)}")

    async def add_background_music(self, filepath: str, music_path: str, volume: float = 0.3) -> str:
        """Add background music to video"""
        try:
            video_clip = VideoFileClip(filepath)
            audio_clip = AudioFileClip(music_path)

            # Loop audio if shorter than video
            if audio_clip.duration < video_clip.duration:
                audio_clip = audio_clip.loop(duration=video_clip.duration)
            else:
                audio_clip = audio_clip.subclip(0, video_clip.duration)

            # Reduce volume
            audio_clip = audio_clip.volumex(volume)

            # Mix with original audio if exists
            if video_clip.audio:
                final_audio = CompositeAudioClip([video_clip.audio, audio_clip])
            else:
                final_audio = audio_clip

            final_clip = video_clip.set_audio(final_audio)

            output_path = f"{self.temp_path}/{uuid.uuid4()}_music.mp4"
            final_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')

            video_clip.close()
            audio_clip.close()
            final_clip.close()

            return output_path
        except Exception as e:
            raise Exception(f"Error adding music: {str(e)}")

    async def convert_to_vertical(self, filepath: str, target_resolution: str = "1080x1920") -> str:
        """Convert video to vertical format (9:16) for TikTok/Reels"""
        try:
            clip = VideoFileClip(filepath)

            width, height = map(int, target_resolution.split('x'))
            target_ratio = width / height  # 9:16 = 0.5625

            # Calculate crop dimensions
            video_ratio = clip.w / clip.h

            if video_ratio > target_ratio:
                # Video is wider, crop width
                new_width = int(clip.h * target_ratio)
                x_center = clip.w / 2
                x1 = int(x_center - new_width / 2)
                cropped = crop(clip, x1=x1, width=new_width)
            else:
                # Video is taller, crop height
                new_height = int(clip.w / target_ratio)
                y_center = clip.h / 2
                y1 = int(y_center - new_height / 2)
                cropped = crop(clip, y1=y1, height=new_height)

            # Resize to target resolution
            resized = resize(cropped, height=height)

            output_path = f"{self.temp_path}/{uuid.uuid4()}_vertical.mp4"
            resized.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                bitrate='5000k',
                fps=30
            )

            clip.close()
            cropped.close()
            resized.close()

            return output_path
        except Exception as e:
            raise Exception(f"Error converting to vertical: {str(e)}")

    async def process_video(
        self,
        filepath: str,
        start_time: float = 0,
        end_time: Optional[float] = None,
        text_overlays: Optional[List[Dict]] = None,
        music_path: Optional[str] = None,
        to_vertical: bool = True
    ) -> str:
        """Process video with all requested edits"""
        try:
            current_file = filepath

            # Trim video
            if end_time:
                current_file = await self.trim_video(current_file, start_time, end_time)

            # Add text overlays
            if text_overlays:
                current_file = await self.add_text_overlay(current_file, text_overlays)

            # Add background music
            if music_path:
                current_file = await self.add_background_music(current_file, music_path)

            # Convert to vertical format
            if to_vertical:
                current_file = await self.convert_to_vertical(current_file)

            return current_file
        except Exception as e:
            raise Exception(f"Error processing video: {str(e)}")


video_service = VideoService()
