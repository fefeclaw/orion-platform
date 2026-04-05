"use client";

import TrackingView from "./TrackingView";
import { Train } from "lucide-react";

const ZONES = [
  { id: "corridor", label: "Corridor ABJ–OUA",  lat: 9.0,   lon: -4.5,  zoom: 6  },
  { id: "abidjan",  label: "Terminal Abidjan",  lat: 5.32,  lon: -4.02, zoom: 13 },
  { id: "ouaga",    label: "Gare Ouagadougou",  lat: 12.37, lon: -1.53, zoom: 13 },
  { id: "bamako",   label: "Terminus Bamako",   lat: 12.65, lon: -8.01, zoom: 13 },
  { id: "dakar",    label: "Liaison Dakar",     lat: 14.69, lon: -17.44, zoom: 12 },
];

function buildOsmUrl(lat: number, lon: number, zoom: number): string {
  const delta = Math.max(0.5, 5 / zoom);
  const bbox = `${lon - delta}%2C${lat - delta * 0.6}%2C${lon + delta}%2C${lat + delta * 0.6}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=transportmap&marker=${lat}%2C${lon}`;
}

const KPIS = [
  {
    label: "Wagons actifs",
    value: "126",
    sub: "Corridor ABJ–OUA–BKO",
    trend: 5,
    sparkline: [40, 48, 44, 55, 52, 60, 58, 65, 64, 70, 75, 78],
  },
  {
    label: "Tonnage mensuel",
    value: "18 400 T",
    sub: "Marchandises diverses",
    trend: 14,
    sparkline: [800, 950, 870, 1100, 1050, 1200, 1150, 1300, 1280, 1400, 1500, 1550],
  },
  {
    label: "Corridors actifs",
    value: "3",
    sub: "CI, Burkina Faso, Mali",
    trend: 0,
    sparkline: [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  },
  {
    label: "Délai moyen",
    value: "2.4j",
    sub: "Abidjan → Ouagadougou",
    trend: -8,
    sparkline: [3.5, 3.2, 3.0, 2.8, 3.1, 2.9, 2.7, 2.6, 2.8, 2.5, 2.4, 2.4],
  },
];

const ACTIVITY = [
  "🚂 Train #CI-BF-047 — départ Abidjan 06:00 · arrivée Ouaga 18:30",
  "📋 Manifeste #RAIL-1284 — validé SITARAIL · 12:45",
  "⚡ Locomotive #SIT-22 — maintenance préventive planifiée · 11:00",
  "📦 Lot #BKO-0312 — chargement Bamako Terminal · 10:30",
  "🛤️ Corridor CI-BF — voie libre toutes sections · 10:00",
];

export default function RailTracker() {
  return (
    <TrackingView
      color="#fb923c"
      title="Réseau Ferroviaire — Infrastructure"
      liveLabel="OpenRailway"
      icon={Train}
      zones={ZONES}
      buildMapUrl={buildOsmUrl}
      kpis={KPIS}
      activity={ACTIVITY}
      externalUrl="https://www.openrailwaymap.org"
      externalLabel="Ouvrir OpenRailwayMap"
    />
  );
}
