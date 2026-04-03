"use client";

import { motion } from "framer-motion";
import { Flag, Clock, Package, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const BORDER_POSTS = [
  { name: "Frontière CI-BF", location: "Hérémakoye", status: "open", waitTime: "45min", cargo: "Cacao, minerais" },
  { name: "Frontière BF-CI", location: "Kolokani", status: "open", waitTime: "30min", cargo: "Carburant, ciment" },
  { name: "Contrôle Nord", location: "Ferkessédougou", status: "alert", waitTime: "2h", cargo: "Transit Mali" },
];

export default function RailBordersPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Postes Frontières</h1>
            <p className="text-sm text-white/40">Contrôles douaniers CI-BF</p>
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
            <Flag className="w-4 h-4 text-red-400" />
            Points de contrôle
          </h2>

          <div className="space-y-3">
            {BORDER_POSTS.map((post, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      post.status === "open" ? "bg-green-500/10" : "bg-orange-500/10"
                    }`}>
                      <Flag className={`w-5 h-5 ${
                        post.status === "open" ? "text-green-400" : "text-orange-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{post.name}</p>
                      <p className="text-xs text-white/40">{post.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className={`text-sm ${
                        post.waitTime.includes("h") ? "text-orange-400" : "text-white/60"
                      }`}>{post.waitTime}</span>
                    </div>
                    <p className="text-xs text-white/40">{post.cargo}</p>
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
          <h2 className="text-sm font-medium text-white/60 mb-4">Statistiques</h2>
          <div className="space-y-4">
            {[
              { label: "Trains contrôlés/jour", value: "24" },
              { label: "Temps moyen", value: "42min" },
              { label: "Déclarations OK", value: "98%", color: "text-green-400" },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02]">
                <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                <p className={`text-xl font-semibold ${stat.color || "text-white/80"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
