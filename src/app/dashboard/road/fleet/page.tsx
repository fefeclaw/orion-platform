"use client";

import { motion } from "framer-motion";
import { Truck, MapPin, Gauge, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import { useRoadData } from "@/hooks/useRoadData";

export default function RoadFleetPage() {
  const { trucks } = useRoadData();

  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Flotte de Camions</h1>
            <p className="text-sm text-white/40">Gestion des véhicules routiers</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">{trucks.length} véhicules</span>
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
            <Truck className="w-4 h-4 text-emerald-400" />
            Camions en service
          </h2>

          <div className="space-y-3">
            {trucks.slice(0, 5).map((truck, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      truck.status === "active" ? "bg-emerald-500/10" : "bg-orange-500/10"
                    }`}>
                      <Truck className={`w-5 h-5 ${
                        truck.status === "active" ? "text-emerald-400" : "text-orange-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{truck.plate}</p>
                      <p className="text-xs text-white/40">{truck.type} · {truck.capacity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-white/60">{truck.driver}</p>
                      <p className="text-xs text-white/40">{truck.route}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      truck.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-orange-500/10 text-orange-400"
                    }`}>
                      {truck.status === "active" ? "En route" : "Arrêt"}
                    </div>
                  </div>
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
          <h2 className="text-sm font-medium text-white/60 mb-4">Métriques flotte</h2>
          <div className="space-y-4">
            {[
              { label: "Disponibilité", value: "89%", color: "text-emerald-400" },
              { label: "En transit", value: "42", color: "text-white/80" },
              { label: "Kilométrage moyen", value: "4 230 km/mois", color: "text-white/80" },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02]">
                <p className="text-xs text-white/40">{stat.label}</p>
                <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>        </motion.div>
      </div>
    </DeckLayout>
  );
}
