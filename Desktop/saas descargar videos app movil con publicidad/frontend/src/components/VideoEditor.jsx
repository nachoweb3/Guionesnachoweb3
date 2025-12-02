import React, { useState, useRef, useEffect } from 'react';
import { useVideoEditor } from '../hooks/useVideoEditor';
import { toast } from 'react-toastify';
import { FaCut, FaFont, FaMusic, FaMobileAlt, FaDownload, FaSpinner } from 'react-icons/fa';
import './VideoEditor.css';

const VideoEditor = ({ videoData }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [textOverlays, setTextOverlays] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);

  const videoRef = useRef(null);
  const { loaded, processing, progress, load, trimVideo, convertToVertical, addAudioToVideo } = useVideoEditor();

  useEffect(() => {
    load();
  }, [load]);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
      }
    }
  };

  const handleAddText = () => {
    if (!currentText) {
      toast.error('Please enter some text');
      return;
    }

    const overlay = {
      text: currentText,
      position: ['center', 'bottom'],
      start: 0,
      duration: endTime - startTime,
      fontsize: 50,
      color: 'white'
    };

    setTextOverlays([...textOverlays, overlay]);
    setCurrentText('');
    toast.success('Text overlay added!');
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      toast.success('Music added!');
    }
  };

  const handleExport = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first');
      return;
    }

    try {
      toast.info('Processing video...');
      let processedVideo = videoFile;

      // Trim video
      if (endTime > startTime) {
        processedVideo = await trimVideo(processedVideo, startTime, endTime);
        toast.info('Video trimmed');
      }

      // Add audio
      if (audioFile) {
        processedVideo = await addAudioToVideo(processedVideo, audioFile);
        toast.info('Audio added');
      }

      // Convert to vertical
      processedVideo = await convertToVertical(processedVideo);
      toast.info('Converted to vertical format');

      // Create download URL
      const url = URL.createObjectURL(processedVideo);
      setExportUrl(url);
      toast.success('Video ready for download!');
    } catch (error) {
      toast.error('Error processing video: ' + error.message);
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (!exportUrl) return;

    const a = document.createElement('a');
    a.href = exportUrl;
    a.download = 'tiktok-reels-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started!');
  };

  return (
    <div className="video-editor">
      <div className="editor-header">
        <h2>Video Editor</h2>
        <p>Edit your video for TikTok & Instagram Reels</p>
      </div>

      <div className="editor-container">
        {/* Video Preview */}
        <div className="video-preview-section">
          <div className="video-wrapper">
            {videoFile ? (
              <video ref={videoRef} controls className="preview-video">
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="upload-placeholder">
                <label htmlFor="video-upload" className="upload-label">
                  <FaMobileAlt size={48} />
                  <p>Upload or drop your video here</p>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>

          {processing && (
            <div className="processing-overlay">
              <FaSpinner className="spin" size={48} />
              <p>Processing... {progress}%</p>
            </div>
          )}
        </div>

        {/* Editing Tools */}
        <div className="editing-tools">
          {/* Trim Tool */}
          <div className="tool-section">
            <div className="tool-header">
              <FaCut />
              <h3>Trim Video</h3>
            </div>
            <div className="tool-controls">
              <label>
                Start Time (sec):
                <input
                  type="number"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value))}
                  min="0"
                  max="60"
                />
              </label>
              <label>
                End Time (sec):
                <input
                  type="number"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  min="0"
                  max="60"
                />
              </label>
              <p className="duration-info">Duration: {endTime - startTime} seconds</p>
            </div>
          </div>

          {/* Text Tool */}
          <div className="tool-section">
            <div className="tool-header">
              <FaFont />
              <h3>Add Text</h3>
            </div>
            <div className="tool-controls">
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Enter text..."
                className="text-input"
              />
              <button onClick={handleAddText} className="btn-add">
                Add Text Overlay
              </button>
              {textOverlays.length > 0 && (
                <div className="overlays-list">
                  <p>Added overlays: {textOverlays.length}</p>
                  {textOverlays.map((overlay, idx) => (
                    <div key={idx} className="overlay-item">
                      {overlay.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Music Tool */}
          <div className="tool-section">
            <div className="tool-header">
              <FaMusic />
              <h3>Add Music</h3>
            </div>
            <div className="tool-controls">
              <label htmlFor="audio-upload" className="file-upload-btn">
                Choose Audio File
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {audioFile && <p className="file-name">{audioFile.name}</p>}
            </div>
          </div>

          {/* Export */}
          <div className="tool-section">
            <button
              onClick={handleExport}
              disabled={!videoFile || processing}
              className="btn-export"
            >
              <FaMobileAlt />
              Export for TikTok/Reels
            </button>

            {exportUrl && (
              <button onClick={handleDownload} className="btn-download-final">
                <FaDownload />
                Download Video
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
