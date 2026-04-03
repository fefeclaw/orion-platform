"use client";

import { motion } from "framer-motion";
import { Clock, Calendar, Train, ArrowRight } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const SCHEDULES = [
  { train: "CI-BF-047", departure: "06:00", arrival: "14:30", frequency: "Quotidien", status: "on-time" },
  { train: "CI-BF-048", departure: "08:00", arrival: "16:45", frequency: "Quotidien", status: "delayed" },
  { train: "BKO-001", departure: "10:00", arrival: "22:00", frequency: "Lun-Mer-Ven", status: "on-time" },
  { train: "VOLTA-EXP", departure: "14:00", arrival: "06:00+", frequency: "Nocturne", status: "on-time" },
];

export default function RailSchedulePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Horaires & Fréquences</h1>
            <p className="text-sm text-white/40">Planning des circulations ferroviaires</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Calendar className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">Avril 2026</span>
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
            <Clock className="w-4 h-4 text-red-400" />
            Tableau des horaires
          </h2>

          <div className="space-y-3">
            {SCHEDULES.map((schedule, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Train className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{schedule.train}</p>
                    <p className="text-xs text-white/40">{schedule.frequency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/80">{schedule.departure}</p>
                    <p className="text-[10px] text-white/40">Départ</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/80">{schedule.arrival}</p>
                    <p className="text-[10px] text-white/40">Arrivée</p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs ${
                  schedule.status === "on-time" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                }`}>
                  {schedule.status === "on-time" ? "À l'heure" : "Retard +30min"}
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
          <h2 className="text-sm font-medium text-white/60 mb-4">Fréquences par ligne</h2>
          <div className="space-y-4">
            {[
              { line: "Abidjan-Ouaga", freq: "4/jour", color: "bg-green-400" },
              { line: "Abidjan-Bobo", freq: "2/jour", color: "bg-blue-400" },
              { line: "Ouaga-Bamako", freq: "1/jour", color: "bg-orange-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-white/60">{item.line}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-white/40">{item.freq}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
