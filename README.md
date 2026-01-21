# Aurora Audio Player

A modern audio and video player component with Aurora effects and additional features.

## Features

- **Multiple Display Modes**: Normal mode with vinyl record visualization and effects mode with dynamic backgrounds
- **Lyrics Support**: Display synchronized lyrics with multiple layout options (scrolling, floating)
- **Visual Effects**: Aurora, Lightning, Threads, RippleGrid, Orb, and Prism background effects
- **Cover Effects**: Smoke and Splash cursor effects
- **Responsive Design**: Adapts to different screen orientations and sizes
- **Playlist Support**: Play multiple tracks with configurable loop modes
- **Customizable UI**: Configurable backgrounds, covers, lyrics display, and handle styles

## Installation

```bash
npm install aurora-player
```

## Usage

```jsx
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
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `playlist` | Track[] | Array of tracks to play |
| `mode` | "normal" \| "effects" | Display mode |
| `fullpage` | boolean | Whether to display in full page mode |
| `onFullpageChange` | (fullpage: boolean) => void | Callback when fullpage mode changes |
| `effects` | Effects | Effects configuration object |
| `loop` | boolean \| "single" \| "list" | Loop mode |
| `muted` | boolean | Whether audio is muted |

### Track Interface

```typescript
interface Track {
  name?: string;
  author?: string;
  url: string;
  poster?: string;
  lyrics?: string;
}
```

### Effects Interface

```typescript
interface Effects {
  background?: string;
  cover?: string;
  lyrics?: string;
  handle?: string;
  coverBackground?: string;
}
```

## Build

To build the component library for distribution:

```bash
npm run build
```

This will compile the TypeScript code and copy necessary assets to the `dist` directory.

## License

MIT