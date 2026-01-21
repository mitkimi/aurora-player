# Aurora Audio Player - Usage Guide

A modern audio and video player component with Aurora effects and additional features.

## Table of Contents
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Features](#features)
- [Configuration Options](#configuration-options)
- [Development](#development)

## Installation

Install the package using npm:

```bash
npm install aurora-player
```

Or using yarn:

```bash
yarn add aurora-player
```

## Basic Usage

```jsx
import React from 'react';
import AuroraAudio from 'aurora-player';

function App() {
  const playlist = [
    {
      name: "Sample Song",
      author: "Artist Name",
      url: "/path/to/audio.mp3",
      poster: "/path/to/poster.jpg",
      lyrics: "/path/to/lyrics.lrc"
    }
  ];

  return (
    <AuroraAudio
      playlist={playlist}
      mode="effects"
      fullpage={false}
      effects={{
        background: "Aurora",
        cover: "Smoke",
        lyrics: "Floating",
        handle: "LightingCenter"
      }}
      loop="list"
    />
  );
}

export default App;
```

## Props Reference

### `playlist` (required)
- **Type:** `Array<Track>`
- **Description:** Array of tracks to play

#### Track Interface
```typescript
interface Track {
  name?: string;        // Name of the track
  author?: string;      // Author of the track
  url: string;          // Audio file URL
  poster?: string;      // Album poster image URL
  lyrics?: string;      // Lyrics file URL (.lrc format)
}
```

### `mode` (optional)
- **Type:** `"normal" | "effects"`
- **Default:** `"effects"`
- **Description:** Display mode for the player

### `fullpage` (optional)
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Whether to display in full page mode

### `onFullpageChange` (optional)
- **Type:** `(fullpage: boolean) => void`
- **Description:** Callback when fullpage mode changes

### `effects` (optional)
- **Type:** `Effects`
- **Description:** Effects configuration object

#### Effects Interface
```typescript
interface Effects {
  background?: string;      // Background effect ('Aurora', 'Lightning', 'Threads', etc.)
  cover?: string;           // Cover effect ('Smoke', 'none')
  lyrics?: string;          // Lyrics display ('scrolling', 'Scrolling', 'floating', 'Floating', 'none')
  handle?: string;          // Handle style
  coverBackground?: string; // Cover background color
}
```

### `loop` (optional)
- **Type:** `boolean | 'single' | 'list'`
- **Default:** `false`
- **Description:** Loop mode for playback

### `muted` (optional)
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Whether audio is muted

## Features

### Multiple Display Modes
- **Normal Mode:** Classic vinyl record visualization with album artwork
- **Effects Mode:** Dynamic background effects with customizable visuals

### Visual Effects
- Aurora backgrounds with colorful gradients
- Lightning effects for dynamic lighting
- Thread-like particle effects
- Ripple grid animations
- Orb and Prism geometric effects

### Cover Effects
- Smoke effect for soft, moving overlay
- Option to disable cover effects entirely

### Lyrics Support
- Synchronized lyrics display with .lrc files
- Multiple layout options:
  - Scrolling lyrics
  - Floating large text
  - Option to disable lyrics
- Automatic fallback to track name/author when lyrics unavailable

### Responsive Design
- Adapts to different screen orientations
- Landscape and portrait mode support
- Fullscreen capability

### Playback Controls
- Play/pause functionality
- Progress bar with seeking
- Volume control with mute
- Next/previous track navigation
- Loop modes (single, list, off)

## Configuration Options

### Background Effects
- `'Aurora'` - Colorful gradient waves
- `'Lightning'` - Electric lighting effects
- `'Threads'` - Thread-like particles
- `'RippleGrid'` - Grid ripple animations
- `'Orb'` - Central orb effect
- `'Prism'` - Geometric prism patterns
- `'none'` - No background effect

### Cover Effects
- `'Smoke'` - Moving smoke overlay
- `'none'` - No cover effect

### Lyrics Display
- `'scrolling'` or `'Scrolling'` - Scrolling lyrics display
- `'floating'` or `'Floating'` - Large floating text
- `'none'` - No lyrics display

### Loop Modes
- `false` or `'false'` - No looping
- `true` or `'true'` - Loop single track
- `'single'` - Loop single track
- `'list'` - Loop entire playlist

## Development

### Running Locally
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production
- Build component library: `npm run build:lib`
- Build application: `npm run build:app`
- Full build: `npm run build`

### File Structure
```
src/
├── lib/                    # Component source code
│   ├── AuroraAudio.tsx     # Main audio player component
│   ├── AuroraAudio.scss    # Component styles
│   ├── images/             # Icon assets
│   ├── backgrounds/        # Background effect components
│   └── covers/             # Cover effect components
├── types/                  # Type definitions
├── App.tsx                 # Demo application
└── index.tsx               # Entry point
```

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## GitHub Pages Deployment

This project can be deployed to GitHub Pages. After configuring GitHub Actions and setting the repository to `aurora-player`, the site will be available at:

`https://mitkimi.github.io/aurora-player`

## License
MIT