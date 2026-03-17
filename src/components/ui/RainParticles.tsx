"use client";

import { useMemo } from "react";
import type { WeatherType } from "../../../config/weather";

interface RainParticlesProps {
  type: WeatherType;
  intensity?: "light" | "heavy";
}

export default function RainParticles({ type, intensity = "light" }: RainParticlesProps) {
  const count = intensity === "heavy" ? 40 : 20;

  const drops = useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i / count) * 100 + Math.random() * (100 / count)}%`,
      animDelay: `${Math.random() * 2}s`,
      animDuration: `${0.6 + Math.random() * 0.8}s`,
      opacity: 0.12 + Math.random() * 0.18,
      height: type === "THUNDERSTORM" ? `${14 + Math.random() * 10}px` : `${8 + Math.random() * 8}px`,
      width: "1px",
      angle: type === "THUNDERSTORM" ? "-15deg" : "-8deg",
    }))
  ), [count, type]);

  if (!["RAIN", "HEAVY_RAIN", "THUNDERSTORM"].includes(type)) return null;

  const dropColor = type === "THUNDERSTORM" ? "#f59e0b" : "#38bdf8";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ zIndex: 1 }}>
      <style>{`
        @keyframes orion-rain-fall {
          0%   { transform: translateY(-20px) rotate(var(--rain-angle)); opacity: var(--rain-opacity); }
          85%  { opacity: var(--rain-opacity); }
          100% { transform: translateY(110%) rotate(var(--rain-angle)); opacity: 0; }
        }
      `}</style>
      {drops.map((drop) => (
        <div
          key={drop.id}
          style={{
            position: "absolute",
            left: drop.left,
            top: 0,
            width: drop.width,
            height: drop.height,
            background: `linear-gradient(to bottom, transparent, ${dropColor})`,
            borderRadius: "1px",
            animationName: "orion-rain-fall",
            animationDuration: drop.animDuration,
            animationDelay: drop.animDelay,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            // @ts-expect-error — CSS custom properties
            "--rain-angle": drop.angle,
            "--rain-opacity": String(drop.opacity),
          }}
        />
      ))}
    </div>
  );
}
