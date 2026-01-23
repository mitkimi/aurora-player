import React from 'react';
import ReactDOM from 'react-dom/client';
import { setDarkMode } from '@apron-design/react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './index.scss';
import './theme.scss';
import App from './App';

// Set dark mode immediately
setDarkMode();

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: false,
  mirror: false,
  offset: -100,  /* Adjust offset to trigger when element is in viewport */
  delay: 0,
  startEvent: 'DOMContentLoaded'
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
