"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PILLARS } from "@/types";
import type { Pillar } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface PillarSelectorProps {
  onSelect: (pillar: Pillar) => void;
  selectedPillar: Pillar | null;
}

// Real photography — logistics & transport
const PILLAR_IMAGES: Record<Pillar, string> = {
  maritime: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&q=80",
  rail:     "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80",
  road:     "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
  air:      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
};

export default function PillarSelector({ onSelect, selectedPillar }: PillarSelectorProps) {
  const [hoveredPillar, setHoveredPillar] = useState<Pillar | null>(null);
  const t = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6 py-4">
      <AnimatePresence mode="popLayout">
        {PILLARS.filter((p) => !selectedPillar || p.id === selectedPillar).map((pillar, i) => {
          const isHovered = hoveredPillar === pillar.id;
          const isSelected = selectedPillar === pillar.id;
          const active = isHovered || isSelected;

          return (
            <motion.button
              key={pillar.id}
              layout
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: active ? 1.04 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.35, delay: i * 0.06 } }}
              transition={{ duration: 0.5, delay: i * 0.09, layout: { duration: 0.45 } }}
              onClick={() => onSelect(pillar.id)}
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
              className="relative overflow-hidden rounded-2xl cursor-pointer focus:outline-none"
              style={{
                width: 168,
                height: 220,
                boxShadow: active
                  ? `0 8px 32px ${pillar.color}50, 0 0 0 1px ${pillar.color}40`
                  : "0 4px 20px rgba(0,0,0,0.35)",
                transition: "box-shadow 0.35s ease, transform 0.35s ease",
              }}
              aria-label={`Accéder au pilier ${pillar.label}`}
            >
              {/* Photo background */}
              <Image
                src={PILLAR_IMAGES[pillar.id as Pillar]}
                alt={pillar.label}
                fill
                sizes="168px"
                className="object-cover"
                style={{
                  transform: active ? "scale(1.06)" : "scale(1)",
                  transition: "transform 0.6s ease",
                  filter: active ? "brightness(0.75) saturate(1.2)" : "brightness(0.6) saturate(0.9)",
                }}
                priority={i < 2}
              />

              {/* Color gradient overlay — bottom */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
                    to bottom,
                    transparent 25%,
                    ${pillar.color}20 60%,
                    ${pillar.color}90 100%
                  )`,
                  transition: "opacity 0.35s ease",
                  opacity: active ? 1 : 0.85,
                }}
              />

              {/* Top corner badge */}
              <motion.div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  border: `1px solid ${pillar.color}50`,
                  backdropFilter: "blur(6px)",
                }}
                animate={{ opacity: active ? 1 : 0.6 }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: pillar.color }}
                />
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: pillar.color }}
                >
                  {t("pillar_live")}
                </span>
              </motion.div>

              {/* Bottom text block */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-base font-bold text-white tracking-wide leading-tight">
                  {t(`pillar_${pillar.id}` as Parameters<typeof t>[0])}
                </p>
                <p className="text-[10px] text-white/70 mt-1 leading-snug">
                  {t(`pillar_${pillar.id}_desc` as Parameters<typeof t>[0])}
                </p>

                {/* Animated enter line */}
                <motion.div
                  className="mt-2 h-px rounded-full"
                  style={{ background: `linear-gradient(90deg, ${pillar.color}, transparent)` }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: active ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
