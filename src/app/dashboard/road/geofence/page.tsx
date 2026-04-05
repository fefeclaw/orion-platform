"use client";

import { motion } from "framer-motion";
import { MapPin, Bell, Shield, CircleOff } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const GEOFENCES = [
  { id: "GF001", name: "Zone Port", type: "entry", radius: "2 km", alerts: true, vehicles: 12 },
  { id: "GF002", name: "Frontière Noé", type: "exit", radius: "500 m", alerts: true, vehicles: 3 },
  { id: "GF003", name: "Zone Livraison", type: "entry", radius: "1 km", alerts: false, vehicles: 8 },
  { id: "GF004", name: "Station Pesage", type: "entry", radius: "200 m", alerts: true, vehicles: 1 },
];

export default function RoadGeofencePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Géofencing</h1>
            <p className="text-sm text-white/40">Zones virtuelles & alertes</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition">
            + Nouvelle zone
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
          {GEOFENCES.map((zone, i) => (
            <div key={zone.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{zone.name}</p>
                  <p className="text-xs text-white/40">
                    {zone.type === "entry" ? "Entrée" : "Sortie"} · {zone.radius} · {zone.vehicles} véhicules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {zone.alerts ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-xs text-emerald-400">
                    <Bell className="w-3 h-3" /> Actif
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-white/40">
                    <CircleOff className="w-3 h-3" /> Inactif
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
