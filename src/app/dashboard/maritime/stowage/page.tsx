"use client";

import { motion } from "framer-motion";
import { Anchor, Ship, Package, Grid3X3 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function MaritimeStowagePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Stowage Plan</h1>
            <p className="text-sm text-white/40">Plan de chargement conteneurs</p>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-sky-400" />
            Vue du pont conteneurs
          </h2>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }).map((_, i) => {
              const filled = Math.random() > 0.3;
              const type = Math.random() > 0.8 ? "reefer" : "dry";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`aspect-square rounded flex items-center justify-center text-[8px] ${
                    filled 
                      ? type === "reefer" ? "bg-blue-500/20 border border-blue-500/40" : "bg-sky-500/20 border border-sky-500/40"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  {filled && <Package className="w-3 h-3 text-white/40" />}
                </motion.div>
              );
            })}
          </div>          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/40" />
              <span className="text-white/40">Dry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40" />
              <span className="text-white/40">Reefer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
              <span className="text-white/40">Vide</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4">Statistiques chargement</h2>
          <div className="space-y-4">
            {[
              { label: "TEU chargés", value: "2,450", color: "text-sky-400" },
              { label: "Capacité", value: "4,200 TEU", color: "text-white/80" },
              { label: "Taux remplissage", value: "58%", color: "text-sky-400" },
              { label: "Reefers", value: "340", color: "text-blue-400" },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02]">
                <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
