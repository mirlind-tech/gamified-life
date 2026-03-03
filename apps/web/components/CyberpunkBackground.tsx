"use client";

/**
 * Clean, minimal background
 * No grids, no scanlines, no orbs - just a subtle gradient
 */
export function CyberpunkBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0f]">
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168, 85, 247, 0.05), transparent)
          `
        }}
      />
    </div>
  );
}
