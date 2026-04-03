"use client";

import { motion } from "framer-motion";
import { Package, Thermometer, AlertTriangle, Wind } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const CARGO = [
  { id: "CRG-001", type: "Standard", pieces: 150, weight: "2.4T", status: "ready" },
  { id: "CRG-002", type: "Périssable", pieces: 45, weight: "890kg", temp: "2-4°C", status: "cooling" },
  { id: "CRG-003", type: "DGR", pieces: 12, weight: "340kg", class: "3", status: "hold" },
  { id: "CRG-004", type: "Standard", pieces: 89, weight: "1.2T", status: "ready" },
];

export default function AirCargoPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Fret & Cargo</h1>
            <p className="text-sm text-white/40">Inventaire terminal FHB</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Package className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-300">296 colis</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-6 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-400" />
            Inventaire cargo
          </h2>

          <div className="space-y-3">
            {CARGO.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${
                item.status === "hold" ? "bg-red-500/5 border-red-500/20" :
                item.status === "cooling" ? "bg-blue-500/5 border-blue-500/20" :
                "bg-white/[0.02] border-white/5"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === "DGR" ? "bg-red-500/10" :
                    item.type === "Périssable" ? "bg-blue-500/10" : "bg-violet-500/10"
                  }`}>
                    <Package className={`w-5 h-5 ${
                      item.type === "DGR" ? "text-red-400" :
                      item.type === "Périssable" ? "text-blue-400" : "text-violet-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{item.id}</p>
                    <p className="text-xs text-white/40">{item.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-white/60">{item.weight}</p>
                    <p className="text-xs text-white/40">{item.pieces} pcs</p>
                  </div>
                  {item.temp && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10">
                      <Thermometer className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">{item.temp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-violet-400" />
            Alertes cargo
          </h2>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-red-400" />
                <span className="text-sm text-white/70">DGR en attente inspection</span>
              </div>
              <p className="text-xs text-white/40 mt-1">CRG-003 · Classe 3</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/70">Température critique</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
