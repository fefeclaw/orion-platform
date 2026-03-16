"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ShipTimelineProps {
  departurePort: string;
  arrivalPort?: string;
  status?: "loading" | "at_sea" | "approaching" | "arrived" | "delayed";
  progress?: number; // 0–100
}

const STATUS_LABELS: Record<string, string> = {
  loading:     "Chargement en cours",
  at_sea:      "En mer",
  approaching: "Approche port",
  arrived:     "Arrivé",
  delayed:     "⚠️ Statut : Vigilance — Déviation détectée",
};

const STATUS_COLORS: Record<string, string> = {
  loading:     "#f87171",
  at_sea:      "#38bdf8",
  approaching: "#D4AF37",
  arrived:     "#34d399",
  delayed:     "#f59e0b",  // amber — Delay Protocol
};

export default function ShipTimeline({
  departurePort,
  arrivalPort = "Port Autonome d'Abidjan",
  status = "at_sea",
  progress = 60,
}: ShipTimelineProps) {
  const color = STATUS_COLORS[status];

  // Pulse keyframes injected once
  const pulseId = `pulse-${status}`;

  return (
    <div className="w-full">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-white/30">
          Trajet navire
        </span>
        <span
          className="text-[10px] uppercase tracking-widest font-medium px-2.5 py-0.5 rounded-full"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Timeline SVG — Aeronautical Pulse */}
      <div className="relative w-full" style={{ height: 80 }}>
        <svg
          viewBox="0 0 400 80"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Pulse gradient */}
            <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.05" />
              <stop offset={`${progress}%`} stopColor={color} stopOpacity="0.5" />
              <stop offset={`${Math.min(progress + 5, 100)}%`} stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor={color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Track rail — faint */}
          <path
            d="M 30 40 Q 200 10 370 40"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Active portion — glowing */}
          <motion.path
            d="M 30 40 Q 200 10 370 40"
            fill="none"
            stroke={`url(#trackGrad)`}
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Solid glow line up to progress */}
          <motion.path
            d="M 30 40 Q 200 10 370 40"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.6"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Departure port dot */}
          <circle cx="30" cy="40" r="4" fill={color} opacity="0.8" />
          <circle cx="30" cy="40" r="4" fill="none" stroke={color} strokeWidth="1">
            <animate attributeName="r" values="4;10;4" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Arrival port dot */}
          <circle
            cx="370"
            cy="40"
            r="4"
            fill={progress >= 95 ? color : "rgba(255,255,255,0.15)"}
          />
          {progress >= 95 && (
            <circle cx="370" cy="40" r="4" fill="none" stroke={color} strokeWidth="1">
              <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Ship icon pulse — moving along the curve */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {/* Ship position marker */}
            <motion.circle
              cx={30 + (progress / 100) * 340}
              cy={40 - Math.sin((progress / 100) * Math.PI) * 30}
              r="5"
              fill={color}
              filter="url(#glow)"
            />
            <motion.circle
              cx={30 + (progress / 100) * 340}
              cy={40 - Math.sin((progress / 100) * Math.PI) * 30}
              r="5"
              fill="none"
              stroke={color}
              strokeWidth="1"
            >
              <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
            </motion.circle>
          </motion.g>

          {/* Port labels */}
          <text x="30" y="65" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7">
            {departurePort.split(" ").slice(0, 2).join(" ")}
          </text>
          <text x="370" y="65" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7">
            Abidjan
          </text>

          {/* Progress % */}
          <text
            x={30 + (progress / 100) * 340}
            y={40 - Math.sin((progress / 100) * Math.PI) * 30 - 12}
            textAnchor="middle"
            fill={color}
            fontSize="8"
            fontWeight="600"
          >
            {progress}%
          </text>
        </svg>
      </div>

      {/* ETA */}
      <div className="flex justify-between text-[10px] text-white/25 mt-1">
        <span>{departurePort}</span>
        <span>{arrivalPort}</span>
      </div>
    </div>
  );
}
