"use client";

import { useEffect, useRef } from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
  colorClass?: string;
}

export function ProgressBar({ 
  progress, 
  className = "", 
  colorClass = "bg-linear-to-r from-purple-500 to-cyan-500" 
}: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty("--progress-width", `${progress}%`);
    }
  }, [progress]);

  return (
    <div className="progress-bar h-2">
      <div
        ref={ref}
        className={`progress-fill h-2 ${colorClass} ${className}`}
      />
    </div>
  );
}
