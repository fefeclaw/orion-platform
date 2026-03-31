"use client";

import { useState, useEffect, useCallback } from "react";
import { useMaritimeData, type Vessel } from "./useMaritimeData";
import { useRailData, type Train } from "./useRailData";
import { useRoadData, type Truck } from "./useRoadData";
import { useAirData, type Flight } from "./useAirData";

export type TransportMode = "sea" | "rail" | "road" | "air";

export interface Segment {
  mode: TransportMode;
  from: string;
  to: string;
  carrier: string;
  departureEta: string;
  arrivalEta: string;
  status: "completed" | "active" | "pending" | "delayed";
  delay: number;
  trackingRef: string;
  // Enrichissement données réelles
  liveAssetId?: string;
  liveAssetName?: string;
  liveSource?: TransportMode;
}

export interface IntermodalShipment {
  id: string;
  clientRef: string;
  origin: string;
  finalDestination: string;
  cargo: string;
  tonnage: number;
  status: "on_track" | "delayed" | "critical" | "delivered";
  totalDelay: number;
  segments: Segment[];
  currentSegmentIndex: number;
  eta: string;
  lat: number;
  lng: number;
}

export interface IntermodalKPI {
  totalShipments: number;
  onTrack: number;
  delayed: number;
  critical: number;
  avgDelay: number;
  modeDistribution: Record<TransportMode, number>;
  jonctionsActives: number;
}

// ─── Coordonnées de référence ──────────────────────────────────────────────────
const COORDS: Record<string, [number, number]> = {
  "Abidjan":        [5.32,  -4.02],
  "Bouaké":         [7.69,  -5.03],
  "Ouagadougou":    [12.37, -1.53],
  "Bobo-Dioulasso": [11.18, -4.30],
  "Lomé":           [6.14,   1.22],
  "Accra":          [5.56,  -0.20],
  "Dakar":          [14.71,-17.47],
  "Paris CDG":      [49.01,  2.55],
  "Rotterdam":      [51.95,  4.14],
  "Bamako":         [12.65, -8.00],
};

