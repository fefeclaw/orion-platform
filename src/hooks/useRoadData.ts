"use client";

import { useState, useEffect, useCallback } from "react";

export interface Truck {
  id: string;
  plate: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: "active" | "delayed" | "stopped" | "checkpoint";
  origin: string;
  destination: string;
  eta: string;
  delay: number;
  cargo: string;
  driver: string;
  lastUpdate: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "border" | "weighing" | "customs" | "toll";
  waitTime: number;
  status: "open" | "slow" | "closed";
}

export interface RoadKpi {
  activeTrucks: number;
  onTime: number;
  delayed: number;
  checkpointIncidents: number;
  avgDelay: string;
}

export interface RoadAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  truck?: string;
  checkpoint?: string;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Mock data fallback ─────────────────────────────────────────────────────
const MOCK_TRUCKS: Truck[] = [
  {
    id: "tr1",
    plate: "CI-4821-AB",
    name: "Iveco Stralis — ABJ Bouaké",
    lat: 7.69,
    lng: -5.03,
    speed: 82,
    heading: 355,
    status: "active",
    origin: "Abidjan (Port)",
    destination: "Ouagadougou",
    eta: "2026-03-29 16:00",
    delay: 0,
    cargo: "Cacao 22T",
    driver: "Koné Mamadou",
    lastUpdate: "09:14",
  },
  {
    id: "tr2",
    plate: "CI-7703-KC",
    name: "Mercedes Actros — Axe San Pedro",
    lat: 4.92,
    lng: -6.64,
    speed: 74,
    heading: 20,
    status: "active",
    origin: "San Pedro (Port)",
    destination: "Abidjan",
    eta: "2026-03-28 17:30",
    delay: 0,
    cargo: "Huile de palme 18T",
    driver: "Yao Jean-Baptiste",
    lastUpdate: "09:10",
  },
  {
    id: "tr3",
    plate: "GH-0912-CE",
    name: "MAN TGX — Axe Noé/Elubo",
    lat: 5.10,
    lng: -3.20,
    speed: 0,
    heading: 90,
    status: "checkpoint",
    origin: "Abidjan",
    destination: "Accra",
    eta: "Retenu frontière Noé — +45 min",
    delay: 45,
    cargo: "Marchandises diverses 15T",
    driver: "Mensah Kwame",
    lastUpdate: "08:58",
  },
  {
    id: "tr4",
    plate: "BF-3341-WA",
    name: "Scania R450 — Axe Pogo",
    lat: 9.88,
    lng: -4.61,
    speed: 0,
    heading: 5,
    status: "delayed",
    origin: "Abidjan",
    destination: "Ouagadougou",
    eta: "Retenu frontière Pogo — +120 min",
    delay: 120,
    cargo: "Riz importé 28T",
    driver: "Traoré Souleymane",
    lastUpdate: "08:30",
  },
  {
    id: "tr5",
    plate: "CI-2214-MN",
    name: "DAF XF — Bouaké Pesage",
    lat: 7.69,
    lng: -5.04,
    speed: 0,
    heading: 0,
    status: "checkpoint",
    origin: "Abidjan",
    destination: "Bouaké",
    eta: "2026-03-28 14:00",
    delay: 15,
    cargo: "Ciment 30T",
    driver: "Coulibaly Ibrahim",
    lastUpdate: "09:05",
  },
  {
    id: "tr6",
    plate: "SN-8821-DK",
    name: "Renault T — ABJ Dakar",
    lat: 11.30,
    lng: -5.55,
    speed: 88,
    heading: 330,
    status: "active",
    origin: "Abidjan",
    destination: "Dakar",
    eta: "2026-03-30 10:00",
    delay: 0,
    cargo: "Café vert 12T",
    driver: "Diallo Oumar",
    lastUpdate: "09:12",
  },
  {
    id: "tr7",
    plate: "CI-5590-RB",
    name: "Volvo FH — Incident mécanique",
    lat: 6.22,
    lng: -4.81,
    speed: 0,
    heading: 0,
    status: "delayed",
    origin: "Abidjan",
    destination: "Bouaké",
    eta: "Incident mécanique — délai indéterminé",
    delay: 240,
    cargo: "Carburant 25T",
    driver: "N'Guessan Koffi",
    lastUpdate: "07:45",
  },
  {
    id: "tr8",
    plate: "CI-1103-LP",
    name: "Iveco Eurocargo — Axe A3",
    lat: 5.290,
    lng: -4.012,
    speed: 67,
    heading: 10,
    status: "active",
    origin: "Abidjan (Port)",
    destination: "Yamoussoukro",
    eta: "2026-03-28 13:45",
    delay: 0,
    cargo: "Électroménager 8T",
    driver: "Bamba Sékou",
    lastUpdate: "09:08",
  },
];

