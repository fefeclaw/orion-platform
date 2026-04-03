"use client";

import { motion } from "framer-motion";
import { Ship, Anchor, Navigation } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const FLEET = [
  { name: "ORION-1", type: "Porte-conteneurs", status: "at-sea", cargo: "85%", next: "Abidjan", eta: "06/04/2026" },
  { name: "ORION-2", type: "Vraquier", status: "berth", cargo: "Docking", next: "San-Pédro", eta: "07/04/2026" },
  { name: "ORION-3", type: "Pétrolier", status: "at-sea", cargo: "60%", next: "Abidjan", eta: "08/04/2026" },
];

export default function MaritimeFleetPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Flotte Navale</h1>
            <p className="text-sm text-white/40">Gestion des navires Orion</p>
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
          <Ship className="w-4 h-4 text-sky-400" />
          Navires en service
        </h2>

        <div className="space-y-3">
          {FLEET.map((vessel, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"
003e
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                    <Anchor className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{vessel.name}</p>
                    <p className="text-xs text-white/40">{vessel.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4"
003e
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Navigation className="w-3 h-3 text-white/30" />
                      <span className="text-sm text-white/60">{vessel.next}</span>
                    </div>
                    <p className="text-xs text-white/40">ETA {vessel.eta}</p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    vessel.status === "at-sea" ? "bg-sky-500/10 text-sky-400" : "bg-green-500/10 text-green-400"
                  }`}
003e
                    {vessel.status === "at-sea" ? "En mer" : "À quai"}
                  </div>
                </div>
              </div>              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Chargement</span>
                  <span>{vessel.cargo}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-400 rounded-full" 
                    style={{ width: vessel.cargo.replace('%', '') + '%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
