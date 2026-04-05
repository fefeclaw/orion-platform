"use client";

import { motion } from "framer-motion";
import { History, MapPin, Clock, Truck } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const HISTORY = [
  { id: "ORN-R-001", route: "Abidjan → Yamoussoukro", date: "04/04/2026", duration: "4h 30min", distance: "245 km" },
  { id: "ORN-R-042", route: "San-Pédro → Abidjan", date: "03/04/2026", duration: "6h 15min", distance: "380 km" },
  { id: "ORN-R-067", route: "Abidjan → Noé border", date: "03/04/2026", duration: "3h 45min", distance: "120 km" },
  { id: "ORN-R-089", route: "Grand-Bassam → Abidjan", date: "02/04/2026", duration: "1h 20min", distance: "45 km" },
];

export default function RoadHistoryPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Historique</h1>
            <p className="text-sm text-white/40">Trajets effectués</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition">
            Exporter CSV
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
          {HISTORY.map((trip, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{trip.id}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trip.route}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">{trip.date}</p>
                <p className="text-xs text-emerald-400 flex items-center justify-end gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {trip.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
