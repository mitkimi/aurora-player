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

// Import background effects
import Aurora from './backgrounds/Aurora';
import Lightning from './backgrounds/Lightning';
import Threads from './backgrounds/Threads';
import RippleGrid from './backgrounds/RippleGrid';
import Orb from './backgrounds/Orb';
import Prism from './backgrounds/Prism';

// Import cover effects
import Smoke from './covers/Smoke';
import SplashCursor from './covers/SplashCursor';

interface Track {
  name?: string;
  author?: string;
  url: string;
  poster?: string;
  lyrics?: string;
}

interface Effects {
  background?: string;
  cover?: string;
  lyrics?: string;
  handle?: string;
  coverBackground?: string;
}

interface Lyric {
  time: number;
  text: string;
}

type Mode = 'normal' | 'effects';
type LoopMode = boolean | 'single' | 'list';

// Poster overlay component for effects mode
const PosterOverlay: React.FC<{ poster: string; containerRef: React.RefObject<HTMLDivElement> }> = ({ poster, containerRef }) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0); // Start at 0

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && posterRef.current) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const newSize = Math.min(containerWidth, containerHeight);
        setSize(newSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Use ResizeObserver for more accurate container size tracking
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
      return () => {
        window.removeEventListener('resize', updateSize);
        resizeObserver.disconnect();
      };
    }
    
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  // Opacity animation: 0 → 20% → 0 every 60 seconds
  useEffect(() => {
    if (!posterRef.current) return;

    let currentTarget = 0.2; // Start by going to 20%
    const duration = 60000; // 60 seconds per cycle
    const transitionDuration = 3000; // 3 seconds for smooth transition
    let timeoutId: NodeJS.Timeout | null = null;

    const animateOpacity = () => {
      if (posterRef.current) {
        // Smooth transition to target opacity
        posterRef.current.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
        setOpacity(currentTarget);
        
        // After duration, switch direction and continue
        timeoutId = setTimeout(() => {
          currentTarget = currentTarget === 0 ? 0.2 : 0; // Toggle between 0 and 0.2 (20%)
          animateOpacity();
        }, duration);
      }
    };

    // Start animation after initial delay
    const initialTimeout = setTimeout(() => {
      animateOpacity();
    }, 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div 
      ref={posterRef}
      className="aurora-audio__poster-overlay"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size > 0 ? `${size}px` : '0px',
        height: size > 0 ? `${size}px` : '0px',
        aspectRatio: '1 / 1', // Ensure square
        backgroundImage: `url(${poster})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: opacity, // Animated opacity: 0 → 10% → 0
        zIndex: 4,
        pointerEvents: 'none',
        // Gradient mask for edges fading to transparent - ensure edges are completely transparent
        maskImage: 'radial-gradient(ellipse 60% 60% at center, black 40%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.2) 80%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at center, black 40%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.2) 80%, transparent 90%)',
      }}
    />
  );
};

interface AuroraAudioProps {
  url?: string;
  poster?: string;
  lyrics?: string;
  playlist?: Track[];
  mode?: Mode;
  effects?: Effects;
  fullpage?: boolean;
  onFullpageChange?: (fullpage: boolean) => void;
  loop?: LoopMode;
  muted?: boolean;
  name?: string;
  author?: string;
  autoTransition?: boolean;
  transitionDuration?: number;
  background?: string;
}

const AuroraAudio: React.FC<AuroraAudioProps> = ({ 
  url, 
  poster, 
  lyrics, 
  playlist, 
  mode = 'normal',
  effects = {
    background: 'Aurora',
    cover: 'none',
    lyrics: 'Scroll',
    handle: 'LightingCenter'
  },
  fullpage = false,
  onFullpageChange,
  loop = false,
  muted = false,
  name,
  author,
  background,
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
    lyrics
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
  const [parsedLyrics, setParsedLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsInnerContainerRef = useRef<HTMLDivElement>(null);
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

    const handleEnded = () => {
      // Handle list loop: if loop is 'list' or true (with playlist), go to next track
      if (playlist && playlist.length > 1) {
        const isListLoop = loop === 'list' || (loop === true && playlist.length > 1);
        if (isListLoop) {
          // List loop: go to next track
          if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
          } else {
            // Loop back to first track
            setCurrentTrackIndex(0);
          }
        }
        // If loop is false or 'single', do nothing (single loop is handled by audio.loop)
      }
    };

    if (audio) {
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [loop, playlist, currentTrackIndex]);

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
      // Set audio element loop based on loop mode
      // true or 'single' means single track loop, 'list' means playlist loop
      // false means no loop
      const shouldLoop = loop === true || loop === 'single';
      audioRef.current.loop = shouldLoop;
    }
  }, [loop]);
  
  // Load lyrics if available
  useEffect(() => {
    if (currentTrack.lyrics) {
      const loadLyrics = async () => {
        try {
          const response = await fetch(currentTrack.lyrics!);
          const text = await response.text();
          parseLyrics(text);
        } catch (error) {
          console.error('Error loading lyrics:', error);
          // Fallback to empty lyrics
          setParsedLyrics([]);
        }
      };
      
      loadLyrics();
    } else {
      setParsedLyrics([]);
    }
  }, [currentTrack.lyrics, currentTrackIndex]);
  
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
    setParsedLyrics(parsedLyrics);
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
    if (parsedLyrics.length > 0) {
      const currentIndex = parsedLyrics.findIndex((lyric, index) => {
        const nextLyric = parsedLyrics[index + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      });
      
      if (currentIndex !== -1) {
        setCurrentLyricIndex(currentIndex);
      } else {
        // Check if we're before the first lyric
        if (parsedLyrics.length > 0 && currentTime < parsedLyrics[0].time) {
          setCurrentLyricIndex(-1); // Show no lyric before first
        }
      }
    } else {
      setCurrentLyricIndex(-1);
    }
  }, [currentTime, parsedLyrics]);

  // Update padding based on container height for landscape mode
  useEffect(() => {
    const updatePadding = () => {
      if (!lyricsContainerRef.current || !lyricsInnerContainerRef.current) return;
      
      const container = lyricsContainerRef.current;
      const innerContainer = lyricsInnerContainerRef.current;
      
      // Get the fixed container height (not scrollHeight)
      const containerHeight = container.clientHeight;
      
      if (isLandscape) {
        const paddingValue = containerHeight / 2;
        innerContainer.style.paddingTop = `${paddingValue}px`;
        innerContainer.style.paddingBottom = `${paddingValue}px`;
      } else {
        // Portrait mode: no padding
        innerContainer.style.paddingTop = '0px';
        innerContainer.style.paddingBottom = '0px';
      }
      
      // Ensure inner container height doesn't affect external layout
      // The container itself handles overflow, inner container can be any height
      innerContainer.style.height = 'auto';
      innerContainer.style.maxHeight = 'none'; // Remove max-height restriction
    };

    // Initial update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePadding, 0);

    // Watch for container size changes
    const container = lyricsContainerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(updatePadding);
      resizeObserver.observe(container);
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLandscape, parsedLyrics.length]);

  // Scroll to current lyric with smooth behavior
  useEffect(() => {
    if (currentLyricIndex >= 0 && activeLyricRef.current && lyricsContainerRef.current) {
      const activeElement = activeLyricRef.current;
      const container = lyricsContainerRef.current;
      
      if (isLandscape) {
        // Landscape: center current lyric vertically in the player
        const containerHeight = container.clientHeight;
        const activeElementTop = activeElement.offsetTop;
        const activeElementHeight = activeElement.offsetHeight;
        const scrollPosition = activeElementTop - (containerHeight / 2) + (activeElementHeight / 2);
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      } else {
        // Portrait: align current lyric to top of lyrics area
        // Use scrollIntoView for better positioning
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  }, [currentLyricIndex, isLandscape]);
  

  

  

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
    
    // Check if list loop is enabled
    const isListLoop = loop === 'list' || (loop === true && playlist.length > 1);
    
    if (isListLoop && currentTrackIndex === 0) {
      // If list looping and at first track, go to last track
      setCurrentTrackIndex(playlist.length - 1);
    } else if (currentTrackIndex > 0) {
      // Otherwise, go to previous track
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (!playlist || playlist.length === 0) return;
    
    // Check if list loop is enabled
    const isListLoop = loop === 'list' || (loop === true && playlist.length > 1);
    
    if (isListLoop && currentTrackIndex === playlist.length - 1) {
      // If list looping and at last track, go to first track
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
      if (event.key === 'Escape' && fullpage) {
        // Call a callback to change fullpage back to false
        if (onFullpageChange) {
          onFullpageChange(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [fullpage, onFullpageChange]);

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
    
  // Use background prop if provided, otherwise extract from effects
  let backgroundColor = background || '#000000'; // default to black
  if (!background) {
    // Extract background color from effects based on mode
    // In normal mode, only accept CSS color values and gradients, not enum values
    // In other modes, enum values like 'Aurora', 'Gradient', 'Solid' are acceptable
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
  }
  
  const positionClass = fullpage ? 'fullpage' : 'regular';
  const playerClass = `aurora-audio aurora-audio--${positionClass} aurora-audio--${mode} aurora-audio--bg-${effects.background} aurora-audio--cover-${effects.cover} aurora-audio--lyrics-${effects.lyrics} aurora-audio--handle-${effects.handle}${isLoading ? ' aurora-audio--loading' : ''}`;

  // Determine layout based on presence of lyrics and container dimensions
  const hasLyrics = !!currentTrack.lyrics;
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
    <div className={playerClass} ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <audio ref={audioRef} src={currentTrack.url} />
      
      {/* Background color layer - z-index 0 (lowest layer) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: backgroundColor }} />
      
      {/* Background effects for effects mode */}
      {mode === 'effects' && effects.background && effects.background !== 'none' && (
        <>
          {/* Aurora background effect */}
          {effects.background === 'Aurora' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <Aurora
                colorStops={["#7cff67","#B19EEF","#5227FF"]}
                blend={0.5}
                amplitude={1.0}
                speed={1}
              />
            </div>
          )}
          
          {/* Lightning background effect */}
          {effects.background === 'Lightning' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <Lightning />
            </div>
          )}
          
          {/* Threads background effect */}
          {effects.background === 'Threads' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <Threads />
            </div>
          )}
          
          {/* RippleGrid background effect */}
          {effects.background === 'RippleGrid' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <RippleGrid
                enableRainbow={false}
                gridColor="#ffffff"
                rippleIntensity={0.05}
                gridSize={10}
                gridThickness={15}
                mouseInteraction={true}
                mouseInteractionRadius={1.2}
                opacity={0.8}
              />
            </div>
          )}
          
          {/* Orb background effect */}
          {effects.background === 'Orb' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <Orb
                hoverIntensity={2}
                rotateOnHover={true}
                hue={0}
                forceHoverState={false}
                backgroundColor="#000000"
              />
            </div>
          )}
          
          {/* Prism background effect */}
          {effects.background === 'Prism' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <Prism
                animationType="rotate"
                timeScale={0.5}
                height={3.5}
                baseWidth={5.5}
                scale={3.6}
                hueShift={0}
                colorFrequency={1}
                noise={0}
                glow={1}
              />
            </div>
          )}
        </>
      )}
      
      {/* Blur layer for effects mode - covers z-index 1 background effects */}
      {mode === 'effects' && effects.cover && effects.cover !== 'none' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, backdropFilter: 'blur(5px)' }} />
      )}
      
      {/* Cover effects for effects mode */}
      {mode === 'effects' && effects.cover && effects.cover !== 'none' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, overflow: 'hidden', borderRadius: 'inherit' }}>
          {/* Smoke cover effect */}
          {effects.cover === 'Smoke' && (
            <Smoke speed={0.5} opacity={1.0} intensity={1.0} emitterCount={15} />
          )}
          
          {/* SplashCursor cover effect */}
          {effects.cover === 'Splash' && (
            <SplashCursor background={effects.coverBackground || '#000000'} />
          )}
        </div>
      )}
      
      {/* Poster layer for effects mode - z-index 4 */}
      {mode === 'effects' && currentTrack.poster && (
        <PosterOverlay 
          poster={currentTrack.poster}
          containerRef={containerRef}
        />
      )}
      
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
      
      {mode === 'normal' && (
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
                <div className="aurora-audio__lyrics-container" ref={lyricsInnerContainerRef}>
                  {parsedLyrics.map((line, index) => (
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
      )}
      
      {/* Controls overlay for normal and effects mode */}
      {(mode === 'normal' || mode === 'effects') && (
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
                  disabled={currentTrackIndex === 0 && loop !== 'list' && !(loop === true && playlist.length > 1)}
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
                  disabled={(currentTrackIndex === playlist.length - 1) && loop !== 'list' && !(loop === true && playlist.length > 1)}
                >
                  <img src={nextIcon} alt="Next" width="16" height="16" />
                </button>
              )}
            </div>
            
            {/* Right: Volume Control */}
            <div className="aurora-audio__volume-control-wrapper">
              <span className="aurora-audio__volume-control-percent">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
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
