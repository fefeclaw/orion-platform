"use client";

import TrackingView from "./TrackingView";
import { Truck } from "lucide-react";

const ZONES = [
  { id: "abidjan",  label: "Abidjan",        lat: 5.35,  lon: -4.02, zoom: 12 },
  { id: "corridor", label: "Corridor CI–BF", lat: 9.0,   lon: -4.5,  zoom: 7  },
  { id: "bouake",   label: "Bouaké",          lat: 7.69,  lon: -5.03, zoom: 12 },
  { id: "ouaga",    label: "Ouagadougou",     lat: 12.37, lon: -1.52, zoom: 12 },
  { id: "lagos",    label: "Lagos",           lat: 6.45,  lon: 3.40,  zoom: 12 },
  { id: "ecowas",   label: "Vue CEDEAO",      lat: 9.0,   lon: -2.0,  zoom: 5  },
];

const KPIS = [
  {
    label: "Camions actifs",
    value: "284",
    sub: "Réseau CI + CEDEAO",
    trend: 7,
    sparkline: [180, 210, 195, 230, 245, 220, 260, 270, 255, 280, 275, 284],
  },
  {
    label: "Livraisons / mois",
    value: "1 247",
    sub: "Ponctualité 94%",
    trend: 11,
    sparkline: [70, 85, 78, 98, 105, 95, 115, 120, 110, 130, 125, 140],
  },
  {
    label: "Corridors couverts",
    value: "8",
    sub: "5 pays CEDEAO",
    trend: 1,
    sparkline: [5, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8],
  },
  {
    label: "KM parcourus",
    value: "384K",
    sub: "Ce mois-ci",
    trend: 9,
    sparkline: [200, 240, 220, 280, 300, 270, 320, 340, 310, 365, 375, 384],
  },
];

const ACTIVITY = [
  "🚛 Convoi #CI-GH-0845 — passage poste Elubo · 14:48",
  "📍 Camion #TRK-217 — arrivée Bouaké · ETA Ouaga 22:00",
  "⚠️ Alerte trafic — RN1 ralentissement Tiébissou · 14:30",
  "✅ Livraison #ABJ-1093 — confirmée Abidjan Centre · 14:10",
  "📡 Tracking GPS actif — 284 véhicules connectés · live",
];

export default function RoadTracker() {
  return (
    <TrackingView
      color="#4ade80"
      title="Trafic Routier — Temps réel"
      liveLabel="Live"
      icon={Truck}
      zones={ZONES}
      buildMapUrl={(lat, lon, zoom) =>
        `https://embed.waze.com/iframe?zoom=${zoom}&lat=${lat}&lon=${lon}&pin=0&desc=0`
      }
      kpis={KPIS}
      activity={ACTIVITY}
      externalUrl="https://www.waze.com"
      externalLabel="Ouvrir Waze"
    />
  );
}
