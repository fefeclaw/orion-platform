"use client";

import { motion } from "framer-motion";
import { Clock, AlertCircle, Plane, CheckCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const CUTOFFS = [
  { flight: "HF-301", departure: "08:30", cutoff_doc: "06:30", cutoff_cargo: "07:00", status: "closed" },
  { flight: "HF-405", departure: "14:45", cutoff_doc: "12:45", cutoff_cargo: "13:15", status: "warning" },
  { flight: "SN-502", departure: "18:20", cutoff_doc: "16:20", cutoff_cargo: "16:50", status: "open" },
  { flight: "TU-712", departure: "22:15", cutoff_doc: "20:15", cutoff_cargo: "20:45", status: "open" },
];

export default function AirCutoffPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Cut-off Times</h1>
            <p className="text-sm text-white/40">Limites acceptation fret · FHB</p>
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
          {CUTOFFS.map((c, i) => (
            <div key={c.flight} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  c.status === "open" ? "bg-green-500/10" :
                  c.status === "warning" ? "bg-orange-500/10" :
                  "bg-red-500/10"
                }`}>
                  {c.status === "open" && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {c.status === "warning" && <Clock className="w-5 h-5 text-orange-400" />}
                  {c.status === "closed" && <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{c.flight}</p>
                  <p className="text-xs text-white/40">Départ: {c.departure}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-3 py-2 rounded bg-white/5">
                  <p className="text-xs text-white/40">Documents</p>
                  <p className={`text-sm ${
                    c.status === "closed" ? "text-red-400" : "text-white/60"
                  }`}>{c.cutoff_doc}</p>
                </div>
                <div className="text-center px-3 py-2 rounded bg-white/5">
                  <p className="text-xs text-white/40">Fret</p>
                  <p className={`text-sm ${
                    c.status === "closed" ? "text-red-400" :
                    c.status === "warning" ? "text-orange-400" :
                    "text-white/60"
                  }`}>{c.cutoff_cargo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
