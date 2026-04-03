"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Flame, Skull, Package } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DGR_CARGO = [
  { id: "DGR-001", class: "3", name: "Liquides inflammables", weight: "450 kg", location: "Warehouse A-12", status: "stored" },
  { id: "DGR-002", class: "8", name: "Matériaux corrosifs", weight: "120 kg", location: "Warehouse A-15", status: "awaiting" },
];

export default function AirDangerousPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h1 className="text-xl font-semibold text-white/90">Fret Dangereux · DGR</h1>
              <p className="text-sm text-white/40">Marchandises dangereuses · IATA DGR</p>
            </div>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white/70">Classe 3 · Inflammable</span>
            </div>
            <p className="text-xs text-white/40">450 kg en stock</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white/70">Classe 8 · Corrosif</span>
            </div>
            <p className="text-xs text-white/40">120 kg en stock</p>
          </div>
        </div>

        <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-400" />
          Inventaire DGR
        </h2>

        <div className="space-y-3">
          {DGR_CARGO.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-400">{item.class}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{item.name}</p>
                    <p className="text-xs text-white/40">{item.id} · {item.weight}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">{item.location}</p>
                  <div className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-400 mt-1">
                    {item.status === "stored" ? "Stocké" : "En attente"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
