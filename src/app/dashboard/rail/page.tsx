"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Train, MapPin, Clock, Package,
  Gauge, AlertTriangle, FileText, Bell, ArrowRight, Stamp,
  AlertCircle, CheckCircle2, XCircle, Activity, Zap,
} from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";
import { useRailData } from "@/hooks/useRailData";
import type { Train as TrainData, StationStatus, RailAlert } from "@/hooks/useRailData";

// ─── Types locaux ──────────────────────────────────────────────────────────────

type CustomsDecl = {
  id: string;
  trainId: string;
  trainName: string;
  regime: "CI" | "BF";
  status: "pre-approved" | "pending" | "blocked";
  cargo: string;
  weight: string;
  declarationRef: string;
  borderPost: string;
  eta: string;
  lastAction: string;
};

// ─── Constantes statiques (hissées hors composant — rendering-hoist-jsx) ──────

const FALLBACK_ASSETS = [
  { id: "T001", name: "Train CI-BF-047",   lat: 7.69,  lng: -5.04, status: "active"  as const, info: "72 km/h · Bouaké → Koudougou" },
  { id: "T002", name: "Train CI-BF-048",   lat: 9.45,  lng: -3.80, status: "active"  as const, info: "65 km/h · Ferkessédougou → Ouaga" },
  { id: "T003", name: "Train BKO-001",     lat: 12.36, lng: -1.52, status: "delayed" as const, info: "En gare Ouagadougou · Retard +3h" },
  { id: "T004", name: "Train CI-004",      lat: 6.20,  lng: -4.80, status: "active"  as const, info: "55 km/h · Dimbokro → Yamoussoukro" },
  { id: "T005", name: "Locomotive SIT-22", lat: 5.35,  lng: -3.99, status: "stopped" as const, info: "Maintenance préventive · Gare Abidjan" },
  { id: "T006", name: "Train Mali-012",    lat: 11.20, lng: -4.20, status: "active"  as const, info: "48 km/h · Sikasso → Bamako" },
];

const STATUS_COLORS: Record<TrainData["status"], string> = {
  active:  "#10B981",
  delayed: "#EF4444",
  stopped: "#F59E0B",
};

const TYPE_LABELS: Record<TrainData["type"], string> = {
  freight: "Fret", mixed: "Mixte", maintenance: "Maintenance",
};

