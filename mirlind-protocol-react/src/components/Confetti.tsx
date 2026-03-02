import { useEffect } from 'react';

// Confetti component for React
export function Confetti() {
  useEffect(() => {
    // Component just ensures canvas exists inside the landmark container
    let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('role', 'presentation');
      canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
      
      // Append to the container inside the main landmark instead of body
      const container = document.getElementById('confetti-container');
      if (container) {
        container.appendChild(canvas);
      } else {
        // Fallback: append to body (should not happen in normal operation)
        canvas.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;';
        document.body.appendChild(canvas);
      }
    }

    return () => {
      // Don't remove on unmount, confetti might still be animating
    };
  }, []);

  return null;
}

// Utility functions are available from '../utils/confetti'
