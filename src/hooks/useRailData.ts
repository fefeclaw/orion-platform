"use client";

import { useState, useEffect, useCallback } from "react";

export interface Train {
  id: string;
  name: string;
  type: "freight" | "mixed" | "maintenance";
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: "active" | "delayed" | "stopped";
  origin: string;
  destination: string;
  eta: string;
  delay: number;
  cargo: string;
  lastUpdate: string;
}

export interface StationStatus {
  id: string;
  name: string;
  lat: number;
  lng: number;
  trainsPresent: number;
  trainsExpected: number;
  nextDeparture: string;
  status: "normal" | "congested" | "closed";
}

export interface RailKpi {
  activeTrains: number;
  onTime: number;
  delayed: number;
  totalTonnage: string;
}

export interface RailAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  train?: string;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Mock data fallback ─────────────────────────────────────────────────────
const MOCK_TRAINS: Train[] = [
  {
    id: "t1",
    name: "Gazelle du Sud CI-101",
    type: "freight",
    lat: 5.35,
    lng: -3.99,
    speed: 0,
    heading: 0,
    status: "stopped",
    origin: "Treichville (ABJ)",
    destination: "Ouagadougou",
    eta: "2026-03-29 06:00",
    delay: 0,
    cargo: "Conteneurs 180T",
    lastUpdate: "08:15",
  },
  {
    id: "t2",
    name: "Volta Express BF-204",
    type: "mixed",
    lat: 6.65,
    lng: -4.70,
    speed: 72,
    heading: 350,
    status: "active",
    origin: "Dimbokro",
    destination: "Ouagadougou",
    eta: "2026-03-29 14:30",
    delay: 0,
    cargo: "Cacao 240T",
    lastUpdate: "08:10",
  },
  {
    id: "t3",
    name: "Savane Fret CI-307",
    type: "freight",
    lat: 7.42,
    lng: -4.92,
    speed: 65,
    heading: 345,
    status: "active",
    origin: "Treichville (ABJ)",
    destination: "Katiola",
    eta: "2026-03-28 18:00",
    delay: 0,
    cargo: "Coton 310T",
    lastUpdate: "08:05",
  },
  {
    id: "t4",
    name: "Ferk Liaison CI-412",
    type: "freight",
    lat: 8.13,
    lng: -5.10,
    speed: 0,
    heading: 0,
    status: "delayed",
    origin: "Katiola",
    destination: "Ferkessédougou",
    eta: "Retard — +3h (voie unique bloquée)",
    delay: 180,
    cargo: "Anacarde 195T",
    lastUpdate: "07:48",
  },
  {
    id: "t5",
    name: "Harmattan BF-518",
    type: "mixed",
    lat: 9.59,
    lng: -5.20,
    speed: 58,
    heading: 10,
    status: "active",
    origin: "Ferkessédougou",
    destination: "Ouagadougou",
    eta: "2026-03-28 22:15",
    delay: 0,
    cargo: "Marchandises diverses 155T",
    lastUpdate: "08:02",
  },
  {
    id: "t6",
    name: "Entretien CI-M01",
    type: "maintenance",
    lat: 8.60,
    lng: -5.15,
    speed: 20,
    heading: 330,
    status: "active",
    origin: "Katiola",
    destination: "Ferkessédougou",
    eta: "—",
    delay: 0,
    cargo: "Équipements de maintenance",
    lastUpdate: "07:55",
  },
];

const MOCK_STATIONS: StationStatus[] = [
  {
    id: "s1",
    name: "Treichville (ABJ)",
    lat: 5.35,
    lng: -3.99,
    trainsPresent: 2,
    trainsExpected: 3,
    nextDeparture: "09:30",
    status: "normal",
  },
  {
    id: "s2",
    name: "Dimbokro",
    lat: 6.65,
    lng: -4.70,
    trainsPresent: 1,
    trainsExpected: 2,
    nextDeparture: "10:15",
    status: "normal",
  },
  {
    id: "s3",
    name: "Katiola",
    lat: 8.13,
    lng: -5.10,
    trainsPresent: 2,
    trainsExpected: 1,
    nextDeparture: "En attente — voie unique",
    status: "congested",
  },
  {
    id: "s4",
    name: "Ferkessédougou",
    lat: 9.59,
    lng: -5.20,
    trainsPresent: 1,
    trainsExpected: 2,
    nextDeparture: "14:00",
    status: "normal",
  },
  {
    id: "s5",
    name: "Ouagadougou",
    lat: 12.36,
    lng: -1.53,
    trainsPresent: 0,
    trainsExpected: 3,
    nextDeparture: "—",
    status: "normal",
  },
];

const MOCK_KPI: RailKpi = {
  activeTrains: 18,
  onTime: 14,
  delayed: 4,
  totalTonnage: "2 840T/jour",
};

