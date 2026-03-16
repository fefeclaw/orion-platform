"use client";

import TrackingView from "./TrackingView";
import { Anchor } from "lucide-react";

const ZONES = [
  { id: "abidjan",    label: "Port d'Abidjan",   lat: 5.28,  lon: -4.02, zoom: 12 },
  { id: "lagos",      label: "Port de Lagos",     lat: 6.42,  lon: 3.38,  zoom: 12 },
  { id: "dakar",      label: "Port de Dakar",     lat: 14.69, lon: -17.44, zoom: 12 },
  { id: "lome",       label: "Port de Lomé",      lat: 6.13,  lon: 1.29,  zoom: 12 },
  { id: "casablanca", label: "Port Casablanca",   lat: 33.60, lon: -7.63, zoom: 11 },
  { id: "westafrica", label: "Vue Afrique Ouest", lat: 8.0,   lon: -5.0,  zoom: 5  },
];

const KPIS = [
  {
    label: "Navires actifs",
    value: "48",
    sub: "Port d'Abidjan + Lagos",
    trend: 12,
    sparkline: [18, 22, 20, 25, 28, 24, 30, 32, 28, 35, 38, 48],
  },
  {
    label: "Conteneurs TEU",
    value: "3 842",
    sub: "En mer · Afrique Ouest",
    trend: 8,
    sparkline: [210, 240, 195, 280, 310, 295, 340, 360, 385, 342, 390, 410],
  },
  {
    label: "Ports desservis",
    value: "14",
    sub: "Côte Ouest Africaine",
    trend: 2,
    sparkline: [9, 10, 10, 11, 12, 11, 12, 13, 13, 13, 14, 14],
  },
  {
    label: "Retards actifs",
    value: "3",
    sub: "Déviations détectées",
    trend: -15,
    sparkline: [8, 6, 7, 5, 4, 6, 5, 4, 3, 4, 3, 3],
  },
];

const ACTIVITY = [
  "🚢 MSC Abidjan — arrivée Port Autonome Abidjan · 14:32",
  "📦 Lot #ABJ-2847 — dédouanement validé DGD · 14:15",
  "⚓ CMA CGM Lagos — départ pour Rotterdam · 13:55",
  "🔄 Transbordement Dakar — 312 conteneurs · 13:40",
  "📡 Balise GPS #MAR-09 — signal reçu Casablanca · 13:22",
];

export default function VesselTracker() {
  return (
    <TrackingView
      color="#38bdf8"
      title="Tracking AIS — Temps réel"
      liveLabel="Live"
      icon={Anchor}
      zones={ZONES}
      buildMapUrl={(lat, lon, zoom) =>
        `https://www.marinetraffic.com/en/ais/embed/zoom:${zoom}/centery:${lat}/centerx:${lon}/maptype:1/shownames:true/mmsi:0/shipid:0/fleet:/fleet_id:/vtypes:/showmenu:false/remember:false`
      }
      kpis={KPIS}
      activity={ACTIVITY}
      externalUrl="https://www.marinetraffic.com"
      externalLabel="Ouvrir MarineTraffic"
    />
  );
}
