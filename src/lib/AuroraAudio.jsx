import React, { useState, useRef, useEffect } from 'react';
import './AuroraAudio.scss';

// Import icons
import nextIcon from './images/next.svg';
import playIcon from './images/play.svg';
import pauseIcon from './images/pause.svg';
import volumeMuteIcon from './images/volume-mute.svg';
import volumeLowIcon from './images/volume-0.svg';
import volumeMediumIcon from './images/volume-1.svg';
import volumeHighIcon from './images/volume-2.svg';

const AuroraAudio = ({ 
  url, 
  poster, 
  lyrics_url, 
  playlist, 
  mode = 'normal',
  effects = {
    background: 'Aurora',
    cover: 'none',
    lyrics: 'Scroll',
    handle: 'LightingCenter'
  },
  position = 'regular',
  onPositionChange,
  loop = false,
  muted = false,
  name,
  author,
  autoTransition = false,
  transitionDuration = 10
}) => {
  // State for tracking current track index
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Use the current track from playlist or direct props
  const currentTrack = playlist && playlist.length > 0 ? playlist[currentTrackIndex] : {
    url,
    name: name || '',
    author: author || '',
    poster,
    lyrics_url
  };
  
  // Use the current track from playlist or direct props


  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hideControlsTimerRef = useRef(null);
  
  // State for lyrics
  const [lyrics, setLyrics] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const activeLyricRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const progressBarRef = useRef(null);

  // Effect for audio events and time updates
  useEffect(() => {
    const audio = audioRef.current;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    if (audio) {
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      
      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
      };
    }
  }, []);

  // Effect for rotation animation
  useEffect(() => {
    let animationFrame;
    
    const rotateRecord = () => {
      if (isPlaying) {
        setRotation(prev => {
          const newRotation = prev + 0.2;
          // Keep the rotation value within a reasonable range to avoid performance issues
          // while maintaining continuous rotation visually
          return newRotation > 3600 ? newRotation - 3600 : newRotation;
        });
      }
      animationFrame = requestAnimationFrame(rotateRecord);
    };
    
    animationFrame = requestAnimationFrame(rotateRecord);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying]);  
  
  // Detect container orientation
  useEffect(() => {
    const container = containerRef.current;
    
    const checkOrientation = () => {
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        if (width >= height) {
          setIsLandscape(true);
        } else {
          setIsLandscape(false);
        }
      }
    };
    
    // Initial check
    checkOrientation();
    
    // Create ResizeObserver to monitor container size changes
    const resizeObserver = new ResizeObserver(checkOrientation);
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Update audio volume when volume or mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Update muted state when prop changes
  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);
  
  // Update loop state when prop changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);
  
  // Load lyrics if available
  useEffect(() => {
    if (currentTrack.lyrics_url) {
      const loadLyrics = async () => {
        try {
          const response = await fetch(currentTrack.lyrics_url);
          const text = await response.text();
          parseLyrics(text);
        } catch (error) {
          console.error('Error loading lyrics:', error);
          // Fallback to empty lyrics
          setLyrics([]);
        }
      };
      
      loadLyrics();
    } else {
      setLyrics([]);
    }
  }, [currentTrack.lyrics_url, currentTrackIndex]);
  
  // Parse lyrics from LRC format
  const parseLyrics = (lrcText) => {
    const lines = lrcText.split('\n');
    const parsedLyrics = [];
    
    lines.forEach(line => {
      // Match timestamp pattern [mm:ss.xx] or [mm:ss.xxx]
      const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/g;
      let match;
      
      while ((match = timeRegex.exec(line)) !== null) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const timeInSeconds = minutes * 60 + seconds;
        const lyricText = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        
        if (lyricText) {
          parsedLyrics.push({ time: timeInSeconds, text: lyricText });
        }
      }
    });
    
    // Sort by time
    parsedLyrics.sort((a, b) => a.time - b.time);
    setLyrics(parsedLyrics);
  };
  
  // Update current lyric based on playback time
  useEffect(() => {
    if (lyrics.length > 0) {
      const currentIndex = lyrics.findIndex((lyric, index) => {
        const nextLyric = lyrics[index + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      });
      
      if (currentIndex !== -1) {
        setCurrentLyricIndex(currentIndex);
      } else {
        // Check if we're before the first lyric
        if (lyrics.length > 0 && currentTime < lyrics[0].time) {
          setCurrentLyricIndex(-1); // Show no lyric before first
        }
      }
    } else {
      setCurrentLyricIndex(-1);
    }
  }, [currentTime, lyrics]);
  

  

  


  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
    
    // When pausing, ensure controls are visible
    if (isPlaying) {
      setShowControls(true);
    }
  };

  const goToPrevious = () => {
    if (!playlist || playlist.length === 0) return;
    
    if (loop && currentTrackIndex === 0) {
      // If looping and at first track, go to last track
      setCurrentTrackIndex(playlist.length - 1);
    } else if (currentTrackIndex > 0) {
      // Otherwise, go to previous track
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (!playlist || playlist.length === 0) return;
    
    if (loop && currentTrackIndex === playlist.length - 1) {
      // If looping and at last track, go to first track
      setCurrentTrackIndex(0);
    } else if (currentTrackIndex < playlist.length - 1) {
      // Otherwise, go to next track
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * duration;
  };
  
  // Handle progress bar drag
  const handleProgressDrag = (e) => {
    const audio = audioRef.current;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1); // Clamp between 0 and 1
    audio.currentTime = pos * duration;
    // Update progress immediately without animation
    setProgress(pos * 100);
  };
  
  // Handle mouse down on progress bar to start drag
  const handleProgressMouseDown = (e) => {
    // Prevent default behavior and start listening for mousemove
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (e) => {
      handleProgressDrag(e);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Also trigger the initial drag position
    handleProgressDrag(e);
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    setVolume(volume);
    audioRef.current.volume = volume;
    if (isMuted && volume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (isMuted) {
      // Restore to previous volume
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      // Store current volume and mute
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  const handleVolumeSliderClick = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const volumeValue = Math.max(0, Math.min(1, position));
    
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
    if (isMuted && volumeValue > 0) {
      setIsMuted(false);
    }
  };
  


  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    
    // If duration is more than 1 hour, show HH:MM:SS format
    if (duration > 3600) {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = Math.floor(time % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Handle fullscreen exit with ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && position === 'fullpage') {
        // Call a callback to change position back to regular
        if (onPositionChange) {
          onPositionChange('regular');
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [position, onPositionChange]);

  // Determine classes based on props
  // Function to check if a string is a valid CSS color format
  const isValidColor = (color) => {
    // Check for hex colors (#FFF, #FFFFFF)
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true;
    // Check for rgb/rgba colors
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[01]?\.?\d+)?\s*\)$/.test(color)) return true;
    // Check for hsl/hsla colors
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*[01]?\.?\d+)?\s*\)$/.test(color)) return true;
    // Check for linear gradients
    if (/^linear-gradient\(/i.test(color)) return true;
    // Check for radial gradients
    if (/^radial-gradient\(/i.test(color)) return true;
    // Check for named colors (limited list of common ones)
    const namedColors = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy', 'maroon', 'olive', 'teal', 'silver', 'transparent'];
    return namedColors.includes(color.toLowerCase());
  };
    
  // Extract background color from effects based on mode
  // In normal mode, only accept CSS color values and gradients, not enum values
  // In other modes, enum values like 'Aurora', 'Gradient', 'Solid' are acceptable
  let backgroundColor = '#000000'; // default to black
  if (mode === 'normal') {
    // In normal mode, only use as background color if it's a valid CSS color or gradient
    if (typeof effects.background === 'string' && isValidColor(effects.background)) {
      backgroundColor = effects.background;
    }
  } else {
    // In other modes, if it's not a valid CSS color, we still assign it (for enum values like 'Aurora')
    if (typeof effects.background === 'string') {
      backgroundColor = effects.background;
    }
  }
  
  const playerClass = `aurora-audio aurora-audio--${position} aurora-audio--${mode} aurora-audio--bg-${effects.background} aurora-audio--cover-${effects.cover} aurora-audio--lyrics-${effects.lyrics} aurora-audio--handle-${effects.handle}`;

  // Determine layout based on presence of lyrics and container dimensions
  const hasLyrics = !!currentTrack.lyrics_url;
  const mediaLayoutClass = `aurora-audio__media-layout ${isLandscape ? 'landscape' : 'portrait'}`;
  
  // Handle mouse enter/leave for controls visibility
  const handleMouseEnter = () => {
    setIsMouseOver(true);
    setShowControls(true);
    
    // Clear any pending timer to hide controls
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  };
  
  const handleMouseLeave = () => {
    setIsMouseOver(false);
    
    // Only hide controls after delay if currently playing
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };
  
  return (
    <div className={playerClass} ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ background: backgroundColor }}>
      <audio ref={audioRef} src={currentTrack.url} />
      
      {/* Semi-transparent poster overlay in normal mode */}
      {mode === 'normal' && currentTrack.poster && (
        <div 
          className="aurora-audio__poster-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${currentTrack.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08, // 8% transparency
            zIndex: 1,
            pointerEvents: 'none' // Allow interactions to pass through
          }}
        />
      )}
      
      {mode === 'normal' ? (
        <div className="aurora-audio__container" style={{ zIndex: 2, position: 'relative' }}>
          <div className={mediaLayoutClass}>
            {/* Record with album cover */}
            <div className="aurora-audio__record-container">
              <div 
                className="aurora-audio__record"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {currentTrack.poster ? (
                  <img 
                    src={currentTrack.poster} 
                    alt="Album Cover" 
                    className="aurora-audio__record-cover" 
                  />
                ) : (
                  <div className="aurora-audio__record-placeholder"></div>
                )}
              </div>
            </div>
            
            {/* Lyrics display */}
            {hasLyrics && (
              <div className="aurora-audio__lyrics" ref={lyricsContainerRef}>
                <div className="aurora-audio__lyrics-container">
                  {lyrics.map((line, index) => (
                    <div 
                      key={index} 
                      className={`aurora-audio__lyric-line ${index === currentLyricIndex ? 'aurora-audio__lyric-line--active' : ''}`}
                      ref={index === currentLyricIndex ? activeLyricRef : null}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="aurora-audio__artwork">
          {currentTrack.poster ? (
            <img 
              src={currentTrack.poster} 
              alt="Album Cover" 
              className="aurora-audio__cover-image" 
            />
          ) : (
            <div className="aurora-audio__visualizer">
              {/* Aurora visualization effect */}
              <div className="aurora-audio__visualizer-bars">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="aurora-audio__visualizer-bar"
                    style={{ height: `${Math.random() * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {mode !== 'normal' && (
        <div className="aurora-audio__info">
          <h3 className="aurora-audio__title">{currentTrack.name || 'Unknown Title'}</h3>
          <p className="aurora-audio__artist">{currentTrack.author || 'Unknown Artist'}</p>
        </div>
      )}
      
      {mode !== 'normal' && (
        <div className="aurora-audio__progress">
          <span className="aurora-audio__time">{formatTime(currentTime)}</span>
          <div 
            className="aurora-audio__progress-bar" 
            onClick={handleProgressClick}
          >
            <div 
              className="aurora-audio__progress-loaded" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="aurora-audio__time">{formatTime(duration)}</span>
        </div>
      )}
      
      {mode !== 'normal' && (
        <div className="aurora-audio__controls">
          <button 
            className={`aurora-audio__control-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      )}
      
      {mode !== 'normal' && (
        <div className="aurora-audio__volume">
          <span>🔊</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={handleVolumeChange}
            className="aurora-audio__volume-slider"
          />
        </div>
      )}
      
      {/* Controls overlay for normal mode */}
      {mode === 'normal' && (
        <div className={`aurora-audio__controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
          <div className="aurora-audio__progress-track">
            <div 
              className={`aurora-audio__progress-bar ${isDragging ? 'dragging' : ''}`}
              ref={progressBarRef}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div 
                className="aurora-audio__progress-loaded" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="aurora-audio__time-display">
            <span className="aurora-audio__time">{formatTime(currentTime)}</span>
            <span className="aurora-audio__time">{formatTime(duration)}</span>
          </div>
          
          <div className="aurora-audio__control-buttons">
            <div className="aurora-audio__track-info">
              {currentTrack.name && (
                <div className="aurora-audio__track-info-title">{currentTrack.name}</div>
              )}
              {currentTrack.author && (
                <div className="aurora-audio__track-info-author">@{currentTrack.author}</div>
              )}
            </div>
            
            {/* Center: Control Buttons */}
            <div className="aurora-audio__control-buttons-group">
              {(playlist && playlist.length > 1) && (
                <button 
                  className="aurora-audio__control-button"
                  onClick={goToPrevious}
                  disabled={currentTrackIndex === 0 && !loop}
                >
                  <img src={nextIcon} alt="Previous" width="16" height="16" style={{transform: 'rotate(180deg)'}} />
                </button>
              )}
              
              <button 
                className="aurora-audio__control-button"
                onClick={togglePlayPause}
              >
                <img src={isPlaying ? pauseIcon : playIcon} alt={isPlaying ? "Pause" : "Play"} width="16" height="16" />
              </button>
              
              {(playlist && playlist.length > 1) && (
                <button 
                  className="aurora-audio__control-button"
                  onClick={goToNext}
                  disabled={(currentTrackIndex === playlist.length - 1) && !loop}
                >
                  <img src={nextIcon} alt="Next" width="16" height="16" />
                </button>
              )}
            </div>
            
            {/* Right: Volume Control */}
            <div className="aurora-audio__volume-control-wrapper">
              <div className="aurora-audio__volume-control">
                <div 
                  className="aurora-audio__volume-control-icon"
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <img 
                    src={
                      isMuted || volume === 0 ? volumeMuteIcon : 
                      volume < 0.33 ? volumeLowIcon : 
                      volume < 0.67 ? volumeMediumIcon : 
                      volumeHighIcon
                    } 
                    alt="Volume" 
                    width="16" 
                    height="16" 
                  />
                </div>
                <span 
                  className="aurora-audio__volume-control-percent"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  {Math.round(volume * 100)}%
                </span>
              </div>
              
              {/* Volume Slider Container */}
              <div className={`aurora-audio__volume-control-slider-container ${showVolumeSlider ? 'visible' : ''}`}>
                <span 
                  className="aurora-audio__volume-control-percent"
                  style={{ marginRight: '5px' }}
                >
                  {Math.round(volume * 100)}%
                </span>
                <div 
                  className="aurora-audio__volume-control-slider-container-slider"
                  onClick={handleVolumeSliderClick}
                >
                  <div 
                    className="aurora-audio__volume-control-slider-container-slider-thumb"
                    style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuroraAudio;