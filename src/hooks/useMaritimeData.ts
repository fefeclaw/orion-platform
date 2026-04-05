"use client";

import { useState, useEffect, useCallback } from "react";

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi?: string;
  type: string;
  flag: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: "transit" | "alert" | "berth";
  destination: string;
  eta: string;
  lastUpdate: string;
  // Champs enrichis AIS
  cargo?: string;
  tonnage?: number;
  cargoType?: "container" | "bulk" | "tanker" | "roro" | "general";
  approachIn24h?: boolean;  // vrai si ETA Abidjan < 24h
  etaPrevious?: string;     // ETA précédent (détection changement > 2h)
  etaChanged?: boolean;     // vrai si ETA a bougé de plus de 2h
}

export interface KpiSummary {
  activeVessels: number;
  atBerth: number;
  inTransit: number;
  congestionIndex: number;
}

export interface MaritimeAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  vessel?: string;
  timestamp: string;
}

const API_URL              = process.env.NEXT_PUBLIC_API_URL ?? "";
const AIS_API_KEY          = process.env.NEXT_PUBLIC_MARINETRAFFIC_API_KEY ?? "";
const VESSELTRACKER_KEY    = process.env.NEXT_PUBLIC_VESSELTRACKER_API_KEY ?? "";

// Centre : Port Autonome d'Abidjan
const ABJ_LAT = 5.35;
const ABJ_LON = -4.00;

// ─── Helpers AIS ──────────────────────────────────────────────────────────────

/** Distance approximative en nm entre deux points (formule haversine simplifiée) */
function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.1; // nm
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Détermine si un navire est en approche d'Abidjan dans les 24h */
function isApproachIn24h(vessel: Partial<Vessel>): boolean {
  if (!vessel.eta || vessel.destination?.toLowerCase().includes("abidjan") === false) return false;
  try {
    const etaMs = new Date(vessel.eta).getTime();
    const nowMs  = Date.now();
    return etaMs > nowMs && etaMs - nowMs < 24 * 3_600_000;
  } catch { return false; }
}

/** Détermine si l'ETA a changé de plus de 2h par rapport au précédent */
function hasEtaChanged2h(newEta: string, prevEta?: string): boolean {
  if (!prevEta) return false;
  try {
    const diff = Math.abs(new Date(newEta).getTime() - new Date(prevEta).getTime());
    return diff > 2 * 3_600_000;
  } catch { return false; }
}

/** Déduit le type de cargo depuis le type de navire */
function toCargoType(type: string): Vessel["cargoType"] {
  const t = type.toLowerCase();
  if (t.includes("conteneur") || t.includes("container")) return "container";
  if (t.includes("vraquier") || t.includes("bulk"))        return "bulk";
  if (t.includes("pétrolier") || t.includes("tanker"))     return "tanker";
  if (t.includes("ro-ro") || t.includes("roro"))           return "roro";
  return "general";
}

