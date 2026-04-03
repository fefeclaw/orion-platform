"use client";

import { motion } from "framer-motion";
import { Train, MapPin, Clock, Route, ArrowRight } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import { useRailData } from "@/hooks/useRailData";

const CORRIDOR_STATIONS = [
  { name: "Abidjan", km: 0, status: "active" },
  { name: "Bingerville", km: 25, status: "active" },
  { name: "Dabou", km: 45, status: "active" },
  { name: "Grand-Bassam", km: 65, status: "congested" },
  { name: "Ferkessédougou", km: 420, status: "active" },
  { name: "Ouangolodougou", km: 580, status: "active" },
  { name: "Bobo-Dioulasso", km: 920, status: "active" },
  { name: "Ouagadougou", km: 1240, status: "active" },
];

export default function RailCorridorPage() {
  const { trains, stations } = useRailData();

  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Corridor Abidjan-Ouagadougou</h1>
            <p className="text-sm text-white/40">1 240 km · Liaison internationale CI-BF</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Route className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">7 trains actifs</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Carte du corridor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            Vue du corridor
          </h2>
          
          {/* Visualisation stylisée du corridor */}
          <div className="relative h-[400px] bg-gradient-to-r from-[#0d1424] to-[#0a1120] rounded-xl overflow-hidden">
            {/* Ligne principale */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-red-500/30 via-red-400/50 to-red-500/30 rounded-full" />
            
            {/* Stations */}
            {CORRIDOR_STATIONS.map((station, index) => {
              const left = (index / (CORRIDOR_STATIONS.length - 1)) * 100;
              return (
                <motion.div
                  key={station.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${left}%` }}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    station.status === "active" ? "bg-green-400" : "bg-orange-400"
                  } border-2 border-[#0a1120]`} />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p className="text-[10px] text-white/50">{station.name}</p>
                    <p className="text-[9px] text-white/30 text-center">{station.km} km</p>
                  </div>
                </motion.div>
              );
            })}

            {/* Trains en cours */}
            {trains.slice(0, 3).map((train, i) => (
              <motion.div
                key={train.id}
                initial={{ left: "10%" }}
                animate={{ left: `${20 + i * 25}%` }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                className="absolute top-[40%]"
              >
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Train className="w-3 h-3 text-red-400" />
                  <span className="text-[9px] text-red-300">{train.name}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats corridor */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: "Distance totale", value: "1 240 km", icon: Route },
              { label: "Temps moyen", value: "48h", icon: Clock },
              { label: "Trains/jour", value: "12", icon: Train },
              { label: "Taux remplissage", value: "87%", icon: ArrowRight },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <stat.icon className="w-4 h-4 text-red-400/60 mb-2" />
                <p className="text-lg font-semibold text-white/80">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Panel droit - Alertes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4">Alertes corridor</h2>
          <div className="space-y-3">
            {[
              { type: "warning", msg: "Ralentissement zone Grand-Bassam" },
              { type: "info", msg: "Maintenance voie Ferkessédougou" },
              { type: "success", msg: "Corridor Nord dégagé" },
            ].map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  alert.type === "warning" ? "bg-orange-500/10 border-orange-500/20" :
                  alert.type === "success" ? "bg-green-500/10 border-green-500/20" :
                  "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                <p className="text-xs text-white/70">{alert.msg}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