// ─── Mock shipments ────────────────────────────────────────────────────────────
const INITIAL_SHIPMENTS: IntermodalShipment[] = [
  {
    id: "ORN-SEA-2026-0042",
    clientRef: "CLIENT-ABJ-001",
    origin: "Abidjan",
    finalDestination: "Ouagadougou",
    cargo: "Cacao 340T",
    tonnage: 340,
    status: "on_track",
    totalDelay: 0,
    currentSegmentIndex: 1,
    eta: "29 mars 18:30",
    lat: 7.69, lng: -5.03,
    segments: [
      { mode: "sea",  from: "Rotterdam",  to: "Abidjan",     carrier: "MSC Beatrice",      departureEta: "25 mars 06:00", arrivalEta: "28 mars 14:00", status: "completed", delay: 0,  trackingRef: "BL-ABJ-2026-4231" },
      { mode: "road", from: "Abidjan",    to: "Bouaké",      carrier: "Iveco CI-4821-AB",  departureEta: "28 mars 16:00", arrivalEta: "28 mars 23:00", status: "active",    delay: 30, trackingRef: "CMR-ABJ-2026-0881" },
      { mode: "road", from: "Bouaké",     to: "Ouagadougou", carrier: "MAN CI-5302-CD",    departureEta: "29 mars 02:00", arrivalEta: "29 mars 18:30", status: "pending",   delay: 0,  trackingRef: "BSC-ABJ-2026-0882" },
    ],
  },
  {
    id: "ORN-SEA-2026-0051",
    clientRef: "CLIENT-ABJ-002",
    origin: "Abidjan",
    finalDestination: "Bobo-Dioulasso",
    cargo: "Anacarde 195T",
    tonnage: 195,
    status: "delayed",
    totalDelay: 120,
    currentSegmentIndex: 1,
    eta: "30 mars 10:00",
    lat: 9.45, lng: -3.80,
    segments: [
      { mode: "sea",  from: "Hambourg",   to: "Abidjan",        carrier: "CMA CGM Topaz",    departureEta: "24 mars 08:00", arrivalEta: "27 mars 20:00", status: "completed", delay: 0,   trackingRef: "BL-ABJ-2026-4290" },
      { mode: "rail", from: "Abidjan",    to: "Bobo-Dioulasso",  carrier: "Train CI-BF-204",  departureEta: "28 mars 07:00", arrivalEta: "28 mars 22:00", status: "delayed",   delay: 120, trackingRef: "LV-ABJ-OUA-2026-2041" },
    ],
  },
  {
    id: "ORN-ROAD-2026-0118",
    clientRef: "CLIENT-ABJ-003",
    origin: "Bouaké",
    finalDestination: "Paris CDG",
    cargo: "Caoutchouc 12T",
    tonnage: 12,
    status: "on_track",
    totalDelay: 0,
    currentSegmentIndex: 1,
    eta: "29 mars 22:15",
    lat: 5.32, lng: -4.02,
    segments: [
      { mode: "road", from: "Bouaké",   to: "Abidjan",  carrier: "Renault CI-0047-RT",   departureEta: "28 mars 06:00", arrivalEta: "28 mars 12:00", status: "completed", delay: 0, trackingRef: "CMR-ABJ-2026-1180" },
      { mode: "air",  from: "Abidjan",  to: "Paris CDG", carrier: "Air CI HF920 Cargo",  departureEta: "28 mars 18:00", arrivalEta: "29 mars 22:15", status: "active",    delay: 0, trackingRef: "AWB-ACI-2026-87421" },
    ],
  },
  {
    id: "ORN-AIR-2026-0033",
    clientRef: "CLIENT-ABJ-004",
    origin: "Paris CDG",
    finalDestination: "Ouagadougou",
    cargo: "Équipements médicaux 3T",
    tonnage: 3,
    status: "critical",
    totalDelay: 240,
    currentSegmentIndex: 1,
    eta: "29 mars 15:00",
    lat: 12.37, lng: -1.53,
    segments: [
      { mode: "air",  from: "Paris CDG",  to: "Abidjan",     carrier: "Air France AF8723",  departureEta: "28 mars 14:00", arrivalEta: "29 mars 06:00", status: "delayed",   delay: 240, trackingRef: "AWB-AFR-2026-91205" },
      { mode: "road", from: "Abidjan",    to: "Ouagadougou", carrier: "Express BF Transit", departureEta: "29 mars 08:00", arrivalEta: "29 mars 15:00", status: "pending",   delay: 0,   trackingRef: "CMR-ABJ-2026-1201" },
    ],
  },
  {
    id: "ORN-SEA-2026-0065",
    clientRef: "CLIENT-ABJ-005",
    origin: "Abidjan",
    finalDestination: "Bamako",
    cargo: "Intrants agricoles 280T",
    tonnage: 280,
    status: "on_track",
    totalDelay: 45,
    currentSegmentIndex: 2,
    eta: "1 avril 09:00",
    lat: 11.18, lng: -4.30,
    segments: [
      { mode: "sea",  from: "Marseille",      to: "Abidjan",        carrier: "Hapag-Lloyd Aurora", departureEta: "23 mars 10:00", arrivalEta: "27 mars 16:00", status: "completed", delay: 0,  trackingRef: "BL-ABJ-2026-4411" },
      { mode: "rail", from: "Abidjan",        to: "Bobo-Dioulasso", carrier: "Train CI-BF-307",    departureEta: "28 mars 08:00", arrivalEta: "28 mars 23:00", status: "completed", delay: 45, trackingRef: "LV-ABJ-OUA-2026-3070" },
      { mode: "road", from: "Bobo-Dioulasso", to: "Bamako",         carrier: "SOTRAMA Express",    departureEta: "29 mars 04:00", arrivalEta: "1 avril 09:00", status: "active",    delay: 0,  trackingRef: "CMR-BDL-2026-0072" },
    ],
  },
  {
    id: "ORN-ROAD-2026-0201",
    clientRef: "CLIENT-ABJ-006",
    origin: "Abidjan",
    finalDestination: "Rotterdam",
    cargo: "Café Robusta 180T",
    tonnage: 180,
    status: "on_track",
    totalDelay: 0,
    currentSegmentIndex: 0,
    eta: "15 avril 08:00",
    lat: 5.32, lng: -4.02,
    segments: [
      { mode: "road", from: "Abidjan", to: "Abidjan (Port)", carrier: "Camion CI-7712-EX",  departureEta: "29 mars 08:00", arrivalEta: "29 mars 10:00", status: "active",  delay: 0, trackingRef: "CMR-ABJ-2026-2010" },
      { mode: "sea",  from: "Abidjan", to: "Rotterdam",      carrier: "MSC Isabella",       departureEta: "30 mars 06:00", arrivalEta: "15 avril 08:00", status: "pending", delay: 0, trackingRef: "BL-ABJ-2026-5501" },
    ],
  },
  {
    id: "ORN-RAIL-2026-0088",
    clientRef: "CLIENT-ABJ-007",
    origin: "Ouagadougou",
    finalDestination: "Paris CDG",
    cargo: "Peaux bovines 8T",
    tonnage: 8,
    status: "delayed",
    totalDelay: 180,
    currentSegmentIndex: 1,
    eta: "2 avril 14:30",
    lat: 5.56, lng: -0.20,
    segments: [
      { mode: "rail", from: "Ouagadougou", to: "Abidjan",  carrier: "Train BF-CI-415",    departureEta: "27 mars 20:00", arrivalEta: "28 mars 14:00", status: "completed", delay: 180, trackingRef: "LV-ABJ-OUA-2026-0880" },
      { mode: "air",  from: "Abidjan",     to: "Accra",    carrier: "Africa World AW302", departureEta: "29 mars 06:00", arrivalEta: "29 mars 07:30", status: "delayed",   delay: 60,  trackingRef: "AWB-AWA-2026-30088" },
      { mode: "air",  from: "Accra",       to: "Paris CDG", carrier: "Corsair XK450",     departureEta: "30 mars 02:00", arrivalEta: "2 avril 14:30", status: "pending",   delay: 0,   trackingRef: "AWB-COR-2026-45012" },
    ],
  },
  {
    id: "ORN-SEA-2026-0099",
    clientRef: "CLIENT-ABJ-008",
    origin: "Dakar",
    finalDestination: "Ouagadougou",
    cargo: "Téléphones & electronique 22T",
    tonnage: 22,
    status: "on_track",
    totalDelay: 0,
    currentSegmentIndex: 1,
    eta: "31 mars 20:00",
    lat: 11.86, lng: -13.50,
    segments: [
      { mode: "sea",  from: "Shanghai",   to: "Dakar",       carrier: "COSCO Pioneer",    departureEta: "10 mars 12:00", arrivalEta: "28 mars 08:00", status: "completed", delay: 0, trackingRef: "BL-DKR-2026-9901" },
      { mode: "road", from: "Dakar",      to: "Bamako",      carrier: "Trans-Sahel 4471", departureEta: "28 mars 10:00", arrivalEta: "29 mars 18:00", status: "active",    delay: 0, trackingRef: "CMR-DKR-2026-4471" },
      { mode: "road", from: "Bamako",     to: "Ouagadougou", carrier: "BF Logistics 221", departureEta: "30 mars 04:00", arrivalEta: "31 mars 20:00", status: "pending",   delay: 0, trackingRef: "BSC-BKO-2026-0221" },
    ],
  },
];

