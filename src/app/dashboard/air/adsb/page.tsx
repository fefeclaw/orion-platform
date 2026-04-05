"use client";

import { motion } from "framer-motion";
import { Radio, Plane, Navigation, Signal } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const ADSB_PLANES = [
  { flight: "HF-301", altitude: "12,500 ft", speed: "450 kts", heading: "245°", signal: "strong", lat: "5.35" },
  { flight: "HF-405", altitude: "8,200 ft", speed: "320 kts", heading: "180°", signal: "medium", lat: "5.28" },
  { flight: "SN-502", altitude: "FL350", speed: "520 kts", heading: "90°", signal: "strong", lat: "5.42" },
  { flight: "TU-712", altitude: "15,000 ft", speed: "410 kts", heading: "300°", signal: "weak", lat: "5.31" },
];

export default function AirADSBPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">ADS-B Tracking</h1>
            <p className="text-sm text-white/40">Position temps réel · Mode-S</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300">4 actifs</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-3">
          {ADSB_PLANES.map((plane, i) => (
            <div key={plane.flight} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{plane.flight}</p>
                    <p className="text-xs text-white/40">Lat: {plane.lat}°N</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Signal className={`w-4 h-4 ${
                    plane.signal === "strong" ? "text-green-400" :
                    plane.signal === "medium" ? "text-yellow-400" :
                    "text-red-400"
                  }`} />
                  <span className="text-xs text-white/40">{plane.signal}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-white/40">Altitude</p>
                  <p className="text-violet-400 font-medium">{plane.altitude}</p>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-white/40">Vitesse</p>
                  <p className="text-violet-400 font-medium">{plane.speed}</p>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-white/40">Cap</p>
                  <p className="text-violet-400 font-medium">{plane.heading}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
