"use client";

import { motion } from "framer-motion";
import { Train, Package, Scale, Box } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const WAGONS = [
  { id: "WG-1201", type: "Citerne", capacity: "60T", load: "48T", cargo: "Carburant", location: "En route" },
  { id: "WG-1202", type: "Citerne", capacity: "60T", load: "55T", cargo: "Carburant", location: "Ouagadougou" },
  { id: "WG-3401", type: "Couvert", capacity: "50T", load: "42T", cargo: "Cacao", location: "Abidjan" },
  { id: "WG-3402", type: "Couvert", capacity: "50T", load: "0T", cargo: "Vide", location: "Bobo-Dioulasso" },
  { id: "WG-5601", type: "Plateau", capacity: "40T", load: "38T", cargo: "Conteneurs", location: "En route" },
];

export default function RailWagonsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Wagons</h1>
            <p className="text-sm text-white/40">Gestion du parc de wagons</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Package className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">5 wagons actifs</span>
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
          <Box className="w-4 h-4 text-red-400" />
          Inventaire des wagons
        </h2>

        <div className="space-y-3">
          {WAGONS.map((wagon, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Train className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{wagon.id}</p>
                  <p className="text-xs text-white/40">{wagon.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-white/60">{wagon.cargo}</p>
                  <p className="text-xs text-white/40">{wagon.load} / {wagon.capacity}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60">
                  {wagon.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
