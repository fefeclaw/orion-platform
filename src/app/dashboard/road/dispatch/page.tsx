"use client";

import { motion } from "framer-motion";
import { Truck, Radio, MapPin, Phone, User } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DISPATCH = [
  { truck: "ORN-R-001", driver: "Amadou K.", status: "active", location: "Grand-Bassam (+45km)", last_contact: "2 min" },
  { truck: "ORN-R-042", driver: "Fatou S.", status: "active", location: "Yamoussoukro (+180km)", last_contact: "5 min" },
  { truck: "ORN-R-067", driver: "Ibrahim D.", status: "pause", location: "Divo arrêt", last_contact: "15 min" },
  { truck: "ORN-R-089", driver: "Aïcha M.", status: "return", location: "En retour Abidjan", last_contact: "8 min" },
];

export default function RoadDispatchPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Dispatch Central</h1>
            <p className="text-sm text-white/40">Suivi flotte en temps réel</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-300">3 actifs</span>
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
          {DISPATCH.map((dispatch, i) => (
            <div key={dispatch.truck} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dispatch.status === "active" ? "bg-emerald-500/10" :
                  dispatch.status === "pause" ? "bg-yellow-500/10" :
                  "bg-sky-500/10"
                }`}>
                  <Truck className={`w-5 h-5 ${
                    dispatch.status === "active" ? "text-emerald-400" :
                    dispatch.status === "pause" ? "text-yellow-400" :
                    "text-sky-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{dispatch.truck}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <User className="w-3 h-3" /> {dispatch.driver}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 flex items-center justify-end gap-1">
                  <MapPin className="w-3 h-3" />
                  {dispatch.location}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3 text-white/30" />
                  <span className="text-xs text-white/40">{dispatch.last_contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
