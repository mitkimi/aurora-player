import React, { useState } from 'react';
import AuroraAudio from './lib/AuroraAudio';
import './App.scss';

type Mode = 'normal' | 'effects';
type Background = 'Aurora' | 'Lightning' | 'Threads' | 'RippleGrid' | 'Orb' | 'Prism' | 'none';
type Cover = 'Smoke' | 'none';
type Lyrics = 'scrolling' | 'Scrolling' | 'floating' | 'Floating' | 'none';
type Handle = 'LightingCenter' | string;
type Loop = false | true | 'single' | 'list';

function App() {
  const [fullpage, setFullpage] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>('effects');
  const [background, setBackground] = useState<Background>('Orb');
  const [cover, setCover] = useState<Cover>('none');
  const [lyrics, setLyrics] = useState<Lyrics>('Floating');
  const [handle, setHandle] = useState<Handle>('LightingCenter');
  const [loop, setLoop] = useState<Loop>('list');

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
          <div className="control-group">
            <label>Full Page:</label>
            <button onClick={() => handleFullpageChange(false)}>Regular</button>
            <button onClick={() => handleFullpageChange(true)}>Full Page</button>
          </div>
          
          <div className="control-group">
            <label htmlFor="mode-select">Mode:</label>
            <select 
              id="mode-select"
              value={mode} 
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="normal">Normal</option>
              <option value="effects">Effects</option>
            </select>
          </div>

          {mode === 'effects' && (
            <>
              <div className="control-group">
                <label htmlFor="background-select">Background:</label>
                <select 
                  id="background-select"
                  value={background} 
                  onChange={(e) => setBackground(e.target.value as Background)}
                >
                  <option value="Aurora">Aurora</option>
                  <option value="Lightning">Lightning</option>
                  <option value="Threads">Threads</option>
                  <option value="RippleGrid">RippleGrid</option>
                  <option value="Orb">Orb</option>
                  <option value="Prism">Prism</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="cover-select">Cover:</label>
                <select 
                  id="cover-select"
                  value={cover} 
                  onChange={(e) => setCover(e.target.value as Cover)}
                >
                  <option value="Smoke">Smoke</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="lyrics-select">Lyrics:</label>
                <select 
                  id="lyrics-select"
                  value={lyrics} 
                  onChange={(e) => setLyrics(e.target.value as Lyrics)}
                >
                  <option value="Scrolling">Scrolling</option>
                  <option value="Floating">Floating</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="handle-select">Handle:</label>
                <select 
                  id="handle-select"
                  value={handle} 
                  onChange={(e) => setHandle(e.target.value)}
                >
                  <option value="LightingCenter">LightingCenter</option>
                </select>
              </div>
            </>
          )}

          <div className="control-group">
            <label htmlFor="loop-select">Loop:</label>
            <select 
              id="loop-select"
              value={loop === false ? 'false' : loop === true ? 'true' : loop} 
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'false') {
                  setLoop(false);
                } else if (value === 'true') {
                  setLoop(true);
                } else {
                  setLoop(value as 'single' | 'list');
                }
              }}
            >
              <option value="false">No Loop</option>
              <option value="true">Single Loop</option>
              <option value="single">Single</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>
        <div className="player-container">
          <AuroraAudio
            playlist={[
              {
                name: "打上花火",
                author: "Daoko, 米津玄師",
                url: "/aurora-player/Daoko,米津玄師 - 打上花火.mp3",
                poster: "/aurora-player/109951163009282836.jpg",
                lyrics: "/aurora-player/Daoko,米津玄師 - 打上花火.lrc"
              },
              {
                name: "ひとり上手",
                author: "中島みゆき",
                url: "/aurora-player/中島みゆき - ひとり上手.mp3", // Placeholder URL - replace with actual audio file
                poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&h=200&auto=format&fit=crop",
                lyrics: "/aurora-player/中島みゆき - ひとり上手.lrc"
              }
            ]}
            mode={mode}
            fullpage={fullpage}
            onFullpageChange={handleFullpageChange}
            effects={{
              background: background,
              cover: cover,
              lyrics: lyrics,
              handle: handle
            }}
            loop={loop}
            muted={false}
          />
        </div>
      </main>
      
    </div>
  );
}

export default App;
