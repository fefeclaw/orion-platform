"use client";

import { motion } from "framer-motion";
import { FileText, User, Clock, Shield } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const AUDIT_LOGS = [
  { action: "B/L généré", user: "Jean Koffi", resource: "BL-2026-001", time: "2 min", type: "document" },
  { action: "Connexion", user: "Marie Bamba", resource: "Dashboard", time: "15 min", type: "auth" },
  { action: "Modification ETA", user: "Admin System", resource: "ORION-03", time: "1h", type: "vessel" },
  { action: "Certificat origine", user: "Paul Kouassi", resource: "CO-2026-042", time: "3h", type: "document" },
];

export default function MaritimeAuditPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Audit Logs</h1>
            <p className="text-sm text-white/40">Traçabilité des actions</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-sky-300">Sécurisé</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-4">
          {AUDIT_LOGS.map((log, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                log.type === "document" ? "bg-blue-500/10" :
                log.type === "auth" ? "bg-green-500/10" :
                "bg-orange-500/10"
              }`}>
                {log.type === "document" && <FileText className="w-5 h-5 text-blue-400" />}
                {log.type === "auth" && <User className="w-5 h-5 text-green-400" />}
                {log.type === "vessel" && <Clock className="w-5 h-5 text-orange-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80">{log.action}</p>
                <p className="text-xs text-white/40">{log.resource} · par {log.user}</p>
              </div>
              <span className="text-xs text-white/30">{log.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
