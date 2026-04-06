"use client";

import { useState, useEffect, useCallback } from "react";

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi?: string;
  type: string;
  flag: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: "transit" | "alert" | "berth";
  destination: string;
  eta: string;
  lastUpdate: string;
  // Champs enrichis AIS
  cargo?: string;
  tonnage?: number;
  cargoType?: "container" | "bulk" | "tanker" | "roro" | "general";
  approachIn24h?: boolean;  // vrai si ETA Abidjan < 24h
  etaPrevious?: string;     // ETA précédent (détection changement > 2h)
  etaChanged?: boolean;     // vrai si ETA a bougé de plus de 2h
}

export interface KpiSummary {
  activeVessels: number;
  atBerth: number;
  inTransit: number;
  congestionIndex: number;
}

export interface MaritimeAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  vessel?: string;
  timestamp: string;
}

const API_URL              = process.env.NEXT_PUBLIC_API_URL ?? "";
const AIS_API_KEY          = process.env.NEXT_PUBLIC_MARINETRAFFIC_API_KEY ?? "";
const VESSELTRACKER_KEY    = process.env.NEXT_PUBLIC_VESSELTRACKER_API_KEY ?? "";

// Centre : Port Autonome d'Abidjan
const ABJ_LAT = 5.35;
const ABJ_LON = -4.00;

// ─── Helpers AIS ──────────────────────────────────────────────────────────────

/** Distance approximative en nm entre deux points (formule haversine simplifiée) */
function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.1; // nm
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Détermine si un navire est en approche d'Abidjan dans les 24h */
function isApproachIn24h(vessel: Partial<Vessel>): boolean {
  if (!vessel.eta || vessel.destination?.toLowerCase().includes("abidjan") === false) return false;
  try {
    const etaMs = new Date(vessel.eta).getTime();
    const nowMs  = Date.now();
    return etaMs > nowMs && etaMs - nowMs < 24 * 3_600_000;
  } catch { return false; }
}

/** Détermine si l'ETA a changé de plus de 2h par rapport au précédent */
function hasEtaChanged2h(newEta: string, prevEta?: string): boolean {
  if (!prevEta) return false;
  try {
    const diff = Math.abs(new Date(newEta).getTime() - new Date(prevEta).getTime());
    return diff > 2 * 3_600_000;
  } catch { return false; }
}

/** Déduit le type de cargo depuis le type de navire */
function toCargoType(type: string): Vessel["cargoType"] {
  const t = type.toLowerCase();
  if (t.includes("conteneur") || t.includes("container")) return "container";
  if (t.includes("vraquier") || t.includes("bulk"))        return "bulk";
  if (t.includes("pétrolier") || t.includes("tanker"))     return "tanker";
  if (t.includes("ro-ro") || t.includes("roro"))           return "roro";
  return "general";
}

