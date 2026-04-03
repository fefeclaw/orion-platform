"use client";

import { motion } from "framer-motion";
import { Thermometer, Clock, Package, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const PERISHABLES = [
  { id: "PER-001", type: "Poisson", temp: "-18°C", expiry: "48h", location: "Cold Room A" },
  { id: "PER-002", type: "Mangues", temp: "8-12°C", expiry: "5 jours", location: "Cold Room B" },
  { id: "PER-003", type: "Ananas", temp: "10°C", expiry: "7 jours", location: "Cold Room B" },
];

export default function AirPerishablesPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Fret Périssable</h1>
            <p className="text-sm text-white/40">Produits sensibles température</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Thermometer className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Contrôle température</span>
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
          <Package className="w-4 h-4 text-violet-400" />
          Inventaire périssables
        </h2>

        <div className="space-y-3">
          {PERISHABLES.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Thermometer className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{item.type}</p>
                    <p className="text-xs text-white/40">{item.id} · {item.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Thermometer className="w-3 h-3 text-blue-400" />
                    <span className="text-sm text-blue-400">{item.temp}</span>
                  </div>                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span className="text-xs text-white/40">DLC {item.expiry}</span>
                  </div>
                </div>
              </div>            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
