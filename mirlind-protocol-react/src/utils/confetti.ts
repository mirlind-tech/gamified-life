interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  drag: number;
  life: number;
  decay: number;
}

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}

const DEFAULT_COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#e94560'];

export function fireConfetti(options: ConfettiOptions = {}) {
  const {
    particleCount = 100,
    spread = 70,
    origin = { y: 0.6 },
    colors = DEFAULT_COLORS,
  } = options;

  // Create canvas if it doesn't exist
  let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;';
    // Append to main element if it exists, otherwise body
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }
  }

  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: origin.x ? origin.x * canvas.width : canvas.width / 2,
      y: origin.y ? origin.y * canvas.height : canvas.height / 2,
      vx: (Math.random() - 0.5) * spread * 0.5,
      vy: (Math.random() - 1) * spread * 0.5 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.3,
      drag: 0.96,
      life: 1,
      decay: 0.01 + Math.random() * 0.01,
    });
  }

  let animationId: number;

  function animate() {
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);

    let activeParticles = 0;

    particles.forEach((p) => {
      if (p.life <= 0) return;
      activeParticles++;

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (activeParticles > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    }
  }

  animate();

  const handleResize = () => {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  setTimeout(() => {
    window.removeEventListener('resize', handleResize);
  }, 5000);
}

export function fireLevelUpConfetti() {
  fireConfetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#fbbf24'],
  });
}

export function fireAchievementConfetti() {
  fireConfetti({
    particleCount: 200,
    spread: 120,
    origin: { y: 0.4 },
    colors: ['#fbbf24', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  });
}

export function fireGateUnlockConfetti() {
  fireConfetti({
    particleCount: 250,
    spread: 150,
    origin: { y: 0.3 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#8b5cf6', '#a78bfa'],
  });
}
