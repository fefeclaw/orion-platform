"use client";

import TrackingView from "./TrackingView";
import { Plane } from "lucide-react";

const ZONES = [
  { id: "abidjan", label: "FHB Abidjan",      lat: 5.36,  lon: -3.93, zoom: 9 },
  { id: "dakar",   label: "Dakar LSS",         lat: 14.74, lon: -17.49, zoom: 9 },
  { id: "lagos",   label: "Lagos LOS",          lat: 6.58,  lon: 3.32,  zoom: 9 },
  { id: "accra",   label: "Accra ACC",          lat: 5.61,  lon: -0.17, zoom: 9 },
  { id: "aowest",  label: "Vue Afrique Ouest",  lat: 9.0,   lon: -5.0,  zoom: 5 },
  { id: "europe",  label: "Hub Europe",         lat: 48.0,  lon: 2.5,   zoom: 5 },
];

const KPIS = [
  {
    label: "Vols actifs",
    value: "32",
    sub: "FHB + Lagos + Dakar",
    trend: 18,
    sparkline: [12, 15, 14, 18, 20, 17, 22, 24, 21, 26, 28, 32],
  },
  {
    label: "Fret traité",
    value: "420 T",
    sub: "Ce mois · +3 hubs",
    trend: 22,
    sparkline: [22, 28, 25, 34, 38, 32, 42, 45, 40, 50, 48, 55],
  },
  {
    label: "Hubs desservis",
    value: "7",
    sub: "AOF + Europe + Asie",
    trend: 3,
    sparkline: [4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
  },
  {
    label: "Délai moyen",
    value: "6.2h",
    sub: "ABJ → CDG",
    trend: -4,
    sparkline: [7.5, 7.2, 7.0, 6.8, 7.1, 6.9, 6.6, 6.5, 6.7, 6.4, 6.3, 6.2],
  },
];

const ACTIVITY = [
  "✈️ Air Côte d'Ivoire #HF104 — décollage FHB 15:00 · CDG 22:10",
  "📦 Lot #AIR-0482 — dédouanement express validé · 14:55",
  "🛬 Ethiopian Airlines ET871 — atterrissage FHB · 14:30",
  "📡 Tracking #AIR-217 — en transit Dubai → Abidjan · live",
  "🔄 Correspondance fret — hub Dakar LSS · 3 palettes · 14:00",
];

export default function FlightTracker() {
  return (
    <TrackingView
      color="#a78bfa"
      title="Tracking ADS-B — Temps réel"
      liveLabel="Live"
      icon={Plane}
      zones={ZONES}
      buildMapUrl={(lat, lon, zoom) =>
        `https://globe.adsbexchange.com/?lat=${lat}&lon=${lon}&zoom=${zoom}`
      }
      kpis={KPIS}
      activity={ACTIVITY}
      externalUrl="https://globe.adsbexchange.com"
      externalLabel="Ouvrir ADSBExchange"
    />
  );
}
