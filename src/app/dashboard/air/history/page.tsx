"use client";

import { motion } from "framer-motion";
import { History, Plane, ArrowRightLeft, Calendar } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const FLIGHT_HISTORY = [
  { flight: "HF-301", route: "CDG → ABJ", date: "04/04/2026", status: "completed", cargo: "124T" },
  { flight: "HF-405", route: "LOS → ABJ", date: "03/04/2026", status: "completed", cargo: "89T" },
  { flight: "SN-502", route: "BRU → ABJ", date: "03/04/2026", status: "completed", cargo: "156T" },
  { flight: "TU-712", route: "TUN → ABJ", date: "02/04/2026", status: "diverted", cargo: "67T" },
];

export default function AirHistoryPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Historique Vols</h1>
            <p className="text-sm text-white/40">FHB · Archives 30 jours</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30 hover:bg-violet-500/30 transition">
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
          {FLIGHT_HISTORY.map((flight, i) => (
            <div key={flight.flight} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{flight.flight}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3" /> {flight.route}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3" /> {flight.date}
                </p>
                <p className={`text-xs mt-1 ${flight.status === "completed" ? "text-green-400" : "text-orange-400"}`}>
                  {flight.cargo} · {flight.status === "completed" ? "Complet" : "Dérouté"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
