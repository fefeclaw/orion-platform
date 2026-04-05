"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Package, Phone, CheckCircle2,
  AlertTriangle, Truck, Anchor, Train, Plane, X,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDate, formatTime } from "@/lib/locale";

// ─── Mock shipment data per pillar ──────────────────────────────────────────

const MOCK_SHIPMENTS: Record<string, {
  id: string;
  description: string;
  origin: string;
  destination: string;
  eta: Date;
  status: "transit" | "customs" | "delivered" | "delayed";
  progress: number;
  lastUpdate: Date;
}[]> = {
  maritime: [
    {
      id: "ORION-4821",
      description: "Cacao — 40 T · Conteneur TCKU3456789",
      origin: "Rotterdam (NL)",
      destination: "Port Autonome d'Abidjan",
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "transit",
      progress: 72,
      lastUpdate: new Date(Date.now() - 35 * 60 * 1000),
    },
    {
      id: "ORION-3312",
      description: "Équipements industriels · 12 TEU",
      origin: "Shanghai (CN)",
      destination: "Port Autonome d'Abidjan",
      eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "transit",
      progress: 38,
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ],
  road: [
    {
      id: "TRK-2847",
      description: "Produits vivriers · 22 T",
      origin: "Abidjan",
      destination: "Ouagadougou (BF)",
      eta: new Date(Date.now() + 18 * 60 * 60 * 1000),
      status: "transit",
      progress: 55,
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
    },
  ],
  rail: [
    {
      id: "RAIL-1284",
      description: "Clinker ciment · 80 T · Wagon SIT-22",
      origin: "Abidjan Terminal",
      destination: "Bamako (ML)",
      eta: new Date(Date.now() + 10 * 60 * 60 * 1000),
      status: "customs",
      progress: 61,
      lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
    },
  ],
  air: [
    {
      id: "AIR-0482",
      description: "Pièces détachées · 800 kg",
      origin: "Paris CDG (FR)",
      destination: "FHB Abidjan",
      eta: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: "transit",
      progress: 85,
      lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
    },
  ],
};

const STATUS_CONFIG = {
  transit:   { label: "En transit",   color: "#22d3ee", icon: "🚀" },
  customs:   { label: "En douane",    color: "#F59E0B", icon: "📋" },
  delivered: { label: "Livré",        color: "#4ade80", icon: "✅" },
  delayed:   { label: "Retard",       color: "#fb923c", icon: "⚠️" },
};

const PILLAR_ICONS: Record<string, React.ElementType> = {
  maritime: Anchor,
  road:     Truck,
  rail:     Train,
  air:      Plane,
};

const PILLAR_COLORS: Record<string, string> = {
  maritime: "#22d3ee",
  road:     "#4ade80",
  rail:     "#fb923c",
  air:      "#818cf8",
};

// ─── Assistance Modal ────────────────────────────────────────────────────────

function AssistanceModal({ onClose, shipmentId }: { onClose: () => void; shipmentId: string }) {
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");

  const handleSend = () => {
    if (!note.trim()) return;
    setSent(true);
    setTimeout(onClose, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "rgba(8,16,30,0.97)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(212,175,55,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <Phone size={15} style={{ color: "#F59E0B" }} />
            <span className="text-sm font-semibold text-white">Demander assistance</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={16} />
          </button>
        </div>

        {!sent ? (
          <div className="p-5 space-y-4">
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
            >
              <span className="text-white/40">Expédition · </span>
              <span className="text-[#F59E0B] font-mono font-medium">{shipmentId}</span>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-2 tracking-wide uppercase">
                Décrivez votre demande
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Je souhaite modifier le destinataire, mettre en attente, obtenir un document…"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm text-white/80 resize-none outline-none placeholder:text-white/20"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={!note.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-black transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #F59E0B, #b8960c)" }}
            >
              Envoyer au support Orion
            </motion.button>

            <p className="text-center text-xs text-white/25">
              Réponse garantie sous 2h · 24/7 via WhatsApp & Email
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 flex flex-col items-center gap-3 text-center"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.12)" }}
            >
              <CheckCircle2 size={24} style={{ color: "#4ade80" }} />
            </div>
            <p className="text-white font-medium">Demande envoyée</p>
            <p className="text-xs text-white/40">Un expert Orion vous contacte dans les 2 heures.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Shipment Card ───────────────────────────────────────────────────────────

function ShipmentCard({
  shipment,
  color,
  onAssist,
  lang,
}: {
  shipment: typeof MOCK_SHIPMENTS.maritime[0];
  color: string;
  onAssist: (id: string) => void;
  lang: string;
}) {
  const status = STATUS_CONFIG[shipment.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold" style={{ color }}>{shipment.id}</p>
          <p className="text-xs text-white/40 mt-0.5">{shipment.description}</p>
        </div>
        <span
          className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: `${status.color}14`,
            color: status.color,
            border: `1px solid ${status.color}30`,
          }}
        >
          {status.icon} {status.label}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-xs">
        <MapPin size={11} className="text-white/30 shrink-0" />
        <span className="text-white/40">{shipment.origin}</span>
        <span className="text-white/20 mx-1">→</span>
        <span className="text-white/60 font-medium">{shipment.destination}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/30 mb-1.5">
          <span>Progression</span>
          <span style={{ color }}>{shipment.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${shipment.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
        </div>
      </div>

      {/* ETA + last update */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/40">
          <Clock size={11} />
          <span>ETA {formatDate(shipment.eta, lang as "fr")}</span>
          <span className="text-white/20">·</span>
          <span>{formatTime(shipment.eta, lang as "fr")}</span>
        </div>
        <span className="text-white/25">
          Màj {formatTime(shipment.lastUpdate, lang as "fr")}
        </span>
      </div>

      {/* Delayed warning */}
      {shipment.status === "delayed" && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <AlertTriangle size={12} style={{ color: "#fb923c" }} />
          <span style={{ color: "#fb923c" }}>
            Ajustement prédictif en cours — solution présentée sous 30 min.
          </span>
        </div>
      )}

      {/* Assistance CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onAssist(shipment.id)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.2)",
          color: "#F59E0B",
        }}
      >
        <Phone size={12} />
        Demander assistance
      </motion.button>
    </motion.div>
  );
}

// ─── Client Dashboard ────────────────────────────────────────────────────────

export default function ClientDashboard({ pillarId }: { pillarId: string }) {
  const t = useTranslation();
  const { lang } = useLanguage();
  const [assistShipment, setAssistShipment] = useState<string | null>(null);

  const PillarIcon = PILLAR_ICONS[pillarId] ?? Package;
  const color = PILLAR_COLORS[pillarId] ?? "#22d3ee";
  const shipments = MOCK_SHIPMENTS[pillarId] ?? [];

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-8"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <PillarIcon size={20} style={{ color }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide">
            {t(`pillar_${pillarId}` as "pillar_maritime")} — Suivi Expédition
          </h1>
          <p className="text-xs text-white/30 tracking-widest uppercase">
            Vue Client · Orion Concierge
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/30">{t("dash_live")}</span>
        </div>
      </motion.div>

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(56,189,248,0.04) 100%)",
          border: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <p className="text-sm text-white/70 leading-relaxed">
          Bienvenue sur votre espace expéditions.{" "}
          <span style={{ color: "#F59E0B" }}>Orion surveille vos cargaisons en temps réel</span>{" "}
          et vous alerte immédiatement en cas de changement.
        </p>
      </motion.div>

      {/* Shipment cards */}
      {shipments.length > 0 ? (
        <div className="space-y-4">
          {shipments.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            >
              <ShipmentCard
                shipment={s}
                color={color}
                onAssist={setAssistShipment}
                lang={lang}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-10 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <Package size={32} className="mx-auto mb-3 text-white/15" />
          <p className="text-white/40 text-sm">Aucune expédition active</p>
          <p className="text-white/20 text-xs mt-1">
            Vos cargaisons apparaîtront ici une fois enregistrées.
          </p>
        </motion.div>
      )}

      {/* Assistance Modal */}
      <AnimatePresence>
        {assistShipment && (
          <AssistanceModal
            shipmentId={assistShipment}
            onClose={() => setAssistShipment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