const MOCK_CHECKPOINTS: Checkpoint[] = [
  {
    id: "cp1",
    name: "Frontière Noé / Elubo (CI–GH)",
    lat: 5.10,
    lng: -3.20,
    type: "border",
    waitTime: 45,
    status: "slow",
  },
  {
    id: "cp2",
    name: "Frontière Pogo (CI–BF)",
    lat: 9.88,
    lng: -4.61,
    type: "customs",
    waitTime: 120,
    status: "slow",
  },
  {
    id: "cp3",
    name: "Gare de pesage Bouaké (A3)",
    lat: 7.69,
    lng: -5.04,
    type: "weighing",
    waitTime: 15,
    status: "open",
  },
];

const MOCK_KPI: RoadKpi = {
  activeTrucks: 284,
  onTime: 267,
  delayed: 17,
  checkpointIncidents: 3,
  avgDelay: "47 min",
};

const MOCK_ALERTS: RoadAlert[] = [
  {
    id: "rda1",
    type: "critical",
    title: "Incident mécanique — camion immobilisé",
    message:
      "Volvo FH CI-5590-RB immobilisé sur l'A3 (PK 184, Tiébissou). Assistance routière dépêchée. Délai reprise estimé : +4h. Cargo carburant 25T sécurisé.",
    truck: "CI-5590-RB",
    timestamp: "07:47 UTC",
  },
  {
    id: "rda2",
    type: "warning",
    title: "Congestion frontière Pogo (CI–BF)",
    message:
      "Attente estimée 120 min à la frontière Pogo. 14 camions en file. Cause : contrôle douanier renforcé. Recommandation : prévoir documents à jour.",
    checkpoint: "Frontière Pogo",
    timestamp: "08:32 UTC",
  },
  {
    id: "rda3",
    type: "warning",
    title: "Frontière Noé / Elubo — délai modéré",
    message:
      "Attente 45 min à Noé/Elubo. Trafic dense sens CI → GH. Heure de pointe habituelle — retour à la normale prévu à 11h00.",
    checkpoint: "Frontière Noé / Elubo",
    timestamp: "09:00 UTC",
  },
  {
    id: "rda4",
    type: "success",
    title: "Axe A3 — trafic fluide",
    message:
      "Segment Abidjan–Yamoussoukro dégagé. Vitesse moyenne de croisière : 80 km/h. Aucun incident signalé sur les 5 dernières heures.",
    timestamp: "09:10 UTC",
  },
];