const MOCK_ALERTS: RailAlert[] = [
  {
    id: "ra1",
    type: "critical",
    title: "Retard critique — voie unique bloquée",
    message:
      "Ferk Liaison CI-412 immobilisé à Katiola — voie unique occupée par convoi maintenance. Retard estimé +3h. Cascades possibles sur 2 convois suivants.",
    train: "Ferk Liaison CI-412",
    timestamp: "07:50 UTC",
  },
  {
    id: "ra2",
    type: "warning",
    title: "Maintenance voie Katiola–Ferkessédougou",
    message:
      "Travaux de remplacement de traverses entre PK 412 et PK 438. Vitesse limitée à 40 km/h. Durée estimée : 6h. Fenêtre maintenance : 08h00–14h00.",
    timestamp: "06:00 UTC",
  },
  {
    id: "ra3",
    type: "info",
    title: "Arrivée prévue à Ouagadougou",
    message:
      "Volta Express BF-204 — arrivée prévue 2026-03-29 14:30. Cargaison : Cacao 240T. Dédouanement pré-autorisé.",
    train: "Volta Express BF-204",
    timestamp: "08:00 UTC",
  },
];

// ─── API mappers ─────────────────────────────────────────────────────────────
function mapApiTrain(t: Record<string, unknown>, idx: number): Train {
  const statusRaw = String(t.status ?? "").toLowerCase();
  let status: Train["status"] = "active";
  if (statusRaw.includes("delay") || statusRaw.includes("retard")) {
    status = "delayed";
  } else if (statusRaw.includes("stop") || statusRaw.includes("arret")) {
    status = "stopped";
  }

  const typeRaw = String(t.type ?? "").toLowerCase();
  let type: Train["type"] = "freight";
  if (typeRaw.includes("mixed") || typeRaw.includes("mixte")) {
    type = "mixed";
  } else if (typeRaw.includes("maintenance")) {
    type = "maintenance";
  }

  return {
    id: String(t.id ?? idx),
    name: String(t.name ?? `Train ${idx + 1}`),
    type,
    lat: Number(t.lat ?? 8.0),
    lng: Number(t.lon ?? t.lng ?? -4.5),
    speed: Number(t.speed ?? 0),
    heading: Number(t.heading ?? 0),
    status,
    origin: String(t.origin ?? "—"),
    destination: String(t.destination ?? "—"),
    eta: String(t.eta ?? "—"),
    delay: Number(t.delay ?? 0),
    cargo: String(t.cargo ?? "—"),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapApiRailAlert(a: Record<string, unknown>, idx: number): RailAlert {
  const level = String(a.level ?? "").toUpperCase();
  let type: RailAlert["type"] = "info";
  if (level === "RED") type = "critical";
  else if (level === "ORANGE") type = "warning";
  else if (level === "GREEN") type = "success";

  return {
    id: String(a.id ?? idx),
    type,
    title: String(a.alert_type ?? a.title ?? "Alerte"),
    message: String(a.message ?? ""),
    train: a.train ? String(a.train) : undefined,
    timestamp: a.created_at
      ? new Date(String(a.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
      : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRailData(refreshInterval = 30_000) {
  const [trains, setTrains] = useState<Train[]>(MOCK_TRAINS);
  const [stations, setStations] = useState<StationStatus[]>(MOCK_STATIONS);
  const [kpi, setKpi] = useState<RailKpi>(MOCK_KPI);
  const [alerts, setAlerts] = useState<RailAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const [trainsRes, kpiRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/rail/trains`,  { cache: "no-store" }),
        fetch(`${API_URL}/api/rail/kpis`,    { cache: "no-store" }),
        fetch(`${API_URL}/api/rail/alerts`,  { cache: "no-store" }),
      ]);

      if (trainsRes.ok) {
        const data = await trainsRes.json();
        const rawTrains: Record<string, unknown>[] = data.trains ?? [];
        if (rawTrains.length > 0) setTrains(rawTrains.map(mapApiTrain));
      }

      if (kpiRes.ok) {
        const kd = await kpiRes.json();
        setKpi({
          activeTrains:  Number(kd.active_trains ?? kd.activeTrains ?? 0),
          onTime:        Number(kd.on_time       ?? kd.onTime       ?? 0),
          delayed:       Number(kd.delayed       ?? 0),
          totalTonnage:  String(kd.total_tonnage ?? kd.totalTonnage ?? "0T/jour"),
        });
        setIsLive(true);
      }

      if (alertsRes.ok) {
        const ad = await alertsRes.json();
        const rawAlerts: Record<string, unknown>[] =
          Array.isArray(ad) ? ad : (ad.alerts ?? []);
        if (rawAlerts.length > 0)
          setAlerts(rawAlerts.slice(0, 10).map(mapApiRailAlert));
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

  return { trains, stations, kpi, alerts, loading, isLive, refetch: fetchData };
}
