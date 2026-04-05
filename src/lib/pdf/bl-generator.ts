"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types FIATA complets ─────────────────────────────────────────────────────

export interface BLContainer {
  number: string;           // ex : MSCU3421567
  type:   "20" | "40" | "40HC" | "45";
  count:  number;
  sealNo: string;
  weight: number;           // kg brut
  volume: number;           // m³
}

export interface BLData {
  // Numérotation
  blNumber:          string;   // BL-ABJ-YYYY-NNNN
  // Navire
  shipName:          string;
  imo:               string;
  flag:              string;
  voyage:            string;
  // Ports
  portLoading:       string;
  portDischarge:     string;
  placeDelivery:     string;
  // Parties
  shipper:           string;
  shipperAddress?:   string;
  consignee:         string;
  consigneeAddress?: string;
  notifyParty?:      string;
  // Cargo
  cargo:             string;
  marks?:            string;
  containers:        BLContainer[];
  grossWeight:       number;   // kg total
  totalVolume:       number;   // m³
  // Fret
  freightTerms:      "Prepaid" | "Collect" | "As Arranged";
  freightAmount?:    number;
  freightCurrency?:  string;
  // Dates
  issueDate:         string;
  eta:               string;
  // Extras
  originalCount:     1 | 2 | 3;
  specialInstructions?: string;
}

// ─── Couleurs & constantes ────────────────────────────────────────────────────

const DARK_BG  = [3, 9, 18] as [number, number, number];        // #030912
const GOLD     = [212, 175, 55] as [number, number, number];     // #D4AF37
const NAVY     = [6, 24, 52] as [number, number, number];        // #061834
const LIGHT    = [220, 230, 240] as [number, number, number];    // texte clair
const GRAY     = [100, 120, 140] as [number, number, number];    // texte secondaire

// ─── Helper : cellule label + valeur ─────────────────────────────────────────

