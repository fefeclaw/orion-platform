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
