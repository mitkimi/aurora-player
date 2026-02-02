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
import loopNoneIcon from './images/loop-none.svg';
import loopSingleIcon from './images/loop-single.svg';
import loopAllIcon from './images/loop.svg';

// Import background effects
import Lightning from './backgrounds/Lightning';
import Threads from './backgrounds/Threads';
import RippleGrid from './backgrounds/RippleGrid';
import Orb from './backgrounds/Orb';
import Prism from './backgrounds/Prism';

// Import cover effects
import Smoke from './covers/Smoke';

// 歌词拆行：只在词边界换行，保证单词完整（不拆开单词）
const splitIntoBalancedLines = (text: string, maxLines: number = 2): string[] => {
  if (!text || maxLines <= 1) return [text];

  // 按空白切分为“词”，换行只发生在词与词之间
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  const totalLen = text.length;
  const targetCharsPerLine = Math.ceil(totalLen / maxLines);

  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const withSpace = currentLine ? ' ' : '';
    const candidate = currentLine + withSpace + word;

    if (candidate.length <= targetCharsPerLine || !currentLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines - 1) {
        // 最后一行：剩余所有词接在一起，不再拆
        const rest = words.slice(i + 1);
        const lastLine = rest.length ? currentLine + ' ' + rest.join(' ') : currentLine;
        if (lastLine) lines.push(lastLine);
        return lines;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

// 渲染歌词子行：每个词用 nowrap 包裹，避免单词被 CSS 换行拆开
// isFloating: 浮动模式时按字母顺序飘动，需传入以应用 animation
const renderLyricChars = (subLine: string, keyPrefix: string, isFloating?: boolean) => {
  const words = subLine.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  let charIndex = 0;
  return words.map((word, wordIndex) => {
    const spaceBefore = wordIndex > 0 ? 1 : 0;
    const startIdx = charIndex;
    charIndex += spaceBefore + word.length;
    const getCharStyle = (idx: number) => {
      const base: React.CSSProperties = {};
      if (isFloating) {
        // 负 delay：加载时动画已在进行中，避免从静止开始
        base.animationDelay = `${idx * 0.08 - 1.25}s`;
      }
      return base;
    };
    return (
      <React.Fragment key={`${keyPrefix}-w${wordIndex}`}>
        {wordIndex > 0 && (
          <span
            className="aurora-audio__lyric-line-char"
            style={getCharStyle(startIdx)}
          >
            {'\u00A0'}
          </span>
        )}
        <span style={{ whiteSpace: 'nowrap' }} className="aurora-audio__lyric-line-word">
          {word.split('').map((char, ci) => (
            <span
              key={ci}
              className="aurora-audio__lyric-line-char"
              style={getCharStyle(startIdx + spaceBefore + ci)}
            >
              {char}
            </span>
          ))}
        </span>
      </React.Fragment>
    );
  });
};

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
  type?: 'metadata' | 'lyric'; // 'metadata' for ti/ar/al/by tags, 'lyric' for timed lyrics
  metadataType?: 'ti' | 'ar' | 'al' | 'by'; // Type of metadata
}

type Mode = 'normal' | 'effects';
type LoopMode = boolean | 'single' | 'list';

// Poster overlay component for effects mode
const PosterOverlay: React.FC<{ poster: string; containerRef: React.RefObject<HTMLDivElement>; isPlaying: boolean }> = ({ poster, containerRef, isPlaying }) => {
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

  // Opacity animation (breathing effect): 0 → 20% → 0 every 60 seconds - only runs when playing
  // When paused, reset to 0 and stop animation
  useEffect(() => {
    if (!isPlaying) {
      setOpacity(0);
      return;
    }
    if (!posterRef.current) return;

    let currentTarget = 0.1; // Start by going to 10% (from 0)
    const duration = 60000; // 60 seconds per cycle
    const transitionDuration = 3000; // 3 seconds for smooth transition
    let timeoutId: NodeJS.Timeout | null = null;

    const animateOpacity = () => {
      if (posterRef.current && isPlaying) {
        // Smooth transition to target opacity
        posterRef.current.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
        setOpacity(currentTarget);
        
        // After duration, switch direction and continue
        timeoutId = setTimeout(() => {
          currentTarget = currentTarget === 0 ? 0.1 : 0; // Toggle between 0 and 0.1 (10%)
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
  }, [isPlaying]);

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
        zIndex: 3,
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
    background: 'none',
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
  const [isMouseOver, setIsMouseOver] = useState<boolean>(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingPosition, setLoadingPosition] = useState<number>(0);
  // Use local state for loop mode to allow UI interaction
  const [localLoop, setLocalLoop] = useState<LoopMode>(loop);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for lyrics
  const [parsedLyrics, setParsedLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  const [previousLyricIndex, setPreviousLyricIndex] = useState<number>(-1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsInnerContainerRef = useRef<HTMLDivElement>(null);
  // Refs for effects mode lyrics
  const effectsActiveLyricRef = useRef<HTMLDivElement>(null);
  const effectsLyricsContainerRef = useRef<HTMLDivElement>(null);
  const effectsLyricsInnerContainerRef = useRef<HTMLDivElement>(null);
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
      // Handle list playback: if playlist exists and has multiple tracks, go to next track
      if (playlist && playlist.length > 1) {
        // Check if we should go to the next track (list mode)
        const shouldGoToNext = localLoop === 'list' || localLoop === true || (localLoop === false && currentTrackIndex < playlist.length - 1);
        
        if (shouldGoToNext) {
          if (currentTrackIndex < playlist.length - 1) {
            // Move to next track and start playing
            setCurrentTrackIndex(prev => {
              const newIndex = prev + 1;
              // After changing track, we'll use the useEffect below to start playback
              return newIndex;
            });
          } else if (localLoop === 'list' || localLoop === true) {
            // If we reached the end and loop is enabled, go back to first track
            setCurrentTrackIndex(0);
          }
        }
      }
      // If loop is 'single', do nothing (single loop is handled by audio.loop)
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
  }, [localLoop, playlist, currentTrackIndex]);
  
  // Effect to start playback when track changes and player was previously playing
  useEffect(() => {
    // Only start playback if the player was playing before the track change
    if (isPlaying && audioRef.current) {
      // Use a small delay to ensure the new track is loaded
      const timer = setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.play().catch(error => {
            console.error('Error auto-playing next track:', error);
          });
          setIsPlaying(true);
        }
      }, 100); // Small delay to ensure track has loaded
      
      return () => clearTimeout(timer);
    }
  }, [currentTrackIndex, isPlaying]);

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
      const shouldLoop = localLoop === true || localLoop === 'single';
      audioRef.current.loop = shouldLoop;
    }
  }, [localLoop]);
  
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
  }, [currentTrack.lyrics, currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Parse lyrics from LRC format
  const parseLyrics = (lrcText: string) => {
    const lines = lrcText.split('\n');
    const parsedLyrics: Lyric[] = [];
    const metadata: Lyric[] = [];
    let firstLyricTime = Infinity;
      
    lines.forEach(line => {
      const trimmedLine = line.trim();
        
      // Parse metadata tags: [ti:...], [ar:...], [al:...], [by:...]
      const metadataRegex = /\[(ti|ar|al|by):(.+?)\]/i;
      const metadataMatch = trimmedLine.match(metadataRegex);
        
      if (metadataMatch) {
        const [, tag, content] = metadataMatch;
        if (content) {
          const metadataType = tag.toLowerCase() as 'ti' | 'ar' | 'al' | 'by';
          // Order: ti, ar, al, by
          const order = { ti: 0, ar: 1, al: 2, by: 3 };
          metadata.push({
            time: order[metadataType],
            text: content,
            type: 'metadata',
            metadataType: metadataType
          });
        }
        return; // Skip metadata lines
      }
        
      // Match timestamp pattern [mm:ss.xx] or [mm:ss.xxx]
      const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/g;
      let match: RegExpExecArray | null;
        
      while ((match = timeRegex.exec(line)) !== null) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const timeInSeconds = minutes * 60 + seconds;
        const lyricText = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
          
        if (lyricText) {
          if (timeInSeconds < firstLyricTime) {
            firstLyricTime = timeInSeconds;
          }
          parsedLyrics.push({ time: timeInSeconds, text: lyricText, type: 'lyric' });
        }
      }
    });
      
    // If no metadata was found in the LRC file, add track name and author from props
    if (metadata.length === 0) {
      if (currentTrack.name) {
        metadata.push({
          time: 0, // Start at 0 seconds
          text: currentTrack.name,
          type: 'metadata',
          metadataType: 'ti'
        });
      }
      if (currentTrack.author) {
        metadata.push({
          time: 1, // Show after title, at 1 second
          text: `@${currentTrack.author}`, // Prefix with @ like in the UI
          type: 'metadata',
          metadataType: 'ar'
        });
      }
    }
      
    // Sort metadata by order (ti, ar, al, by) when it exists in the file
    // For manually added metadata, we'll sort by time
    metadata.sort((a, b) => a.time - b.time);
      
    // Calculate metadata display times (before first lyric, evenly spaced)
    const metadataCount = metadata.length;
    const metadataDuration = Math.min(firstLyricTime, 20); // Show metadata for up to 20 seconds before first lyric
      
    // Adjust times proportionally if we have metadata
    if (metadataCount > 0) {
      metadata.forEach((meta, index) => {
        // If times were set manually (like 0 for title, 1 for author), keep them
        // Otherwise, distribute evenly
        if (meta.time === 0 && index === 0 && metadataCount > 1) {
          // First metadata item keeps time 0
          meta.time = 0;
        } else if (meta.time === 1 && index === 1 && metadataCount > 1) {
          // Second metadata item keeps time 1
          meta.time = 1;
        } else {
          // Distribute remaining metadata items evenly
          meta.time = (index / metadataCount) * metadataDuration;
        }
      });
    }
      
    // Combine metadata and lyrics, sort by time
    const allLyrics = [...metadata, ...parsedLyrics];
    allLyrics.sort((a, b) => a.time - b.time);
    setParsedLyrics(allLyrics);
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
      const audio = audioRef.current;
      return () => {
        if (audio) {
          audio.removeEventListener('canplay', handleCanPlay);
        }
      };
    }
  }, [currentTrackIndex, currentTrack.url]); // Removed isPlaying from dependencies to prevent reset on play/pause
  
  // Update current lyric based on playback time
  useEffect(() => {
    if (parsedLyrics.length > 0) {
      // Find the first lyric (non-metadata) time
      const firstLyric = parsedLyrics.find(l => l.type !== 'metadata');
      const firstLyricTime = firstLyric ? firstLyric.time : 0;
      
      // If before first lyric, show metadata sequentially
      if (currentTime < firstLyricTime) {
        const metadataLyrics = parsedLyrics.filter(l => l.type === 'metadata');
        const currentMetaIndex = metadataLyrics.findIndex((meta, index) => {
          const nextMeta = metadataLyrics[index + 1];
          return currentTime >= meta.time && (!nextMeta || currentTime < nextMeta.time);
        });
        if (currentMetaIndex !== -1) {
          const actualIndex = parsedLyrics.indexOf(metadataLyrics[currentMetaIndex]);
          setPreviousLyricIndex(currentLyricIndex);
          setCurrentLyricIndex(actualIndex);
        } else if (metadataLyrics.length > 0 && currentTime < metadataLyrics[0].time) {
          setPreviousLyricIndex(currentLyricIndex);
          setCurrentLyricIndex(-1);
        }
      } else {
        // Show timed lyrics
        const currentIndex = parsedLyrics.findIndex((lyric, index) => {
          const nextLyric = parsedLyrics[index + 1];
          return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
        });
        
        if (currentIndex !== -1) {
          setPreviousLyricIndex(currentLyricIndex);
          setCurrentLyricIndex(currentIndex);
        } else {
          setPreviousLyricIndex(currentLyricIndex);
          setCurrentLyricIndex(-1);
        }
      }
    } else {
      setPreviousLyricIndex(currentLyricIndex);
      setCurrentLyricIndex(-1);
    }
  }, [currentTime, parsedLyrics, currentLyricIndex]);

  // Update padding based on container height for landscape mode (normal mode)
  useEffect(() => {
    if (mode !== 'normal') return;
    
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
  }, [isLandscape, parsedLyrics.length, mode]);

  // Update padding for effects mode lyrics (always center aligned)
  useEffect(() => {
    if (mode !== 'effects' || (effects.lyrics !== 'scrolling' && effects.lyrics !== 'Scrolling')) return;
    
    const updatePadding = () => {
      if (!effectsLyricsContainerRef.current || !effectsLyricsInnerContainerRef.current) return;
      
      const container = effectsLyricsContainerRef.current;
      const innerContainer = effectsLyricsInnerContainerRef.current;
      
      // Get the fixed container height (not scrollHeight)
      const containerHeight = container.clientHeight;
      
      // Always center align in effects mode
      const paddingValue = containerHeight / 2;
      innerContainer.style.paddingTop = `${paddingValue}px`;
      innerContainer.style.paddingBottom = `${paddingValue}px`;
      
      // Ensure inner container height doesn't affect external layout
      innerContainer.style.height = 'auto';
      innerContainer.style.maxHeight = 'none';
    };

    // Initial update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePadding, 0);

    // Watch for container size changes
    const container = effectsLyricsContainerRef.current;
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
  }, [parsedLyrics.length, mode, effects.lyrics]);

  // Scroll to current lyric with smooth behavior (normal mode)
  useEffect(() => {
    if (mode === 'normal' && currentLyricIndex >= 0 && activeLyricRef.current && lyricsContainerRef.current) {
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
  }, [currentLyricIndex, isLandscape, mode]);

  // Scroll to current lyric with smooth behavior (effects mode - always center aligned)
  useEffect(() => {
    if (mode === 'effects' && (effects.lyrics === 'scrolling' || effects.lyrics === 'Scrolling') && currentLyricIndex >= 0 && effectsActiveLyricRef.current && effectsLyricsContainerRef.current) {
      const activeElement = effectsActiveLyricRef.current;
      const container = effectsLyricsContainerRef.current;
      
      // Always center current lyric vertically (like landscape mode in normal)
      const containerHeight = container.clientHeight;
      const activeElementTop = activeElement.offsetTop;
      const activeElementHeight = activeElement.offsetHeight;
      const scrollPosition = activeElementTop - (containerHeight / 2) + (activeElementHeight / 2);
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentLyricIndex, mode, effects.lyrics]);
  

  

  

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (isMuted && volume > 0) {
      setIsMuted(false);
    }
  }; // Intentionally unused - volume is controlled via slider click/drag
  
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
  
  // Function to cycle through loop modes: none -> single -> list -> none
  const cycleLoopMode = () => {
    setLocalLoop(prev => {
      if (prev === false) {
        return 'single';
      } else if (prev === 'single' || prev === true) {
        return 'list';
      } else {
        return false;
      }
    });
  };
  
  // Function to get the appropriate icon based on the current loop mode
  const getLoopIcon = (): string => {
    if (localLoop === 'single' || localLoop === true) {
      return loopSingleIcon;
    } else if (localLoop === 'list') {
      return loopAllIcon;
    } else {
      return loopNoneIcon;
    }
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
    // In other modes, enum values like 'Lightning', 'Gradient', 'Solid' are acceptable
    if (mode === 'normal') {
      // In normal mode, only use as background color if it's a valid CSS color or gradient
      if (typeof effects.background === 'string' && isValidColor(effects.background)) {
        backgroundColor = effects.background;
      }
    } else {
      // In other modes, if it's not a valid CSS color, we still assign it (for enum values like 'Lightning')
      if (typeof effects.background === 'string') {
        backgroundColor = effects.background;
      }
    }
  }
  
  const positionClass = fullpage ? 'fullpage' : 'regular';
  const playerClass = `aurora-audio aurora-audio--${positionClass} aurora-audio--${mode} aurora-audio--bg-${effects.background} aurora-audio--cover-${effects.cover} aurora-audio--lyrics-${effects.lyrics} aurora-audio--handle-${effects.handle}${isLoading ? ' aurora-audio--loading' : ''}${isPlaying ? ' aurora-audio--playing' : ''}`;

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
          {/* Lightning background effect */}
          {effects.background === 'Lightning' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
              <Lightning />
            </div>
          )}
          
          {/* Threads background effect */}
          {effects.background === 'Threads' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
              <Threads />
            </div>
          )}
          
          {/* RippleGrid background effect */}
          {effects.background === 'RippleGrid' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
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
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
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
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
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
      
      {/* Blur layer for effects mode - covers z-index 1 background effects - always present regardless of cover setting */}
      {mode === 'effects' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, backdropFilter: 'blur(8px)' }} />
      )}
      
      {/* Poster layer for effects mode - z-index 3 */}
      {mode === 'effects' && currentTrack.poster && (
        <PosterOverlay 
          poster={currentTrack.poster}
          containerRef={containerRef}
          isPlaying={isPlaying}
        />
      )}
      
      {/* Cover effects for effects mode - z-index 4 */}
      {mode === 'effects' && effects.cover && effects.cover !== 'none' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 4, overflow: 'hidden', borderRadius: 'inherit' }}>
          {/* Smoke cover effect */}
          {effects.cover === 'Smoke' && (
            <Smoke speed={0.5} opacity={1.0} intensity={1.0} emitterCount={15} />
          )}
        </div>
      )}
      
      {/* Lyrics layer for effects mode - z-index 5 */}
      {/* Scrolling lyrics */}
      {mode === 'effects' && (effects.lyrics === 'scrolling' || effects.lyrics === 'Scrolling') && hasLyrics && (
        <div 
          className="aurora-audio__lyrics aurora-audio__lyrics--effects"
          ref={effectsLyricsContainerRef}
          style={{ zIndex: 5, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <div className="aurora-audio__lyrics-container aurora-audio__lyrics-container--effects" ref={effectsLyricsInnerContainerRef}>
            {parsedLyrics.map((line, index) => {
              // Only apply animations for floating mode
              const animationType = (effects.lyrics === 'floating' || effects.lyrics === 'Floating') && index === currentLyricIndex ? 'fade-up' : undefined;
              
              return (
                <div 
                  key={index} 
                  className={`aurora-audio__lyric-line ${index === currentLyricIndex ? 'aurora-audio__lyric-line--active' : ''}`}
                  ref={index === currentLyricIndex ? effectsActiveLyricRef : null}
                  { ...(animationType && {
                    'data-aos': animationType,
                    'data-aos-duration': "800",
                    'data-aos-easing': "ease-in-out",
                    'data-aos-once': "false"
                  }) }
                >
                  {line && line.text ? splitIntoBalancedLines(line.text, 2).map((subLine, lineIndex) => (
                    <div key={`line-${index}-${lineIndex}`} className="aurora-audio__lyric-subline">
                      {renderLyricChars(subLine, `effects-${index}-${lineIndex}`)}
                    </div>
                  )) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Floating lyrics - single line, large text, centered, with fade in/out */}
      {mode === 'effects' && (effects.lyrics === 'floating' || effects.lyrics === 'Floating') && hasLyrics && (currentLyricIndex >= 0 || previousLyricIndex >= 0) && (
        <div 
          className="aurora-audio__lyrics aurora-audio__lyrics--floating"
          style={{ zIndex: 5, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="aurora-audio__lyrics-floating-wrapper">
            {/* 上一句：fade out */}
            {previousLyricIndex >= 0 && previousLyricIndex !== currentLyricIndex && parsedLyrics[previousLyricIndex]?.text && (
              <div 
                className="aurora-audio__lyric-line aurora-audio__lyric-line--floating aurora-audio__lyric-line--fade-out"
              >
                {splitIntoBalancedLines(parsedLyrics[previousLyricIndex].text, 2).map((subLine, lineIndex) => (
                  <div key={`prev-${previousLyricIndex}-${lineIndex}`} className="aurora-audio__lyric-subline">
                    {renderLyricChars(subLine, `floating-prev-${previousLyricIndex}-${lineIndex}`, false)}
                  </div>
                ))}
              </div>
            )}
            {/* 当前句：fade in */}
            {currentLyricIndex >= 0 && parsedLyrics[currentLyricIndex]?.text && (
              <div 
                className="aurora-audio__lyric-line aurora-audio__lyric-line--floating aurora-audio__lyric-line--fade-in"
              >
                {splitIntoBalancedLines(parsedLyrics[currentLyricIndex].text, 2).map((subLine, lineIndex) => (
                  <div key={`curr-${currentLyricIndex}-${lineIndex}`} className="aurora-audio__lyric-subline">
                    {renderLyricChars(subLine, `floating-${currentLyricIndex}-${lineIndex}`, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
                  {parsedLyrics.map((line, index) => {
                    // No animations for normal mode - only floating mode has fade effects
                    return (
                      <div 
                        key={index} 
                        className={`aurora-audio__lyric-line ${index === currentLyricIndex ? 'aurora-audio__lyric-line--active' : ''} ${(index === currentLyricIndex && isLandscape) ? 'aurora-audio__lyric-line--active-landscape' : ''}`}
                        ref={index === currentLyricIndex ? activeLyricRef : null}
                      >
                        {line && line.text ? splitIntoBalancedLines(line.text, 2).map((subLine, lineIndex) => (
                          <div key={`line-${index}-${lineIndex}`} className="aurora-audio__lyric-subline">
                            {renderLyricChars(subLine, `normal-${index}-${lineIndex}`)}
                          </div>
                        )) : null}
                      </div>
                    );
                  })}
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
            
            {/* Combined Volume and Loop Control */}
            <div className="aurora-audio__volume-and-loop-wrapper">
              {/* Loop Control Button */}
              <div className="aurora-audio__loop-control-wrapper">
                <button 
                  className="aurora-audio__control-button"
                  onClick={cycleLoopMode}
                  title="Toggle loop mode"
                >
                  <img 
                    src={getLoopIcon()} 
                    alt={localLoop === 'single' || localLoop === true ? 'Single Loop' : localLoop === 'list' ? 'List Loop' : 'No Loop'}
                    width="16" 
                    height="16" 
                  />
                </button>
              </div>
              
              <div className="aurora-audio__volume-control-wrapper">
                <span className={`aurora-audio__volume-control-percent ${showVolumeSlider ? 'visible' : ''}`}>
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
        </div>
      )}
    </div>
  );
};

export default AuroraAudio;
