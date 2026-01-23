'use client';

import { useEffect, useState } from 'react';
import GlassSurface from '../ui/GlassSurface';
import Logo from './logo.png';
import './Navigation.scss';

const navItems = [
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'about', label: 'About' },
];

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navigation">
      <GlassSurface
        width={600}
        height={80}
        borderRadius={40}
        borderWidth={0.1}
        brightness={10}
        opacity={0.7}
        blur={40}
        displace={0}
        backgroundOpacity={0}
        saturation={1}
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        xChannel="R"
        yChannel="G"
        mixBlendMode="difference"
        className="navigation__glass"
      >
        <div className="navigation__container">
          <div className="navigation__logo">
            <img src={Logo} alt="Aurora Player" className="navigation__logo-img" />
            <h1 className="navigation__logo-text">Aurora Player</h1>
          </div>
        <div className="navigation__content">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`navigation__item ${activeSection === item.id ? 'navigation__item--active' : ''}`}
              onClick={() => handleClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        </div>
      </GlassSurface>
    </nav>
  );
}