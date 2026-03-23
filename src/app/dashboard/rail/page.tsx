"use client";

import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";

const RAIL_CONFIG: DeckConfig = {
  type: "rail",
  name: "RAIL DECK",
  color: "#f87171",
  forecastLabel: "Corridor ABJ-OUA · 4h",
  kpis: [
    { label: "Wagons Actifs", value: 126, color: "#f87171" },
    { label: "Tonnage / Jour", value: "1 840 T", color: "#f87171" },
    { label: "Corridors",     value: 3,   color: "#f87171" },
    { label: "Délai Moyen",   value: "2.4j", sub: "ABJ→OUA", color: "#f87171" },
  ],
  assets: [
    { id: "T001", name: "Train CI-BF-047", lat: 7.69,  lng: -5.04, status: "active",  info: "72 km/h · Bouaké → Koudougou" },
    { id: "T002", name: "Train CI-BF-048", lat: 9.45,  lng: -3.80, status: "active",  info: "65 km/h · Ferkessédougou → Ouaga" },
    { id: "T003", name: "Train BKO-001",   lat: 12.36, lng: -1.52, status: "delayed", info: "En gare Ouagadougou · Retard +3h" },
    { id: "T004", name: "Train CI-004",    lat: 6.20,  lng: -4.80, status: "active",  info: "55 km/h · Dimbokro → Yamoussoukro" },
    { id: "T005", name: "Locomotive SIT-22",lat: 5.35, lng: -3.99, status: "stopped", info: "Maintenance préventive · Gare Abidjan" },
    { id: "T006", name: "Train Mali-012",  lat: 11.20, lng: -4.20, status: "active",  info: "48 km/h · Sikasso → Bamako" },
  ],
};

export default function RailDeck() {
  return <DeckLayout config={RAIL_CONFIG} />;
}
