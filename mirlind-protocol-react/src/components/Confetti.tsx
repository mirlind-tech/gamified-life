import { useEffect } from 'react';

// Confetti component for React
export function Confetti() {
  useEffect(() => {
    // Component just ensures canvas exists
    let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;';
      document.body.appendChild(canvas);
    }

    return () => {
      // Don't remove on unmount, confetti might still be animating
    };
  }, []);

  return null;
}

// Utility functions are available from '../utils/confetti'
