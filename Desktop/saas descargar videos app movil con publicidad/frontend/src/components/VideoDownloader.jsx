import React, { useState } from 'react';
import { downloadVideo, getVideoInfo } from '../services/api';
import { toast } from 'react-toastify';
import { FaDownload, FaYoutube, FaSpinner } from 'react-icons/fa';
import './VideoDownloader.css';

const VideoDownloader = ({ onVideoDownloaded }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);

  const handleGetInfo = async () => {
    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const info = await getVideoInfo(url);
      setVideoInfo(info);
      toast.info('Video found! Click download to proceed');
    } catch (error) {
      toast.error('Error getting video info: ' + (error.detail || error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const result = await downloadVideo(url);
      toast.success('Video downloaded successfully!');
      onVideoDownloaded(result);
      setUrl('');
      setVideoInfo(null);
    } catch (error) {
      toast.error('Error downloading video: ' + (error.detail || error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-downloader">
      <div className="downloader-header">
        <FaYoutube className="youtube-icon" />
        <h2>Download from YouTube</h2>
      </div>

      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL here..."
          className="url-input"
          disabled={loading}
        />
        <button
          onClick={handleGetInfo}
          disabled={loading || !url}
          className="btn-primary"
        >
          {loading ? <FaSpinner className="spin" /> : 'Get Info'}
        </button>
      </div>

      {videoInfo && (
        <div className="video-preview">
          <img src={videoInfo.thumbnail} alt={videoInfo.title} />
          <div className="video-details">
            <h3>{videoInfo.title}</h3>
            <p>Duration: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}</p>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="btn-download"
            >
              <FaDownload /> Download Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDownloader;
