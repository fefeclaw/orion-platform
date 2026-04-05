"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, TrendingUp, Truck } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const WAITING_TIMES = [
  { post: "Frontière Noé", type: "Douane", avg: "55 min", current: "1h 20min", trend: "up" },
  { post: "Frontière Elubo", type: "Douane", avg: "35 min", current: "25 min", trend: "down" },
  { post: "Pesage YK", type: "Pesage", avg: "12 min", current: "15 min", trend: "up" },
  { post: "Poste Adjamé", type: "Police", avg: "8 min", current: "5 min", trend: "down" },
];

export default function RoadWaitingPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Temps d'Attente</h1>
            
            <p className="text-sm text-white/40">Postes et frontières CEDEAO</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">Moyenne: 42 min</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-3">
          {WAITING_TIMES.map((post, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{post.post}</p>
                  <p className="text-xs text-white/40">{post.type}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm text-white/60">{post.current}</span>
                  {post.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-400 rotate-180" />
                  )}
                </div>
                <p className="text-xs text-white/40">Moyenne: {post.avg}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
