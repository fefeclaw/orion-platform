"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { BarChart2, Layers, FileText, TrendingUp, TrendingDown, Ship } from "lucide-react";
import { useMaritimeData } from "@/hooks/useMaritimeData";
import { useWeather } from "@/hooks/useWeather";
import { generateBL, generateManifest, generatePhytoCert, generateOriginCert } from "@/lib/pdf-service";
import type { ManifestVessel } from "@/lib/pdf-service";
import { MaritimeHeader } from "@/components/maritime/MaritimeHeader";
import { VesselsTable } from "@/components/maritime/VesselsTable";
import { AlertsPanel } from "@/components/maritime/AlertsPanel";
import { AnalyticsPanel } from "@/components/maritime/AnalyticsPanel";
import { ForecastCard } from "@/components/maritime/ForecastCard";
import { WeatherWidget } from "@/components/maritime/WeatherWidget";
import { CrisisPanel, useCrisisTrigger } from "@/components/maritime/CrisisPanel";
import ArrivalsPanel from "@/components/maritime/ArrivalsPanel";
import BLFormPanel from "@/components/maritime/BLFormPanel";
import WeatherRadarOverlay from "@/components/ui/WeatherRadarOverlay";
import RainParticles from "@/components/ui/RainParticles";
import type { Vessel } from "@/hooks/useMaritimeData";

