"use client";

import { motion } from "framer-motion";
import { Anchor, Ship, Clock, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const BERTHS = [
  { id: "Q1", status: "occupied", vessel: "ORION-01", eta: "Arrivé", departure: "18:00" },
  { id: "Q2", status: "occupied", vessel: "MSC Sarah", eta: "Arrivé", departure: "20:30" },
  { id: "Q3", status: "free", vessel: "-", eta: "Libre", departure: "-" },
  { id: "Q4", status: "free", vessel: "-", eta: "Libre", departure: "-" },
  { id: "Q5", status: "occupied", vessel: "CMA CGM Rio", eta: "14:30", departure: "02:00" },
  { id: "Q6", status: "maintenance", vessel: "ND", eta: "Maint.", departure: "-" },
];

export default function MaritimeBerthPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Berth Planning</h1>
            <p className="text-sm text-white/40">Planification des quais</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">4/6 disponibles</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {BERTHS.map((berth, i) => (
          <div
            key={berth.id}
            className={`p-4 rounded-xl border ${
              berth.status === "free" ? "bg-green-500/5 border-green-500/10" :
              berth.status === "occupied" ? "bg-sky-500/5 border-sky-500/10" :
              "bg-orange-500/5 border-orange-500/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-white/80">{berth.id}</span>
              {berth.status === "free" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {berth.status === "occupied" && <Anchor className="w-5 h-5 text-sky-400" />}
              {berth.status === "maintenance" && <Clock className="w-5 h-5 text-orange-400" />}
            </div>
            <p className="text-sm text-white/60">{berth.vessel}</p>
            <p className="text-xs text-white/40 mt-1">{berth.eta}</p>
            {berth.departure !== "-" && (
              <p className="text-xs text-white/30 mt-1">Départ: {berth.departure}</p>
            )}
          </div>
        ))}
      </motion.div>
    </DeckLayout>
  );
}
