"use client";

import { motion } from "framer-motion";
import { Building2, Clock, Users, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import { useRailData } from "@/hooks/useRailData";

export default function RailStationsPage() {
  const { stations } = useRailData();

  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Gares & Stations</h1>
            <p className="text-sm text-white/40">État des infrastructures ferroviaires</p>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="grid grid-cols-3 gap-4">
          {stations.map((station, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                station.status === "normal" ? "bg-green-500/5 border-green-500/20" :
                station.status === "congested" ? "bg-orange-500/5 border-orange-500/20" :
                "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Building2 className={`w-5 h-5 ${
                  station.status === "normal" ? "text-green-400" :
                  station.status === "congested" ? "text-orange-400" :
                  "text-red-400"
                }`} />
                <div className={`w-2 h-2 rounded-full ${
                  station.status === "normal" ? "bg-green-400" :
                  station.status === "congested" ? "bg-orange-400" :
                  "bg-red-400"
                }`} />
              </div>
              <h3 className="text-sm font-medium text-white/80">{station.name}</h3>
              <p className="text-xs text-white/40">{station.trainsCount} trains présents</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Clock className="w-3 h-3" />
                  <span>{station.eta || "Opérationnel"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