// Import dynamique — MapLibre GL est browser-only (WebGL)
const MaritimeMapGL = dynamic(
  () => import("@/components/maritime/MaritimeMapGL").then(m => ({ default: m.MaritimeMapGL })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center"
        style={{ background: "#030712" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
          <p className="text-xs text-white/30 font-mono tracking-widest">CHARGEMENT CARTE</p>
        </div>
      </div>
    ),
  }
);

// ─── Taux de change FCFA ───────────────────────────────────────────────────────
const BASE_RATES = { EUR: 655.96, USD: 610.40, GBP: 780.25 };
type CurrencyKey = keyof typeof BASE_RATES;

function useFCFARates() {
  const [rates, setRates] = useState(BASE_RATES);
  const [prev, setPrev]   = useState(BASE_RATES);

  useEffect(() => {
    const id = setInterval(() => {
      setPrev(r => ({ ...r }));
      setRates(r => ({
        EUR: +(r.EUR * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
        USD: +(r.USD * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
        GBP: +(r.GBP * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
      }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return { rates, prev };
}

// ─── ETA prédictif météo ──────────────────────────────────────────────────────
function computeAdjustedETA(eta: string, weatherType?: string): { adjusted: string; factor: number } {
  const factor =
    weatherType === "THUNDERSTORM" || weatherType === "HEAVY_RAIN" ? 1.2 :
    weatherType === "FOG" ? 1.1 : 1.0;

  if (factor === 1.0) return { adjusted: eta, factor };

  const base = new Date(eta);
  if (isNaN(base.getTime())) return { adjusted: eta, factor };

  const now = Date.now();
  const remaining = base.getTime() - now;
  if (remaining <= 0) return { adjusted: eta, factor };

  const adjusted = new Date(now + remaining * factor);
  return {
    adjusted: adjusted.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    factor,
  };
}

export default function MaritimeDashboard() {
  const { vessels, kpi, alerts, loading, isLive, refetch } = useMaritimeData(30_000);
  const { weather } = useWeather(5.32, -4.02); // Port Autonome d'Abidjan
  const [showAlerts, setShowAlerts]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [is3D, setIs3D]                 = useState(false);
  const [radarActive, setRadarActive]   = useState(false);
  const [rainActive,  setRainActive]    = useState(false);
  const [showCrisis,    setShowCrisis]    = useState(false);
  const [showArrivals,  setShowArrivals]  = useState(true);
  const [showBLForm,    setShowBLForm]    = useState(false);
  const crisis = useCrisisTrigger(kpi, alerts);
  const { rates, prev } = useFCFARates();

  const handleGenerateBL = useCallback((vessel: Vessel) => {
    const blNumber = `BL-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
    generateBL({
      blNumber,
      shipName:    vessel.name,
      imo:         vessel.imo,
      flag:        (vessel as Vessel & { flag?: string }).flag ?? "CI",
      origin:      "Port Autonome d'Abidjan",
      destination: vessel.destination,
      eta:         vessel.eta,
      cargo:       (vessel as Vessel & { cargo?: string }).cargo ?? "Marchandises générales",
      tonnage:     (vessel as Vessel & { tonnage?: number }).tonnage ?? 25000,
      shipper:     "ORION Shipping Abidjan",
      consignee:   "Destinataire " + vessel.destination,
      issueDate:   new Date().toLocaleDateString("fr-FR"),
    });
  }, []);

  // ── Manifeste cargo — tous les navires ─────────────────────────────────────
  const handleGenerateManifest = useCallback(() => {
    const manifestVessels: ManifestVessel[] = vessels.map(v => ({
      name:        v.name,
      imo:         v.imo,
      flag:        (v as Vessel & { flag?: string }).flag ?? "CI",
      type:        (v as Vessel & { cargoType?: string }).cargoType === "container" ? "Porte-conteneurs" :
                   (v as Vessel & { cargoType?: string }).cargoType === "tanker"    ? "Pétrolier"        :
                   (v as Vessel & { cargoType?: string }).cargoType === "bulk"      ? "Vraquier"         :
                   (v as Vessel & { cargoType?: string }).cargoType === "roro"      ? "Roulier (RoRo)"   : "Cargo général",
      status:      v.status === "berth" ? "À quai" : v.status === "alert" ? "En alerte" : "En transit",
      destination: v.destination,
      eta:         v.eta,
      cargo:       (v as Vessel & { cargo?: string }).cargo,
      tonnage:     (v as Vessel & { tonnage?: number }).tonnage,
      speed:       v.speed,
    }));
    generateManifest({
      manifestNumber: `MAN-ABJ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 900) + 100}`,
      port:           "Port Autonome d'Abidjan (CIABJ)",
      dateEmission:   new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      vessels:        manifestVessels,
      generatedBy:    "ORION Autonomous Logistics Platform",
    });
  }, [vessels]);

  // ── Certificat phytosanitaire (par navire) ───────────────────────────────
  const handleGeneratePhyto = useCallback((vessel: Vessel) => {
    generatePhytoCert({
      certNumber:       `PHYTO-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      shipName:         vessel.name,
      imo:              vessel.imo,
      paysOrigine:      "Côte d'Ivoire",
      paysDestination:  vessel.destination,
      exportateur:      "ORION Agri Export CI — Zone Industrielle de Vridi, Abidjan",
      importateur:      "Importateur " + vessel.destination,
      marchandise:      (vessel as Vessel & { cargo?: string }).cargo ?? "Cacao en fèves / Produits végétaux",
      poidsNet:         (vessel as Vessel & { tonnage?: number }).tonnage ?? 500,
      nombreColis:      Math.floor(((vessel as Vessel & { tonnage?: number }).tonnage ?? 500) / 25),
      traitement:       "Fumigation au Phosphure d'Hydrogène (Phosphine) — 3g/m³ / 72h",
      dateTraitement:   new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
      dateInspection:   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
      dateEmission:     new Date().toLocaleDateString("fr-FR"),
      inspecteur:       "Inspecteur MINADER — Port d'Abidjan",
      numero_phyto:     `ANADER-${Math.floor(Math.random() * 90000) + 10000}`,
    });
  }, []);

  // ── Certificat d'origine (par navire) ───────────────────────────────────
  const handleGenerateOriginCert = useCallback((vessel: Vessel) => {
    generateOriginCert({
      certNumber:          `CO-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      shipName:            vessel.name,
      imo:                 vessel.imo,
      exportateur:         "ORION Trading CI",
      exportateurAdresse:  "Zone Industrielle de Vridi, 01 BP 1234 Abidjan 01, Côte d'Ivoire",
      importateur:         "Importateur " + vessel.destination,
      importateurAdresse:  vessel.destination,
      paysOrigine:         "Côte d'Ivoire",
      paysDestination:     vessel.destination,
      marchandise:         (vessel as Vessel & { cargo?: string }).cargo ?? "Marchandises diverses",
      hsCode:              "1801.00.00",   // cacao brut par défaut
      poidsNet:            (vessel as Vessel & { tonnage?: number }).tonnage ?? 25000,
      poidsBrut:           Math.round(((vessel as Vessel & { tonnage?: number }).tonnage ?? 25000) * 1.08),
      valeurFOB:           ((vessel as Vessel & { tonnage?: number }).tonnage ?? 25000) * 1850,  // FCFA/T approximatif
      nombreColis:         Math.floor(((vessel as Vessel & { tonnage?: number }).tonnage ?? 25000) / 25),
      marques:             `ORN-${vessel.imo.slice(-4)}`,
      dateEmission:        new Date().toLocaleDateString("fr-FR"),
      chambreCommerce:     "Chambre de Commerce et d'Industrie de Côte d'Ivoire (CCI-CI)",
    });
  }, []);

  const criticalAlerts = alerts.filter(a => a.type === "critical" || a.type === "warning");

  const handleVesselClick = useCallback((vessel: Vessel) => {
    setSelectedVessel(vessel);
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* ── Header ── */}
      <MaritimeHeader
        kpi={kpi}
        alertCount={criticalAlerts.length}
        loading={loading}
        isLive={isLive}
        showAlerts={showAlerts}
        onToggleAlerts={() => setShowAlerts(v => !v)}
        onRefresh={refetch}
      />

      {/* ── Map + overlays ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* MapLibre GL — WebGL 2D/3D */}
        <MaritimeMapGL
          vessels={vessels}
          is3D={is3D}
          onVesselClick={handleVesselClick}
        />

        {/* Overlays météo — sous la carte */}
        {weather && radarActive && <WeatherRadarOverlay weather={weather} visible={radarActive} />}
        {weather && rainActive && <RainParticles type={weather.type} intensity="heavy" />}

        {/* Crisis Panel */}
        <CrisisPanel
          kpi={kpi}
          alerts={alerts}
          isOpen={showCrisis}
          onClose={() => setShowCrisis(false)}
        />

        {/* ── Toolbar top-left ── */}
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
          {/* Crisis Mode button — visible si trigger actif */}
          {crisis.triggered && (
            <button
              onClick={() => setShowCrisis(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all animate-pulse"
              style={{
                background: showCrisis
                  ? (crisis.severity === "RED" ? "rgba(239,68,68,0.22)" : "rgba(245,158,11,0.18)")
                  : (crisis.severity === "RED" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.10)"),
                border: `1px solid ${crisis.severity === "RED" ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.4)"}`,
                color: crisis.severity === "RED" ? "#EF4444" : "#F59E0B",
                boxShadow: crisis.severity === "RED" ? "0 0 12px rgba(239,68,68,0.25)" : "0 0 12px rgba(245,158,11,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              ⚡ Crisis Mode
            </button>
          )}
          {/* Analytiques */}
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showAnalytics ? "rgba(14,165,233,0.18)" : "rgba(6,14,26,0.85)",
              border: `1px solid ${showAnalytics ? "rgba(14,165,233,0.4)" : "rgba(14,165,233,0.14)"}`,
              color: showAnalytics ? "#22d3ee" : "rgba(255,255,255,0.42)",
              backdropFilter: "blur(10px)",
            }}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytiques
          </button>

          {/* Manifeste cargo — tous les navires */}
          <button
            onClick={handleGenerateManifest}
            disabled={vessels.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            style={{
              background: "rgba(0,82,136,0.12)",
              border: "1px solid rgba(0,82,136,0.35)",
              color: "#60a5fa",
              backdropFilter: "blur(10px)",
            }}
            title={`Générer le manifeste cargo (${vessels.length} navires)`}
          >
            <FileText className="h-3.5 w-3.5" />
            Manifeste ({vessels.length})
          </button>

          {/* Weather Widget */}
          <WeatherWidget
            radarActive={radarActive}
            rainActive={rainActive}
            onRadarToggle={setRadarActive}
            onRainToggle={setRainActive}
          />
        </div>

        {/* ── Toggle 2D / 3D — top-right ── */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          {/* Arrivals toggle */}
          <button
            onClick={() => setShowArrivals(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showArrivals ? "rgba(212,175,55,0.15)" : "rgba(6,14,26,0.88)",
              border: `1px solid ${showArrivals ? "rgba(212,175,55,0.4)" : "rgba(14,165,233,0.16)"}`,
              color: showArrivals ? "#F59E0B" : "rgba(255,255,255,0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Ship className="h-3.5 w-3.5" />
            {vessels.filter(v => v.approachIn24h).length > 0 && (
              <span style={{
                background: "#F59E0B",
                color: "#030712",
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "0.05rem 0.3rem",
                borderRadius: "9999px",
              }}>
                {vessels.filter(v => v.approachIn24h).length}
              </span>
            )}
          </button>

          {/* 2D/3D toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{
              background: "rgba(6,14,26,0.88)",
              border: "1px solid rgba(14,165,233,0.16)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Layers className="h-3.5 w-3.5 ml-2.5 text-white/30" />
            <button
              onClick={() => setIs3D(false)}
              className="px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: !is3D ? "rgba(14,165,233,0.22)" : "transparent",
                color: !is3D ? "#22d3ee" : "rgba(255,255,255,0.35)",
                borderRight: "1px solid rgba(14,165,233,0.12)",
              }}
            >
              2D
            </button>
            <button
              onClick={() => setIs3D(true)}
              className="px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: is3D ? "rgba(14,165,233,0.22)" : "transparent",
                color: is3D ? "#22d3ee" : "rgba(255,255,255,0.35)",
              }}
            >
              3D
            </button>
          </div>
        </div>

        {/* ── ArrivalsPanel — right side (masqué si B/L form ouvert) ── */}
        {showArrivals && !showBLForm && (
          <div className="absolute right-4 top-16 z-20" style={{ width: "240px" }}>
            <ArrivalsPanel
              vessels={vessels}
              onSelectVessel={setSelectedVessel}
            />
          </div>
        )}

        {/* ── BL Form Panel ── */}
        <AnimatePresence>
          {showBLForm && (
            <BLFormPanel
              vessel={selectedVessel}
              onClose={() => setShowBLForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Panels flottants */}
        <AlertsPanel
          alerts={alerts}
          isOpen={showAlerts}
          onClose={() => setShowAlerts(false)}
          isLive={isLive}
        />
        <AnalyticsPanel
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />

        {/* Forecast Model */}
        <ForecastCard kpi={kpi} alertCount={criticalAlerts.length} />

        {/* Vessel detail card */}
        {selectedVessel && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-4 z-30 px-5 py-3 rounded-xl shadow-2xl"
            style={{
              background: "rgba(6,14,26,0.96)",
              border: "1px solid rgba(14,165,233,0.25)",
              backdropFilter: "blur(12px)",
              minWidth: "280px",
            }}
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-white/90">{selectedVessel.name}</p>
                <p className="text-[11px] text-white/30 font-mono mt-0.5">
                  IMO {selectedVessel.imo} · {selectedVessel.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-white/30 hover:text-white/70 transition-colors text-xs shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-white/30">Vitesse</p>
                <p className="text-sm font-mono text-sky-400">{selectedVessel.speed} kn</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Destination</p>
                <p className="text-sm text-white/75 truncate">{selectedVessel.destination}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">ETA</p>
                <p className="text-sm font-mono text-white/60 truncate">{selectedVessel.eta}</p>
              </div>
            </div>
            {/* ETA ajusté météo */}
            {(() => {
              const { adjusted, factor } = computeAdjustedETA(selectedVessel.eta, weather?.type);
              if (factor === 1.0) return (
                <p className="text-[10px] mt-1.5" style={{ color: "#10B981" }}>✓ ETA nominal — conditions clémentes</p>
              );
              return (
                <p className="text-[10px] mt-1.5 font-semibold" style={{ color: factor >= 1.2 ? "#EF4444" : "#F97316" }}>
                  ⚠ ETA ajusté météo : {adjusted} (+{Math.round((factor - 1) * 100)}%)
                </p>
              );
            })()}
            {/* Boutons documents */}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleGenerateBL(selectedVessel)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(212,175,55,0.4)", color: "#F59E0B", background: "rgba(212,175,55,0.08)" }}
              >
                <FileText className="h-3 w-3" /> B/L Rapide
              </button>
              <button
                onClick={() => setShowBLForm(v => !v)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(212,175,55,0.5)", color: "#F59E0B", background: "rgba(212,175,55,0.14)" }}
              >
                <FileText className="h-3 w-3" /> B/L Complet
              </button>
              <button
                onClick={() => handleGeneratePhyto(selectedVessel)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(34,139,34,0.4)", color: "#4ade80", background: "rgba(34,139,34,0.08)" }}
                title="Certificat phytosanitaire (produits végétaux)"
              >
                <FileText className="h-3 w-3" /> Phyto
              </button>
              <button
                onClick={() => handleGenerateOriginCert(selectedVessel)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(185,28,28,0.4)", color: "#fb923c", background: "rgba(185,28,28,0.08)" }}
                title="Certificat d'origine (Chambre de Commerce)"
              >
                <FileText className="h-3 w-3" /> Origine
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    selectedVessel.status === "berth" ? "#10B981" :
                    selectedVessel.status === "alert" ? "#EF4444" : "#0EA5E9",
                }}
              />
              <span className="text-[11px] text-white/40">
                {selectedVessel.status === "berth" ? "À quai" :
                 selectedVessel.status === "alert" ? "En alerte" : "En transit"}
              </span>
              <span className="text-[11px] text-white/25 ml-auto font-mono">
                {selectedVessel.lat.toFixed(4)}°, {selectedVessel.lng.toFixed(4)}°
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Widget taux de change FCFA ── */}
      <div
        className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(6,14,26,0.90)",
          border: "1px solid rgba(14,165,233,0.14)",
          backdropFilter: "blur(10px)",
          minWidth: "160px",
        }}
      >
        <p className="text-[9px] text-white/30 font-mono tracking-widest mb-1.5">TAUX DE CHANGE FCFA</p>
        {(["EUR", "USD", "GBP"] as CurrencyKey[]).map(cur => {
          const up = rates[cur] >= prev[cur];
          return (
            <div key={cur} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-[10px] text-white/50 font-mono w-7">1 {cur}</span>
              <span className="text-[10px] font-mono font-semibold text-white/80">
                {rates[cur].toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              </span>
              {up
                ? <TrendingUp  className="h-2.5 w-2.5 shrink-0" style={{ color: "#10B981" }} />
                : <TrendingDown className="h-2.5 w-2.5 shrink-0" style={{ color: "#EF4444" }} />
              }
            </div>
          );
        })}
      </div>

      {/* ── Vessels table drawer ── */}
      <VesselsTable
        vessels={vessels}
        isExpanded={tableExpanded}
        onToggleExpand={() => setTableExpanded(v => !v)}
        onVesselSelect={handleVesselClick}
      />
    </div>
  );
}
