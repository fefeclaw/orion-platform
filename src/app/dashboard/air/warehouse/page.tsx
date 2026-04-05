"use client";

import { motion } from "framer-motion";
import { Warehouse, Thermometer, Droplets, Wind, PackageOpen } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const ZONES = [
  { id: "A", name: "Zone Standard", capacity: 85, total: "500m²", used: "425m²", temp: "22°C", humidity: "45%" },
  { id: "B", name: "Zone Express", capacity: 60, total: "200m²", used: "120m²", temp: "22°C", humidity: "45%" },
  { id: "C", name: "Réfrigéré", capacity: 90, total: "150m²", used: "135m²", temp: "4°C", humidity: "65%" },
  { id: "D", name: "DGR", capacity: 40, total: "100m²", used: "40m²", temp: "18°C", humidity: "40%" },
];

export default function AirWarehousePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Entrepôt FHB</h1>
            <p className="text-sm text-white/40">Ground handling · Stockage</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <PackageOpen className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-300">720m² occupé</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4"
      >
        {ZONES.map((zone, i) => (
          <div
            key={zone.id}
            className="bg-[#0a1120] rounded-xl border border-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Zone {zone.id} · {zone.name}</p>
                  <p className="text-xs text-white/40">{zone.used} / {zone.total}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">{zone.temp}</span>
                  <Droplets className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">{zone.humidity}</span>
                </div>
              </div>
            </div>            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Capacité</span>
                <span className={`${zone.capacity > 85 ? "text-red-400" : "text-white/60"}`}>{zone.capacity}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    zone.capacity > 85 ? "bg-red-400" :
                    zone.capacity > 60 ? "bg-orange-400" :
                    "bg-green-400"
                  }`}
                  style={{ width: `${zone.capacity}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </DeckLayout>
  );
}
