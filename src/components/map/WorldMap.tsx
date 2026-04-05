"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { Pillar } from "@/types";

// SatelliteBackground loaded client-side only (Leaflet requires browser APIs)
const SatelliteBackground = dynamic(() => import("./SatelliteBackground"), { ssr: false });

interface WorldMapProps {
  selectedPillar: Pillar | null;
}

const PILLAR_COLORS: Record<Pillar, string> = {
  maritime: "#22d3ee",
  rail:     "#fb923c",
  road:     "#4ade80",
  air:      "#818cf8",
};

function toPercent(lat: number, lng: number) {
  return {
    left: `${((lng + 180) / 360) * 100}%`,
    top:  `${((90 - lat) / 180) * 100}%`,
  };
}

const TRAFFIC_ROUTES: Record<Pillar, { lat: number; lng: number; label: string }[]> = {
  maritime: [
    { lat: 5.3,   lng: -4.0,   label: "Abidjan" },
    { lat: 6.4,   lng: 3.4,    label: "Lagos" },
    { lat: 14.7,  lng: -17.4,  label: "Dakar" },
    { lat: 33.9,  lng: -6.8,   label: "Casablanca" },
    { lat: 51.9,  lng: 4.5,    label: "Rotterdam" },
    { lat: 31.2,  lng: 121.5,  label: "Shanghai" },
    { lat: 1.3,   lng: 103.8,  label: "Singapore" },
    { lat: -33.9, lng: 18.4,   label: "Cape Town" },
  ],
  rail: [
    { lat: 5.3,  lng: -4.0,   label: "Abidjan" },
    { lat: 6.8,  lng: -5.3,   label: "Bouaké" },
    { lat: 12.4, lng: -1.5,   label: "Ouagadougou" },
    { lat: 12.6, lng: -8.0,   label: "Bamako" },
    { lat: 14.7, lng: -17.4,  label: "Dakar" },
  ],
  road: [
    { lat: 5.3,  lng: -4.0,   label: "Abidjan" },
    { lat: 7.7,  lng: -5.0,   label: "Yamoussoukro" },
    { lat: 12.4, lng: -1.5,   label: "Ouagadougou" },
    { lat: 12.6, lng: -8.0,   label: "Bamako" },
    { lat: 6.4,  lng: 3.4,    label: "Lagos" },
    { lat: 5.6,  lng: -0.2,   label: "Accra" },
  ],
  air: [
    { lat: 5.3,  lng: -4.0,   label: "Abidjan" },
    { lat: 48.9, lng: 2.4,    label: "Paris CDG" },
    { lat: 6.6,  lng: 3.3,    label: "Lagos" },
    { lat: 25.3, lng: 55.4,   label: "Dubai" },
    { lat: 40.6, lng: -73.8,  label: "New York JFK" },
    { lat: 14.7, lng: -17.4,  label: "Dakar" },
  ],
};

export default function WorldMap({ selectedPillar }: WorldMapProps) {
  const color = selectedPillar ? PILLAR_COLORS[selectedPillar] : "#d4a843";
  const routes = selectedPillar ? TRAFFIC_ROUTES[selectedPillar] : [];

  return (
    <div className="satellite-wrapper fixed inset-0 z-0 overflow-hidden">

      {/* ── Leaflet satellite map (ArcGIS World Imagery — gratuit, fiable) ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-5%",
          width: "110%",
          height: "110%",
          filter: "blur(4px) brightness(0.55) saturate(1.4)",
        }}
      >
        <SatelliteBackground />
      </div>

      {/* ── Gradient vignette overlay ────────────────────── */}
      <div
        className="satellite-overlay absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(5,8,15,0.65) 100%)",
            "linear-gradient(to bottom, rgba(5,8,15,0.72) 0%, rgba(5,8,15,0.15) 40%, rgba(5,8,15,0.15) 60%, rgba(5,8,15,0.80) 100%)",
          ].join(", "),
        }}
      />

      {/* ── Noise texture for depth ──────────────────────── */}
      <div
        className="satellite-noise absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px",
        }}
      />

      {/* ── Animated route dots + lines ─────────────────── */}
      <AnimatePresence>
        {selectedPillar && routes.length > 0 && (
          <motion.div
            key={selectedPillar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* SVG route lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
              <defs>
                <filter id="glow-route">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {routes.map((pt, i) => {
                if (i === 0) return null;
                const prev = routes[i - 1];
                const x1 = ((prev.lng + 180) / 360) * 100;
                const y1 = ((90 - prev.lat) / 180) * 100;
                const x2 = ((pt.lng + 180) / 360) * 100;
                const y2 = ((90 - pt.lat) / 180) * 100;
                const mx = (x1 + x2) / 2;
                const my = Math.min(y1, y2) - 8;
                return (
                  <motion.path
                    key={`line-${i}`}
                    d={`M ${x1}% ${y1}% Q ${mx}% ${my}% ${x2}% ${y2}%`}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.15%"
                    strokeOpacity="0.5"
                    filter="url(#glow-route)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 1.5, delay: i * 0.15, ease: "easeOut" }}
                  />
                );
              })}
            </svg>

            {/* Dot pulses */}
            {routes.map((pt, i) => {
              const pos = toPercent(pt.lat, pt.lng);
              return (
                <motion.div
                  key={`dot-${i}`}
                  className="absolute"
                  style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
                >
                  <motion.div
                    className="absolute rounded-full border"
                    style={{
                      width: 20, height: 20,
                      left: -10, top: -10,
                      borderColor: color,
                      boxShadow: `0 0 8px ${color}60`,
                    }}
                    animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: color,
                      boxShadow: `0 0 6px ${color}, 0 0 14px ${color}80`,
                    }}
                  />
                  <motion.span
                    className="absolute left-3 top-0 text-[8px] font-medium whitespace-nowrap tracking-wide"
                    style={{ color, textShadow: `0 0 8px ${color}` }}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 0.8, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.12 }}
                  >
                    {pt.label}
                  </motion.span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
