import React, { useState, useEffect } from 'react';
import '../styles/MusicPlayer.css';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [player, setPlayer] = useState<any>(null);

  // Vaporwave playlist - using YouTube video IDs
  // This is "HOME - Resonance" - iconic vaporwave track
  const videoId = 'FaUyq18r_GI'; // You can change this to any YouTube video ID

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: videoId, // Required for looping
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, []);

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  return (
    <div className="music-player">
      {/* Hidden YouTube player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>
      
      <div className="player-content">
        <div className="player-title">
          <span className="neon-text">🌴 VAPORWAVE 🌴</span>
          <div style={{ 
            fontSize: '0.6rem', 
            color: '#ff66ff',
            marginTop: '0.25rem',
            textShadow: '0 0 5px rgba(255, 0, 255, 0.5)'
          }}>
            HOME - Resonance
          </div>
        </div>

        <button 
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="volume-control">
          <svg viewBox="0 0 24 24" fill="currentColor" className="volume-icon">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>

        <div className="equalizer">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
