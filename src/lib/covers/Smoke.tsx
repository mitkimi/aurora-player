import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import './Smoke.scss';

interface SmokeProps {
  speed?: number;
  opacity?: number;
  intensity?: number;
  emitterCount?: number; // Number of smoke emitters at the bottom
}

interface SmokeParticle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  endY: number;
  opacity: number;
  scale: number;
  drift: number;
  driftFrequency: number;
  radius: number;
  timeline: gsap.core.Timeline | null;
  element: HTMLDivElement;
}

const MAX_PARTICLES = 20; // 限制同时存在的粒子数以优化性能

const Smoke: React.FC<SmokeProps> = ({ 
  speed = 0.5, 
  opacity = 1.0,
  intensity = 1.0,
  emitterCount = 8
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<SmokeParticle[]>([]);
  const emittersRef = useRef<{ x: number; intervalId: number | null; timeoutId?: number | null }[]>([]);

  // Create a smoke particle element
  const createParticleElement = useCallback((): HTMLDivElement => {
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';
    particle.style.position = 'absolute';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.transformOrigin = 'center center';
    return particle;
  }, []);

  // Create and animate a smoke particle
  const createParticle = useCallback((emitterX: number, containerHeight: number) => {
    if (!containerRef.current) return;
    if (particlesRef.current.length >= MAX_PARTICLES) return;

    const particleElement = createParticleElement();
    containerRef.current.appendChild(particleElement);

    // 烟雾最多覆盖下半屏：粒子从底部上升到屏幕中线（50%）
    const startX = emitterX + gsap.utils.random(-40, 40);
    const startY = containerHeight;
    const radius = gsap.utils.random(35, 65);
    const maxRadius = 65;
    const midHeight = containerHeight * 0.5; // 最高到半屏
    const endY = midHeight - gsap.utils.random(0, maxRadius); // 止于中线附近
    const particleOpacity = gsap.utils.random(0.15 * opacity * intensity, 0.25 * opacity * intensity);
    // More scale variation for better layering effect
    const particleScale = gsap.utils.random(0.8, 1.5);
    const drift = gsap.utils.random(-100, 100);
    const driftFrequency = gsap.utils.random(0.001, 0.003);

    // Set initial position and style - start from bottom of container
    particleElement.style.left = `${startX}px`;
    particleElement.style.bottom = '0px'; // Start from bottom
    particleElement.style.top = 'auto'; // Override top if set
    particleElement.style.width = `${radius * 2}px`;
    particleElement.style.height = `${radius * 2}px`;
    particleElement.style.opacity = '0';
    particleElement.style.transform = `scale(${particleScale})`;
    particleElement.style.position = 'absolute'; // Ensure absolute positioning
    
    // Create gradient background for smoke effect - smaller particles with better layering
    // More variation in opacity for depth
    const centerOpacity = particleOpacity;
    const midOpacity = particleOpacity * 0.7;
    const edgeOpacity = particleOpacity * 0.4;
    const gradient = `radial-gradient(circle, rgba(255, 255, 255, ${centerOpacity}) 0%, rgba(240, 240, 240, ${midOpacity}) 30%, rgba(220, 220, 220, ${edgeOpacity}) 60%, rgba(200, 200, 200, 0) 100%)`;
    particleElement.style.background = gradient;
    particleElement.style.filter = 'blur(10px)';

    // Create GSAP timeline for particle animation
    const timeline = gsap.timeline({
      onComplete: () => {
        // Remove particle when animation completes
        if (particleElement.parentNode) {
          particleElement.parentNode.removeChild(particleElement);
        }
        // Remove from particles array
        particlesRef.current = particlesRef.current.filter(p => p.element !== particleElement);
      }
    });

    // Animation duration based on speed
    const duration = gsap.utils.random(5000 / speed, 9000 / speed);

    // 从底部上升到半屏（endY 为从顶部算起的 y），用 bottom 表示：bottom = containerHeight - endY
    const finalBottom = containerHeight - endY;
    timeline.to(particleElement, {
      bottom: `${finalBottom}px`,
      left: `+=${drift}px`,
      duration: duration / 1000,
      ease: 'none',
    });

    // Fade in at start - quick fade in
    timeline.fromTo(particleElement, 
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power1.out' },
      0
    );

    // 上半段（接近半屏）开始消散：行程约 60% 后开始淡出
    const fadeOutStart = (duration / 1000) * 0.6;
    timeline.to(particleElement, {
      opacity: 0,
      duration: (duration / 1000) * 0.4,
      ease: 'power1.in',
    }, fadeOutStart);

    // Scale up as it rises - less dramatic for smaller particles
    timeline.to(particleElement, {
      scale: particleScale * 1.2,
      duration: duration / 1000,
      ease: 'power1.out'
    }, 0);

    // Add horizontal drift oscillation
    const driftAmplitude = 20;
    const driftTimeline = gsap.timeline({ repeat: -1 });
    driftTimeline.to(particleElement, {
      x: `+=${driftAmplitude}`,
      duration: 2 / driftFrequency,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // Store particle reference
    const particle: SmokeParticle = {
      x: startX,
      y: startY,
      startX,
      startY,
      endY,
      opacity: particleOpacity,
      scale: particleScale,
      drift,
      driftFrequency,
      radius,
      timeline,
      element: particleElement
    };

    particlesRef.current.push(particle);
  }, [speed, opacity, intensity, createParticleElement]);

  // Initialize emitters
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Clear existing emitters
    emittersRef.current.forEach(emitter => {
      if (emitter.intervalId !== null) {
        clearInterval(emitter.intervalId);
      }
    });
    emittersRef.current = [];

    // Create emitters across the bottom
    const spacing = containerWidth / (emitterCount + 1);
    
    // Delay initial particle generation to avoid covering the player immediately
    const initialDelay = 500; // Wait 500ms before starting
    
    setTimeout(() => {
      for (let i = 0; i < emitterCount; i++) {
        const emitterX = spacing * (i + 1);
        
        const emitInterval = gsap.utils.random(400 / speed, 800 / speed);
        const intervalId = window.setInterval(() => {
          createParticle(emitterX, containerHeight);
        }, emitInterval);

        emittersRef.current.push({ x: emitterX, intervalId });
      }
    }, initialDelay);

    return () => {
      // Cleanup emitters
      emittersRef.current.forEach(emitter => {
        if (emitter.intervalId !== null) {
          clearInterval(emitter.intervalId);
        }
      });
      emittersRef.current = [];

      // Cleanup particles
      particlesRef.current.forEach(particle => {
        if (particle.timeline) {
          particle.timeline.kill();
        }
        if (particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      });
      particlesRef.current = [];
    };
  }, [emitterCount, speed, createParticle]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Reinitialize emitters on resize
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        // Clear existing emitters
        emittersRef.current.forEach(emitter => {
          if (emitter.intervalId !== null) {
            clearInterval(emitter.intervalId);
          }
        });
        emittersRef.current = [];

        // Recreate emitters
        const spacing = containerWidth / (emitterCount + 1);
        for (let i = 0; i < emitterCount; i++) {
          const emitterX = spacing * (i + 1);
          const emitInterval = gsap.utils.random(400 / speed, 800 / speed);
          const intervalId = window.setInterval(() => {
            createParticle(emitterX, containerHeight);
          }, emitInterval);
          emittersRef.current.push({ x: emitterX, intervalId });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [emitterCount, speed, createParticle]);

  return (
    <div className="smoke-container" ref={containerRef}>
      {/* Particles will be dynamically added here */}
    </div>
  );
};

export default Smoke;
