import { useState } from 'react';
import VideoDownloader from './components/VideoDownloader';
import VideoEditor from './components/VideoEditor';
import AdBanner from './components/AdBanner';
import PremiumModal from './components/PremiumModal';
import { FaCrown, FaVideo } from 'react-icons/fa';
import './App.css';

function App() {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const handleVideoDownloaded = (videoData) => {
    setCurrentVideo(videoData);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <FaVideo className="logo-icon" />
          <h1>TikTok/Reels Editor</h1>
        </div>
        <button
          className="btn-premium"
          onClick={() => setShowPremiumModal(true)}
        >
          <FaCrown />
          {isPremium ? 'Premium' : 'Upgrade'}
        </button>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Ad Banner - only show if not premium */}
        {!isPremium && (
          <AdBanner adSlot="ca-pub-xxxxxxxxxx" />
        )}

        {/* Video Downloader */}
        <VideoDownloader onVideoDownloaded={handleVideoDownloaded} />

        {/* Ad Banner */}
        {!isPremium && (
          <AdBanner adSlot="ca-pub-xxxxxxxxxx" />
        )}

        {/* Video Editor */}
        <VideoEditor videoData={currentVideo} />

        {/* Ad Banner */}
        {!isPremium && (
          <AdBanner adSlot="ca-pub-xxxxxxxxxx" />
        )}

        {/* Features Section */}
        <section className="features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📥 Download from YouTube</h3>
              <p>Easily download videos from YouTube by pasting the URL</p>
            </div>
            <div className="feature-card">
              <h3>✂️ Trim & Cut</h3>
              <p>Trim your videos to the perfect length for TikTok and Reels (max 60s)</p>
            </div>
            <div className="feature-card">
              <h3>📝 Add Text</h3>
              <p>Add custom text overlays to make your videos more engaging</p>
            </div>
            <div className="feature-card">
              <h3>🎵 Add Music</h3>
              <p>Include background music to enhance your content</p>
            </div>
            <div className="feature-card">
              <h3>📱 Vertical Format</h3>
              <p>Automatically convert to vertical 9:16 format optimized for mobile</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Fast Export</h3>
              <p>Export your edited videos quickly and easily</p>
            </div>
          </div>
        </section>

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; 2024 TikTok/Reels Video Editor. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
