"use client";

import { motion } from "framer-motion";
import { Users, Phone, Calendar, Award } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DRIVERS = [
  { name: "Amadou K.", phone: "+225 07 XX XX XX", license: "C+D", experience: "8 ans", rating: 4.8 },
  { name: "Jean B.", phone: "+225 05 XX XX XX", license: "C+E", experience: "12 ans", rating: 4.9 },
  { name: "Fatou S.", phone: "+225 01 XX XX XX", license: "C", experience: "5 ans", rating: 4.6 },
];

export default function RoadDriversPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Chauffeurs</h1>
            <p className="text-sm text-white/40">Gestion des conducteurs</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">{DRIVERS.length} conducteurs</span>
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
          <Users className="w-4 h-4 text-emerald-400" />
          Liste des conducteurs
        </h2>

        <div className="space-y-3">
          {DRIVERS.map((driver, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-emerald-400">
                    {driver.name.split(" ")[0][0]}{driver.name.split(" ")[1][0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{driver.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-white/30" />
                    <span className="text-xs text-white/40">{driver.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Award className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-white/60">{driver.rating}</span>
                  </div>
                  <p className="text-xs text-white/40">{driver.experience}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                  {driver.license}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
