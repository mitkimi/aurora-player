import React, { useState } from 'react';
import AuroraAudio from './lib/AuroraAudio';
import './App.scss';

function App() {
  const [fullpage, setFullpage] = useState<boolean>(false);

  const handleFullpageChange = (newFullpage: boolean) => {
    setFullpage(newFullpage);
  };
  return (
    <div className="App">
      <header className="App-header">
        <h1>Aurora Audio Player</h1>
        <p>A beautiful audio player with Aurora effects</p>
      </header>
      <main>
        <div className="controls">
          <button onClick={() => handleFullpageChange(false)}>Regular</button>
          <button onClick={() => handleFullpageChange(true)}>Full Page</button>
        </div>
        <div className="player-container">
          <AuroraAudio
            url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            poster="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&h=200&auto=format&fit=crop"
            lyrics="/sample-lyrics.lrc"
            playlist={[
              {
                name: "Aurora Dreams",
                author: "Cosmic Sound",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&h=200&auto=format&fit=crop",
                lyrics: "/sample-lyrics.lrc"
              },
              {
                name: "Stellar Journey",
                author: "Galaxy Music",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                poster: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=200&h=200&auto=format&fit=crop",
                lyrics: "/sample-lyrics.lrc"
              },
              {
                name: "Cosmic Waves",
                author: "Universe Sounds",
                url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                poster: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=200&h=200&auto=format&fit=crop",
                lyrics: "/sample-lyrics.lrc"
              }
            ]}
            mode="normal"
            fullpage={fullpage}
            onFullpageChange={handleFullpageChange}
            effects={{
              background: 'Aurora',
              cover: 'none',
              lyrics: 'Scroll',
              handle: 'LightingCenter'
            }}
            loop={false}
            muted={false}
            name="Sample Track"
            author="Sample Artist"
          />
        </div>

        <div style={{ width: '345px', height: '700px' }}>
          <AuroraAudio
            name="不可思议"
            author="田昊天"
            url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            poster="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&h=200&auto=format&fit=crop"
            lyrics="/sample-lyrics.lrc"
          />
        </div>
      </main>
      
    </div>
  );
}

export default App;
