"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PILLARS, Pillar } from "@/types";
import PillarIcon from "./PillarIcon";

interface PillarSelectorProps {
  onSelect: (pillar: Pillar) => void;
  selectedPillar: Pillar | null;
}

const NEON_SHADOWS: Record<Pillar, string> = {
  maritime: "0 0 24px rgba(56,189,248,0.45), 0 0 60px rgba(56,189,248,0.15)",
  rail:     "0 0 24px rgba(248,113,113,0.45), 0 0 60px rgba(248,113,113,0.15)",
  road:     "0 0 24px rgba(52,211,153,0.45),  0 0 60px rgba(52,211,153,0.15)",
  air:      "0 0 24px rgba(167,139,250,0.45), 0 0 60px rgba(167,139,250,0.15)",
};

export default function PillarSelector({ onSelect, selectedPillar }: PillarSelectorProps) {
  const [hoveredPillar, setHoveredPillar] = useState<Pillar | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 py-4">
      <AnimatePresence mode="popLayout">
        {PILLARS.filter((p) => !selectedPillar || p.id === selectedPillar).map((pillar, i) => {
          const isHovered = hoveredPillar === pillar.id;
          const isSelected = selectedPillar === pillar.id;
          return (
            <motion.button
              key={pillar.id}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: isHovered ? 1.05 : 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.3,
                transition: { duration: 0.4, delay: i * 0.08 },
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                layout: { duration: 0.45 },
              }}
              onClick={() => onSelect(pillar.id)}
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
              className={`glass rounded-2xl p-6 md:p-8 cursor-pointer flex flex-col items-center gap-4 w-40 md:w-48 ${isSelected ? `glow-${pillar.id}` : ""}`}
              style={{
                boxShadow: isHovered
                  ? NEON_SHADOWS[pillar.id as Pillar]
                  : isSelected
                    ? undefined
                    : "none",
                transition: "box-shadow 0.35s ease, transform 0.35s ease",
              }}
            >
              <PillarIcon
                icon={pillar.icon}
                color={pillar.color}
                size={64}
                pillarId={pillar.id}
                hovered={isHovered || isSelected}
              />
              <span
                className="text-lg font-semibold tracking-wide transition-colors duration-300"
                style={{ color: isHovered || isSelected ? pillar.color : "#e8ecf1" }}
              >
                {pillar.label}
              </span>
              <span className="text-xs text-center leading-tight" style={{ color: "rgba(200,210,220,0.5)" }}>
                {pillar.description}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
