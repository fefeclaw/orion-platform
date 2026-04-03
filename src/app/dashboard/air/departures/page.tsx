"use client";

import { motion } from "framer-motion";
import { Plane, MapPin, Clock } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DEPARTURES = [
  { flight: "HF-302", destination: "CDG Paris", schedule: "14:30", status: "boarding", gate: "T1-A4" },
  { flight: "HF-406", destination: "Lagos", schedule: "16:00", status: "on-time", gate: "T2-B2" },
  { flight: "SN-503", destination: "Bruxelles", schedule: "18:45", status: "delayed", gate: "T1-A6" },
];

export default function AirDeparturesPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Départs</h1>
            <p className="text-sm text-white/40">Vol ABJ · Félix Houphouët-Boigny</p>
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
          <Plane className="w-4 h-4 text-violet-400" />
          Prochains départs
        </h2>

        <div className="space-y-3">
          {DEPARTURES.map((flight, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  flight.status === "boarding" ? "bg-blue-500/10" :
                  flight.status === "delayed" ? "bg-orange-500/10" : "bg-green-500/10"
                }`}>
                  <Plane className={`w-5 h-5 ${
                    flight.status === "boarding" ? "text-blue-400" :
                    flight.status === "delayed" ? "text-orange-400" : "text-green-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{flight.flight}</p>
                  <p className="text-xs text-white/40">{flight.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/80">{flight.schedule}</p>
                  {flight.status === "delayed" && <p className="text-xs text-orange-400">+1h20</p>}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${
                  flight.status === "boarding" ? "bg-blue-500/10 text-blue-400" :
                  flight.status === "delayed" ? "bg-orange-500/10 text-orange-400" :
                  "bg-green-500/10 text-green-400"
                }`}>
                  {flight.status === "boarding" ? "Embarquement" :
                   flight.status === "delayed" ? "Retardé" : "À l'heure"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
