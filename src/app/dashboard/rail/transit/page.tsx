"use client";

import { motion } from "framer-motion";
import { Route, ArrowRight, Clock } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const TRANSIT = [
  { id: "TR-001", origin: "Abidjan", destination: "Bamako", via: "Ouagadougou", status: "in-transit", eta: "48h" },
];

export default function RailTransitPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Transit</h1>
            <p className="text-sm text-white/40">Marchandises en transit</p>
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
          <Route className="w-4 h-4 text-red-400" />
          Opérations de transit
        </h2>

        <div className="space-y-3">
          {TRANSIT.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">{item.id}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                    <span>{item.origin}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{item.via}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{item.destination}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-white/60">
                    <Clock className="w-3 h-3" />
                    <span>ETA {item.eta}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