// ─── Enrichissement données réelles ───────────────────────────────────────────

function enrichSegmentsWithLiveData(
  shipments: IntermodalShipment[],
  vessels: Vessel[],
  trains: Train[],
  trucks: Truck[],
  flights: Flight[],
): IntermodalShipment[] {
  return shipments.map(ship => {
    const enrichedSegments = ship.segments.map(seg => {
      if (seg.status === "completed" || seg.status === "pending") return seg;
      let enriched = { ...seg };

      switch (seg.mode) {
        case "sea": {
          const company = seg.carrier.split(" ")[0];
          const vessel = vessels.find(v =>
            v.name.startsWith(company) ||
            v.destination.toLowerCase().includes(seg.to.toLowerCase().split(" ")[0])
          );
          if (vessel) {
            enriched.liveAssetId   = vessel.id;
            enriched.liveAssetName = vessel.name;
            enriched.liveSource    = "sea";
            if (vessel.status === "alert") {
              enriched.delay  = Math.max(enriched.delay, 90);
              enriched.status = "delayed";
            }
          }
          break;
        }
        case "rail": {
          const train = trains.find(t =>
            t.destination.toLowerCase().includes(seg.to.split(" ")[0].toLowerCase()) ||
            t.origin.toLowerCase().includes(seg.from.split(" ")[0].toLowerCase())
          );
          if (train) {
            enriched.liveAssetId   = train.id;
            enriched.liveAssetName = train.name;
            enriched.liveSource    = "rail";
            if (train.delay > 0) {
              enriched.delay  = Math.max(enriched.delay, train.delay);
              enriched.status = train.delay > 60 ? "delayed" : enriched.status;
            }
            if (train.status === "stopped") {
              enriched.delay  = Math.max(enriched.delay, 120);
              enriched.status = "delayed";
            }
          }
          break;
        }
        case "road": {
          const truck = trucks.find(t =>
            t.destination.toLowerCase().includes(seg.to.split(" ")[0].toLowerCase()) ||
            t.origin.toLowerCase().includes(seg.from.split(" ")[0].toLowerCase())
          );
          if (truck) {
            enriched.liveAssetId   = truck.id;
            enriched.liveAssetName = truck.plate;
            enriched.liveSource    = "road";
            if (truck.delay > 0) {
              enriched.delay  = Math.max(enriched.delay, truck.delay);
              enriched.status = truck.delay > 60 ? "delayed" : enriched.status;
            }
            if (truck.status === "stopped") {
              enriched.delay  = Math.max(enriched.delay, 90);
              enriched.status = "delayed";
            }
          }
          break;
        }
        case "air": {
          const flight = flights.find(f =>
            f.destination.toLowerCase().includes(seg.to.split(" ")[0].toLowerCase()) ||
            f.origin.toLowerCase().includes(seg.from.split(" ")[0].toLowerCase())
          );
          if (flight) {
            enriched.liveAssetId   = flight.id;
            enriched.liveAssetName = flight.flightNumber;
            enriched.liveSource    = "air";
            if (flight.delay > 0) {
              enriched.delay  = Math.max(enriched.delay, flight.delay);
              enriched.status = flight.delay > 60 ? "delayed" : enriched.status;
            }
            if (flight.status === "ground_hold" || flight.status === "diverted") {
              enriched.delay  = Math.max(enriched.delay, 180);
              enriched.status = "delayed";
            }
          }
          break;
        }
      }
      return enriched;
    });

    const maxDelay = Math.max(...enrichedSegments.map(s => s.delay));
    const newStatus: IntermodalShipment["status"] =
      maxDelay > 180 ? "critical" :
      maxDelay > 30  ? "delayed"  :
      "on_track";

    return { ...ship, segments: enrichedSegments, totalDelay: maxDelay, status: newStatus };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function computeKPI(shipments: IntermodalShipment[]): IntermodalKPI {
  const dist: Record<TransportMode, number> = { sea: 0, rail: 0, road: 0, air: 0 };
  let jonctions = 0;

  for (const s of shipments) {
    for (const seg of s.segments) dist[seg.mode]++;
    jonctions += Math.max(0, s.segments.length - 1);
  }

  const onTrack  = shipments.filter(s => s.status === "on_track" || s.status === "delivered").length;
  const delayed  = shipments.filter(s => s.status === "delayed").length;
  const critical = shipments.filter(s => s.status === "critical").length;
  const avgDelay = shipments.length > 0
    ? Math.round(shipments.reduce((acc, s) => acc + s.totalDelay, 0) / shipments.length)
    : 0;

  return {
    totalShipments: shipments.length,
    onTrack, delayed, critical, avgDelay,
    modeDistribution: dist,
    jonctionsActives: jonctions,
  };
}

function interpolatePosition(from: string, to: string, progress: number): [number, number] {
  const [fLat, fLng] = COORDS[from] ?? [5.32, -4.02];
  const [tLat, tLng] = COORDS[to]   ?? [12.37, -1.53];
  return [
    fLat + (tLat - fLat) * progress,
    fLng + (tLng - fLng) * progress,
  ];
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useIntermodalData(refreshMs = 15_000): {
  shipments: IntermodalShipment[];
  kpi: IntermodalKPI;
  loading: boolean;
  isLive: boolean;
} {
  const [baseShipments, setBaseShipments] = useState<IntermodalShipment[]>(INITIAL_SHIPMENTS);
  const [loading, setLoading] = useState(true);

  // Données live des 4 piliers
  const { vessels } = useMaritimeData(60_000);
  const { trains }  = useRailData(60_000);
  const { trucks }  = useRoadData(60_000);
  const { flights } = useAirData(60_000);

  const tick = useCallback(() => {
    setBaseShipments(prev =>
      prev.map(ship => {
        const deltaDelay = Math.round((Math.random() - 0.48) * 10);
        const newDelay   = Math.max(0, ship.totalDelay + deltaDelay);

        const activeSeg = ship.segments[ship.currentSegmentIndex];
        const progress  = 0.3 + Math.random() * 0.4;
        const [lat, lng] = activeSeg
          ? interpolatePosition(activeSeg.from, activeSeg.to, progress)
          : [ship.lat, ship.lng];

        const updatedSegments = ship.segments.map((seg, idx) => {
          if (idx !== ship.currentSegmentIndex) return seg;
          const segDelay  = Math.max(0, seg.delay + deltaDelay);
          const segStatus: Segment["status"] = segDelay > 60 ? "delayed" : "active";
          return { ...seg, delay: segDelay, status: segStatus };
        });

        const newStatus: IntermodalShipment["status"] =
          newDelay > 180 ? "critical" :
          newDelay > 30  ? "delayed"  :
          "on_track";

        return { ...ship, totalDelay: newDelay, status: newStatus, lat, lng, segments: updatedSegments };
      })
    );
  }, []);

  useEffect(() => {
    const init = setTimeout(() => setLoading(false), 600);
    const id   = setInterval(tick, refreshMs);
    return () => { clearTimeout(init); clearInterval(id); };
  }, [refreshMs, tick]);

  // Enrichissement avec données live des 4 piliers
  const shipments = enrichSegmentsWithLiveData(baseShipments, vessels, trains, trucks, flights);
  const kpi = computeKPI(shipments);
  return { shipments, kpi, loading, isLive: true };
}
