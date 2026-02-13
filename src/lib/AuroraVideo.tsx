/**
 * Aurora Video Player Component
 * A beautiful video player with Aurora effects
 */

import React from 'react';
import './AuroraVideo.scss';

// Import icons
import playIcon from './images/play.svg';

interface Track {
  name?: string;
  author?: string;
  url: string;
  poster?: string;
  subtitles_url?: string;
}

interface Effects {
  background?: string;
  cover?: string;
  lyrics?: string;
  handle?: string;
}

type Position = 'regular' | 'fullpage';
type Mode = 'normal' | string;

interface AuroraVideoProps {
  url?: string;
  poster?: string;
  subtitles_url?: string;
  playlist?: Track[];
  mode?: Mode;
  effects?: Effects;
  position?: Position;
  onPositionChange?: (position: Position) => void;
  loop?: boolean;
  muted?: boolean;
  autoTransition?: boolean;
  transitionDuration?: number;
}

const AuroraVideo: React.FC<AuroraVideoProps> = ({
  url,
  poster,
  subtitles_url,
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
  autoTransition = false,
  transitionDuration = 10
}) => {
  // TODO: Implement video player functionality
  
  // Determine classes based on props
  const playerClass = `aurora-video aurora-video--${position} aurora-video--${mode} aurora-video--bg-${effects.background} aurora-video--cover-${effects.cover} aurora-video--lyrics-${effects.lyrics} aurora-video--handle-${effects.handle}`;

  return (
    <div className={playerClass}>
      <video 
        src={url} 
        poster={poster}
        controls
        loop={loop}
        muted={muted}
        className="aurora-video__element"
      />
      
      {mode !== 'normal' && (
        <div className="aurora-video__info">
          <h3 className="aurora-video__title">Video Title</h3>
          <p className="aurora-video__creator">Video Creator</p>
        </div>
      )}
      
      {mode === 'normal' && (
        <div className="aurora-video__controls-overlay">
          <div className="aurora-video__control-buttons">
            <button className="aurora-video__control-button">
              <img src={playIcon} alt="Play" width="16" height="16" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuroraVideo;
