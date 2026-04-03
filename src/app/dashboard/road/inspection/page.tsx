"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const INSPECTIONS = [
  { id: "INS-2026-089", vehicle: "AB-1234-AB", type: "Contrôle technique", status: "passed", date: "02/04/2026" },
  { id: "INS-2026-090", vehicle: "AB-5678-CD", type: "Contrôle technique", status: "failed", date: "01/04/2026" },
];

export default function RoadInspectionPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Inspections</h1>
            <p className="text-sm text-white/40">Contrôles techniques véhicules</p>
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
          <Shield className="w-4 h-4 text-emerald-400" />
          Contrôles techniques
        </h2>

        <div className="space-y-3">
          {INSPECTIONS.map((inspection, i) => (
            <div key={i} className={`p-4 rounded-xl border ${
              inspection.status === "passed" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    inspection.status === "passed" ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    <CheckCircle2 className={`w-5 h-5 ${
                      inspection.status === "passed" ? "text-green-400" : "text-red-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{inspection.vehicle}</p>
                    <p className="text-xs text-white/40">{inspection.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    inspection.status === "passed" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {inspection.status === "passed" ? "Validé" : "Non conforme"}
                  </div>
                  <p className="text-xs text-white/40 mt-1">{inspection.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
