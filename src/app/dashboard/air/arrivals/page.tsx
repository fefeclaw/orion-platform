"use client";

import { motion } from "framer-motion";
import { Plane, Clock, MapPin, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const ARRIVALS = [
  { flight: "HF-301", origin: "CDG Paris", schedule: "08:30", status: "landed", gate: "T1-A3" },
  { flight: "HF-405", origin: "Lagos", schedule: "09:45", status: "delayed", gate: "T2-B1" },
  { flight: "SN-502", origin: "Bruxelles", schedule: "11:20", status: "expected", gate: "T1-A5" },
];

export default function AirArrivalsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Arrivées</h1>
            <p className="text-sm text-white/40">Vol ABJ · Félix Houphouët-Boigny</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Plane className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-300">Flight Tracking</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-violet-400" />
          Prochaines arrivées
        </h2>

        <div className="space-y-3">
          {ARRIVALS.map((flight, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  flight.status === "landed" ? "bg-green-500/10" :
                  flight.status === "delayed" ? "bg-orange-500/10" : "bg-violet-500/10"
                }`}>
                  <Plane className={`w-5 h-5 ${
                    flight.status === "landed" ? "text-green-400" :
                    flight.status === "delayed" ? "text-orange-400" : "text-violet-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{flight.flight}</p>
                  <p className="text-xs text-white/40">{flight.origin}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/80">{flight.schedule}</p>
                  {flight.status === "delayed" && <p className="text-xs text-orange-400">+45min</p>}
                </div>
                <div className="px-3 py-1 rounded-lg bg-white/5">
                  <p className="text-xs text-white/60">{flight.gate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
