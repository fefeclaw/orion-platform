"use client";

import { motion, AnimatePresence } from "framer-motion";
import { radarColor } from "@/lib/weather";
import type { WeatherCondition } from "@/lib/weather";

interface WeatherRadarOverlayProps {
  weather: WeatherCondition;
  visible: boolean;
}

export default function WeatherRadarOverlay({ weather, visible }: WeatherRadarOverlayProps) {
  const colors = radarColor(weather.type);

  return (
    <AnimatePresence>
      {visible && colors && (
        <motion.div
          key="radar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ borderRadius: "inherit" }}
        >
          {/* Radar blob 1 — main coverage */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "20%",
              top: "25%",
              width: "55%",
              height: "50%",
              background: `radial-gradient(ellipse, ${colors.fill} 0%, transparent 70%)`,
              filter: "blur(16px)",
            }}
            animate={{
              scale: [1, 1.12, 1.05, 1],
              opacity: [0.9, 1, 0.85, 0.9],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Radar blob 2 — secondary */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "45%",
              top: "40%",
              width: "40%",
              height: "40%",
              background: `radial-gradient(ellipse, ${colors.fill.replace("0.18", "0.12")} 0%, transparent 70%)`,
              filter: "blur(20px)",
            }}
            animate={{
              scale: [1.05, 1, 1.1, 1.05],
              x: [0, 8, 0, -4, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Scan ring — premium radar pulse */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "30%",
              top: "20%",
              width: "40%",
              height: "60%",
              border: `1px solid ${colors.pulse}`,
              opacity: 0,
            }}
            animate={{
              scale: [0.8, 1.4],
              opacity: [0.5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "30%",
              top: "20%",
              width: "40%",
              height: "60%",
              border: `1px solid ${colors.pulse}`,
              opacity: 0,
            }}
            animate={{
              scale: [0.8, 1.4],
              opacity: [0.5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
          />

          {/* Badge — top-right */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest"
            style={{
              background: "rgba(4,10,20,0.8)",
              border: `1px solid ${colors.pulse}40`,
              backdropFilter: "blur(8px)",
              color: colors.pulse,
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: colors.pulse }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Radar Météo
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