function field(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w = 80,
  h = 9
) {
  doc.setFillColor(...NAVY);
  doc.rect(x, y, w, h, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), x + 2, y + 3.5);
  doc.setFontSize(8);
  doc.setTextColor(...LIGHT);
  doc.text(value || "—", x + 2, y + 7.5);
}

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateBLComplete(data: BLData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // ── 1. Header ORION ────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, W, 0.8, "F");

  // Logo texte ORION
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("ORION", 12, 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("UNIFIED LOGISTICS SYSTEM  ·  PORT AUTONOME D'ABIDJAN", 12, 19);

  // Titre document
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LIGHT);
  doc.text("BILL OF LADING", W - 12, 12, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  doc.text(data.blNumber, W - 12, 18, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(`Émis le : ${data.issueDate}  ·  Originaux : ${data.originalCount}`, W - 12, 23, { align: "right" });

  y = 36;

  // ── 2. Section navire ──────────────────────────────────────────────────────
  const shipFields: [string, string, number, number, number][] = [
    ["Navire",       data.shipName,   12,  y, 55],
    ["IMO",          data.imo,        68,  y, 35],
    ["Pavillon",     data.flag,       104, y, 30],
    ["Voyage N°",    data.voyage || "—", 135, y, 30],
    ["ETA",          data.eta,        166, y, 32],
  ];
  for (const [label, val, x, fy, w] of shipFields) {
    field(doc, label, val, x, fy, w);
  }
  y += 12;

  const portFields: [string, string, number, number, number][] = [
    ["Port de chargement",    data.portLoading,    12,  y, 61],
    ["Port de déchargement",  data.portDischarge,  74,  y, 61],
    ["Lieu de livraison",     data.placeDelivery,  136, y, 62],
  ];
  for (const [label, val, x, fy, w] of portFields) {
    field(doc, label, val, x, fy, w);
  }
  y += 14;

  // Séparateur
  doc.setFillColor(...GOLD);
  doc.rect(12, y, W - 24, 0.4, "F");
  y += 4;

  // ── 3. Parties ─────────────────────────────────────────────────────────────
  const partyW = (W - 30) / 3;

  // Shipper
  doc.setFillColor(...NAVY);
  doc.rect(12, y, partyW, 28, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("CHARGEUR / SHIPPER", 14, y + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LIGHT);
  doc.text(data.shipper, 14, y + 9);
  if (data.shipperAddress) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(data.shipperAddress, partyW - 4);
    doc.text(lines, 14, y + 14);
  }

  // Consignee
  const cx = 12 + partyW + 3;
  doc.setFillColor(...NAVY);
  doc.rect(cx, y, partyW, 28, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("DESTINATAIRE / CONSIGNEE", cx + 2, y + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LIGHT);
  doc.text(data.consignee, cx + 2, y + 9);
  if (data.consigneeAddress) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(data.consigneeAddress, partyW - 4);
    doc.text(lines, cx + 2, y + 14);
  }

  // Notify party
  const nx = cx + partyW + 3;
  doc.setFillColor(...NAVY);
  doc.rect(nx, y, partyW, 28, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("PARTIE À NOTIFIER / NOTIFY", nx + 2, y + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LIGHT);
  doc.text(data.notifyParty || "SAME AS CONSIGNEE", nx + 2, y + 9);

  y += 32;

  // ── 4. Description marchandises ────────────────────────────────────────────
  doc.setFillColor(...DARK_BG);
  doc.rect(12, y, W - 24, 7, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("DESCRIPTION DES MARCHANDISES", 14, y + 4.5);
  y += 8;

  // Tableau conteneurs
  const containerRows = data.containers.length > 0
    ? data.containers.map(c => [
        c.number || "—",
        `${c.count} × ${c.type}'`,
        c.sealNo || "—",
        `${c.weight.toLocaleString()} kg`,
        `${c.volume.toFixed(2)} m³`,
      ])
    : [["—", "—", "—", `${data.grossWeight.toLocaleString()} kg`, `${data.totalVolume.toFixed(2)} m³`]];

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [["N° Conteneur", "Type / Qté", "N° Plombs", "Poids Brut", "Volume"]],
    body: containerRows,
    theme: "plain",
    headStyles: {
      fillColor: [12, 30, 60],
      textColor: GOLD,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fillColor: NAVY,
      textColor: LIGHT,
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: [8, 20, 42] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // Description textuelle cargo
  doc.setFillColor(...NAVY);
  doc.rect(12, y, W - 24, 12, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("NATURE ET DESCRIPTION DES MARCHANDISES", 14, y + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT);
  doc.text(data.cargo, 14, y + 9);

  if (data.marks) {
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text("MARQUES ET NUMÉROS", 14 + (W - 30) / 2, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT);
    doc.text(data.marks, 14 + (W - 30) / 2, y + 9);
  }
  y += 16;

  // ── 5. Fret ────────────────────────────────────────────────────────────────
  const freightColor = data.freightTerms === "Prepaid" ? "#10B981" :
                       data.freightTerms === "Collect" ? "#F97316" : "#94a3b8";

  doc.setFillColor(...NAVY);
  doc.rect(12, y, W - 24, 10, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text("CONDITIONS DE FRET", 14, y + 4);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    parseInt(freightColor.slice(1, 3), 16),
    parseInt(freightColor.slice(3, 5), 16),
    parseInt(freightColor.slice(5, 7), 16)
  );
  doc.text(data.freightTerms.toUpperCase(), 14, y + 8.5);

  if (data.freightAmount) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT);
    doc.text(
      `${data.freightCurrency ?? "USD"} ${data.freightAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
      W / 2, y + 8.5
    );
  }
  y += 14;

  // Poids & volume totaux
  const totals: [string, string][] = [
    ["Poids brut total", `${data.grossWeight.toLocaleString()} kg`],
    ["Volume total",     `${data.totalVolume.toFixed(2)} m³`],
    ["Nb conteneurs",   `${data.containers.reduce((s, c) => s + c.count, 0) || 1}`],
  ];
  let tx = 12;
  for (const [label, val] of totals) {
    field(doc, label, val, tx, y, 58);
    tx += 60;
  }
  y += 14;

  // Instructions spéciales
  if (data.specialInstructions) {
    doc.setFillColor(...NAVY);
    doc.rect(12, y, W - 24, 12, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text("INSTRUCTIONS SPÉCIALES", 14, y + 4);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT);
    const lines = doc.splitTextToSize(data.specialInstructions, W - 30);
    doc.text(lines, 14, y + 9);
    y += 16;
  }

  // ── 6. Clause légale FIATA ─────────────────────────────────────────────────
  doc.setFillColor(4, 10, 22);
  doc.rect(12, y, W - 24, 22, "F");
  doc.setFontSize(5.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 100, 120);
  const legalText = [
    "REÇU par le transporteur, en apparente bon ordre et condition, sauf stipulation contraire, les marchandises ou les colis décrits ci-dessus.",
    "Le transporteur soussigné s'engage à transporter les marchandises de la façon indiquée dans ce connaissement.",
    "En acceptant ce connaissement, le chargeur, le destinataire et le propriétaire des marchandises acceptent les termes,",
    "conditions, exceptions et limitations d'une façon personnelle et au nom de toute personne ayant un intérêt dans les marchandises.",
    "Ce connaissement est établi conformément aux Règles de La Haye-Visby (Convention de Bruxelles 1924, amendements 1968 et 1979).",
    "ORION Logistics — Port Autonome d'Abidjan — Côte d'Ivoire — www.orion-logistics.ci",
  ];
  doc.text(legalText, 14, y + 5, { lineHeightFactor: 1.4 });
  y += 26;

  // ── 7. Signatures ──────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(12, y, 56, 20, "F");
  doc.setFillColor(...NAVY);
  doc.rect(77, y, 56, 20, "F");
  doc.setFillColor(...NAVY);
  doc.rect(142, y, 56, 20, "F");

  const sigLabels = ["Signature chargeur", "Signature transporteur", "Signature ORION"];
  const sigX = [12, 77, 142];
  for (let i = 0; i < 3; i++) {
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(sigLabels[i].toUpperCase(), sigX[i] + 2, y + 4);
    doc.setDrawColor(...GOLD);
    doc.line(sigX[i] + 4, y + 16, sigX[i] + 50, y + 16);
  }
  y += 24;

  // ── 8. Footer ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 285, W, 12, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 285, W, 0.5, "F");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text(
    `ORION UNIFIED LOGISTICS SYSTEM  ·  B/L N° ${data.blNumber}  ·  ${data.issueDate}  ·  Document généré électroniquement`,
    W / 2, 291, { align: "center" }
  );

  // Filigrane "ORIGINAL"
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55, 0.04);
  doc.text("ORIGINAL", W / 2, 160, { align: "center", angle: -45 });

  // ── Téléchargement ─────────────────────────────────────────────────────────
  doc.save(`${data.blNumber}.pdf`);
}

// ─── Numérotation auto ────────────────────────────────────────────────────────

export function nextBLNumber(): string {
  const year = new Date().getFullYear();
  const key = `orion_bl_seq_${year}`;
  try {
    const seq = (parseInt(localStorage.getItem(key) ?? "0", 10) || 0) + 1;
    localStorage.setItem(key, String(seq));
    return `BL-ABJ-${year}-${String(seq).padStart(4, "0")}`;
  } catch {
    return `BL-ABJ-${year}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
}

// ─── Stockage local des B/L émis ─────────────────────────────────────────────

export interface BLRecord {
  blNumber:  string;
  shipName:  string;
  cargo:     string;
  issueDate: string;
  tonnage:   number;
}

const STORAGE_KEY = "orion_bl_records";

export function saveBLRecord(record: BLRecord): void {
  try {
    const existing: BLRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing].slice(0, 50)));
  } catch { /* silent */ }
}

export function loadBLRecords(): BLRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}
