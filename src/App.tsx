import React, { useEffect } from 'react';
import { setDarkMode } from '@apron-design/react';
import Navigation from './components/Navigation/Navigation';
import './App.scss';
import Shuffle from './components/ui/ShuffleText';
import AudioPlayerScreen from './components/Screens/AudioPlayerScreen';

function App() {
  useEffect(() => {
    // Ensure dark mode is set when component mounts
    setDarkMode();
  }, []);

  return (
    <div className="App">
      <Navigation />
      <main className="App-main">
        <section id="home" className="section">
          <header className="App-header">
            <h1>
              <Shuffle
                text="欢迎使用 Aurora Player"
                shuffleDirection="right"
                duration={0.35}
                animationMode="evenodd"
                shuffleTimes={1}
                ease="power3.out"
                stagger={0.03}
                threshold={0.1}
                triggerOnce={true}
                triggerOnHover
                respectReducedMotion={true}
                loop
                loopDelay={5}
                />
            </h1>
            <p>体验下一代音频和视频播放器</p>
          </header>
          <div className="hero-container">
            <img src="/aurora-player/hero.png" alt="Hero" data-aos="fade-up" data-aos-delay="500" className="hero-image" />
          </div>
        </section>
        
        <section id="audio" className="section">
          <h2>音乐播放器</h2>
          <div>
            <AudioPlayerScreen />
          </div>
        </section>
        
        <section id="video" className="section">
          <h2>视频播放器</h2>
          <p>Under development</p>
        </section>
        
        <section id="about" className="section">
          <h2>关于我们</h2>
          <p>Aurora Player带给你最佳的多媒体体验</p>
        </section>
      </main>
    </div>
  );
}

export default App;