// ─── Mock data enrichi — navires réalistes zone Golfe de Guinée ───────────────
const tomorrow = (h: number) => {
  const d = new Date(Date.now() + h * 3_600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
};

const MOCK_VESSELS: Vessel[] = [
  {
    id: "v1", name: "MSC Abidjan", imo: "9876543", mmsi: "619000001",
    type: "Porte-conteneurs", flag: "CI", cargoType: "container",
    lat: 5.3083, lng: -3.9780, speed: 0, heading: 0,
    status: "berth", destination: "Port Autonome Abidjan",
    eta: "À quai", cargo: "Électronique + Textiles", tonnage: 52000,
    approachIn24h: false, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v2", name: "CMA CGM Ivory Coast", imo: "9123456", mmsi: "619000002",
    type: "Porte-conteneurs", flag: "FR", cargoType: "container",
    lat: 3.8, lng: -2.1, speed: 14.2, heading: 285,
    status: "transit", destination: "Abidjan",
    eta: tomorrow(8), cargo: "Marchandises générales", tonnage: 66000,
    approachIn24h: true, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v3", name: "Pacific Carrier", imo: "9654321", mmsi: "477000003",
    type: "Vraquier", flag: "LR", cargoType: "bulk",
    lat: 3.2, lng: -5.1, speed: 11.8, heading: 45,
    status: "transit", destination: "Dakar",
    eta: tomorrow(22), cargo: "Cacao 38 000T", tonnage: 38000,
    approachIn24h: false, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v4", name: "West Africa Star", imo: "9741258", mmsi: "566000004",
    type: "Pétrolier", flag: "GH", cargoType: "tanker",
    lat: 6.1, lng: -2.3, speed: 0, heading: 180,
    status: "alert", destination: "Port Tema",
    eta: "En retard — +28h", cargo: "Pétrole brut 85 000T", tonnage: 85000,
    approachIn24h: false, etaChanged: true, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v5", name: "Côte d'Ivoire Express", imo: "9852369", mmsi: "619000005",
    type: "Ro-Ro", flag: "CI", cargoType: "roro",
    lat: 5.0, lng: -3.5, speed: 16.4, heading: 270,
    status: "transit", destination: "Abidjan",
    eta: tomorrow(5), cargo: "Véhicules 420 unités", tonnage: 12000,
    approachIn24h: true, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v6", name: "Hapag-Lloyd Abidjan", imo: "9763214", mmsi: "211000006",
    type: "Porte-conteneurs", flag: "DE", cargoType: "container",
    lat: 4.1, lng: -3.7, speed: 13.5, heading: 310,
    status: "transit", destination: "Abidjan",
    eta: tomorrow(14), cargo: "Machines industrielles", tonnage: 71000,
    approachIn24h: true, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v7", name: "Boluda Abidjan", imo: "9512340", mmsi: "224000007",
    type: "Remorqueur", flag: "ES", cargoType: "general",
    lat: 5.28, lng: -3.98, speed: 4.0, heading: 90,
    status: "berth", destination: "Port Autonome Abidjan",
    eta: "À quai", cargo: "Service portuaire", tonnage: 800,
    approachIn24h: false, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "v8", name: "MSC Maria", imo: "9441892", mmsi: "229000008",
    type: "Porte-conteneurs", flag: "MT", cargoType: "container",
    lat: 2.5, lng: -1.0, speed: 15.2, heading: 295,
    status: "transit", destination: "Abidjan",
    eta: tomorrow(18), cargo: "Produits finis Asie", tonnage: 95000,
    approachIn24h: false, lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
];

const MOCK_KPI: KpiSummary = {
  activeVessels: 48,
  atBerth: 12,
  inTransit: 32,
  congestionIndex: 62,
};

const MOCK_ALERTS: MaritimeAlert[] = [
  {
    id: "a1", type: "critical",
    title: "Retard critique détecté",
    message: "West Africa Star — ETA dépassé de 28h. Recommandation : Plan B Buffer Storage activé.",
    vessel: "West Africa Star",
    timestamp: "14:32 UTC",
  },
  {
    id: "a2", type: "warning",
    title: "Congestion portuaire",
    message: "Taux d'occupation Port Abidjan à 62% — seuil ORANGE. Surveillance renforcée.",
    timestamp: "14:00 UTC",
  },
  {
    id: "a3", type: "info",
    title: "Navire attendu",
    message: "Côte d'Ivoire Express — arrivée prévue 2026-03-24 06:00.",
    vessel: "Côte d'Ivoire Express",
    timestamp: "13:45 UTC",
  },
  {
    id: "a4", type: "success",
    title: "Opportunité de coût détectée",
    message: "Fenêtre tarifaire favorable sur Rotterdam — économie estimée 12 400 €.",
    timestamp: "13:00 UTC",
  },
];

// ─── API mappers ─────────────────────────────────────────────────────────────
function mapApiVessel(v: Record<string, unknown>, idx: number): Vessel {
  const statusRaw = String(v.status ?? "").toLowerCase();
  let status: Vessel["status"] = "transit";
  if (statusRaw.includes("berth") || statusRaw.includes("quai") || statusRaw.includes("moored")) {
    status = "berth";
  } else if (statusRaw.includes("delay") || statusRaw.includes("alert") || statusRaw.includes("retard")) {
    status = "alert";
  }

  return {
    id: String(v.mmsi ?? v.id ?? idx),
    name: String(v.name ?? `Navire ${idx + 1}`),
    imo: String(v.imo ?? "—"),
    mmsi: v.mmsi ? String(v.mmsi) : undefined,
    type: String(v.vessel_type ?? v.type ?? "Inconnu"),
    flag: String(v.flag ?? "—"),
    lat: Number(v.lat ?? 5.3),
    lng: Number(v.lon ?? v.lng ?? -4.0),
    speed: Number(v.speed_kn ?? v.speed ?? 0),
    heading: Number(v.heading ?? 0),
    status,
    destination: String(v.destination ?? v.eta_port ?? "—"),
    eta: String(v.eta ?? "—"),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapApiAlert(a: Record<string, unknown>, idx: number): MaritimeAlert {
  const level = String(a.level ?? "").toUpperCase();
  let type: MaritimeAlert["type"] = "info";
  if (level === "RED") type = "critical";
  else if (level === "ORANGE") type = "warning";
  else if (level === "GREEN") type = "success";

  return {
    id: String(a.id ?? idx),
    type,
    title: String(a.alert_type ?? a.title ?? "Alerte"),
    message: String(a.message ?? ""),
    vessel: a.vessel ? String(a.vessel) : undefined,
    timestamp: a.created_at
      ? new Date(String(a.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
      : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
  };
}

// ─── AIS fetcher (MarineTraffic → VesselFinder → null) ───────────────────────

/** Tente MarineTraffic v3 (jsono) — retourne un tableau ou null */
async function fetchMarineTraffic(prevVessels: Vessel[]): Promise<Vessel[] | null> {
  if (!AIS_API_KEY) return null;
  try {
    const url =
      `https://services.marinetraffic.com/api/getvessel/v:3/${AIS_API_KEY}` +
      `/protocol:jsono/lat:${ABJ_LAT}/lon:${ABJ_LON}/radius:50/`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const raw: Record<string, unknown>[] = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((v, i) => {
      const mapped = mapApiVessel(v, i);
      const prev = prevVessels.find(p => p.mmsi === mapped.mmsi || p.imo === mapped.imo);
      return {
        ...mapped,
        cargoType: toCargoType(mapped.type),
        approachIn24h: isApproachIn24h(mapped),
        etaPrevious: prev?.eta !== mapped.eta ? prev?.eta : undefined,
        etaChanged: hasEtaChanged2h(mapped.eta, prev?.eta),
      };
    });
  } catch { return null; }
}

/** Tente VesselFinder (AIS stream) — retourne un tableau ou null */
async function fetchVesselFinder(prevVessels: Vessel[]): Promise<Vessel[] | null> {
  if (!VESSELTRACKER_KEY) return null;
  try {
    const url =
      `https://api.vesseltracker.com/api/v1/vessels/userpolygon` +
      `?userkey=${VESSELTRACKER_KEY}` +
      `&lat1=${ABJ_LAT - 0.45}&lon1=${ABJ_LON - 0.45}` +
      `&lat2=${ABJ_LAT + 0.45}&lon2=${ABJ_LON + 0.45}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: Record<string, unknown>[] = data.vessels ?? data ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((v, i) => {
      const mapped = mapApiVessel(v, i);
      const prev = prevVessels.find(p => p.mmsi === mapped.mmsi);
      return {
        ...mapped,
        cargoType: toCargoType(mapped.type),
        approachIn24h: isApproachIn24h(mapped),
        etaPrevious: prev?.eta !== mapped.eta ? prev?.eta : undefined,
        etaChanged: hasEtaChanged2h(mapped.eta, prev?.eta),
      };
    });
  } catch { return null; }
}

/** Enrichit le mock avec les champs approachIn24h / etaChanged */
function enrichMock(): Vessel[] {
  return MOCK_VESSELS.map(v => ({
    ...v,
    approachIn24h: isApproachIn24h(v),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMaritimeData(refreshInterval = 60_000) {
  const [vessels, setVessels] = useState<Vessel[]>(enrichMock());
  const [kpi, setKpi] = useState<KpiSummary>(MOCK_KPI);
  const [alerts, setAlerts] = useState<MaritimeAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ── 1. Tente AIS réel (MarineTraffic → VesselFinder) ──────────────────
      const currentVessels = vessels;
      const aisVessels =
        (await fetchMarineTraffic(currentVessels)) ??
        (await fetchVesselFinder(currentVessels));

      if (aisVessels && aisVessels.length > 0) {
        setVessels(aisVessels);
        setIsLive(true);
        // Compute KPI from live data
        setKpi({
          activeVessels:   aisVessels.length,
          atBerth:         aisVessels.filter(v => v.status === "berth").length,
          inTransit:       aisVessels.filter(v => v.status === "transit").length,
          congestionIndex: Math.min(100, Math.round(
            (aisVessels.filter(v => v.status === "berth").length / Math.max(1, aisVessels.length)) * 100
          )),
        });
        // Generate alerts from ETA changes
        const etaAlerts: MaritimeAlert[] = aisVessels
          .filter(v => v.etaChanged)
          .map((v, i) => ({
            id: `eta-${v.id}`,
            type: "warning" as const,
            title: "Changement ETA détecté",
            message: `${v.name} — ETA modifié de plus de 2h (${v.etaPrevious} → ${v.eta})`,
            vessel: v.name,
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
          }));
        if (etaAlerts.length > 0) setAlerts(prev => [...etaAlerts, ...prev.slice(0, 8)]);
        return;
      }

      // ── 2. Fallback : API ORION backend ───────────────────────────────────
      if (API_URL) {
        const [vesselsRes, kpiRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/vessels`,     { cache: "no-store" }),
          fetch(`${API_URL}/api/kpis/latest`, { cache: "no-store" }),
          fetch(`${API_URL}/api/alerts`,      { cache: "no-store" }),
        ]);

        if (vesselsRes.ok) {
          const data = await vesselsRes.json();
          const rawVessels: Record<string, unknown>[] = data.vessels ?? [];
          if (rawVessels.length > 0) {
            setVessels(rawVessels.map(mapApiVessel));
            setIsLive(true);
          }
        }

        if (kpiRes.ok) {
          const kd = await kpiRes.json();
          const meta = kd.congestion_metadata ?? {};
          setKpi({
            activeVessels:   Number(kd.total    ?? 0),
            atBerth:         Number(kd.at_berth ?? 0),
            inTransit:       Number(kd.in_transit ?? 0),
            congestionIndex: Math.round(Number(meta.index_pct ?? 0)),
          });
          setIsLive(true);
        }

        if (alertsRes.ok) {
          const ad = await alertsRes.json();
          const rawAlerts: Record<string, unknown>[] =
            Array.isArray(ad) ? ad : (ad.alerts ?? []);
          if (rawAlerts.length > 0)
            setAlerts(rawAlerts.slice(0, 10).map(mapApiAlert));
        }
        return;
      }
    } catch {
      // silently keep mock data if all APIs unreachable
    } finally {
      setLoading(false);
    }

    // ── 3. Fallback final : mock enrichi ──────────────────────────────────────
    setVessels(enrichMock());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  return { vessels, kpi, alerts, loading, isLive, refetch: fetchData };
}
