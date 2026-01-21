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

interface Track {
  name?: string;
  author?: string;
  url: string;
  poster?: string;
  lyrics_url?: string;
}

interface Effects {
  background?: string;
  cover?: string;
  lyrics?: string;
  handle?: string;
}

interface Lyric {
  time: number;
  text: string;
}

type Position = 'regular' | 'fullpage';
type Mode = 'normal' | string;

interface AuroraAudioProps {
  url?: string;
  poster?: string;
  lyrics_url?: string;
  playlist?: Track[];
  mode?: Mode;
  effects?: Effects;
  position?: Position;
  onPositionChange?: (position: Position) => void;
  loop?: boolean;
  muted?: boolean;
  name?: string;
  author?: string;
  autoTransition?: boolean;
  transitionDuration?: number;
}

const AuroraAudio: React.FC<AuroraAudioProps> = ({ 
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
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  
  // Use the current track from playlist or direct props
  const currentTrack: Track = playlist && playlist.length > 0 ? playlist[currentTrackIndex] : {
    url: url || '',
    name: name || '',
    author: author || '',
    poster,
    lyrics_url
  };
  
  // Use the current track from playlist or direct props


  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isMouseOver, setIsMouseOver] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingPosition, setLoadingPosition] = useState<number>(0);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for lyrics
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // Effect for audio events and time updates
  useEffect(() => {
    const audio = audioRef.current;
    
    const setAudioData = () => {
      if (audio) {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };

    const setAudioTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
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
    let animationFrame: number;
    
    const rotateRecord = () => {
      if (isPlaying && !isLoading) {
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
  }, [isPlaying, isLoading]);  
  
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
          const response = await fetch(currentTrack.lyrics_url!);
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
  const parseLyrics = (lrcText: string) => {
    const lines = lrcText.split('\n');
    const parsedLyrics: Lyric[] = [];
    
    lines.forEach(line => {
      // Match timestamp pattern [mm:ss.xx] or [mm:ss.xxx]
      const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/g;
      let match: RegExpExecArray | null;
      
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
  
  // Effect to handle track changes
  useEffect(() => {
    // Set loading state when track changes
    setIsLoading(true);
    // Set loading position to beginning
    setLoadingPosition(0);
    
    // Reset progress when track changes
    setProgress(0);
    setCurrentTime(0);
    
    // Set the new track URL to the audio element
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.currentTime = 0; // Reset time immediately
      
      // Wait for the new track to load and clear loading state
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      audioRef.current.addEventListener('canplay', handleCanPlay);
      
      // Clean up event listener
      return () => {
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [currentTrackIndex, currentTrack.url]); // Removed isPlaying from dependencies to prevent reset on play/pause
  
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
    if (!audio) return;
    
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
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    // Calculate new time position
    const newTime = pos * duration;
    
    // Set loading state and position
    setIsLoading(true);
    setLoadingPosition(pos * 100);
    
    // Update audio and React state immediately
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(pos * 100);
    
    // Clear loading state after a brief moment
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };
  
  // Handle progress bar drag
  const handleProgressDrag = (e: MouseEvent) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1); // Clamp between 0 and 1
    
    // Calculate new time position
    const newTime = pos * duration;
    
    // Set loading state and position
    setIsLoading(true);
    setLoadingPosition(pos * 100);
    
    // Update audio and React state immediately
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    // Update progress immediately without animation
    setProgress(pos * 100);
    
    // Clear loading state after a brief moment
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };
  
  // Handle mouse down on progress bar to start drag
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent default behavior and start listening for mousemove
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
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
    handleProgressDrag(e.nativeEvent);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (isMuted && volume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
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
  
  const handleVolumeSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
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

  const handleVolumeSliderDrag = (e: MouseEvent) => {
    if (!audioRef.current || !volumeSliderRef.current) return;
    
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const position = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const volumeValue = Math.max(0, Math.min(1, position));
    
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
    if (isMuted && volumeValue > 0) {
      setIsMuted(false);
    }
  };

  const handleVolumeSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const handleMouseMove = (e: MouseEvent) => {
      handleVolumeSliderDrag(e);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Also trigger the initial drag position
    handleVolumeSliderDrag(e.nativeEvent);
  };
  


  const formatTime = (time: number) => {
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
    const handleEscKey = (event: KeyboardEvent) => {
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
  const isValidColor = (color: string): boolean => {
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
  
  const playerClass = `aurora-audio aurora-audio--${position} aurora-audio--${mode} aurora-audio--bg-${effects.background} aurora-audio--cover-${effects.cover} aurora-audio--lyrics-${effects.lyrics} aurora-audio--handle-${effects.handle}${isLoading ? ' aurora-audio--loading' : ''}`;

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
          <div className="aurora-audio__progress-relative-container">
            {/* Loading indicator above progress bar at specific position */}
            {isLoading && (
              <div className="aurora-audio__loading-indicator--above-progress" style={{left: `${loadingPosition}%`, transform: 'translateX(-50%)'}}>
                <div className="aurora-audio__spinner"></div>
              </div>
            )}
            <div 
              className="aurora-audio__progress-bar" 
              onClick={handleProgressClick}
            >
              <div 
                className="aurora-audio__progress-loaded" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <span className="aurora-audio__time">{formatTime(duration)}</span>
        </div>
      )}
      
      {mode !== 'normal' && (
        <div className="aurora-audio__controls">
          <button 
            className={`aurora-audio__control-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayPause}
            disabled={!duration || isLoading}
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
            <div className="aurora-audio__progress-relative-container">
              {/* Loading indicator above progress bar at specific position */}
              {isLoading && (
                <div className="aurora-audio__loading-indicator--above-progress" style={{left: `${loadingPosition}%`, transform: 'translateX(-50%)'}}>
                    <div className="aurora-audio__spinner"></div>
                  </div>
              )}
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
                disabled={!duration || isLoading}
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
              <span className="aurora-audio__volume-control-percent">
                {Math.round(volume * 100)}%
              </span>
              <div 
                className="aurora-audio__volume-control-button"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div className={`aurora-audio__volume-control-slider-inside ${showVolumeSlider ? 'visible' : ''}`}>
                  <div 
                    ref={volumeSliderRef}
                    className="aurora-audio__volume-control-slider-track"
                    onClick={handleVolumeSliderClick}
                    onMouseDown={handleVolumeSliderMouseDown}
                  >
                    <div 
                      className="aurora-audio__volume-control-slider-filled"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div 
                  className="aurora-audio__volume-control-icon"
                  onClick={toggleMute}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuroraAudio;
