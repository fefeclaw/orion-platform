"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const COMPLIANCE_ITEMS = [
  { category: "Douane CI", item: "Déclaration en douane", status: "compliant", due: "OK" },
  { category: "Douane CI", item: "BSC validé", status: "compliant", due: "OK" },
  { category: "Port", item: "Certificat phytosanitaire", status: "pending", due: "2 jours" },
  { category: "Maritime", item: "Certificat origine", status: "compliant", due: "OK" },
  { category: "Sécurité", item: "Inspection ISPS", status: "alert", due: "Urgent" },
  { category: "Environnement", item: "Certificat déchets", status: "compliant", due: "OK" },
];

export default function MaritimeCompliancePage() {
  const stats = {
    compliant: COMPLIANCE_ITEMS.filter(i => i.status === "compliant").length,
    pending: COMPLIANCE_ITEMS.filter(i => i.status === "pending").length,
    alert: COMPLIANCE_ITEMS.filter(i => i.status === "alert").length,
  };

  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Conformité & Douanes</h1>
            <p className="text-sm text-white/40">Obligations réglementaires</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">{stats.compliant} OK</span>
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">{stats.pending} Attente</span>
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">{stats.alert} Urgent</span>
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
          {COMPLIANCE_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status === "compliant" ? "bg-green-500/10" :
                  item.status === "pending" ? "bg-yellow-500/10" :
                  "bg-red-500/10"
                }`}>
                  {item.status === "compliant" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {item.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                  {item.status === "alert" && <AlertTriangle className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{item.item}</p>
                  <p className="text-xs text-white/40">{item.category}</p>
                </div>
              </div>
              <span className={`text-xs ${
                item.status === "compliant" ? "text-green-400" :
                item.status === "pending" ? "text-yellow-400" :
                "text-red-400"
              }`}>
                {item.due}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
