"use client";

import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";

const ROAD_CONFIG: DeckConfig = {
  type: "road",
  name: "ROAD DECK",
  color: "#34d399",
  forecastLabel: "Réseau CEDEAO · 4h",
  kpis: [
    { label: "Camions Actifs", value: 284,    color: "#34d399" },
    { label: "Livraisons / mois", value: "1 247", color: "#34d399" },
    { label: "Pays CEDEAO", value: 5,         color: "#34d399" },
    { label: "Ponctualité", value: "94%",     color: "#34d399" },
  ],
  assets: [
    { id: "TRK-001", name: "Convoi CI-GH-0845", lat: 5.35,  lng: -3.50, status: "active",  info: "88 km/h · ABJ → Accra via Elubo" },
    { id: "TRK-002", name: "Camion TRK-217",    lat: 7.68,  lng: -5.03, status: "active",  info: "72 km/h · Bouaké → Ouagadougou" },
    { id: "TRK-003", name: "Convoi DKR-ABJ",    lat: 11.86, lng: -15.55, status: "delayed", info: "Arrêté frontière Guinée · Retard +5h" },
    { id: "TRK-004", name: "Camion RN1-054",    lat: 6.82,  lng: -4.35, status: "active",  info: "68 km/h · Yamoussoukro → Bouaké" },
    { id: "TRK-005", name: "Convoi CEDEAO-008",  lat: 9.54, lng: -13.68, status: "active",  info: "62 km/h · Conakry → Dakar" },
    { id: "TRK-006", name: "Camion GH-CI-112",  lat: 5.10,  lng: -3.20, status: "stopped", info: "En pause — poste frontière Noé" },
    { id: "TRK-007", name: "Convoi BKF-CI-031", lat: 10.44, lng: -0.48, status: "active",  info: "75 km/h · Ouaga → Accra" },
    { id: "TRK-008", name: "Camion ABJ-DKR-02", lat: 14.00, lng: -16.50, status: "active", info: "71 km/h · Approche Dakar" },
  ],
};

export default function RoadDeck() {
  return <DeckLayout config={ROAD_CONFIG} />;
}
