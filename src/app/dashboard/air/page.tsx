"use client";

import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";

const AIR_CONFIG: DeckConfig = {
  type: "air",
  name: "AIR DECK",
  color: "#a78bfa",
  forecastLabel: "Hub FHB Abidjan · 4h",
  kpis: [
    { label: "Vols Actifs",  value: 32,       color: "#a78bfa" },
    { label: "Fret Traité",  value: "420 T",  color: "#a78bfa" },
    { label: "Hubs Desservis", value: 7,      color: "#a78bfa" },
    { label: "Délai Moyen", value: "6.2h", sub: "ABJ→CDG", color: "#a78bfa" },
  ],
  assets: [
    { id: "HF104",  name: "Air CI HF104",         lat: 18.0,  lng: -3.0,   status: "active",  info: "Flight level 350 · ABJ→CDG · ETA 22:10" },
    { id: "ET871",  name: "Ethiopian ET871",        lat: 8.0,   lng: 18.0,   status: "active",  info: "FL320 · ADD→ABJ · ETA 14:30" },
    { id: "AH1047", name: "Air Algérie AH1047",    lat: 22.0,  lng: 5.0,    status: "delayed", info: "Déroutement météo · Retard +2h · ALG→ABJ" },
    { id: "QR552",  name: "Qatar QR552 Cargo",     lat: 15.0,  lng: 40.0,   status: "active",  info: "FL390 · DOH→LOS · ETA 18:45" },
    { id: "LH8412", name: "Lufthansa Cargo LH8412",lat: 30.0,  lng: 15.0,   status: "active",  info: "FL370 · FRA→ABJ · ETA 06:20" },
    { id: "AF8723", name: "Air France AF8723",      lat: 40.0,  lng: 5.0,    status: "active",  info: "FL350 · CDG→ABJ · ETA 23:15" },
    { id: "EK9054", name: "Emirates Cargo EK9054", lat: 12.0,  lng: 50.0,   status: "stopped", info: "Ground hold DXB — vents forts · +1h30" },
  ],
};

export default function AirDeck() {
  return <DeckLayout config={AIR_CONFIG} />;
}
