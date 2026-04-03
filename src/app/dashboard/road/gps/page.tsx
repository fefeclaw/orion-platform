"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Satellite } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function RoadGPSPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Tracking GPS</h1>
            <p className="text-sm text-white/40">Position temps réel des camions</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Satellite className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">42 véhicules suivis</span>
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
            <Navigation className="w-4 h-4 text-emerald-400" />
            Carte GPS
          </h2>
          <div className="h-[400px] bg-gradient-to-br from-[#0d1424] to-[#0a1120] rounded-xl border border-white/5 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
              <p className="text-white/40">Carte de tracking routier</p>
              <p className="text-xs text-white/30 mt-1">Intégration GPS temps réel</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4">Positions actuelles</h2>
          <div className="space-y-3">
            {[
              { plate: "AB-1234-AB", location: "Abidjan - Bouaké", time: "10:42" },
              { plate: "AB-5678-CD", location: "Yamoussoukro", time: "10:38" },
              { plate: "AB-9012-EF", location: "San-Pédro", time: "10:35" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-white/70">{item.plate}</span>
                </div>
                <p className="text-xs text-white/40 mt-1">{item.location}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
