"use client";

import { useState, useEffect, useCallback } from "react";

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  type: "cargo" | "combi" | "charter";
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  heading: number;
  status: "active" | "delayed" | "ground_hold" | "diverted" | "landed";
  origin: string;
  destination: string;
  eta: string;
  delay: number;
  cargo: string;
  cutoffTime?: string;
  gate?: string;
  lastUpdate: string;
}

export interface AirKpi {
  activeFlights: number;
  landed: number;
  delayed: number;
  groundHolds: number;
  totalFreight: string;
}

export interface AirAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  flight?: string;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Mock data fallback ─────────────────────────────────────────────────────
const MOCK_FLIGHTS: Flight[] = [
  {
    id: "f1",
    flightNumber: "HF104",
    airline: "Air Côte d'Ivoire",
    type: "combi",
    lat: 5.35,
    lng: -3.93,
    altitude: 0,
    speed: 0,
    heading: 0,
    status: "active",
    origin: "Abidjan (DIAP)",
    destination: "Paris CDG",
    eta: "2026-03-28 22:10",
    delay: 0,
    cargo: "Fret général 18T",
    cutoffTime: "19:30",
    gate: "B7",
    lastUpdate: "09:05",
  },
  {
    id: "f2",
    flightNumber: "ET3721",
    airline: "Ethiopian Cargo",
    type: "cargo",
    lat: 8.42,
    lng: 5.60,
    altitude: 37000,
    speed: 482,
    heading: 65,
    status: "active",
    origin: "Abidjan (DIAP)",
    destination: "Addis-Abeba (ADD)",
    eta: "2026-03-28 15:45",
    delay: 0,
    cargo: "Cacao transformé 42T",
    lastUpdate: "09:02",
  },
  {
    id: "f3",
    flightNumber: "QR8811",
    airline: "Qatar Airways Cargo",
    type: "cargo",
    lat: 15.22,
    lng: 42.10,
    altitude: 39000,
    speed: 498,
    heading: 80,
    status: "ground_hold",
    origin: "Abidjan (DIAP)",
    destination: "Doha (DXB)",
    eta: "Retard — ground hold DXB (vents forts)",
    delay: 95,
    cargo: "Électronique 14T",
    lastUpdate: "08:55",
  },
  {
    id: "f4",
    flightNumber: "AT5602",
    airline: "Royal Air Maroc Cargo",
    type: "cargo",
    lat: 25.10,
    lng: 1.40,
    altitude: 35000,
    speed: 461,
    heading: 340,
    status: "active",
    origin: "Abidjan (DIAP)",
    destination: "Casablanca (CMN)",
    eta: "2026-03-28 13:30",
    delay: 0,
    cargo: "Fruits tropicaux 8T",
    lastUpdate: "08:50",
  },
  {
    id: "f5",
    flightNumber: "AH1043",
    airline: "Air Algérie",
    type: "combi",
    lat: 29.80,
    lng: 2.50,
    altitude: 36000,
    speed: 455,
    heading: 185,
    status: "diverted",
    origin: "Alger (ALG)",
    destination: "Abidjan (DIAP)",
    eta: "Dérouté — Bamako (BKO) météo adverse",
    delay: 180,
    cargo: "Pièces industrielles 6T",
    lastUpdate: "08:40",
  },
  {
    id: "f6",
    flightNumber: "LH8474",
    airline: "Lufthansa Cargo",
    type: "cargo",
    lat: 12.85,
    lng: -8.00,
    altitude: 38000,
    speed: 490,
    heading: 215,
    status: "active",
    origin: "Francfort (FRA)",
    destination: "Abidjan (DIAP)",
    eta: "2026-03-28 19:55",
    delay: 0,
    cargo: "Médicaments réfrigérés 4T",
    lastUpdate: "09:00",
  },
  {
    id: "f7",
    flightNumber: "TK6731",
    airline: "Turkish Cargo",
    type: "cargo",
    lat: 5.38,
    lng: -3.88,
    altitude: 0,
    speed: 0,
    heading: 0,
    status: "landed",
    origin: "Istanbul (IST)",
    destination: "Abidjan (DIAP)",
    eta: "Posé — 07:42",
    delay: 0,
    cargo: "Textile 22T",
    gate: "C3",
    lastUpdate: "07:42",
  },
];

const MOCK_KPI: AirKpi = {
  activeFlights: 32,
  landed: 8,
  delayed: 2,
  groundHolds: 1,
  totalFreight: "420 T",
};