const STATION_COLORS: Record<StationStatus["status"], { bg: string; border: string; text: string; label: string }> = {
  normal:    { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10B981", label: "Normal" },
  congested: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#F59E0B", label: "Congestion" },
  closed:    { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  text: "#EF4444", label: "Fermée" },
};

const ALERT_COLORS: Record<RailAlert["type"], { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)",  text: "#EF4444", icon: "🔴" },
  warning:  { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", text: "#F59E0B", icon: "🟠" },
  info:     { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.20)", text: "#38bdf8", icon: "🔵" },
  success:  { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.20)", text: "#10B981", icon: "🟢" },
};

// Déclarations douanières mock CI/BF
const MOCK_CUSTOMS: CustomsDecl[] = [
  {
    id: "dc1",
    trainId: "t2",
    trainName: "Volta Express BF-204",
    regime: "BF",
    status: "pre-approved",
    cargo: "Cacao 240T",
    weight: "240 000 kg",
    declarationRef: "DGDDI-BF-2026-047821",
    borderPost: "Frontière Hérémakoye",
    eta: "29 mars 14:30",
    lastAction: "Pré-autorisation accordée — 28 mars 06:00",
  },
  {
    id: "dc2",
    trainId: "t4",
    trainName: "Ferk Liaison CI-412",
    regime: "CI",
    status: "blocked",
    cargo: "Anacarde 195T",
    weight: "195 000 kg",
    declarationRef: "DGD-CI-2026-039174",
    borderPost: "Poste Ouangolodougou",
    eta: "Retard — voie bloquée",
    lastAction: "Blocage technique signalé — 28 mars 07:48",
  },
  {
    id: "dc3",
    trainId: "t3",
    trainName: "Savane Fret CI-307",
    regime: "CI",
    status: "pending",
    cargo: "Coton 310T",
    weight: "310 000 kg",
    declarationRef: "DGD-CI-2026-039201",
    borderPost: "En transit interne",
    eta: "28 mars 18:00",
    lastAction: "Documents transmis DGD — en attente validation",
  },
  {
    id: "dc4",
    trainId: "t5",
    trainName: "Harmattan BF-518",
    regime: "BF",
    status: "pre-approved",
    cargo: "Marchandises diverses 155T",
    weight: "155 000 kg",
    declarationRef: "DGDDI-BF-2026-047903",
    borderPost: "Frontière Niangoloko",
    eta: "28 mars 22:15",
    lastAction: "Pré-autorisation accordée — 28 mars 05:30",
  },
];

const CUSTOMS_STATUS_CFG = {
  "pre-approved": { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", text: "#10B981", label: "Pré-approuvé" },
  "pending":      { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", text: "#F59E0B", label: "En attente" },
  "blocked":      { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)",  text: "#EF4444", label: "Bloqué" },
} as const;

// ─── Utilitaires ───────────────────────────────────────────────────────────────

function formatEta(eta: string): string {
  if (!eta || eta === "—") return "—";
  try {
    const d = new Date(eta);
    if (isNaN(d.getTime())) return eta;
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return eta; }
}

function formatDelay(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `+${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `+${m}min`;
}

/**
 * Génère un Blob HTML de LV (Lettre de Voiture) et l'ouvre dans un nouvel onglet.
 * Utilise Blob + URL.createObjectURL pour éviter document.write (XSS).
 */
function generateLvPdf(train: TrainData): void {
  const statusLabel =
    train.status === "active"  ? "En transit" :
    train.status === "delayed" ? "En retard"  : "Immobilisé";

  const delayStr    = train.delay > 0 ? `Retard : ${formatDelay(train.delay)}` : "À l'heure";
  const now         = new Date().toLocaleString("fr-FR");
  const refSuffix   = Date.now().toString().slice(-6);
  const badgeClass  = `badge-${train.status}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>LV — ${train.name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;color:#111}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #D4AF37;padding-bottom:16px;margin-bottom:24px}
    .header-left h1{font-size:22px;font-weight:800;color:#1a1a2e}
    .header-left p{font-size:11px;color:#666;margin-top:2px}
    .header-right{text-align:right}
    .ref{font-size:13px;font-weight:700;color:#D4AF37}
    .date{font-size:10px;color:#999}
    .badge{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.05em}
    .badge-active{background:#d1fae5;color:#065f46}
    .badge-delayed{background:#fee2e2;color:#991b1b}
    .badge-stopped{background:#fef3c7;color:#92400e}
    .section{margin-bottom:20px}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .field label{font-size:10px;color:#999;display:block}
    .field value{font-size:13px;font-weight:600;color:#1a1a2e;display:block;margin-top:2px}
    .route-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px}
    .delay-box{background:#fff5f5;border:1px solid #fecaca;border-radius:6px;padding:12px;margin-top:12px}
    .delay-box p{font-size:12px;color:#991b1b;font-weight:600}
    .footer{margin-top:40px;border-top:1px solid #eee;padding-top:12px;display:flex;justify-content:space-between;font-size:9px;color:#bbb}
    .signature-box{border:1px dashed #ccc;height:60px;margin-top:8px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:10px}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>LETTRE DE VOITURE FERROVIAIRE</h1>
      <p>Corridor CI-BF &middot; Orion Logistics Platform</p>
      <div style="margin-top:8px"><span class="badge ${badgeClass}">${statusLabel}</span></div>
    </div>
    <div class="header-right">
      <div class="ref">LV-${train.id.toUpperCase()}-${refSuffix}</div>
      <div class="date">Généré le ${now}</div>
      <div style="margin-top:6px;font-size:11px;color:#666">${TYPE_LABELS[train.type].toUpperCase()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Identification du convoi</div>
    <div class="grid">
      <div class="field"><label>Désignation</label><value>${train.name}</value></div>
      <div class="field"><label>Identifiant</label><value>${train.id.toUpperCase()}</value></div>
      <div class="field"><label>Type de service</label><value>${TYPE_LABELS[train.type]}</value></div>
      <div class="field"><label>Vitesse actuelle</label><value>${train.speed > 0 ? `${train.speed} km/h` : "À l'arrêt"}</value></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itinéraire</div>
    <div class="route-box">
      <div class="grid">
        <div class="field"><label>Gare d'origine</label><value>${train.origin}</value></div>
        <div class="field"><label>Gare de destination</label><value>${train.destination}</value></div>
      </div>
      <div style="text-align:center;color:#D4AF37;font-size:20px;font-weight:700;margin:8px 0">↓</div>
      <div class="grid">
        <div class="field"><label>ETA prévu</label><value>${formatEta(train.eta)}</value></div>
        <div class="field"><label>Ponctualité</label><value>${delayStr}</value></div>
      </div>
      ${train.delay > 0
        ? `<div class="delay-box"><p>⚠ Retard constaté : ${formatDelay(train.delay)} — Impact cascade possible sur convois suivants</p></div>`
        : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cargaison</div>
    <div class="grid">
      <div class="field"><label>Description</label><value>${train.cargo}</value></div>
      <div class="field"><label>Dernière mise à jour</label><value>${train.lastUpdate}</value></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Signatures &amp; Validation</div>
    <div class="grid">
      <div><div style="font-size:10px;color:#999;margin-bottom:4px">Expéditeur</div><div class="signature-box">Signature</div></div>
      <div><div style="font-size:10px;color:#999;margin-bottom:4px">Transporteur SITARAIL</div><div class="signature-box">Tampon officiel</div></div>
    </div>
  </div>

  <div class="footer">
    <span>Orion Unified Logistics System</span>
    <span>Document non contractuel &middot; Valeur informationnelle</span>
    <span>Page 1/1</span>
  </div>

  <script>window.addEventListener("load",function(){window.print();});</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  // Libère la mémoire après ouverture
  if (win) {
    win.addEventListener("load", () => URL.revokeObjectURL(url));
  } else {
    // Fallback si popup bloquée : téléchargement direct
    const a = document.createElement("a");
    a.href     = url;
    a.download = `LV-${train.id}-${refSuffix}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// ─── Composant : Badge Congestion ──────────────────────────────────────────────
function CongestionBadge({ status, compact = false }: {
  status: StationStatus["status"];
  compact?: boolean;
}) {
  const cfg  = STATION_COLORS[status];
  const Icon = status === "congested" ? AlertCircle
             : status === "closed"    ? XCircle
             :                          CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {cfg.label}
    </span>
  );
}

// ─── Composant : Cascade Retards ───────────────────────────────────────────────
function DelayCascadePanel({ trains, alerts }: {
  trains: TrainData[];
  alerts: RailAlert[];
}) {
  const delayedTrains  = useMemo(() => trains.filter(t => t.status === "delayed"), [trains]);
  const cascadeAlerts  = useMemo(() => alerts.filter(a => a.type === "critical" || a.type === "warning"), [alerts]);

  if (delayedTrains.length === 0 && cascadeAlerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-4 right-4 z-20 rounded-xl overflow-hidden"
      style={{
        background:    "rgba(6,14,26,0.96)",
        border:        "1px solid rgba(239,68,68,0.25)",
        backdropFilter:"blur(16px)",
        maxHeight:     "160px",
      }}
    >
      {/* Header bande */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: "1px solid rgba(239,68,68,0.12)" }}
      >
        <Activity className="h-4 w-4 shrink-0" style={{ color: "#EF4444" }} />
        <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">
          Cascade Retards
        </span>
        <span
          className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-semibold"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}
        >
          {delayedTrains.length} retardé{delayedTrains.length > 1 ? "s" : ""}
        </span>
        {cascadeAlerts.length > 0 && (
          <span
            className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-semibold"
            style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.22)", color: "#F59E0B" }}
          >
            {cascadeAlerts.length} alerte{cascadeAlerts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Scroll horizontal : trains retardés en cascade */}
      <div className="overflow-x-auto">
        <div className="flex items-center min-w-max px-2 py-2 gap-1">
          {delayedTrains.map((train, idx) => (
            <div key={train.id} className="flex items-center gap-1">
              <div
                className="px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)" }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: STATUS_COLORS[train.status] }}
                  />
                  <span className="text-[11px] font-semibold text-white/80 whitespace-nowrap">{train.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: "#EF4444" }}>
                    {formatDelay(train.delay)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/35 whitespace-nowrap">
                  <span>{train.origin}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-white/20" />
                  <span>{train.destination}</span>
                </div>
              </div>
              {idx < delayedTrains.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(239,68,68,0.40)" }} />
              )}
            </div>
          ))}

          {/* Alertes cascade sur la droite */}
          {cascadeAlerts.length > 0 && (
            <div
              className="ml-3 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.14)" }}
            >
              {cascadeAlerts.slice(0, 2).map(a => {
                const ac = ALERT_COLORS[a.type];
                return (
                  <div key={a.id} className="flex items-start gap-1.5 mb-0.5 last:mb-0">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: ac.text }} />
                    <p className="text-[10px] text-white/50 leading-tight max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {a.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Composant : Panneau Douanes CI/BF ────────────────────────────────────────
function CustomsPanel({ open, onToggle, declarations }: {
  open: boolean;
  onToggle: () => void;
  declarations: CustomsDecl[];
}) {
  return (
    <div className="relative flex shrink-0" style={{ zIndex: 20 }}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="customs-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full overflow-hidden"
            style={{
              background:    "rgba(6,14,26,0.96)",
              borderLeft:    "1px solid rgba(212,175,55,0.14)",
              backdropFilter:"blur(16px)",
            }}
          >
            <div className="w-72 h-full flex flex-col">
              {/* Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid rgba(212,175,55,0.10)" }}
              >
                <Stamp className="h-4 w-4 shrink-0" style={{ color: "#D4AF37" }} />
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">
                  Douanes CI / BF
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {(["CI", "BF"] as const).map(r => {
                    const count = declarations.filter(d => d.regime === r).length;
                    return (
                      <span
                        key={r}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: r === "CI" ? "rgba(14,165,233,0.12)" : "rgba(212,175,55,0.12)",
                          border:     r === "CI" ? "1px solid rgba(14,165,233,0.25)" : "1px solid rgba(212,175,55,0.25)",
                          color:      r === "CI" ? "#38bdf8" : "#D4AF37",
                        }}
                      >
                        {r} ×{count}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Liste déclarations */}
              <div className="flex-1 overflow-y-auto">
                {declarations.map(decl => {
                  const sc = CUSTOMS_STATUS_CFG[decl.status];
                  return (
                    <div
                      key={decl.id}
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Train + régime */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: decl.regime === "CI" ? "rgba(14,165,233,0.10)" : "rgba(212,175,55,0.10)",
                              border:     decl.regime === "CI" ? "1px solid rgba(14,165,233,0.22)" : "1px solid rgba(212,175,55,0.22)",
                              color:      decl.regime === "CI" ? "#38bdf8" : "#D4AF37",
                            }}
                          >
                            {decl.regime}
                          </span>
                          <p className="text-[12px] font-semibold text-white/80 truncate">{decl.trainName}</p>
                        </div>
                        <span
                          className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                        >
                          {sc.label}
                        </span>
                      </div>

                      {/* Ref */}
                      <p className="text-[10px] font-mono mb-1.5" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {decl.declarationRef}
                      </p>

                      {/* Détails */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="h-3 w-3 text-white/25" />
                        <span className="text-[10px] text-white/50">{decl.cargo}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3 w-3 text-white/25" />
                        <span className="text-[10px] text-white/50 truncate">{decl.borderPost}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-white/25" />
                        <span className="text-[10px] text-white/40 truncate">{decl.eta}</span>
                      </div>

                      <p className="text-[9px] text-white/25 mt-2 leading-tight">{decl.lastAction}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle bouton gauche du panneau */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-10 rounded-l-lg hover:bg-white/10 transition-all"
        style={{
          left:       "-20px",
          background: "rgba(6,14,26,0.90)",
          border:     "1px solid rgba(212,175,55,0.18)",
          borderRight:"none",
          color:      "rgba(212,175,55,0.7)",
        }}
        title={open ? "Masquer" : "Déclarations douanières CI/BF"}
      >
        {open ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Composant : Panneau Gares ─────────────────────────────────────────────────
function StationsPanel({ stations, trains, open, onToggle }: {
  stations: StationStatus[];
  trains: TrainData[];
  open: boolean;
  onToggle: () => void;
}) {
  const dominoTrains = useMemo(() => trains.filter(t => t.delay > 30), [trains]);
  const hasDomino = dominoTrains.length > 0;

  return (
    <div className="relative flex shrink-0" style={{ zIndex: 20 }}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="stations-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full overflow-hidden"
            style={{
              background:    "rgba(6,14,26,0.96)",
              borderRight:   "1px solid rgba(248,113,113,0.12)",
              backdropFilter:"blur(16px)",
            }}
          >
            <div className="w-64 h-full flex flex-col">
              <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid rgba(248,113,113,0.10)" }}
              >
                <MapPin className="h-4 w-4 shrink-0" style={{ color: "#f87171" }} />
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Gares</span>
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)", color: "#f87171" }}
                >
                  {stations.length}
                </span>
              </div>

              {/* Banner cascade active */}
              {hasDomino && (
                <div className="flex items-center gap-1.5 px-4 py-2 shrink-0"
                  style={{ background: "rgba(249,115,22,0.08)", borderBottom: "1px solid rgba(249,115,22,0.15)" }}>
                  <Zap className="h-3 w-3 shrink-0 animate-pulse" style={{ color: "#F97316" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#F97316" }}>
                    Prédiction cascade active · {dominoTrains.length} train{dominoTrains.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {stations.map(s => {
                  const sc = STATION_COLORS[s.status];
                  return (
                    <div
                      key={s.id}
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Nom + badge congestion */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13px] font-semibold text-white/85 leading-tight">{s.name}</p>
                        <CongestionBadge status={s.status} compact />
                      </div>

                      {/* Barre occupation */}
                      {s.trainsExpected > 0 && (
                        <div className="mb-2">
                          <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width:      `${Math.min(100, (s.trainsPresent / Math.max(s.trainsExpected, 1)) * 100)}%`,
                                background: sc.text,
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[9px] text-white/25">Occupation</span>
                            <span className="text-[9px]" style={{ color: sc.text }}>
                              {s.trainsPresent}/{s.trainsExpected}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Train className="h-3 w-3 text-white/30" />
                          <span className="text-[11px] text-white/55">
                            <span className="text-white/80 font-semibold">{s.trainsPresent}</span>
                            {" "}présent{s.trainsPresent > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="text-[11px] text-white/40">
                          {s.trainsExpected} attendu{s.trainsExpected > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-white/25" />
                        <span className="text-[11px] text-white/40">
                          Départ : <span className="text-white/65">{s.nextDeparture}</span>
                        </span>
                      </div>
                      {/* Badges Effet Domino */}
                      {dominoTrains.filter(dt => dt.origin === s.name || dt.destination === s.name).map(dt => {
                        const impacted = Math.ceil(dt.delay / 15);
                        return (
                          <div key={dt.id} className="mt-2 flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse"
                              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.30)", color: "#F97316" }}>
                              <Zap className="h-2.5 w-2.5" />
                              Effet Domino · {impacted} train{impacted > 1 ? "s" : ""} impacté{impacted > 1 ? "s" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-10 rounded-r-lg hover:bg-white/10 transition-all"
        style={{
          right:      "-20px",
          background: "rgba(6,14,26,0.90)",
          border:     "1px solid rgba(248,113,113,0.18)",
          borderLeft: "none",
          color:      "rgba(248,113,113,0.7)",
        }}
        title={open ? "Masquer" : "Gares"}
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Composant : Détail Train ──────────────────────────────────────────────────
function TrainDetail({ train, onClose }: { train: TrainData; onClose: () => void }) {
  const col   = STATUS_COLORS[train.status];
  const label = train.status === "active"  ? "Actif"
              : train.status === "delayed" ? "En retard"
              :                              "Arrêté";

  // Déclaration douanière associée (recherche stable)
  const customs    = useMemo(() => MOCK_CUSTOMS.find(d => d.trainId === train.id), [train.id]);
  const csConfig   = customs ? CUSTOMS_STATUS_CFG[customs.status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute left-1/2 -translate-x-1/2 top-4 z-30 w-80 rounded-xl shadow-2xl overflow-hidden"
      style={{
        background:    "rgba(6,14,26,0.97)",
        border:        "1px solid rgba(248,113,113,0.25)",
        backdropFilter:"blur(16px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(248,113,113,0.10)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" }}
          >
            <Train className="h-4 w-4" style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">{train.name}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#f87171" }}>
              {TYPE_LABELS[train.type]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton LV PDF */}
          <button
            onClick={() => generateLvPdf(train)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{
              background: "rgba(212,175,55,0.10)",
              border:     "1px solid rgba(212,175,55,0.25)",
              color:      "#D4AF37",
            }}
            title="Générer Lettre de Voiture PDF"
          >
            <FileText className="h-3 w-3" />
            LV
          </button>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Statut + retard */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
          <span className="text-[12px] font-semibold" style={{ color: col }}>{label}</span>
          {train.delay > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 ml-1">
              <AlertTriangle className="h-3 w-3" />
              {formatDelay(train.delay)}
            </span>
          )}
        </div>

        {/* Route */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <div className="w-px h-5 bg-white/15" />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f87171" }} />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 ml-2">
            <p className="text-[10px] text-white/40">
              Origine · <span className="text-white/70 font-medium">{train.origin}</span>
            </p>
            <p className="text-[10px] text-white/40">
              Destination · <span className="text-white/70 font-medium">{train.destination}</span>
            </p>
          </div>
        </div>

        {/* Cargo + vitesse */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/40 uppercase">Cargo</span>
            </div>
            <p className="text-[11px] font-semibold text-white/75">{train.cargo}</p>
          </div>
          <div
            className="px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/40 uppercase">Vitesse</span>
            </div>
            <p className="text-[11px] font-semibold text-white/75">
              {train.speed > 0 ? `${train.speed} km/h` : "À l'arrêt"}
            </p>
          </div>
          <div
            className="col-span-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/40 uppercase">ETA</span>
            </div>
            <p className="text-[12px] font-semibold text-white/80">{formatEta(train.eta)}</p>
          </div>
        </div>

        {/* Déclaration douanière liée au train */}
        {customs && csConfig && (
          <div
            className="px-3 py-2 rounded-lg"
            style={{ background: csConfig.bg, border: `1px solid ${csConfig.border}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Stamp className="h-3 w-3" style={{ color: csConfig.text }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: csConfig.text }}
                >
                  Douane {customs.regime}
                </span>
              </div>
              <span className="text-[9px] font-medium" style={{ color: csConfig.text }}>
                {csConfig.label}
              </span>
            </div>
            <p className="text-[9px] font-mono text-white/35">{customs.declarationRef}</p>
            <p className="text-[9px] text-white/30 mt-0.5 truncate">{customs.borderPost}</p>
            <p className="text-[9px] text-white/25 mt-1 leading-tight">{customs.lastAction}</p>
          </div>
        )}

        <p className="text-[10px] text-white/25 text-right font-mono">Mis à jour {train.lastUpdate}</p>
      </div>
    </motion.div>
  );
}

// ─── Composant : Panneau Alertes flottant ─────────────────────────────────────
function AlertsFloating({ alerts, open, onClose }: {
  alerts: RailAlert[];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-14 right-4 z-30 w-72 max-h-80 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background:    "rgba(6,14,26,0.97)",
            border:        "1px solid rgba(239,68,68,0.22)",
            backdropFilter:"blur(16px)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid rgba(239,68,68,0.10)" }}
          >
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
              Alertes Rail
            </span>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto max-h-64">
            {alerts.length === 0 ? (
              <p className="px-4 py-4 text-[11px] text-white/30 text-center">Aucune alerte active</p>
            ) : (
              alerts.map(a => {
                const ac = ALERT_COLORS[a.type];
                return (
                  <div
                    key={a.id}
                    className="px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] shrink-0 mt-0.5">{ac.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-tight" style={{ color: ac.text }}>
                          {a.title}
                        </p>
                        <p className="text-[10px] text-white/45 mt-0.5 leading-tight">{a.message}</p>
                        {a.train && (
                          <p className="text-[9px] text-white/25 mt-1 font-mono">{a.train}</p>
                        )}
                        <p className="text-[9px] text-white/20 mt-0.5">{a.timestamp}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function RailDeck() {
  const { trains, stations, kpi, alerts, loading, isLive, refetch } = useRailData();

  const [stationsOpen,  setStationsOpen]  = useState(true);
  const [customsOpen,   setCustomsOpen]   = useState(false);
  const [showAlerts,    setShowAlerts]    = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<TrainData | null>(null);

  // Dérivé stable — évite recalcul inline (rerender-derived-state-no-effect)
  const criticalAlertCount = useMemo(
    () => alerts.filter(a => a.type === "critical" || a.type === "warning").length,
    [alerts],
  );

  // Config DeckLayout mémorisée (évite prop non-sérialisable inline)
  const deckConfig: DeckConfig = useMemo(() => ({
    type:          "rail",
    name:          "RAIL DECK",
    color:         "#f87171",
    forecastLabel: "Corridor ABJ-OUA · 4h",
    kpis: trains.length > 0
      ? [
          { label: "Trains Actifs",  value: kpi.activeTrains, color: "#f87171" },
          { label: "À l'heure",      value: kpi.onTime,        color: "#10B981" },
          { label: "En Retard",      value: kpi.delayed,       color: "#EF4444" },
          { label: "Tonnage / Jour", value: kpi.totalTonnage,  color: "#f87171" },
        ]
      : [
          { label: "Wagons Actifs",  value: 126,       color: "#f87171" },
          { label: "Tonnage / Jour", value: "1 840 T", color: "#f87171" },
          { label: "Corridors",      value: 3,          color: "#f87171" },
          { label: "Délai Moyen",    value: "2.4j", sub: "ABJ→OUA", color: "#f87171" },
        ],
    assets: trains.length > 0
      ? trains.map(t => ({
          id:     t.id,
          name:   t.name,
          lat:    t.lat,
          lng:    t.lng,
          status: t.status,
          info:   [t.speed > 0 ? `${t.speed} km/h` : "À l'arrêt", `${t.origin} → ${t.destination}`].join(" · "),
        }))
      : FALLBACK_ASSETS,
  }), [trains, kpi]);

  // Stable callback — évite recréation à chaque render (rerender-functional-setstate)
  const handleAssetClick = useCallback((asset: { id: string }) => {
    const match = trains.find(t => t.id === asset.id) ?? null;
    setSelectedTrain(prev => (prev?.id === match?.id ? null : match));
  }, [trains]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#030712" }}>

      {/* ── Panneau gauche : Gares + badges congestion ── */}
      <StationsPanel
        stations={stations}
        trains={trains}
        open={stationsOpen}
        onToggle={() => setStationsOpen(v => !v)}
      />

      {/* ── Zone centrale : Carte + overlays ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Détail train sélectionné (LV + déclaration douane inline) */}
        <AnimatePresence>
          {selectedTrain && (
            <TrainDetail
              train={selectedTrain}
              onClose={() => setSelectedTrain(null)}
            />
          )}
        </AnimatePresence>

        {/* Badge API LIVE */}
        {isLive && (
          <div
            className="absolute top-16 left-4 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
            style={{
              background: "rgba(16,185,129,0.08)",
              border:     "1px solid rgba(16,185,129,0.20)",
              color:      "#10B981",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API LIVE
            <button
              onClick={refetch}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              title="Rafraîchir"
            >
              ↻
            </button>
          </div>
        )}

        {/* Bouton Alertes top-right */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowAlerts(v => !v)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background:   showAlerts ? "rgba(239,68,68,0.16)" : "rgba(6,14,26,0.88)",
              border:       `1px solid ${showAlerts ? "rgba(239,68,68,0.40)" : "rgba(239,68,68,0.18)"}`,
              color:        showAlerts ? "#EF4444" : "rgba(255,255,255,0.42)",
              backdropFilter:"blur(10px)",
            }}
          >
            <Bell className="h-3.5 w-3.5" />
            Alertes
            {criticalAlertCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: "#EF4444", color: "#fff" }}
              >
                {criticalAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* Panneau alertes flottant */}
        <AlertsFloating
          alerts={alerts}
          open={showAlerts}
          onClose={() => setShowAlerts(false)}
        />

        {/* Bande cascade retards — bas de l'écran */}
        <DelayCascadePanel trains={trains} alerts={alerts} />

        {/* Carte principale */}
        <DeckLayout
          config={deckConfig}
          isLoading={loading}
        />
      </div>

      {/* ── Panneau droit : Douanes CI/BF ── */}
      <CustomsPanel
        open={customsOpen}
        onToggle={() => setCustomsOpen(v => !v)}
        declarations={MOCK_CUSTOMS}
      />
    </div>
  );
}
