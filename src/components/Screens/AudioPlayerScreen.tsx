import React, { useState } from 'react';
import AuroraAudio from '../../lib/AuroraAudio';
import { Switch, Select } from '@apron-design/react';
import '@apron-design/react/styles';
import './AudioPlayerScreen.scss';

interface AudioPlayerScreenProps {
  // Define any props that the audio player screen might need
}

const playlist = [
  {
    name: "Magic Together",
    author: "上海迪士尼度假区",
    url: "/aurora-player/music/magic-together.mp3",
    poster: "/aurora-player/music/magic-together.png",
    lyrics: "/aurora-player/music/magic-together.lrc"
  },
  {
    name: "B612",
    author: "走洲舟",
    url: "/aurora-player/music/走洲舟 - B612.mp3",
    poster: "/aurora-player/music/b612.jpg",
    lyrics: "/aurora-player/music/走洲舟 - B612.lrc"
  },
  {
    name: "打上花火",
    author: "Daoko, 米津玄師",
    url: "/aurora-player/music/Daoko,米津玄師 - 打上花火.mp3",
    poster: "/aurora-player/music/dashanghuahuo.webp",
    lyrics: "/aurora-player/music/Daoko,米津玄師 - 打上花火.lrc"
  },
  {
    name: "Somebody That I Used To Know",
    author: "Just Lowkey",
    url: "/aurora-player/music/Just Lowkey - Somebody That I Used To Know.mp3",
    poster: "/aurora-player/music/somebody.jpg",
    lyrics: "/aurora-player/music/Just Lowkey - Somebody That I Used To Know.lrc"
  },
  {
    name: "我们打着光脚在风车下跑，手上的狗尾巴草摇啊摇",
    author: "等一下就回家，艾兜",
    url: "/aurora-player/music/等一下就回家,-艾兜 - 我们打着光脚在风车下跑，手上的狗尾巴草摇啊摇.mp3",
    poster: "/aurora-player/music/womendazheguangjiao.webp",
    lyrics: "/aurora-player/music/等一下就回家,-艾兜 - 我们打着光脚在风车下跑，手上的狗尾巴草摇啊摇.lrc"
  },
  {
    name: "Happy",
    author: "Pharrell Williams",
    url: "/aurora-player/music/Pharrell Williams - Happy.mp3",
    poster: "/aurora-player/music/happy.webp",
    lyrics: "/aurora-player/music/Pharrell Williams - Happy.lrc",
  },
]

const AudioPlayerScreen: React.FC<AudioPlayerScreenProps> = () => {
  const [effectsEnabled, setEffectsEnabled] = useState(false); // 特效模式，默认关闭
  const [backgroundEffect, setBackgroundEffect] = useState("Orb"); // 背景效果，默认Orb
  const [coverEffect, setCoverEffect] = useState("none"); // 封面效果，默认none
  const [lyricsDisplay, setLyricsDisplay] = useState("Floating"); // 歌词显示，默认Floating
  const [loopMode, setLoopMode] = useState<"list" | "single" | false>("list");

  return (
    <div className="audio-player-screen">
      <div className="display-area">
        <AuroraAudio 
          playlist={playlist}
          mode={effectsEnabled ? "effects" : "normal"}
          effects={{
            background: backgroundEffect,
            cover: coverEffect,
            lyrics: lyricsDisplay,
            handle: "LightingCenter"
          }}
          loop={loopMode === "list" ? "list" : loopMode === "single" ? "single" : false}
        />
      </div>
      
      <div className="config-bar">
        <div className="config-content">
          <div className="config-group">
            <label>特效模式：</label>
            <Switch 
              size="small" 
              checked={effectsEnabled}
              onChange={(checked) => setEffectsEnabled(checked)}
            />
          </div>
          
          {effectsEnabled && (
            <>
              <div className="config-group">
                <label>背景效果:</label>
                <Select 
                  value={backgroundEffect}
                  onChange={(value) => setBackgroundEffect(value as string)}
                  options={[
                    { value: "Lightning", label: "闪电" },
                    { value: "Threads", label: "线程" },
                    { value: "RippleGrid", label: "网格" },
                    { value: "Orb", label: "球体" },
                    { value: "Prism", label: "棱镜" },
                    { value: "none", label: "无" }
                  ]}
                />
              </div>
              
              <div className="config-group">
                <label>封面效果:</label>
                <Select 
                  value={coverEffect}
                  onChange={(value) => setCoverEffect(value as string)}
                  options={[
                    { value: "Smoke", label: "烟雾" },
                    { value: "none", label: "无" }
                  ]}
                />
              </div>
              
              <div className="config-group">
                <label>歌词显示:</label>
                <Select 
                  value={lyricsDisplay}
                  onChange={(value) => setLyricsDisplay(value as string)}
                  options={[
                    { value: "Scrolling", label: "滚动" },
                    { value: "Floating", label: "浮动" },
                    { value: "none", label: "隐藏" }
                  ]}
                />
              </div>
            </>
          )}
          
          <div className="config-group">
            <label>循环模式:</label>
            <Select 
              value={loopMode === false ? "false" : loopMode}
              onChange={(value) => {
                if (value === "false") {
                  setLoopMode(false);
                } else if (value === "single" || value === "list") {
                  setLoopMode(value);
                }
              }}
              options={[
                { value: "false", label: "不循环" },
                { value: "single", label: "单曲循环" },
                { value: "list", label: "列表循环" }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerScreen;