"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DECLARATIONS = [
  { id: "DGDDI-047821", type: "Export CI", status: "approved", train: "Volta Express BF-204", cargo: "Cacao 240T" },
  { id: "DGDDI-047822", type: "Import BF", status: "pending", train: "CI-BF-048", cargo: "Carburant 180T" },
];

export default function RailCustomsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Douanes CI / Burkina</h1>
            <p className="text-sm text-white/40">Déclarations tranfrontalières</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300">{DECLARATIONS.length} déclarations</span>
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
          <Shield className="w-4 h-4 text-red-400" />
          Déclarations en cours
        </h2>

        <div className="space-y-3">
          {DECLARATIONS.map((decl, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              decl.status === "approved" ? "bg-green-500/5 border-green-500/20" :
              "bg-orange-500/5 border-orange-500/20"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    decl.status === "approved" ? "bg-green-500/10" : "bg-orange-500/10"
                  }`}>
                    <CheckCircle2 className={`w-5 h-5 ${
                      decl.status === "approved" ? "text-green-400" : "text-orange-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{decl.id}</p>
                    <p className="text-xs text-white/40">{decl.train} · {decl.cargo}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${
                  decl.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
                }`}>
                  {decl.status === "approved" ? "Pré-dédouané" : "En attente"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
