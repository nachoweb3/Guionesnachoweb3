import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const useVideoEditor = () => {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  const load = useCallback(async () => {
    if (loaded) return;

    const ffmpeg = ffmpegRef.current;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    try {
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setLoaded(true);
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      throw error;
    }
  }, [loaded]);

  const trimVideo = useCallback(async (videoFile, startTime, endTime) => {
    if (!loaded) await load();

    setProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      // Write input file
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      // Trim video
      const duration = endTime - startTime;
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        'output.mp4'
      ]);

      // Read result
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');

      setProcessing(false);
      return blob;
    } catch (error) {
      setProcessing(false);
      throw error;
    }
  }, [loaded, load]);

  const convertToVertical = useCallback(async (videoFile) => {
    if (!loaded) await load();

    setProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      // Convert to vertical format (9:16 ratio, 1080x1920)
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
        '-c:a', 'copy',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');

      setProcessing(false);
      return blob;
    } catch (error) {
      setProcessing(false);
      throw error;
    }
  }, [loaded, load]);

  const addAudioToVideo = useCallback(async (videoFile, audioFile, volume = 0.3) => {
    if (!loaded) await load();

    setProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      await ffmpeg.writeFile('video.mp4', await fetchFile(videoFile));
      await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

      // Mix audio with original video audio
      await ffmpeg.exec([
        '-i', 'video.mp4',
        '-i', 'audio.mp3',
        '-filter_complex',
        `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=shortest[aout]`,
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      await ffmpeg.deleteFile('video.mp4');
      await ffmpeg.deleteFile('audio.mp3');
      await ffmpeg.deleteFile('output.mp4');

      setProcessing(false);
      return blob;
    } catch (error) {
      setProcessing(false);
      throw error;
    }
  }, [loaded, load]);

  return {
    loaded,
    processing,
    progress,
    load,
    trimVideo,
    convertToVertical,
    addAudioToVideo,
  };
};
