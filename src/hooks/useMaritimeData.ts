"use client";

import { useState, useEffect, useCallback } from "react";

export interface Vessel {
  id: string;
  name: string;
  imo: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Mock data fallback ─────────────────────────────────────────────────────
const MOCK_VESSELS: Vessel[] = [
  {
    id: "v1", name: "MSC Abidjan", imo: "9876543", type: "Porte-conteneurs",
    flag: "CI", lat: 5.35, lng: -4.02, speed: 0, heading: 0,
    status: "berth", destination: "Port Autonome Abidjan",
    eta: "À quai", lastUpdate: "14:32",
  },
  {
    id: "v2", name: "CMA CGM Lagos", imo: "9123456", type: "Porte-conteneurs",
    flag: "FR", lat: 4.5, lng: -1.8, speed: 14.2, heading: 320,
    status: "transit", destination: "Rotterdam",
    eta: "2026-04-02 08:00", lastUpdate: "14:28",
  },
  {
    id: "v3", name: "Pacific Carrier", imo: "9654321", type: "Vraquier",
    flag: "LR", lat: 3.2, lng: -5.1, speed: 11.8, heading: 45,
    status: "transit", destination: "Dakar",
    eta: "2026-03-25 16:00", lastUpdate: "14:20",
  },
  {
    id: "v4", name: "West Africa Star", imo: "9741258", type: "Pétrolier",
    flag: "GH", lat: 6.1, lng: -2.3, speed: 0, heading: 180,
    status: "alert", destination: "Port Tema",
    eta: "En retard — +28h", lastUpdate: "13:55",
  },
  {
    id: "v5", name: "Côte d'Ivoire Express", imo: "9852369", type: "Ro-Ro",
    flag: "CI", lat: 5.0, lng: -3.5, speed: 16.4, heading: 270,
    status: "transit", destination: "Abidjan",
    eta: "2026-03-24 06:00", lastUpdate: "14:15",
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
    id: String(v.id ?? idx),
    name: String(v.name ?? `Navire ${idx + 1}`),
    imo: String(v.imo ?? "—"),
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

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMaritimeData(refreshInterval = 30_000) {
  const [vessels, setVessels] = useState<Vessel[]>(MOCK_VESSELS);
  const [kpi, setKpi] = useState<KpiSummary>(MOCK_KPI);
  const [alerts, setAlerts] = useState<MaritimeAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const [vesselsRes, kpiRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/vessels`,     { cache: "no-store" }),
        fetch(`${API_URL}/api/kpis/latest`, { cache: "no-store" }),
        fetch(`${API_URL}/api/alerts`,      { cache: "no-store" }),
      ]);

      if (vesselsRes.ok) {
        const data = await vesselsRes.json();
        const rawVessels: Record<string, unknown>[] = data.vessels ?? [];
        if (rawVessels.length > 0) setVessels(rawVessels.map(mapApiVessel));
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
        // backend returns { alerts: [...], count: N } or direct array
        const rawAlerts: Record<string, unknown>[] =
          Array.isArray(ad) ? ad : (ad.alerts ?? []);
        if (rawAlerts.length > 0)
          setAlerts(rawAlerts.slice(0, 10).map(mapApiAlert));
      }
    } catch {
      // silently keep mock data if API unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  return { vessels, kpi, alerts, loading, isLive, refetch: fetchData };
}
