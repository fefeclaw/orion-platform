"use client";

import { motion } from "framer-motion";
import { FileText, Users, Plane, Download } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const MANIFESTS = [
  { flight: "HF-301", date: "04/04/2026", passengers: 124, cargo: "2.4T", status: "final" },
  { flight: "HF-405", date: "03/04/2026", passengers: 89, cargo: "1.8T", status: "final" },
  { flight: "SN-502", date: "03/04/2026", passengers: 156, cargo: "5.2T", status: "final" },
  { flight: "TU-712", date: "02/04/2026", passengers: 92, cargo: "3.1T", status: "draft" },
];

export default function AirManifestPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Manifeste PAX</h1>
            <p className="text-sm text-white/40">Passagers · Bagages · Cargo</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30 hover:bg-violet-500/30 transition">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-3">
          {MANIFESTS.map((mf, i) => (
            <div key={mf.flight} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Vol {mf.flight}</p>
                  <p className="text-xs text-white/40">{mf.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="w-3 h-3" />
                  {mf.passengers}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Plane className="w-3 h-3" />
                  {mf.cargo}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  mf.status === "final" ? "bg-green-500/10 text-green-400" :
                  "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {mf.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