// ─── Mock data enrichi — navires réalistes zone Golfe de Guinée ───────────────
const tomorrow = (h: number) => {
  const d = new Date(Date.now() + h * 3_600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
};

const MOCK_VESSELS: Vessel[] = [
  // ── Port d'Abidjan — navires à quai ──────────────────────────────────────
  { id:"v1",  name:"MSC Abidjan",           imo:"9876543", mmsi:"619000001", type:"Porte-conteneurs", flag:"CI", cargoType:"container", lat:5.3083,  lng:-3.9780, speed:0,    heading:0,   status:"berth",   destination:"Port Autonome Abidjan", eta:"À quai",          cargo:"Électronique + Textiles",      tonnage:52000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v2",  name:"Boluda Abidjan",        imo:"9512340", mmsi:"224000007", type:"Remorqueur",       flag:"ES", cargoType:"general",   lat:5.2900,  lng:-3.9820, speed:3.0,  heading:90,  status:"berth",   destination:"Port Autonome Abidjan", eta:"À quai",          cargo:"Service portuaire",            tonnage:800,   approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v3",  name:"African Queen",         imo:"9334412", mmsi:"619000009", type:"Vraquier",         flag:"CI", cargoType:"bulk",      lat:5.3150,  lng:-3.9700, speed:0,    heading:180, status:"berth",   destination:"Port Autonome Abidjan", eta:"À quai",          cargo:"Cacao 45 000T",               tonnage:45000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v4",  name:"Ivoire Trader",         imo:"9445523", mmsi:"619000010", type:"Cargo général",    flag:"CI", cargoType:"general",   lat:5.3050,  lng:-3.9850, speed:0,    heading:270, status:"berth",   destination:"Port Autonome Abidjan", eta:"À quai",          cargo:"Noix de cajou 12 000T",       tonnage:12000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v5",  name:"COFCO Grain Abidjan",   imo:"9556634", mmsi:"413000011", type:"Vraquier",         flag:"CN", cargoType:"bulk",      lat:5.3200,  lng:-3.9600, speed:0,    heading:0,   status:"berth",   destination:"Port Autonome Abidjan", eta:"À quai",          cargo:"Blé importation 60 000T",     tonnage:60000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Approche immédiate Abidjan (< 24h) ───────────────────────────────────
  { id:"v6",  name:"CMA CGM Ivory Coast",   imo:"9123456", mmsi:"619000002", type:"Porte-conteneurs", flag:"FR", cargoType:"container", lat:4.80,    lng:-4.10,   speed:14.2, heading:330, status:"transit", destination:"Abidjan",               eta:tomorrow(6),       cargo:"Marchandises générales",      tonnage:66000, approachIn24h:true,  lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v7",  name:"Côte d'Ivoire Express", imo:"9852369", mmsi:"619000005", type:"Ro-Ro",            flag:"CI", cargoType:"roro",      lat:4.60,    lng:-3.80,   speed:16.4, heading:315, status:"transit", destination:"Abidjan",               eta:tomorrow(4),       cargo:"Véhicules 420 unités",        tonnage:12000, approachIn24h:true,  lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v8",  name:"Hapag-Lloyd Abidjan",   imo:"9763214", mmsi:"211000006", type:"Porte-conteneurs", flag:"DE", cargoType:"container", lat:4.20,    lng:-4.50,   speed:13.5, heading:340, status:"transit", destination:"Abidjan",               eta:tomorrow(10),      cargo:"Machines industrielles",      tonnage:71000, approachIn24h:true,  lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v9",  name:"Evergreen West Africa", imo:"9612345", mmsi:"416000012", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:3.90,    lng:-3.20,   speed:15.8, heading:305, status:"transit", destination:"Abidjan",               eta:tomorrow(18),      cargo:"Produits manufacturés Asie",  tonnage:88000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v10", name:"Maersk Abidjan",        imo:"9701234", mmsi:"219000013", type:"Porte-conteneurs", flag:"DK", cargoType:"container", lat:3.50,    lng:-2.80,   speed:17.2, heading:290, status:"transit", destination:"Abidjan",               eta:tomorrow(22),      cargo:"Équipements + Chimie",        tonnage:110000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Zone Golfe de Guinée centrale ─────────────────────────────────────────
  { id:"v11", name:"West Africa Star",      imo:"9741258", mmsi:"566000004", type:"Pétrolier",        flag:"GH", cargoType:"tanker",    lat:6.10,    lng:-2.30,   speed:0,    heading:180, status:"alert",   destination:"Port Tema",             eta:"En retard +28h",  cargo:"Pétrole brut 85 000T",        tonnage:85000, approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v12", name:"Pacific Carrier",       imo:"9654321", mmsi:"477000003", type:"Vraquier",         flag:"LR", cargoType:"bulk",      lat:3.20,    lng:-5.10,   speed:11.8, heading:45,  status:"transit", destination:"Dakar",                 eta:tomorrow(22),      cargo:"Cacao 38 000T",               tonnage:38000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v13", name:"MSC Maria",             imo:"9441892", mmsi:"229000008", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:2.50,    lng:-1.00,   speed:15.2, heading:295, status:"transit", destination:"Abidjan",               eta:tomorrow(18),      cargo:"Produits finis Asie",         tonnage:95000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v14", name:"Atlantic Voyager",      imo:"9234567", mmsi:"338000014", type:"Pétrolier",        flag:"US", cargoType:"tanker",    lat:5.50,    lng:-1.20,   speed:12.0, heading:270, status:"transit", destination:"Lagos",                 eta:tomorrow(8),       cargo:"Produits pétroliers 70 000T", tonnage:70000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v15", name:"MOL Triumph Gulf",      imo:"9345678", mmsi:"431000015", type:"Porte-conteneurs", flag:"JP", cargoType:"container", lat:1.80,    lng:2.50,    speed:14.5, heading:270, status:"transit", destination:"Lagos",                 eta:tomorrow(14),      cargo:"Électroménager + Auto",       tonnage:78000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v16", name:"Ebony Star",            imo:"9456789", mmsi:"636000016", type:"Cargo général",    flag:"LR", cargoType:"general",   lat:4.30,    lng:1.80,    speed:9.5,  heading:255, status:"transit", destination:"Cotonou",               eta:tomorrow(12),      cargo:"Riz + Produits alimentaires", tonnage:18000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v17", name:"Gulf Serenity",         imo:"9567890", mmsi:"525000017", type:"Pétrolier",        flag:"ID", cargoType:"tanker",    lat:3.80,    lng:3.40,    speed:10.2, heading:280, status:"transit", destination:"Lagos",                 eta:tomorrow(20),      cargo:"LNG 55 000T",                 tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v18", name:"CMACGM Bangui",         imo:"9678901", mmsi:"242000018", type:"Porte-conteneurs", flag:"BE", cargoType:"container", lat:2.10,    lng:4.60,    speed:13.8, heading:265, status:"transit", destination:"Lagos",                 eta:tomorrow(16),      cargo:"Biens de consommation",       tonnage:62000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Lagos / Nigeria zone ───────────────────────────────────────────────────
  { id:"v19", name:"Lagos Pioneer",         imo:"9789012", mmsi:"657000019", type:"Pétrolier",        flag:"NG", cargoType:"tanker",    lat:6.30,    lng:3.20,    speed:0,    heading:90,  status:"berth",   destination:"Port d'Apapa Lagos",    eta:"À quai",          cargo:"Pétrole brut Niger Delta",    tonnage:92000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v20", name:"Nigeria Express",       imo:"9890123", mmsi:"657000020", type:"Ro-Ro",            flag:"NG", cargoType:"roro",      lat:6.45,    lng:3.35,    speed:0,    heading:0,   status:"berth",   destination:"Port d'Apapa Lagos",    eta:"À quai",          cargo:"Véhicules d'occasion 680u",   tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v21", name:"Bonny Trader",          imo:"9901234", mmsi:"657000021", type:"Vraquier",         flag:"NG", cargoType:"bulk",      lat:4.20,    lng:6.10,    speed:8.5,  heading:310, status:"transit", destination:"Lagos",                 eta:tomorrow(28),      cargo:"Minerai de fer 48 000T",      tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v22", name:"Oando Resolve",         imo:"9012345", mmsi:"657000022", type:"Pétrolier",        flag:"NG", cargoType:"tanker",    lat:5.00,    lng:5.50,    speed:11.0, heading:285, status:"transit", destination:"Lagos",                 eta:tomorrow(10),      cargo:"Brut offshore Bonga",         tonnage:130000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Tema (Ghana) zone ─────────────────────────────────────────────────────
  { id:"v23", name:"Ghana Star",            imo:"9112233", mmsi:"627000023", type:"Porte-conteneurs", flag:"GH", cargoType:"container", lat:5.63,    lng:0.02,    speed:0,    heading:270, status:"berth",   destination:"Port de Tema",          eta:"À quai",          cargo:"Produits manufacturés",       tonnage:42000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v24", name:"Accra Venture",         imo:"9223344", mmsi:"627000024", type:"Vraquier",         flag:"GH", cargoType:"bulk",      lat:4.80,    lng:0.80,    speed:10.5, heading:270, status:"transit", destination:"Tema",                  eta:tomorrow(16),      cargo:"Clinker ciment 35 000T",      tonnage:35000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Dakar / Sénégal zone ──────────────────────────────────────────────────
  { id:"v25", name:"Dakar Liner",           imo:"9334455", mmsi:"663000025", type:"Porte-conteneurs", flag:"SN", cargoType:"container", lat:14.60,   lng:-17.50,  speed:0,    heading:180, status:"berth",   destination:"Port de Dakar",         eta:"À quai",          cargo:"Engrais + Chimie 28 000T",    tonnage:28000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v26", name:"Sénégal Express",       imo:"9445566", mmsi:"663000026", type:"Ro-Ro",            flag:"SN", cargoType:"roro",      lat:13.20,   lng:-16.80,  speed:14.0, heading:350, status:"transit", destination:"Dakar",                 eta:tomorrow(12),      cargo:"Véhicules neufs 280 unités",  tonnage:14000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v27", name:"Atlantic Pilgrim",      imo:"9556677", mmsi:"311000027", type:"Cargo général",    flag:"BS", cargoType:"general",   lat:10.50,   lng:-16.20,  speed:12.5, heading:160, status:"transit", destination:"Dakar",                 eta:tomorrow(30),      cargo:"Fret mixte",                  tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Cotonou (Bénin) zone ──────────────────────────────────────────────────
  { id:"v28", name:"Bénin Galaxy",          imo:"9667788", mmsi:"605000028", type:"Cargo général",    flag:"BJ", cargoType:"general",   lat:6.35,    lng:2.42,    speed:0,    heading:90,  status:"berth",   destination:"Port de Cotonou",       eta:"À quai",          cargo:"Riz importation 8 000T",      tonnage:8000,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v29", name:"Lomé Pioneer",          imo:"9778899", mmsi:"620000029", type:"Porte-conteneurs", flag:"TG", cargoType:"container", lat:6.12,    lng:1.28,    speed:0,    heading:0,   status:"berth",   destination:"Port de Lomé",          eta:"À quai",          cargo:"Conteneurs transit ECOWAS",   tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Routes hauturières Atlantique ────────────────────────────────────────
  { id:"v30", name:"MSC Miriam",            imo:"9889900", mmsi:"255000030", type:"Porte-conteneurs", flag:"PT", cargoType:"container", lat:-2.50,   lng:-8.20,   speed:18.0, heading:50,  status:"transit", destination:"Rotterdam via Abidjan",  eta:tomorrow(72),      cargo:"Cacao + Caoutchouc export",   tonnage:102000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v31", name:"Cosco West Africa",     imo:"9990011", mmsi:"413000031", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:-1.20,   lng:-4.50,   speed:17.5, heading:335, status:"transit", destination:"Abidjan",               eta:tomorrow(48),      cargo:"Import Chine — électronique", tonnage:115000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v32", name:"Yang Ming Dakar",       imo:"9101122", mmsi:"416000032", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:-3.80,   lng:-2.10,   speed:16.8, heading:340, status:"transit", destination:"Lagos",                 eta:tomorrow(56),      cargo:"Biens manufacturés Asie",     tonnage:98000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v33", name:"BW Odin",               imo:"9212233", mmsi:"257000033", type:"Pétrolier",        flag:"NO", cargoType:"tanker",    lat:0.50,    lng:-8.80,   speed:13.5, heading:90,  status:"transit", destination:"Abidjan OPL",           eta:tomorrow(36),      cargo:"Brut Sahara 78 000T",         tonnage:78000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v34", name:"Scorpio Harmony",       imo:"9323344", mmsi:"229000034", type:"Pétrolier",        flag:"MT", cargoType:"tanker",    lat:1.80,    lng:-10.50,  speed:12.0, heading:65,  status:"transit", destination:"Lagos OPL",             eta:tomorrow(44),      cargo:"Fuel oil 62 000T",            tonnage:62000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v35", name:"Supramax Courage",      imo:"9434455", mmsi:"518000035", type:"Vraquier",         flag:"MH", cargoType:"bulk",      lat:-4.20,   lng:-5.30,   speed:11.2, heading:15,  status:"transit", destination:"Abidjan",               eta:tomorrow(60),      cargo:"Phosphate 32 000T",           tonnage:32000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v36", name:"BBC Africa",            imo:"9545566", mmsi:"218000036", type:"Cargo général",    flag:"DE", cargoType:"general",   lat:7.20,    lng:-7.80,   speed:10.8, heading:180, status:"transit", destination:"San Pedro CI",          eta:tomorrow(14),      cargo:"Équipements lourds projet",   tonnage:15000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Golfe de Guinée nord (Nigeria offshore) ───────────────────────────────
  { id:"v37", name:"Bourbon Liberty",       imo:"9656677", mmsi:"228000037", type:"Remorqueur",       flag:"FR", cargoType:"general",   lat:4.50,    lng:4.20,    speed:8.0,  heading:45,  status:"transit", destination:"Offshore Bonga",        eta:tomorrow(6),       cargo:"Offshore supply",             tonnage:2200,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v38", name:"Seacor Power",          imo:"9767788", mmsi:"338000038", type:"Remorqueur",       flag:"US", cargoType:"general",   lat:3.60,    lng:6.80,    speed:6.5,  heading:90,  status:"transit", destination:"Port Harcourt",         eta:tomorrow(8),       cargo:"Offshore support",            tonnage:3500,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v39", name:"Armada Tuah",           imo:"9878899", mmsi:"533000039", type:"Pétrolier",        flag:"MY", cargoType:"tanker",    lat:5.80,    lng:5.10,    speed:0,    heading:270, status:"alert",   destination:"FPSO Offshore",         eta:"Maintenance OPL", cargo:"Brut condensat",              tonnage:45000, approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v40", name:"Hercules Navigator",    imo:"9989900", mmsi:"538000040", type:"Cargo général",    flag:"MH", cargoType:"general",   lat:6.80,    lng:4.90,    speed:7.2,  heading:320, status:"transit", destination:"Lagos",                 eta:tomorrow(18),      cargo:"Matériel pétrolier",          tonnage:9500,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Mouillage & zones d'attente ABJ ──────────────────────────────────────
  { id:"v41", name:"San Pedro Trader",      imo:"9090112", mmsi:"619000041", type:"Vraquier",         flag:"CI", cargoType:"bulk",      lat:4.92,    lng:-6.62,   speed:0,    heading:0,   status:"berth",   destination:"Port de San Pedro",     eta:"À quai",          cargo:"Bois + Caoutchouc 25 000T",   tonnage:25000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v42", name:"Abidjan Anchorage 1",   imo:"9101234", mmsi:"619000042", type:"Pétrolier",        flag:"LR", cargoType:"tanker",    lat:5.10,    lng:-4.20,   speed:0,    heading:45,  status:"berth",   destination:"Mouillage ABJ",         eta:"Attente quai",    cargo:"Fuel HFO 35 000T",            tonnage:35000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v43", name:"Abidjan Anchorage 2",   imo:"9112345", mmsi:"619000043", type:"Porte-conteneurs", flag:"PA", cargoType:"container", lat:5.05,    lng:-4.30,   speed:0,    heading:135, status:"berth",   destination:"Mouillage ABJ",         eta:"Attente fenêtre", cargo:"Conteneurs transit",          tonnage:58000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v44", name:"Grand Lahou Express",   imo:"9223456", mmsi:"619000044", type:"Cargo général",    flag:"CI", cargoType:"general",   lat:5.14,    lng:-5.02,   speed:9.0,  heading:90,  status:"transit", destination:"Abidjan",               eta:tomorrow(5),       cargo:"Fret côtier CI",              tonnage:4500,  approachIn24h:true,  lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v45", name:"Sassandra Belle",       imo:"9334567", mmsi:"619000045", type:"Cargo général",    flag:"CI", cargoType:"general",   lat:4.95,    lng:-6.10,   speed:8.2,  heading:70,  status:"transit", destination:"Abidjan",               eta:tomorrow(8),       cargo:"Bananes + Ananas 3 200T",     tonnage:3200,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Routes vers Europe ────────────────────────────────────────────────────
  { id:"v46", name:"MSC Gülsün Africa",     imo:"9445678", mmsi:"255000046", type:"Porte-conteneurs", flag:"PT", cargoType:"container", lat:8.50,    lng:-14.80,  speed:20.0, heading:15,  status:"transit", destination:"Rotterdam",             eta:tomorrow(96),      cargo:"Cacao + Caoutchouc export",   tonnage:228000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v47", name:"Ever Given WA",         imo:"9556789", mmsi:"357000047", type:"Porte-conteneurs", flag:"PA", cargoType:"container", lat:7.20,    lng:-12.30,  speed:19.5, heading:20,  status:"transit", destination:"Hambourg",              eta:tomorrow(108),     cargo:"Matières premières Afrique",  tonnage:180000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v48", name:"Stolt Tenacity",        imo:"9667890", mmsi:"257000048", type:"Pétrolier",        flag:"NO", cargoType:"tanker",    lat:9.80,    lng:-15.40,  speed:14.5, heading:25,  status:"transit", destination:"Marseille",             eta:tomorrow(84),      cargo:"Huile de palme 42 000T",      tonnage:42000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Vraquier zone — route minerai ────────────────────────────────────────
  { id:"v49", name:"Cargill Conqueror",     imo:"9778901", mmsi:"538000049", type:"Vraquier",         flag:"MH", cargoType:"bulk",      lat:6.50,    lng:-8.20,   speed:13.0, heading:195, status:"transit", destination:"Abidjan",               eta:tomorrow(32),      cargo:"Engrais DAP 40 000T",         tonnage:40000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v50", name:"Louis Dreyfus Grain",   imo:"9889012", mmsi:"229000050", type:"Vraquier",         flag:"MT", cargoType:"bulk",      lat:5.90,    lng:-7.10,   speed:11.5, heading:80,  status:"transit", destination:"Abidjan",               eta:tomorrow(20),      cargo:"Maïs importation 55 000T",    tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Méditerranée ───────────────────────────────────────────────────────────
  { id:"v51",  name:"MSC Fantasia",          imo:"9320679", mmsi:"248000051", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:36.10,  lng:13.50,  speed:18.0, heading:90,  status:"transit", destination:"Port-Saïd",    eta:tomorrow(20),  cargo:"Fret mixte Europe-Asie",     tonnage:137000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v52",  name:"CMA CGM Marco Polo",    imo:"9454450", mmsi:"228000052", type:"Porte-conteneurs", flag:"FR", cargoType:"container", lat:37.80,  lng:9.20,   speed:17.5, heading:100, status:"transit", destination:"Algésiras",    eta:tomorrow(16),  cargo:"Asie → Europe",              tonnage:187000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v53",  name:"Maersk Eindhoven",      imo:"9742458", mmsi:"219000053", type:"Porte-conteneurs", flag:"DK", cargoType:"container", lat:35.50,  lng:5.80,   speed:16.0, heading:275, status:"transit", destination:"Rotterdam",     eta:tomorrow(48),  cargo:"Conteneurs Asie",            tonnage:214000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v54",  name:"Costa Concordia II",    imo:"9612480", mmsi:"247000054", type:"Cargo général",    flag:"IT", cargoType:"general",   lat:38.20,  lng:15.60,  speed:12.0, heading:185, status:"transit", destination:"Palerme",      eta:tomorrow(10),  cargo:"Fret général",               tonnage:28000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v55",  name:"Tanker Helios",         imo:"9523401", mmsi:"241000055", type:"Pétrolier",        flag:"GR", cargoType:"tanker",    lat:37.50,  lng:22.80,  speed:11.0, heading:90,  status:"transit", destination:"Pirée",        eta:tomorrow(6),   cargo:"Pétrole brut 65 000T",       tonnage:65000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v56",  name:"Evergreen Ever Ace",    imo:"9801562", mmsi:"416000056", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:36.80,  lng:27.40,  speed:15.5, heading:80,  status:"transit", destination:"Port-Saïd",    eta:tomorrow(24),  cargo:"Asie → Méditerranée",        tonnage:235000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v57",  name:"Adriatic Breeze",       imo:"9334522", mmsi:"247000057", type:"Ro-Ro",            flag:"IT", cargoType:"roro",      lat:41.60,  lng:17.20,  speed:14.0, heading:140, status:"transit", destination:"Bari",         eta:tomorrow(8),   cargo:"Véhicules Europe",           tonnage:18000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Canal de Suez / Mer Rouge ──────────────────────────────────────────────
  { id:"v58",  name:"OOCL Hong Kong",        imo:"9776171", mmsi:"477000058", type:"Porte-conteneurs", flag:"HK", cargoType:"container", lat:30.80,  lng:32.30,  speed:8.0,  heading:165, status:"transit", destination:"Singapour",    eta:tomorrow(96),  cargo:"Europe → Asie",              tonnage:210000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v59",  name:"HMM Algeciras",         imo:"9863297", mmsi:"440000059", type:"Porte-conteneurs", flag:"KR", cargoType:"container", lat:28.50,  lng:33.80,  speed:12.0, heading:155, status:"transit", destination:"Jeddah",       eta:tomorrow(18),  cargo:"Fret conteneurisé",          tonnage:237000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v60",  name:"Arabian Spirit",        imo:"9445390", mmsi:"370000060", type:"Pétrolier",        flag:"PA", cargoType:"tanker",    lat:24.80,  lng:36.50,  speed:13.5, heading:160, status:"transit", destination:"Djibouti",     eta:tomorrow(28),  cargo:"Brut Arabie 95 000T",        tonnage:95000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v61",  name:"MOL Experience",        imo:"9593820", mmsi:"431000061", type:"Porte-conteneurs", flag:"JP", cargoType:"container", lat:22.10,  lng:38.40,  speed:14.0, heading:145, status:"transit", destination:"Colombo",      eta:tomorrow(72),  cargo:"Japon → Europe",             tonnage:186000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v62",  name:"Jeddah Star",           imo:"9287432", mmsi:"403000062", type:"Vraquier",         flag:"SA", cargoType:"bulk",      lat:21.50,  lng:38.80,  speed:0,    heading:0,   status:"berth",   destination:"Jeddah",       eta:"À quai",      cargo:"Céréales 45 000T",           tonnage:45000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Océan Indien ───────────────────────────────────────────────────────────
  { id:"v63",  name:"MSC Gülsün",            imo:"9839430", mmsi:"229000063", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:12.50,  lng:51.30,  speed:20.0, heading:95,  status:"transit", destination:"Singapour",    eta:tomorrow(84),  cargo:"Fret Europe → Asie",         tonnage:236000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v64",  name:"Ever Golden",           imo:"9231743", mmsi:"416000064", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:8.80,   lng:56.40,  speed:18.0, heading:90,  status:"transit", destination:"Colombo",      eta:tomorrow(36),  cargo:"Asie → Europe",              tonnage:200000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v65",  name:"Mumbai Express",        imo:"9334891", mmsi:"419000065", type:"Porte-conteneurs", flag:"IN", cargoType:"container", lat:18.90,  lng:72.80,  speed:0,    heading:90,  status:"berth",   destination:"Mumbai JNPT",  eta:"À quai",      cargo:"Import consommation",        tonnage:98000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v66",  name:"BW Mindoro",            imo:"9456780", mmsi:"352000066", type:"Pétrolier",        flag:"PA", cargoType:"tanker",    lat:5.20,   lng:63.40,  speed:14.5, heading:80,  status:"transit", destination:"Singapour",    eta:tomorrow(52),  cargo:"Brut Golfe 110 000T",        tonnage:110000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v67",  name:"Colombo Express",       imo:"9618700", mmsi:"636000067", type:"Porte-conteneurs", flag:"LR", cargoType:"container", lat:7.00,   lng:79.90,  speed:0,    heading:180, status:"berth",   destination:"Colombo",      eta:"À quai",      cargo:"Transit hub SSEA",           tonnage:132000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v68",  name:"Stena Impero",          imo:"9345845", mmsi:"422000068", type:"Pétrolier",        flag:"IR", cargoType:"tanker",    lat:25.30,  lng:57.60,  speed:11.5, heading:220, status:"transit", destination:"Bandar Abbas", eta:tomorrow(10),  cargo:"Pétrole brut 78 000T",       tonnage:78000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v69",  name:"Darya Prem",            imo:"9223900", mmsi:"419000069", type:"Vraquier",         flag:"IN", cargoType:"bulk",      lat:15.50,  lng:67.20,  speed:12.0, heading:45,  status:"transit", destination:"Kandla",       eta:tomorrow(28),  cargo:"Minerai de fer 55 000T",     tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v70",  name:"Cape Sun",              imo:"9112890", mmsi:"518000070", type:"Vraquier",         flag:"MH", cargoType:"bulk",      lat:-5.80,  lng:65.30,  speed:13.0, heading:270, status:"transit", destination:"Richards Bay", eta:tomorrow(72),  cargo:"Charbon Australie 68 000T",  tonnage:68000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Détroit de Malacca / Mer de Chine ────────────────────────────────────
  { id:"v71",  name:"COSCO Shipping Taurus", imo:"9785728", mmsi:"413000071", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:1.30,   lng:104.50, speed:16.0, heading:350, status:"transit", destination:"Shanghai",     eta:tomorrow(48),  cargo:"Monde → Chine",              tonnage:210000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v72",  name:"Singapore Voyager",     imo:"9456890", mmsi:"564000072", type:"Porte-conteneurs", flag:"SG", cargoType:"container", lat:1.25,   lng:103.82, speed:0,    heading:270, status:"berth",   destination:"Singapour PSA", eta:"À quai",     cargo:"Hub transhipment",           tonnage:145000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v73",  name:"Yang Ming Warranty",    imo:"9623139", mmsi:"416000073", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:22.30,  lng:114.20, speed:0,    heading:0,   status:"berth",   destination:"Hong Kong",    eta:"À quai",      cargo:"Asie → Monde",               tonnage:88000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v74",  name:"Formosa Carrier",       imo:"9334780", mmsi:"416000074", type:"Vraquier",         flag:"TW", cargoType:"bulk",      lat:25.10,  lng:121.80, speed:0,    heading:0,   status:"berth",   destination:"Kaohsiung",    eta:"À quai",      cargo:"Minerai acier 72 000T",      tonnage:72000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v75",  name:"Orient Eagle",          imo:"9223780", mmsi:"477000075", type:"Pétrolier",        flag:"HK", cargoType:"tanker",    lat:20.50,  lng:112.30, speed:13.0, heading:200, status:"transit", destination:"Singapour",    eta:tomorrow(24),  cargo:"LNG Australie",              tonnage:120000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v76",  name:"APL England",           imo:"9456901", mmsi:"564000076", type:"Porte-conteneurs", flag:"SG", cargoType:"container", lat:10.20,  lng:107.50, speed:15.0, heading:280, status:"transit", destination:"Singapour",    eta:tomorrow(18),  cargo:"Vietnam → monde",            tonnage:110000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Pacifique Nord ─────────────────────────────────────────────────────────
  { id:"v77",  name:"NYK Aphrodite",         imo:"9334456", mmsi:"431000077", type:"Porte-conteneurs", flag:"JP", cargoType:"container", lat:38.50,  lng:147.80, speed:20.0, heading:60,  status:"transit", destination:"Long Beach",   eta:tomorrow(72),  cargo:"Japon → USA",                tonnage:145000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v78",  name:"Pacific Highway",       imo:"9223567", mmsi:"431000078", type:"Ro-Ro",            flag:"JP", cargoType:"roro",      lat:42.80,  lng:152.40, speed:18.0, heading:55,  status:"transit", destination:"Vancouver",    eta:tomorrow(60),  cargo:"Véhicules Toyota 4 200u",    tonnage:56000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v79",  name:"Panamax Bulker",        imo:"9112678", mmsi:"354000079", type:"Vraquier",         flag:"PA", cargoType:"bulk",      lat:30.20,  lng:158.60, speed:14.0, heading:65,  status:"transit", destination:"Vancouver",    eta:tomorrow(90),  cargo:"Charbon 68 000T",            tonnage:68000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v80",  name:"Cosco Pacific Star",    imo:"9001789", mmsi:"413000080", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:35.10,  lng:164.20, speed:19.0, heading:55,  status:"transit", destination:"Los Angeles",  eta:tomorrow(80),  cargo:"Chine → USA",                tonnage:190000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v81",  name:"APL Singapore",         imo:"9112890", mmsi:"564000081", type:"Porte-conteneurs", flag:"SG", cargoType:"container", lat:28.40,  lng:172.80, speed:18.5, heading:60,  status:"transit", destination:"Los Angeles",  eta:tomorrow(76),  cargo:"Asie → USA",                 tonnage:165000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Côte Ouest USA / Pacifique Est ────────────────────────────────────────
  { id:"v82",  name:"Matson Manulani",       imo:"9334012", mmsi:"338000082", type:"Porte-conteneurs", flag:"US", cargoType:"container", lat:33.70,  lng:-118.20,speed:0,    heading:180, status:"berth",   destination:"Los Angeles",  eta:"À quai",      cargo:"Import Asie",                tonnage:52000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v83",  name:"President Truman",      imo:"9445012", mmsi:"338000083", type:"Porte-conteneurs", flag:"US", cargoType:"container", lat:37.80,  lng:-122.30,speed:0,    heading:0,   status:"berth",   destination:"Oakland",      eta:"À quai",      cargo:"Import conteneurisé",        tonnage:75000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v84",  name:"VLCC Pacific Gem",      imo:"9556012", mmsi:"538000084", type:"Pétrolier",        flag:"MH", cargoType:"tanker",    lat:25.80,  lng:-110.40,speed:15.0, heading:330, status:"transit", destination:"Long Beach",   eta:tomorrow(28),  cargo:"Brut Moyen-Orient 280 000T", tonnage:280000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v85",  name:"Alaska Trader",         imo:"9667012", mmsi:"338000085", type:"Cargo général",    flag:"US", cargoType:"general",   lat:58.30,  lng:-136.80,speed:12.0, heading:220, status:"transit", destination:"Seattle",      eta:tomorrow(18),  cargo:"Ressources Alaska",          tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Atlantique Nord ────────────────────────────────────────────────────────
  { id:"v86",  name:"Maersk Mc-Kinney",      imo:"9619907", mmsi:"219000086", type:"Porte-conteneurs", flag:"DK", cargoType:"container", lat:50.20,  lng:-32.40, speed:22.0, heading:270, status:"transit", destination:"Rotterdam",    eta:tomorrow(36),  cargo:"USA → Europe",               tonnage:194849,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v87",  name:"CMA CGM Antoine",       imo:"9703291", mmsi:"228000087", type:"Porte-conteneurs", flag:"FR", cargoType:"container", lat:46.80,  lng:-20.60, speed:19.0, heading:85,  status:"transit", destination:"Le Havre",     eta:tomorrow(28),  cargo:"Amériques → Europe",         tonnage:200000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v88",  name:"Nordic Hawk",           imo:"9334234", mmsi:"257000088", type:"Vraquier",         flag:"NO", cargoType:"bulk",      lat:62.50,  lng:-8.20,  speed:14.0, heading:15,  status:"transit", destination:"Bergen",       eta:tomorrow(20),  cargo:"Bauxite 48 000T",            tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v89",  name:"Teesta Spirit",         imo:"9445234", mmsi:"357000089", type:"Pétrolier",        flag:"PA", cargoType:"tanker",    lat:52.50,  lng:-18.30, speed:15.0, heading:100, status:"transit", destination:"Rotterdam",    eta:tomorrow(22),  cargo:"Pétrole brut 160 000T",      tonnage:160000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v90",  name:"Hoegh Target",          imo:"9556234", mmsi:"257000090", type:"Ro-Ro",            flag:"NO", cargoType:"roro",      lat:55.80,  lng:-12.40, speed:17.0, heading:90,  status:"transit", destination:"Zeebrugge",    eta:tomorrow(14),  cargo:"Véhicules neufs 6 500u",     tonnage:60000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v91",  name:"MSC Vittoria",          imo:"9667234", mmsi:"248000091", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:43.50,  lng:-40.60, speed:21.0, heading:80,  status:"transit", destination:"Algésiras",    eta:tomorrow(40),  cargo:"USA → Méditerranée",         tonnage:140000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Côte Est USA / Caraïbes ────────────────────────────────────────────────
  { id:"v92",  name:"ZIM Chicago",           imo:"9778234", mmsi:"212000092", type:"Porte-conteneurs", flag:"IL", cargoType:"container", lat:40.70,  lng:-74.00, speed:0,    heading:90,  status:"berth",   destination:"New York",     eta:"À quai",      cargo:"Import méditerranéen",       tonnage:95000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v93",  name:"Caribbean Princess",    imo:"9889234", mmsi:"311000093", type:"Cargo général",    flag:"BS", cargoType:"general",   lat:18.50,  lng:-66.10, speed:14.0, heading:230, status:"transit", destination:"Colón",        eta:tomorrow(20),  cargo:"Fret caribéen mixte",        tonnage:18000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v94",  name:"Tropical Breeze",       imo:"9990234", mmsi:"339000094", type:"Pétrolier",        flag:"TC", cargoType:"tanker",    lat:14.80,  lng:-61.20, speed:12.5, heading:180, status:"transit", destination:"Trinidad",     eta:tomorrow(16),  cargo:"Naphta 32 000T",             tonnage:32000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v95",  name:"Amazon Carrier",        imo:"9101356", mmsi:"710000095", type:"Cargo général",    flag:"BR", cargoType:"general",   lat:-3.10,  lng:-44.30, speed:11.0, heading:15,  status:"transit", destination:"Belém",        eta:tomorrow(12),  cargo:"Fret brésilien",             tonnage:14000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Atlantique Sud ─────────────────────────────────────────────────────────
  { id:"v96",  name:"Vale Brasil",           imo:"9212456", mmsi:"710000096", type:"Vraquier",         flag:"BR", cargoType:"bulk",      lat:-5.50,  lng:-35.20, speed:14.5, heading:60,  status:"transit", destination:"Roterdã",      eta:tomorrow(96),  cargo:"Minerai de fer 380 000T",    tonnage:380000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v97",  name:"Santos Express",        imo:"9323456", mmsi:"710000097", type:"Porte-conteneurs", flag:"BR", cargoType:"container", lat:-23.90, lng:-46.30, speed:0,    heading:270, status:"berth",   destination:"Santos",       eta:"À quai",      cargo:"Export Brésil",              tonnage:88000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v98",  name:"Iver Target",           imo:"9434456", mmsi:"257000098", type:"Pétrolier",        flag:"NO", cargoType:"tanker",    lat:-15.80, lng:-30.60, speed:13.5, heading:350, status:"transit", destination:"Rotterdam",    eta:tomorrow(108), cargo:"Brut Angola 110 000T",       tonnage:110000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v99",  name:"Golden Endurance",      imo:"9545456", mmsi:"538000099", type:"Vraquier",         flag:"MH", cargoType:"bulk",      lat:-33.80, lng:-51.40, speed:15.0, heading:100, status:"transit", destination:"Buenos Aires", eta:tomorrow(20),  cargo:"Grain Argentine 60 000T",    tonnage:60000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v100", name:"Buenos Aires Star",     imo:"9656456", mmsi:"701000100", type:"Cargo général",    flag:"AR", cargoType:"general",   lat:-34.60, lng:-58.40, speed:0,    heading:0,   status:"berth",   destination:"Buenos Aires", eta:"À quai",      cargo:"Conteneurs Mercosur",        tonnage:35000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Cap de Bonne-Espérance ────────────────────────────────────────────────
  { id:"v101", name:"Cape Horizon",          imo:"9767456", mmsi:"638000101", type:"Vraquier",         flag:"ZA", cargoType:"bulk",      lat:-33.90, lng:18.40,  speed:0,    heading:90,  status:"berth",   destination:"Le Cap",       eta:"À quai",      cargo:"Charbon 85 000T",            tonnage:85000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v102", name:"Durban Voyager",        imo:"9878456", mmsi:"638000102", type:"Pétrolier",        flag:"ZA", cargoType:"tanker",    lat:-29.80, lng:31.00,  speed:0,    heading:180, status:"berth",   destination:"Durban",       eta:"À quai",      cargo:"Raffiné 42 000T",            tonnage:42000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v103", name:"Seaspan Dragon",        imo:"9989456", mmsi:"477000103", type:"Porte-conteneurs", flag:"HK", cargoType:"container", lat:-38.50, lng:20.80,  speed:18.0, heading:60,  status:"transit", destination:"Singapour",    eta:tomorrow(72),  cargo:"Europe → Asie Cap",          tonnage:140000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v104", name:"Minerva Harmony",       imo:"9090567", mmsi:"241000104", type:"Pétrolier",        flag:"GR", cargoType:"tanker",    lat:-35.20, lng:25.60,  speed:14.0, heading:80,  status:"transit", destination:"Mumbai",       eta:tomorrow(96),  cargo:"Pétrole Atlantique 72 000T", tonnage:72000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Côte Ouest Afrique ────────────────────────────────────────────────────
  { id:"v105", name:"Luanda Pioneer",        imo:"9101678", mmsi:"603000105", type:"Pétrolier",        flag:"AO", cargoType:"tanker",    lat:-8.80,  lng:13.20,  speed:0,    heading:270, status:"berth",   destination:"Luanda",       eta:"À quai",      cargo:"Brut Angola 150 000T",       tonnage:150000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v106", name:"Congo River",           imo:"9212678", mmsi:"615000106", type:"Cargo général",    flag:"CG", cargoType:"general",   lat:-4.30,  lng:15.30,  speed:9.0,  heading:215, status:"transit", destination:"Pointe-Noire", eta:tomorrow(8),   cargo:"Bois + matières premières",  tonnage:12000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v107", name:"Cameroon Star",         imo:"9323678", mmsi:"613000107", type:"Pétrolier",        flag:"CM", cargoType:"tanker",    lat:4.00,   lng:9.70,   speed:0,    heading:180, status:"berth",   destination:"Douala",       eta:"À quai",      cargo:"Brut Cameroun 38 000T",      tonnage:38000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v108", name:"Maputo Carrier",        imo:"9434678", mmsi:"638000108", type:"Vraquier",         flag:"MZ", cargoType:"bulk",      lat:-25.90, lng:32.60,  speed:0,    heading:0,   status:"berth",   destination:"Maputo",       eta:"À quai",      cargo:"Charbon + Titane 30 000T",   tonnage:30000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Europe du Nord ─────────────────────────────────────────────────────────
  { id:"v109", name:"Emma Mærsk",            imo:"9321483", mmsi:"219000109", type:"Porte-conteneurs", flag:"DK", cargoType:"container", lat:55.70,  lng:12.60,  speed:0,    heading:270, status:"berth",   destination:"Copenhague",   eta:"À quai",      cargo:"Asie → Scandinavie",         tonnage:156907,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v110", name:"Rotterdam Carrier",     imo:"9445789", mmsi:"245000110", type:"Porte-conteneurs", flag:"NL", cargoType:"container", lat:51.90,  lng:4.10,   speed:0,    heading:90,  status:"berth",   destination:"Rotterdam",    eta:"À quai",      cargo:"Hub Europe principal",       tonnage:180000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v111", name:"Normandie Express",     imo:"9556789", mmsi:"228000111", type:"Ro-Ro",            flag:"FR", cargoType:"roro",      lat:49.50,  lng:-0.10,  speed:0,    heading:90,  status:"berth",   destination:"Le Havre",     eta:"À quai",      cargo:"Véhicules 3 200 unités",     tonnage:32000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v112", name:"Baltic Ace",            imo:"9667789", mmsi:"245000112", type:"Ro-Ro",            flag:"NL", cargoType:"roro",      lat:57.20,  lng:18.60,  speed:14.0, heading:200, status:"transit", destination:"Zeebrugge",    eta:tomorrow(24),  cargo:"Véhicules Baltique",         tonnage:44000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v113", name:"LNG Lerici",            imo:"9778789", mmsi:"247000113", type:"Pétrolier",        flag:"IT", cargoType:"tanker",    lat:44.20,  lng:8.30,   speed:0,    heading:90,  status:"berth",   destination:"Gênes",        eta:"À quai",      cargo:"LNG 130 000T",               tonnage:130000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Moyen-Orient / Golfe Persique ─────────────────────────────────────────
  { id:"v114", name:"Al Karaama",            imo:"9889789", mmsi:"470000114", type:"Pétrolier",        flag:"AE", cargoType:"tanker",    lat:25.30,  lng:55.30,  speed:0,    heading:180, status:"berth",   destination:"Dubaï",        eta:"À quai",      cargo:"Brut 200 000T",              tonnage:200000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v115", name:"Qatar LNG Pioneer",     imo:"9990789", mmsi:"466000115", type:"Pétrolier",        flag:"QA", cargoType:"tanker",    lat:25.90,  lng:51.60,  speed:0,    heading:270, status:"berth",   destination:"Ras Laffan",   eta:"À quai",      cargo:"LNG Qatar 266 000T",         tonnage:266000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v116", name:"Bahri Yanbu",           imo:"9091012", mmsi:"403000116", type:"Pétrolier",        flag:"SA", cargoType:"tanker",    lat:24.10,  lng:45.80,  speed:15.0, heading:200, status:"transit", destination:"Jubail",       eta:tomorrow(12),  cargo:"Brut Saudi Aramco 280 000T", tonnage:280000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v117", name:"Seri Alam",             imo:"9202012", mmsi:"533000117", type:"Pétrolier",        flag:"MY", cargoType:"tanker",    lat:27.80,  lng:50.20,  speed:12.0, heading:150, status:"transit", destination:"Dubaï",        eta:tomorrow(8),   cargo:"Raffiné 65 000T",            tonnage:65000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Australie / Pacifique Sud ─────────────────────────────────────────────
  { id:"v118", name:"BHP Iron Chieftain",    imo:"9313012", mmsi:"503000118", type:"Vraquier",         flag:"AU", cargoType:"bulk",      lat:-31.90, lng:115.80, speed:0,    heading:270, status:"berth",   destination:"Port Hedland", eta:"À quai",      cargo:"Minerai de fer 220 000T",    tonnage:220000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v119", name:"Pacific Seagull",       imo:"9424012", mmsi:"503000119", type:"Vraquier",         flag:"AU", cargoType:"bulk",      lat:-22.80, lng:151.20, speed:13.0, heading:310, status:"transit", destination:"Chine",        eta:tomorrow(72),  cargo:"Charbon Queensland",         tonnage:95000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v120", name:"Auckland Star",         imo:"9535012", mmsi:"512000120", type:"Cargo général",    flag:"NZ", cargoType:"general",   lat:-36.80, lng:174.80, speed:0,    heading:180, status:"berth",   destination:"Auckland",     eta:"À quai",      cargo:"Import Asie + Pacifique",    tonnage:28000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Arctique / Mer du Nord ────────────────────────────────────────────────
  { id:"v121", name:"Arctic Spirit",         imo:"9646012", mmsi:"257000121", type:"Pétrolier",        flag:"NO", cargoType:"tanker",    lat:70.80,  lng:29.80,  speed:10.0, heading:200, status:"transit", destination:"Murmansk",     eta:tomorrow(18),  cargo:"LNG Arctique 170 000T",      tonnage:170000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v122", name:"Ob River",              imo:"9757012", mmsi:"273000122", type:"Pétrolier",        flag:"RU", cargoType:"tanker",    lat:72.50,  lng:55.20,  speed:8.0,  heading:90,  status:"transit", destination:"Yamal LNG",    eta:tomorrow(24),  cargo:"LNG route Nord-Est",         tonnage:172000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Mer Noire / Caspienne ─────────────────────────────────────────────────
  { id:"v123", name:"BW Baltic",             imo:"9868012", mmsi:"209000123", type:"Pétrolier",        flag:"CY", cargoType:"tanker",    lat:44.60,  lng:33.50,  speed:12.0, heading:180, status:"transit", destination:"Novorossiysk", eta:tomorrow(10),  cargo:"Pétrole Mer Noire 55 000T",  tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v124", name:"Odessa Star",           imo:"9979012", mmsi:"272000124", type:"Vraquier",         flag:"UA", cargoType:"bulk",      lat:46.50,  lng:30.70,  speed:0,    heading:0,   status:"berth",   destination:"Odessa",       eta:"À quai",      cargo:"Céréales Ukraine 38 000T",   tonnage:38000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Canal de Panama / Pacifique Central ──────────────────────────────────
  { id:"v125", name:"Evergreen Emerald",     imo:"9080123", mmsi:"416000125", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:8.90,   lng:-79.60, speed:7.0,  heading:290, status:"transit", destination:"Canal Panama", eta:tomorrow(4),   cargo:"Asie → Atlantique",          tonnage:180000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v126", name:"MSC Panama",            imo:"9191123", mmsi:"373000126", type:"Porte-conteneurs", flag:"PA", cargoType:"container", lat:7.50,   lng:-79.90, speed:5.5,  heading:350, status:"transit", destination:"Colon",        eta:tomorrow(6),   cargo:"File d'attente canal",       tonnage:145000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v127", name:"Callao Express",        imo:"9302123", mmsi:"760000127", type:"Porte-conteneurs", flag:"PE", cargoType:"container", lat:-12.00, lng:-77.10, speed:0,    heading:180, status:"berth",   destination:"Callao",       eta:"À quai",      cargo:"Import Asie-Pacifique",      tonnage:72000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Mer de Chine Méridionale étendue ─────────────────────────────────────
  { id:"v128", name:"Wan Hai 503",           imo:"9413123", mmsi:"416000128", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:13.80,  lng:109.20, speed:15.0, heading:195, status:"transit", destination:"Singapour",    eta:tomorrow(28),  cargo:"Vietnam → Singapour",        tonnage:68000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v129", name:"Philippine Pioneer",    imo:"9524123", mmsi:"548000129", type:"Ro-Ro",            flag:"PH", cargoType:"roro",      lat:14.60,  lng:120.90, speed:0,    heading:270, status:"berth",   destination:"Manille",      eta:"À quai",      cargo:"Véhicules 1 800 unités",     tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v130", name:"Haiphong Star",         imo:"9635123", mmsi:"574000130", type:"Cargo général",    flag:"VN", cargoType:"general",   lat:20.90,  lng:106.70, speed:0,    heading:0,   status:"berth",   destination:"Haïphong",     eta:"À quai",      cargo:"Export textile + électro",   tonnage:32000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Indonésie / Océanie ───────────────────────────────────────────────────
  { id:"v131", name:"Meratus Jayakarta",     imo:"9746123", mmsi:"525000131", type:"Porte-conteneurs", flag:"ID", cargoType:"container", lat:-6.10,  lng:106.80, speed:0,    heading:270, status:"berth",   destination:"Jakarta",      eta:"À quai",      cargo:"Import archipel",            tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v132", name:"Papua LNG",             imo:"9857123", mmsi:"503000132", type:"Pétrolier",        flag:"AU", cargoType:"tanker",    lat:-5.50,  lng:145.80, speed:12.0, heading:20,  status:"transit", destination:"Japon",        eta:tomorrow(60),  cargo:"LNG PNG 155 000T",           tonnage:155000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Mer Méditerranée Est / Turquie ────────────────────────────────────────
  { id:"v133", name:"Istanbul Carrier",      imo:"9968123", mmsi:"271000133", type:"Ro-Ro",            flag:"TR", cargoType:"roro",      lat:41.00,  lng:28.90,  speed:0,    heading:0,   status:"berth",   destination:"Istanbul",     eta:"À quai",      cargo:"Véhicules export",           tonnage:38000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v134", name:"Bosphorus Star",        imo:"9079234", mmsi:"271000134", type:"Pétrolier",        flag:"TR", cargoType:"tanker",    lat:41.20,  lng:29.10,  speed:8.0,  heading:0,   status:"transit", destination:"Bosphore",     eta:tomorrow(4),   cargo:"Pétrole Mer Noire 45 000T",  tonnage:45000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Zones éloignées / Long courrier ──────────────────────────────────────
  { id:"v135", name:"Sovereign Majestic",    imo:"9190234", mmsi:"518000135", type:"Porte-conteneurs", flag:"MH", cargoType:"container", lat:-18.50, lng:-28.80, speed:19.0, heading:100, status:"transit", destination:"Le Cap",       eta:tomorrow(96),  cargo:"Amériques → Asie Cap Horn",  tonnage:165000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v136", name:"Pacific Wanderer",      imo:"9301234", mmsi:"512000136", type:"Vraquier",         flag:"NZ", cargoType:"bulk",      lat:-42.50, lng:-158.80,speed:14.0, heading:280, status:"transit", destination:"Valparaíso",   eta:tomorrow(72),  cargo:"Charbon NZ 52 000T",         tonnage:52000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v137", name:"Polar Explorer",        imo:"9412234", mmsi:"232000137", type:"Cargo général",    flag:"GB", cargoType:"general",   lat:78.20,  lng:-18.60, speed:8.0,  heading:90,  status:"transit", destination:"Longyearbyen", eta:tomorrow(20),  cargo:"Approvisionnement Svalbard", tonnage:8000,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v138", name:"MSC Mia",               imo:"9523234", mmsi:"229000138", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:-28.20, lng:-45.60, speed:20.0, heading:60,  status:"transit", destination:"Rotterdam",    eta:tomorrow(120), cargo:"Amériques → Europe",         tonnage:198000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v139", name:"Maersk Honam",          imo:"9634234", mmsi:"219000139", type:"Porte-conteneurs", flag:"DK", cargoType:"container", lat:16.20,  lng:82.50,  speed:18.0, heading:280, status:"transit", destination:"Colombo",      eta:tomorrow(36),  cargo:"Asie → Europe via Suez",     tonnage:210000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v140", name:"VLCC Genco",            imo:"9745234", mmsi:"538000140", type:"Pétrolier",        flag:"MH", cargoType:"tanker",    lat:-12.80, lng:48.60,  speed:15.0, heading:210, status:"transit", destination:"Durban",       eta:tomorrow(48),  cargo:"Brut Golfe → Afrique Sud",   tonnage:295000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v141", name:"Hanjin Greece",         imo:"9856234", mmsi:"440000141", type:"Porte-conteneurs", flag:"KR", cargoType:"container", lat:35.20,  lng:128.50, speed:0,    heading:90,  status:"berth",   destination:"Busan",        eta:"À quai",      cargo:"Corée export + import",      tonnage:130000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v142", name:"MSC Zephyr",            imo:"9967234", mmsi:"229000142", type:"Porte-conteneurs", flag:"MT", cargoType:"container", lat:1.50,   lng:-18.50, speed:21.0, heading:90,  status:"transit", destination:"Tanger Med",   eta:tomorrow(60),  cargo:"Transatlantique express",    tonnage:175000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v143", name:"Pacific Bulker",        imo:"9078345", mmsi:"354000143", type:"Vraquier",         flag:"PA", cargoType:"bulk",      lat:48.50,  lng:-140.20,speed:14.5, heading:90,  status:"transit", destination:"Vancouver",    eta:tomorrow(28),  cargo:"Blé USA 62 000T",            tonnage:62000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v144", name:"Handy Star",            imo:"9189345", mmsi:"636000144", type:"Vraquier",         flag:"LR", cargoType:"bulk",      lat:-8.20,  lng:-32.80, speed:12.5, heading:180, status:"transit", destination:"Buenos Aires", eta:tomorrow(80),  cargo:"Sucre brésilien 28 000T",    tonnage:28000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v145", name:"Daewoo Orion",          imo:"9290345", mmsi:"440000145", type:"Porte-conteneurs", flag:"KR", cargoType:"container", lat:26.50,  lng:126.80, speed:17.0, heading:230, status:"transit", destination:"Singapour",    eta:tomorrow(44),  cargo:"Corée → ASEAN",              tonnage:98000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Quelques navires en alerte / retard ───────────────────────────────────
  { id:"v146", name:"Ever Forward",          imo:"9401345", mmsi:"416000146", type:"Porte-conteneurs", flag:"TW", cargoType:"container", lat:38.90,  lng:-76.40, speed:0,    heading:0,   status:"alert",   destination:"Baltimore",    eta:"Échoué temp.", cargo:"Asie → Baltim 5 000 EVP",    tonnage:116000,approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v147", name:"Endurance III",         imo:"9512345", mmsi:"538000147", type:"Vraquier",         flag:"MH", cargoType:"bulk",      lat:-60.80, lng:-44.60, speed:0,    heading:135, status:"alert",   destination:"Stanley FK",   eta:"Urgence météo",cargo:"Fret Antarctique",           tonnage:15000, approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v148", name:"Gulf Orion",            imo:"9623345", mmsi:"470000148", type:"Pétrolier",        flag:"AE", cargoType:"tanker",    lat:26.20,  lng:56.30,  speed:0,    heading:90,  status:"alert",   destination:"Hormuz",       eta:"Retard +48h",  cargo:"Brut UAE 160 000T",          tonnage:160000,approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v149", name:"Bourbon Argos",         imo:"9734345", mmsi:"228000149", type:"Remorqueur",       flag:"FR", cargoType:"general",   lat:-24.80, lng:15.20,  speed:11.0, heading:180, status:"alert",   destination:"Assistance",   eta:"SAR en cours", cargo:"Mission sauvetage",          tonnage:3200,  approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v150", name:"MSC Flaminia",          imo:"9845345", mmsi:"255000150", type:"Porte-conteneurs", flag:"PT", cargoType:"container", lat:46.80,  lng:-12.50, speed:0,    heading:270, status:"alert",   destination:"Brest",        eta:"Avarie moteur", cargo:"Asie → Europe dérouté",      tonnage:88000, approachIn24h:false, etaChanged:true, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Remplissage Pacifique / zones vides ───────────────────────────────────
  { id:"v151", name:"Pacific Dream",         imo:"9956345", mmsi:"354000151", type:"Vraquier",         flag:"PA", cargoType:"bulk",      lat:15.50,  lng:-130.80,speed:13.5, heading:275, status:"transit", destination:"Hawaï",        eta:tomorrow(40),  cargo:"Grain US West",              tonnage:58000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v152", name:"Honolulu Star",         imo:"9067456", mmsi:"338000152", type:"Cargo général",    flag:"US", cargoType:"general",   lat:21.30,  lng:-157.80,speed:0,    heading:270, status:"berth",   destination:"Honolulu",     eta:"À quai",      cargo:"Approvisionnement Hawaï",    tonnage:18000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v153", name:"Indian Ocean Trader",   imo:"9178456", mmsi:"419000153", type:"Pétrolier",        flag:"IN", cargoType:"tanker",    lat:-15.20, lng:80.80,  speed:14.0, heading:270, status:"transit", destination:"Mombasa",      eta:tomorrow(52),  cargo:"Raffiné océan Indien",       tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v154", name:"East Africa Pioneer",   imo:"9289456", mmsi:"630000154", type:"Cargo général",    flag:"KE", cargoType:"general",   lat:-4.10,  lng:39.70,  speed:10.0, heading:15,  status:"transit", destination:"Mombasa",      eta:tomorrow(8),   cargo:"Fret côte est Afrique",      tonnage:12000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v155", name:"Suezmax Fortuna",       imo:"9390456", mmsi:"229000155", type:"Pétrolier",        flag:"MT", cargoType:"tanker",    lat:32.50,  lng:29.80,  speed:13.0, heading:195, status:"transit", destination:"Alexandrie",   eta:tomorrow(12),  cargo:"Brut Suez 145 000T",         tonnage:145000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v156", name:"Capesize Tiger",        imo:"9501456", mmsi:"477000156", type:"Vraquier",         flag:"HK", cargoType:"bulk",      lat:-18.80, lng:118.50, speed:15.0, heading:280, status:"transit", destination:"Chine",        eta:tomorrow(60),  cargo:"Minerai Pilbara 180 000T",   tonnage:180000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v157", name:"Alang Carrier",         imo:"9612456", mmsi:"419000157", type:"Cargo général",    flag:"IN", cargoType:"general",   lat:22.30,  lng:72.20,  speed:0,    heading:0,   status:"berth",   destination:"Surat",        eta:"À quai",      cargo:"Ferraille recyclage",        tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v158", name:"Caribbean Bulker",      imo:"9723456", mmsi:"311000158", type:"Vraquier",         flag:"BS", cargoType:"bulk",      lat:10.20,  lng:-61.80, speed:11.0, heading:15,  status:"transit", destination:"Georgetown",   eta:tomorrow(18),  cargo:"Bauxite Guyana 35 000T",     tonnage:35000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v159", name:"Trans-Atlantic Bridge", imo:"9834456", mmsi:"636000159", type:"Porte-conteneurs", flag:"LR", cargoType:"container", lat:28.50,  lng:-38.20, speed:19.5, heading:95,  status:"transit", destination:"Tanger Med",   eta:tomorrow(52),  cargo:"USA/Caraïbes → Europe",      tonnage:152000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v160", name:"South China Star",      imo:"9945456", mmsi:"477000160", type:"Pétrolier",        flag:"HK", cargoType:"tanker",    lat:18.80,  lng:115.50, speed:12.5, heading:220, status:"transit", destination:"Singapour",    eta:tomorrow(28),  cargo:"Brut offshore 85 000T",      tonnage:85000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v161", name:"Adriatic Pioneer",      imo:"9056567", mmsi:"338000161", type:"Vraquier",         flag:"US", cargoType:"bulk",      lat:44.80,  lng:-63.20, speed:12.0, heading:120, status:"transit", destination:"Baltimore",    eta:tomorrow(24),  cargo:"Potasse Canada 42 000T",     tonnage:42000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v162", name:"Santiago Express",      imo:"9167567", mmsi:"725000162", type:"Porte-conteneurs", flag:"CL", cargoType:"container", lat:-33.50, lng:-71.60, speed:0,    heading:270, status:"berth",   destination:"Valparaíso",   eta:"À quai",      cargo:"Import Asie-Pacifique",      tonnage:62000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v163", name:"Korean Express",        imo:"9278567", mmsi:"440000163", type:"Porte-conteneurs", flag:"KR", cargoType:"container", lat:45.20,  lng:132.80, speed:18.0, heading:55,  status:"transit", destination:"Long Beach",   eta:tomorrow(96),  cargo:"Corée → côte Ouest USA",     tonnage:118000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v164", name:"Amsterdam Carrier",     imo:"9389567", mmsi:"245000164", type:"Vraquier",         flag:"NL", cargoType:"bulk",      lat:53.20,  lng:4.80,   speed:10.0, heading:180, status:"transit", destination:"Rotterdam",    eta:tomorrow(8),   cargo:"Céréales transit 48 000T",   tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v165", name:"Fujian Carrier",        imo:"9490567", mmsi:"413000165", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:24.40,  lng:118.10, speed:0,    heading:270, status:"berth",   destination:"Xiamen",       eta:"À quai",      cargo:"Hub export Chine",           tonnage:142000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v166", name:"Western Sahara Wind",   imo:"9601567", mmsi:"274000166", type:"Cargo général",    flag:"MA", cargoType:"general",   lat:27.90,  lng:-13.60, speed:10.5, heading:200, status:"transit", destination:"Las Palmas",   eta:tomorrow(14),  cargo:"Phosphate Maroc 15 000T",    tonnage:15000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v167", name:"East Med Harmony",      imo:"9712567", mmsi:"209000167", type:"Pétrolier",        flag:"CY", cargoType:"tanker",    lat:34.70,  lng:33.10,  speed:12.5, heading:210, status:"transit", destination:"Limassol",     eta:tomorrow(6),   cargo:"Raffiné Méditerranée",       tonnage:42000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v168", name:"Caribbean LNG",         imo:"9823567", mmsi:"358000168", type:"Pétrolier",        flag:"PA", cargoType:"tanker",    lat:10.60,  lng:-71.60, speed:13.0, heading:50,  status:"transit", destination:"Boston",       eta:tomorrow(40),  cargo:"LNG Trinidad 155 000T",      tonnage:155000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v169", name:"East African Cargo",    imo:"9934567", mmsi:"630000169", type:"Cargo général",    flag:"KE", cargoType:"general",   lat:-11.70, lng:43.30,  speed:9.0,  heading:330, status:"transit", destination:"Djibouti",     eta:tomorrow(24),  cargo:"Fret Afrique Est",           tonnage:14000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v170", name:"Ulsan Heavy",           imo:"9045678", mmsi:"440000170", type:"Vraquier",         flag:"KR", cargoType:"bulk",      lat:35.60,  lng:129.40, speed:0,    heading:90,  status:"berth",   destination:"Ulsan",        eta:"À quai",      cargo:"Minerai + acier 75 000T",    tonnage:75000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },

  // ── Derniers navires — bouclage global ────────────────────────────────────
  { id:"v171", name:"Norse Carrier",         imo:"9156678", mmsi:"257000171", type:"Vraquier",         flag:"NO", cargoType:"bulk",      lat:65.50,  lng:14.20,  speed:11.0, heading:200, status:"transit", destination:"Narvik",       eta:tomorrow(10),  cargo:"Minerai de fer 48 000T",     tonnage:48000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v172", name:"Celtic Commander",      imo:"9267678", mmsi:"232000172", type:"Cargo général",    flag:"GB", cargoType:"general",   lat:52.00,  lng:-5.10,  speed:12.0, heading:150, status:"transit", destination:"Cork",         eta:tomorrow(6),   cargo:"Fret irlandais",             tonnage:8500,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v173", name:"Iberian Star",          imo:"9378678", mmsi:"224000173", type:"Ro-Ro",            flag:"ES", cargoType:"roro",      lat:38.70,  lng:-9.10,  speed:0,    heading:180, status:"berth",   destination:"Lisbonne",     eta:"À quai",      cargo:"Véhicules 2 400 unités",     tonnage:28000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v174", name:"Gold Coast Pioneer",    imo:"9489678", mmsi:"627000174", type:"Vraquier",         flag:"GH", cargoType:"bulk",      lat:5.40,   lng:-0.20,  speed:0,    heading:270, status:"berth",   destination:"Tema",         eta:"À quai",      cargo:"Cocoa + Manganese 25 000T",  tonnage:25000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v175", name:"Caspian Wind",          imo:"9590678", mmsi:"273000175", type:"Pétrolier",        flag:"RU", cargoType:"tanker",    lat:41.80,  lng:51.50,  speed:10.5, heading:330, status:"transit", destination:"Baku",         eta:tomorrow(10),  cargo:"Brut Caspien 58 000T",       tonnage:58000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v176", name:"Yangtze River",         imo:"9701678", mmsi:"413000176", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:30.60,  lng:122.10, speed:0,    heading:90,  status:"berth",   destination:"Shanghai",     eta:"À quai",      cargo:"Hub export mondial",         tonnage:195000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v177", name:"Transworld Eagle",      imo:"9812678", mmsi:"636000177", type:"Vraquier",         flag:"LR", cargoType:"bulk",      lat:-2.50,  lng:-42.80, speed:12.0, heading:30,  status:"transit", destination:"Manaus",       eta:tomorrow(36),  cargo:"Fret Amazonie 18 000T",      tonnage:18000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v178", name:"Pacific Voyager",       imo:"9923678", mmsi:"354000178", type:"Pétrolier",        flag:"PA", cargoType:"tanker",    lat:-8.50,  lng:-108.40,speed:14.0, heading:100, status:"transit", destination:"Manzanillo",   eta:tomorrow(44),  cargo:"Raffiné 72 000T",            tonnage:72000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v179", name:"Maritime Wonder",       imo:"9034789", mmsi:"518000179", type:"Porte-conteneurs", flag:"MH", cargoType:"container", lat:-35.80, lng:138.50, speed:17.0, heading:310, status:"transit", destination:"Singapour",    eta:tomorrow(72),  cargo:"Australie → Monde",          tonnage:128000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v180", name:"Sirius Star",           imo:"9145789", mmsi:"403000180", type:"Pétrolier",        flag:"SA", cargoType:"tanker",    lat:-10.50, lng:40.80,  speed:15.0, heading:170, status:"transit", destination:"Dar es Salaam",eta:tomorrow(28),  cargo:"Brut export Saudi 318 000T", tonnage:318000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v181", name:"Shandong Pioneer",      imo:"9256789", mmsi:"413000181", type:"Vraquier",         flag:"CN", cargoType:"bulk",      lat:36.90,  lng:119.60, speed:0,    heading:0,   status:"berth",   destination:"Qingdao",      eta:"À quai",      cargo:"Minerai import 165 000T",    tonnage:165000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v182", name:"Baltic Trader",         imo:"9367789", mmsi:"276000182", type:"Cargo général",    flag:"EE", cargoType:"general",   lat:59.40,  lng:24.80,  speed:11.0, heading:280, status:"transit", destination:"Tallinn",      eta:tomorrow(8),   cargo:"Fret baltique mixte",        tonnage:9500,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v183", name:"Dakar Progress",        imo:"9478789", mmsi:"663000183", type:"Vraquier",         flag:"SN", cargoType:"bulk",      lat:12.20,  lng:-15.80, speed:10.0, heading:350, status:"transit", destination:"Dakar",        eta:tomorrow(12),  cargo:"Phosphate 22 000T",          tonnage:22000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v184", name:"VLCC Bravo",            imo:"9589789", mmsi:"538000184", type:"Pétrolier",        flag:"MH", cargoType:"tanker",    lat:10.80,  lng:45.20,  speed:14.5, heading:175, status:"transit", destination:"Singapour",    eta:tomorrow(80),  cargo:"Brut Golfe → Asie 300 000T", tonnage:300000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v185", name:"Amazon Giant",          imo:"9690789", mmsi:"710000185", type:"Vraquier",         flag:"BR", cargoType:"bulk",      lat:-5.80,  lng:-35.20, speed:13.0, heading:45,  status:"transit", destination:"Roterdã",      eta:tomorrow(96),  cargo:"Soja brésilien 75 000T",     tonnage:75000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v186", name:"Hellenic Carrier",      imo:"9801789", mmsi:"241000186", type:"Vraquier",         flag:"GR", cargoType:"bulk",      lat:37.90,  lng:23.60,  speed:0,    heading:180, status:"berth",   destination:"Le Pirée",     eta:"À quai",      cargo:"Céréales Mer Noire",         tonnage:55000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v187", name:"Indian Star",           imo:"9912789", mmsi:"419000187", type:"Pétrolier",        flag:"IN", cargoType:"tanker",    lat:11.90,  lng:79.80,  speed:0,    heading:90,  status:"berth",   destination:"Chennai",      eta:"À quai",      cargo:"Raffiné import 38 000T",     tonnage:38000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v188", name:"Coral Bay",             imo:"9023890", mmsi:"503000188", type:"Cargo général",    flag:"AU", cargoType:"general",   lat:-16.90, lng:145.80, speed:9.0,  heading:180, status:"transit", destination:"Cairns",       eta:tomorrow(10),  cargo:"Approvisionnement NQ",       tonnage:6500,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v189", name:"Cape Verde Carrier",    imo:"9134890", mmsi:"617000189", type:"Cargo général",    flag:"CV", cargoType:"general",   lat:15.10,  lng:-23.60, speed:9.5,  heading:270, status:"transit", destination:"Praia",        eta:tomorrow(6),   cargo:"Approvisionnement îles",     tonnage:4200,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v190", name:"Trans-Pacific Hero",    imo:"9245890", mmsi:"477000190", type:"Porte-conteneurs", flag:"HK", cargoType:"container", lat:5.50,   lng:135.80, speed:20.0, heading:75,  status:"transit", destination:"Los Angeles",  eta:tomorrow(88),  cargo:"Asie → USA Pacifique",       tonnage:196000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v191", name:"Emerald Isle",          imo:"9356890", mmsi:"250000191", type:"Ro-Ro",            flag:"IE", cargoType:"roro",      lat:53.30,  lng:-6.30,  speed:0,    heading:0,   status:"berth",   destination:"Dublin",       eta:"À quai",      cargo:"Fret routier RoRo",          tonnage:16000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v192", name:"Andean Condor",         imo:"9467890", mmsi:"730000192", type:"Cargo général",    flag:"EC", cargoType:"general",   lat:-2.20,  lng:-80.00, speed:10.5, heading:280, status:"transit", destination:"Guayaquil",    eta:tomorrow(8),   cargo:"Export bananes Équateur",    tonnage:10000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v193", name:"Nile Delta Express",    imo:"9578890", mmsi:"622000193", type:"Porte-conteneurs", flag:"EG", cargoType:"container", lat:31.20,  lng:32.00,  speed:0,    heading:90,  status:"berth",   destination:"Port-Saïd",    eta:"À quai",      cargo:"Hub transit Suez",           tonnage:88000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v194", name:"Black Pearl",           imo:"9689890", mmsi:"636000194", type:"Pétrolier",        flag:"LR", cargoType:"tanker",    lat:-19.80, lng:63.40,  speed:14.5, heading:280, status:"transit", destination:"Durban",       eta:tomorrow(36),  cargo:"Brut transit océan Indien",  tonnage:88000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v195", name:"Nordic Bulk Carrier",   imo:"9790890", mmsi:"257000195", type:"Vraquier",         flag:"NO", cargoType:"bulk",      lat:58.90,  lng:5.80,   speed:0,    heading:0,   status:"berth",   destination:"Stavanger",    eta:"À quai",      cargo:"Bauxite + aluminium",        tonnage:62000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v196", name:"Gulf of Mexico Star",   imo:"9901890", mmsi:"338000196", type:"Pétrolier",        flag:"US", cargoType:"tanker",    lat:25.80,  lng:-89.40, speed:0,    heading:90,  status:"berth",   destination:"Houston",      eta:"À quai",      cargo:"Offshore GoM 65 000T",       tonnage:65000, approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v197", name:"Suez Express",          imo:"9012901", mmsi:"255000197", type:"Porte-conteneurs", flag:"PT", cargoType:"container", lat:29.90,  lng:32.60,  speed:6.0,  heading:155, status:"transit", destination:"Djibouti",     eta:tomorrow(36),  cargo:"Europe → Asie via Suez",     tonnage:175000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v198", name:"Malagasy Pioneer",      imo:"9123901", mmsi:"663000198", type:"Cargo général",    flag:"MG", cargoType:"general",   lat:-18.90, lng:47.50,  speed:8.5,  heading:95,  status:"transit", destination:"Toamasina",    eta:tomorrow(12),  cargo:"Import Madagascar",          tonnage:8000,  approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v199", name:"Shanghai Master",       imo:"9234901", mmsi:"413000199", type:"Porte-conteneurs", flag:"CN", cargoType:"container", lat:31.40,  lng:121.60, speed:0,    heading:0,   status:"berth",   destination:"Shanghai",     eta:"À quai",      cargo:"N°1 port mondial",           tonnage:220000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
  { id:"v200", name:"Global Horizon",        imo:"9345901", mmsi:"518000200", type:"Porte-conteneurs", flag:"MH", cargoType:"container", lat:-0.50,  lng:-1.50,  speed:19.0, heading:80,  status:"transit", destination:"Rotterdam",    eta:tomorrow(60),  cargo:"Toutes origines → Europe",   tonnage:188000,approachIn24h:false, lastUpdate:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) },
];

const MOCK_KPI: KpiSummary = {
  activeVessels: 50,
  atBerth: 14,
  inTransit: 36,
  congestionIndex: 68,
};

const MOCK_ALERTS: MaritimeAlert[] = [
  {
    id: "a1", type: "critical",
    title: "Retard critique détecté",
    message: "West Africa Star — ETA dépassé de 28h. Recommandation : Plan B Buffer Storage activé.",
    vessel: "West Africa Star",
    timestamp: "14:32 UTC",
  },
  {
    id: "a2", type: "warning",
    title: "Congestion portuaire",
    message: "Taux d'occupation Port Abidjan à 62% — seuil ORANGE. Surveillance renforcée.",
    timestamp: "14:00 UTC",
  },
  {
    id: "a3", type: "info",
    title: "Navire attendu",
    message: "Côte d'Ivoire Express — arrivée prévue 2026-03-24 06:00.",
    vessel: "Côte d'Ivoire Express",
    timestamp: "13:45 UTC",
  },
  {
    id: "a4", type: "success",
    title: "Opportunité de coût détectée",
    message: "Fenêtre tarifaire favorable sur Rotterdam — économie estimée 12 400 €.",
    timestamp: "13:00 UTC",
  },
];

// ─── API mappers ─────────────────────────────────────────────────────────────
function mapApiVessel(v: Record<string, unknown>, idx: number): Vessel {
  const statusRaw = String(v.status ?? "").toLowerCase();
  let status: Vessel["status"] = "transit";
  if (statusRaw.includes("berth") || statusRaw.includes("quai") || statusRaw.includes("moored")) {
    status = "berth";
  } else if (statusRaw.includes("delay") || statusRaw.includes("alert") || statusRaw.includes("retard")) {
    status = "alert";
  }

  return {
    id: String(v.mmsi ?? v.id ?? idx),
    name: String(v.name ?? `Navire ${idx + 1}`),
    imo: String(v.imo ?? "—"),
    mmsi: v.mmsi ? String(v.mmsi) : undefined,
    type: String(v.vessel_type ?? v.type ?? "Inconnu"),
    flag: String(v.flag ?? "—"),
    lat: Number(v.lat ?? 5.3),
    lng: Number(v.lon ?? v.lng ?? -4.0),
    speed: Number(v.speed_kn ?? v.speed ?? 0),
    heading: Number(v.heading ?? 0),
    status,
    destination: String(v.destination ?? v.eta_port ?? "—"),
    eta: String(v.eta ?? "—"),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function mapApiAlert(a: Record<string, unknown>, idx: number): MaritimeAlert {
  const level = String(a.level ?? "").toUpperCase();
  let type: MaritimeAlert["type"] = "info";
  if (level === "RED") type = "critical";
  else if (level === "ORANGE") type = "warning";
  else if (level === "GREEN") type = "success";

  return {
    id: String(a.id ?? idx),
    type,
    title: String(a.alert_type ?? a.title ?? "Alerte"),
    message: String(a.message ?? ""),
    vessel: a.vessel ? String(a.vessel) : undefined,
    timestamp: a.created_at
      ? new Date(String(a.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
      : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
  };
}

// ─── AIS fetcher (MarineTraffic → VesselFinder → null) ───────────────────────

/** Tente MarineTraffic v3 (jsono) — retourne un tableau ou null */
async function fetchMarineTraffic(prevVessels: Vessel[]): Promise<Vessel[] | null> {
  if (!AIS_API_KEY) return null;
  try {
    const url =
      `https://services.marinetraffic.com/api/getvessel/v:3/${AIS_API_KEY}` +
      `/protocol:jsono/lat:${ABJ_LAT}/lon:${ABJ_LON}/radius:50/`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const raw: Record<string, unknown>[] = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((v, i) => {
      const mapped = mapApiVessel(v, i);
      const prev = prevVessels.find(p => p.mmsi === mapped.mmsi || p.imo === mapped.imo);
      return {
        ...mapped,
        cargoType: toCargoType(mapped.type),
        approachIn24h: isApproachIn24h(mapped),
        etaPrevious: prev?.eta !== mapped.eta ? prev?.eta : undefined,
        etaChanged: hasEtaChanged2h(mapped.eta, prev?.eta),
      };
    });
  } catch { return null; }
}

/** Tente VesselFinder (AIS stream) — retourne un tableau ou null */
async function fetchVesselFinder(prevVessels: Vessel[]): Promise<Vessel[] | null> {
  if (!VESSELTRACKER_KEY) return null;
  try {
    const url =
      `https://api.vesseltracker.com/api/v1/vessels/userpolygon` +
      `?userkey=${VESSELTRACKER_KEY}` +
      `&lat1=${ABJ_LAT - 0.45}&lon1=${ABJ_LON - 0.45}` +
      `&lat2=${ABJ_LAT + 0.45}&lon2=${ABJ_LON + 0.45}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: Record<string, unknown>[] = data.vessels ?? data ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((v, i) => {
      const mapped = mapApiVessel(v, i);
      const prev = prevVessels.find(p => p.mmsi === mapped.mmsi);
      return {
        ...mapped,
        cargoType: toCargoType(mapped.type),
        approachIn24h: isApproachIn24h(mapped),
        etaPrevious: prev?.eta !== mapped.eta ? prev?.eta : undefined,
        etaChanged: hasEtaChanged2h(mapped.eta, prev?.eta),
      };
    });
  } catch { return null; }
}

/** Enrichit le mock avec les champs approachIn24h / etaChanged */
function enrichMock(): Vessel[] {
  return MOCK_VESSELS.map(v => ({
    ...v,
    approachIn24h: isApproachIn24h(v),
    lastUpdate: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMaritimeData(refreshInterval = 60_000) {
  const [vessels, setVessels] = useState<Vessel[]>(enrichMock());
  const [kpi, setKpi] = useState<KpiSummary>(MOCK_KPI);
  const [alerts, setAlerts] = useState<MaritimeAlert[]>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ── 1. Tente AIS réel (MarineTraffic → VesselFinder) ──────────────────
      const currentVessels = vessels;
      const aisVessels =
        (await fetchMarineTraffic(currentVessels)) ??
        (await fetchVesselFinder(currentVessels));

      if (aisVessels && aisVessels.length > 0) {
        setVessels(aisVessels);
        setIsLive(true);
        // Compute KPI from live data
        setKpi({
          activeVessels:   aisVessels.length,
          atBerth:         aisVessels.filter(v => v.status === "berth").length,
          inTransit:       aisVessels.filter(v => v.status === "transit").length,
          congestionIndex: Math.min(100, Math.round(
            (aisVessels.filter(v => v.status === "berth").length / Math.max(1, aisVessels.length)) * 100
          )),
        });
        // Generate alerts from ETA changes
        const etaAlerts: MaritimeAlert[] = aisVessels
          .filter(v => v.etaChanged)
          .map((v, i) => ({
            id: `eta-${v.id}`,
            type: "warning" as const,
            title: "Changement ETA détecté",
            message: `${v.name} — ETA modifié de plus de 2h (${v.etaPrevious} → ${v.eta})`,
            vessel: v.name,
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC",
          }));
        if (etaAlerts.length > 0) setAlerts(prev => [...etaAlerts, ...prev.slice(0, 8)]);
        return;
      }

      // ── 2. Fallback : API ORION backend ───────────────────────────────────
      if (API_URL) {
        let gotVessels = false;
        const [vesselsRes, kpiRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/vessels`,     { cache: "no-store" }),
          fetch(`${API_URL}/api/kpis/latest`, { cache: "no-store" }),
          fetch(`${API_URL}/api/alerts`,      { cache: "no-store" }),
        ]);

        if (vesselsRes.ok) {
          const data = await vesselsRes.json();
          const rawVessels: Record<string, unknown>[] = data.vessels ?? [];
          if (rawVessels.length > 0) {
            setVessels(rawVessels.map(mapApiVessel));
            setIsLive(true);
            gotVessels = true;
          }
        }

        if (kpiRes.ok) {
          const kd = await kpiRes.json();
          const meta = kd.congestion_metadata ?? {};
          setKpi({
            activeVessels:   Number(kd.total    ?? 0),
            atBerth:         Number(kd.at_berth ?? 0),
            inTransit:       Number(kd.in_transit ?? 0),
            congestionIndex: Math.round(Number(meta.index_pct ?? 0)),
          });
          setIsLive(true);
        }

        if (alertsRes.ok) {
          const ad = await alertsRes.json();
          const rawAlerts: Record<string, unknown>[] =
            Array.isArray(ad) ? ad : (ad.alerts ?? []);
          if (rawAlerts.length > 0)
            setAlerts(rawAlerts.slice(0, 10).map(mapApiAlert));
        }

        // Si l'API n'a retourné aucun navire, on reste sur les mocks
        if (gotVessels) return;
      }
    } catch {
      // silently keep mock data if all APIs unreachable
    } finally {
      setLoading(false);
    }

    // ── 3. Fallback final : mock enrichi ──────────────────────────────────────
    setVessels(enrichMock());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  return { vessels, kpi, alerts, loading, isLive, refetch: fetchData };
}