// ─── API mappers ─────────────────────────────────────────────────────────────
function mapApiTruck(t: Record<string, unknown>, idx: number): Truck {
  const statusRaw = String(t.status ?? "").toLowerCase();
  let status: Truck["status"] = "active";
  if (statusRaw.includes("delay") || statusRaw.includes("retard")) {
    status = "delayed";
  } else if (statusRaw.includes("stop") || statusRaw.includes("arret")) {
    status = "stopped";
  } else if (statusRaw.includes("checkpoint") || statusRaw.includes("frontiere") || statusRaw.includes("pesage")) {
    status = "checkpoint";
  }

  return {
    id: String(t.id ?? idx),
    plate: String(t.plate ?? t.immatriculation ?? `CI-${idx}-XX`),
    name: String(t.name ?? `Camion ${idx + 1}`),
    lat: Number(t.lat ?? 7.0),
    lng: Number(t.lon ?? t.lng ?? -5.0),
    speed: Number(t.speed ?? 0),
    heading: Number(t.heading ?? 0),
    status,
    origin: String(t.origin ?? "—"),
    destination: String(t.destination ?? "—"),
    eta: String(t.eta ?? "—"),
    delay: Number(t.delay ?? 0),
    cargo: String(t.cargo ?? "—"),
    driver: String(t.driver ?? "—"),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapApiRoadAlert(a: Record<string, unknown>, idx: number): RoadAlert {
  const level = String(a.level ?? "").toUpperCase();
  let type: RoadAlert["type"] = "info";
  if (level === "RED") type = "critical";
  else if (level === "ORANGE") type = "warning";
  else if (level === "GREEN") type = "success";

  return {
    id: String(a.id ?? idx),
    type,
    title: String(a.alert_type ?? a.title ?? "Alerte"),
    message: String(a.message ?? ""),
    truck: a.truck ? String(a.truck) : undefined,
    checkpoint: a.checkpoint ? String(a.checkpoint) : undefined,
    timestamp: a.created_at
      ? new Date(String(a.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
      : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRoadData(refreshInterval = 30_000) {
  const [trucks, setTrucks] = useState<Truck[]>(MOCK_TRUCKS);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(MOCK_CHECKPOINTS);
  const [kpi, setKpi] = useState<RoadKpi>(MOCK_KPI);
  const [alerts, setAlerts] = useState<RoadAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const [trucksRes, checkpointsRes, kpiRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/road/trucks`,      { cache: "no-store" }),
        fetch(`${API_URL}/api/road/checkpoints`, { cache: "no-store" }),
        fetch(`${API_URL}/api/road/kpis`,        { cache: "no-store" }),
        fetch(`${API_URL}/api/road/alerts`,      { cache: "no-store" }),
      ]);

      if (trucksRes.ok) {
        const data = await trucksRes.json();
        const rawTrucks: Record<string, unknown>[] = data.trucks ?? [];
        if (rawTrucks.length > 0) setTrucks(rawTrucks.map(mapApiTruck));
      }

      if (checkpointsRes.ok) {
        const data = await checkpointsRes.json();
        const rawCheckpoints: Record<string, unknown>[] = data.checkpoints ?? [];
        if (rawCheckpoints.length > 0) {
          setCheckpoints(
            rawCheckpoints.map((c, i) => ({
              id: String(c.id ?? i),
              name: String(c.name ?? `Checkpoint ${i + 1}`),
              lat: Number(c.lat ?? 7.0),
              lng: Number(c.lon ?? c.lng ?? -5.0),
              type: (["border", "weighing", "customs", "toll"].includes(String(c.type))
                ? (c.type as Checkpoint["type"])
                : "border"),
              waitTime: Number(c.wait_time ?? c.waitTime ?? 0),
              status: (["open", "slow", "closed"].includes(String(c.status))
                ? (c.status as Checkpoint["status"])
                : "open"),
            }))
          );
        }
      }

      if (kpiRes.ok) {
        const kd = await kpiRes.json();
        setKpi({
          activeTrucks:        Number(kd.active_trucks        ?? kd.activeTrucks        ?? 0),
          onTime:              Number(kd.on_time              ?? kd.onTime              ?? 0),
          delayed:             Number(kd.delayed              ?? 0),
          checkpointIncidents: Number(kd.checkpoint_incidents ?? kd.checkpointIncidents ?? 0),
          avgDelay:            String(kd.avg_delay            ?? kd.avgDelay            ?? "0 min"),
        });
        setIsLive(true);
      }

      if (alertsRes.ok) {
        const ad = await alertsRes.json();
        const rawAlerts: Record<string, unknown>[] =
          Array.isArray(ad) ? ad : (ad.alerts ?? []);
        if (rawAlerts.length > 0)
          setAlerts(rawAlerts.slice(0, 10).map(mapApiRoadAlert));
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

  return { trucks, checkpoints, kpi, alerts, loading, isLive, refetch: fetchData };
}