const MOCK_ALERTS: AirAlert[] = [
  {
    id: "aa1",
    type: "critical",
    title: "Risque miss flight — HF104 cutoff 19h30",
    message:
      "Vol HF104 Air CI — départ 22h10 vers Paris CDG. Heure limite dépôt fret : 19h30. Il reste moins de 10h30 pour déposer les marchandises. Risque de miss flight si dépôt tardif.",
    flight: "HF104",
    timestamp: "09:05 UTC",
  },
  {
    id: "aa2",
    type: "critical",
    title: "Ground hold QR8811 — vents forts DXB",
    message:
      "Qatar Airways Cargo QR8811 en attente à Doha. Vents en rafales > 35 m/s sur DXB. Ground hold estimé : +95 min. Livraison correspondance impactée.",
    flight: "QR8811",
    timestamp: "08:58 UTC",
  },
  {
    id: "aa3",
    type: "warning",
    title: "Déroutement AH1043 — Bamako (BKO)",
    message:
      "Air Algérie AH1043 dérouté vers Bamako suite à conditions météo adverses sur axe ALG–ABJ. Nouvelle ETA Abidjan estimée à +3h. Prise en charge cargo en cours.",
    flight: "AH1043",
    timestamp: "08:42 UTC",
  },
  {
    id: "aa4",
    type: "success",
    title: "TK6731 posé — déchargement en cours",
    message:
      "Turkish Cargo TK6731 posé à 07:42. Déchargement textiles 22T en cours, porte C3. Livraison entrepôt prévue avant 11h00.",
    flight: "TK6731",
    timestamp: "07:44 UTC",
  },
];

// ─── API mappers ─────────────────────────────────────────────────────────────
function mapApiFlight(f: Record<string, unknown>, idx: number): Flight {
  const statusRaw = String(f.status ?? "").toLowerCase();
  let status: Flight["status"] = "active";
  if (statusRaw.includes("delay") || statusRaw.includes("retard")) {
    status = "delayed";
  } else if (statusRaw.includes("ground") || statusRaw.includes("hold")) {
    status = "ground_hold";
  } else if (statusRaw.includes("divert") || statusRaw.includes("detourne")) {
    status = "diverted";
  } else if (statusRaw.includes("land") || statusRaw.includes("pose") || statusRaw.includes("arrivé")) {
    status = "landed";
  }

  const typeRaw = String(f.type ?? "").toLowerCase();
  let type: Flight["type"] = "cargo";
  if (typeRaw.includes("combi")) {
    type = "combi";
  } else if (typeRaw.includes("charter")) {
    type = "charter";
  }

  return {
    id: String(f.id ?? idx),
    flightNumber: String(f.flight_number ?? f.flightNumber ?? `XX${idx}`),
    airline: String(f.airline ?? "—"),
    type,
    lat: Number(f.lat ?? 5.4),
    lng: Number(f.lon ?? f.lng ?? -4.0),
    altitude: Number(f.altitude ?? f.alt ?? 0),
    speed: Number(f.speed ?? 0),
    heading: Number(f.heading ?? 0),
    status,
    origin: String(f.origin ?? "—"),
    destination: String(f.destination ?? "—"),
    eta: String(f.eta ?? "—"),
    delay: Number(f.delay ?? 0),
    cargo: String(f.cargo ?? "—"),
    cutoffTime: f.cutoff_time ?? f.cutoffTime ? String(f.cutoff_time ?? f.cutoffTime) : undefined,
    gate: f.gate ? String(f.gate) : undefined,
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapApiAirAlert(a: Record<string, unknown>, idx: number): AirAlert {
  const level = String(a.level ?? "").toUpperCase();
  let type: AirAlert["type"] = "info";
  if (level === "RED") type = "critical";
  else if (level === "ORANGE") type = "warning";
  else if (level === "GREEN") type = "success";

  return {
    id: String(a.id ?? idx),
    type,
    title: String(a.alert_type ?? a.title ?? "Alerte"),
    message: String(a.message ?? ""),
    flight: a.flight ? String(a.flight) : undefined,
    timestamp: a.created_at
      ? new Date(String(a.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
      : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAirData(refreshInterval = 30_000) {
  const [flights, setFlights] = useState<Flight[]>(MOCK_FLIGHTS);
  const [kpi, setKpi] = useState<AirKpi>(MOCK_KPI);
  const [alerts, setAlerts] = useState<AirAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const [flightsRes, kpiRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/air/flights`, { cache: "no-store" }),
        fetch(`${API_URL}/api/air/kpis`,    { cache: "no-store" }),
        fetch(`${API_URL}/api/air/alerts`,  { cache: "no-store" }),
      ]);

      if (flightsRes.ok) {
        const data = await flightsRes.json();
        const rawFlights: Record<string, unknown>[] = data.flights ?? [];
        if (rawFlights.length > 0) setFlights(rawFlights.map(mapApiFlight));
      }

      if (kpiRes.ok) {
        const kd = await kpiRes.json();
        setKpi({
          activeFlights: Number(kd.active_flights ?? kd.activeFlights ?? 0),
          landed:        Number(kd.landed         ?? 0),
          delayed:       Number(kd.delayed         ?? 0),
          groundHolds:   Number(kd.ground_holds   ?? kd.groundHolds   ?? 0),
          totalFreight:  String(kd.total_freight  ?? kd.totalFreight  ?? "0 T"),
        });
        setIsLive(true);
      }

      if (alertsRes.ok) {
        const ad = await alertsRes.json();
        const rawAlerts: Record<string, unknown>[] =
          Array.isArray(ad) ? ad : (ad.alerts ?? []);
        if (rawAlerts.length > 0)
          setAlerts(rawAlerts.slice(0, 10).map(mapApiAirAlert));
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

  return { flights, kpi, alerts, loading, isLive, refetch: fetchData };
}
