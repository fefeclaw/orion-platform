"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Pillar } from "@/types";

interface WorldMapProps {
  selectedPillar: Pillar | null;
}

const PILLAR_COLORS: Record<Pillar, string> = {
  maritime: "#1e88e5",
  rail: "#e53935",
  road: "#43a047",
  air: "#8e24aa",
};

// Simulated traffic dots for each pillar
const TRAFFIC_ROUTES: Record<Pillar, { lat: number; lng: number }[]> = {
  maritime: [
    { lat: 5.3, lng: -4.0 }, // Abidjan
    { lat: 6.4, lng: 3.4 },  // Lagos
    { lat: 33.9, lng: -6.8 }, // Casablanca
    { lat: 51.9, lng: 4.5 },  // Rotterdam
    { lat: 31.2, lng: 121.5 }, // Shanghai
    { lat: 1.3, lng: 103.8 }, // Singapore
    { lat: 22.3, lng: 114.2 }, // Hong Kong
    { lat: -33.9, lng: 18.4 }, // Cape Town
  ],
  rail: [
    { lat: 5.3, lng: -4.0 },  // Abidjan
    { lat: 6.8, lng: -5.3 },  // Bouake
    { lat: 9.3, lng: -5.6 },  // Ferkessedougou
    { lat: 12.4, lng: -1.5 }, // Ouagadougou
    { lat: 12.6, lng: -8.0 }, // Bamako
    { lat: 14.7, lng: -17.4 }, // Dakar
  ],
  road: [
    { lat: 5.3, lng: -4.0 },   // Abidjan
    { lat: 7.7, lng: -5.0 },   // Yamoussoukro
    { lat: 9.5, lng: -5.6 },   // Korhogo
    { lat: 12.4, lng: -1.5 },  // Ouagadougou
    { lat: 12.6, lng: -8.0 },  // Bamako
    { lat: 6.4, lng: 3.4 },    // Lagos
    { lat: 9.1, lng: 7.5 },    // Abuja
    { lat: 5.6, lng: -0.2 },   // Accra
  ],
  air: [
    { lat: 5.3, lng: -4.0 },   // Abidjan FHB
    { lat: 48.9, lng: 2.4 },   // CDG Paris
    { lat: 6.6, lng: 3.3 },    // Lagos
    { lat: 25.3, lng: 55.4 },  // Dubai
    { lat: 40.6, lng: -73.8 }, // JFK
    { lat: 0.0, lng: 32.4 },   // Entebbe
    { lat: -1.3, lng: 36.9 },  // Nairobi
    { lat: 14.7, lng: -17.4 }, // Dakar
  ],
};

// Convert lat/lng to SVG viewBox coordinates (simple Mercator-like)
function toSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

export default function WorldMap({ selectedPillar }: WorldMapProps) {
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!selectedPillar) {
      setDots([]);
      return;
    }
    const routes = TRAFFIC_ROUTES[selectedPillar];
    setDots(routes.map((r) => toSvg(r.lat, r.lng)));
  }, [selectedPillar]);

  const color = selectedPillar ? PILLAR_COLORS[selectedPillar] : "#d4a843";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="w-full max-w-5xl mx-auto relative"
    >
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe ellipse */}
        <ellipse
          cx="500"
          cy="250"
          rx="480"
          ry="230"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.5"
          opacity="0.4"
        />
        {/* Grid lines — breathing */}
        <g className="map-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * (1000 / 18)}
              y1="0"
              x2={i * (1000 / 18)}
              y2="500"
              stroke="#3a6fa8"
              strokeWidth="0.3"
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * (500 / 9)}
              x2="1000"
              y2={i * (500 / 9)}
              stroke="#3a6fa8"
              strokeWidth="0.3"
            />
          ))}
        </g>
        {/* Continental masses — simplified */}
        {/* Africa */}
        <path
          d="M480 180 Q510 170 520 200 Q530 250 520 300 Q510 340 490 350 Q470 340 460 300 Q450 260 460 220 Q465 190 480 180Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
        {/* Europe */}
        <path
          d="M470 120 Q500 100 530 110 Q540 130 520 150 Q500 160 480 155 Q465 140 470 120Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
        {/* Asia */}
        <path
          d="M540 100 Q620 80 700 100 Q750 130 740 180 Q720 220 680 230 Q640 220 600 200 Q560 170 540 140 Q535 120 540 100Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
        {/* Americas */}
        <path
          d="M200 100 Q230 80 260 100 Q270 140 260 180 Q250 220 240 260 Q230 300 220 340 Q210 360 200 340 Q190 300 185 260 Q180 200 190 140 Q195 110 200 100Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
        <path
          d="M260 280 Q280 260 300 280 Q310 320 300 360 Q280 390 260 370 Q250 340 255 310 Q258 290 260 280Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
        {/* Australia */}
        <path
          d="M750 300 Q780 285 810 295 Q825 315 820 340 Q800 360 775 355 Q755 340 750 320 Q748 310 750 300Z"
          fill="#0d1e35"
          stroke="#1e4878"
          strokeWidth="1"
        />
      </svg>

      {/* Traffic dots overlay */}
      <svg
        viewBox="0 0 1000 500"
        className="absolute inset-0 w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Routes connecting dots */}
        {dots.length > 1 &&
          dots.map((dot, i) => {
            if (i === 0) return null;
            const prev = dots[i - 1];
            return (
              <motion.line
                key={`route-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={dot.x}
                y2={dot.y}
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: i * 0.2 }}
              />
            );
          })}
        {/* Animated dots */}
        {dots.map((dot, i) => (
          <g key={`dot-${i}`}>
            <motion.circle
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            />
            <motion.circle
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill="none"
              stroke={color}
              strokeWidth="1"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: 2,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </g>
        ))}
      </svg>
    </motion.div>
  );
}
