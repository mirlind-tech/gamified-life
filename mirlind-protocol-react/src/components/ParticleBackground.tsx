import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const COLORS = [
  'rgba(139, 92, 246, 0.4)',
  'rgba(6, 182, 212, 0.3)',
  'rgba(236, 72, 153, 0.3)',
];

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
      return;
    }

    // Check if mobile (reduce particles on mobile)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsVisible(false); // Disable canvas on mobile for performance
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio consideration
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Debounced resize listener
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 200);
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles - reduced count for performance
    const particleCount = Math.min(20, Math.floor(window.innerWidth / 80));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    // Animation loop with frame skipping for performance
    const animate = () => {
      frameCountRef.current++;
      
      // Render every 2nd frame (30fps instead of 60fps)
      if (frameCountRef.current % 2 === 0) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particlesRef.current.forEach((particle) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around screen
          if (particle.x < 0) particle.x = window.innerWidth;
          if (particle.x > window.innerWidth) particle.x = 0;
          if (particle.y < 0) particle.y = window.innerHeight;
          if (particle.y > window.innerHeight) particle.y = 0;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        });

        // Draw connections (limited for performance)
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < particlesRef.current.length; i++) {
          let connections = 0;
          for (let j = i + 1; j < particlesRef.current.length && connections < 2; j++) {
            const dx = particlesRef.current[i].x - particlesRef.current[j].x;
            const dy = particlesRef.current[i].y - particlesRef.current[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
              ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
              ctx.stroke();
              connections++;
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimeout);
    };
  }, []);

  if (!isVisible) {
    // Return a static gradient background for mobile/reduced motion
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
