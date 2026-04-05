"use client";

import { motion } from "framer-motion";
import { Users, UserCircle, Shield, Mail } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const TEAM = [
  { name: "Koffi Jean", role: "Admin", email: "jean@orion.ci", status: "online" },
  { name: "Bamba Marie", role: "Opérateur", email: "marie@orion.ci", status: "online" },
  { name: "Kouassi Paul", role: "Document", email: "paul@orion.ci", status: "offline" },
  { name: "Diarra Aminata", role: "Agent", email: "aminata@orion.ci", status: "online" },
];

export default function MaritimeTeamPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Équipe Maritime</h1>
            <p className="text-sm text-white/40">Gestion des accès</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 text-sm border border-sky-500/30 hover:bg-sky-500/30 transition">
            + Inviter
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
          {TEAM.map((member, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{member.name}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-white/50">
                  <Shield className="w-3 h-3" /> {member.role}
                </span>
                <span className={`w-2 h-2 rounded-full ${member.status === "online" ? "bg-green-400" : "bg-gray-400"}`} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
