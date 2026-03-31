// REQUIRES: npm install jspdf jspdf-autotable
// Service PDF unifié — génère B/L, LV, AWB, CMR, BSC pour tous les piliers Orion

"use client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BLData {
  blNumber: string;
  shipName: string;
  imo: string;
  flag: string;
  origin: string;
  destination: string;
  eta: string;
  cargo: string;
  tonnage: number;
  shipper: string;
  consignee: string;
  issueDate: string;
}

export interface LVData {
  lvNumber: string;
  trainId: string;
  corridor: string;
  cargo: string;
  departureDate: string;
  eta: string;
  shipper: string;
  consignee: string;
  delay: number; // minutes
}

export interface AWBData {
  awbNumber: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  eta: string;
  cargo: string;
  shipper: string;
  consignee: string;
  issueDate: string;
  cutoffTime?: string;
  gate?: string;
}

export interface CMRData {
  cmrNumber: string;
  plate: string;
  driver: string;
  origin: string;
  destination: string;
  cargo: string;
  eta: string;
  delay: number; // minutes
}

export interface BSCData {
  bscNumber: string;
  expediteur: string;
  destinataire: string;
  marchandise: string;
  poidsNet: number;
  poidsBrut: number;
  valeurCFA: number;
  transporteur: string;
  dateEmission: string;
}

// ─── Manifeste Cargo — document portuaire global ──────────────────────────────
export interface ManifestVessel {
  name: string;
  imo: string;
  flag: string;
  type: string;       // ex : "Porte-conteneurs"
  status: string;     // "À quai" | "En transit" | "En alerte"
  destination: string;
  eta: string;
  cargo?: string;
  tonnage?: number;
  speed: number;
}

export interface ManifestData {
  manifestNumber: string;
  port: string;
  dateEmission: string;
  vessels: ManifestVessel[];
  generatedBy?: string;
}

// ─── Certificat Phytosanitaire ────────────────────────────────────────────────
export interface PhytoCertData {
  certNumber: string;
  shipName: string;
  imo: string;
  paysOrigine: string;
  paysDestination: string;
  exportateur: string;
  importateur: string;
  marchandise: string;        // ex : "Cacao en fèves"
  poidsNet: number;
  nombreColis: number;
  traitement: string;         // ex : "Fumigation Méthyl Bromure"
  dateTraitement: string;
  dateInspection: string;
  dateEmission: string;
  inspecteur: string;
  numero_phyto?: string;      // référence MINADER / ANADER
}

// ─── Certificat d'Origine ─────────────────────────────────────────────────────
export interface OriginCertData {
  certNumber: string;
  shipName: string;
  imo: string;
  exportateur: string;
  exportateurAdresse: string;
  importateur: string;
  importateurAdresse: string;
  paysOrigine: string;
  paysDestination: string;
  marchandise: string;
  hsCode: string;              // code SH (tarif douanier)
  poidsNet: number;
  poidsBrut: number;
  valeurFOB: number;
  nombreColis: number;
  marques?: string;
  dateEmission: string;
  chambreCommerce: string;     // ex : "Chambre de Commerce et d'Industrie de Côte d'Ivoire"
}

export interface TRIEData {
  trieNumber: string;
  plate: string;
  driver: string;
  transporteur: string;
  paysEmission: string;
  paysTransit: string[];  // liste des pays traversés
  paysDestination: string;
  pointEntree: string;
  pointSortie: string;
  cargo: string;
  poidsNet: number;
  valeurCFA: number;
  asycudaRef?: string;    // référence déclaration douanière
  cautionMontant: number; // garantie TRIE en FCFA
  dateEmission: string;
  dateExpiration: string;
}

export interface LTAShipment {
  awbRef: string;
  shipper: string;
  consignee: string;
  cargo: string;
  pieces: number;
  weightKg: number;
  chargeableWeight?: number;
  declaredValue?: string;
}

export interface LTAData {
  ltaNumber: string;
  flightNumber: string;
  airline: string;
  originAirport: string;   // ex: "ABJ – Aéroport FHB Abidjan"
  destinationAirport: string;
  departureDate: string;
  eta: string;
  issueDate: string;
  issuedBy?: string;
  totalPieces: number;
  totalWeightKg: number;
  shipments: LTAShipment[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const ORION_BLUE   = [14, 165, 233]  as [number, number, number];
const ORION_DARK   = [3, 7, 18]      as [number, number, number];
const ORION_GOLD   = [212, 175, 55]  as [number, number, number];
const WHITE        = [255, 255, 255] as [number, number, number];
const LIGHT_GRAY   = [245, 247, 250] as [number, number, number];
const TEXT_GRAY    = [100, 116, 139] as [number, number, number];
const TEXT_DARK    = [15, 23, 42]    as [number, number, number];

function loadJsPDF() {
  // Dynamic require to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require("jspdf") as typeof import("jspdf");
  return jsPDF;
}

function addHeader(
  doc: InstanceType<ReturnType<typeof loadJsPDF>>,
  docType: string,
  docNumber: string,
  accentColor: [number, number, number] = ORION_BLUE
) {
  const w = doc.internal.pageSize.getWidth();

  // Background header band
  doc.setFillColor(...ORION_DARK);
  doc.rect(0, 0, w, 28, "F");

  // Orion logo text
  doc.setTextColor(...accentColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ORION", 12, 12);

  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUTONOMOUS LOGISTICS PLATFORM", 12, 18);

  // Document type badge
  doc.setFillColor(...accentColor);
  doc.roundedRect(w - 70, 6, 60, 16, 3, 3, "F");
  doc.setTextColor(...ORION_DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(docType, w - 40, 14, { align: "center" });
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(docNumber, w - 40, 20, { align: "center" });

  // Gold separator line
  doc.setDrawColor(...ORION_GOLD);
  doc.setLineWidth(0.5);
  doc.line(0, 28, w, 28);
}

function addFooter(doc: InstanceType<ReturnType<typeof loadJsPDF>>, pageNum = 1) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...TEXT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(10, h - 16, w - 10, h - 16);

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Orion Autonomous Logistics Platform — Port Autonome d'Abidjan, Côte d'Ivoire", 10, h - 10);
  doc.text(`Page ${pageNum}`, w - 10, h - 10, { align: "right" });
}

function addField(
  doc: InstanceType<ReturnType<typeof loadJsPDF>>,
  label: string,
  value: string,
  x: number,
  y: number,
  width = 80
) {
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), x, y);

  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(value || "—", x, y + 5);

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.2);
  doc.line(x, y + 7, x + width, y + 7);
}

function addSection(
  doc: InstanceType<ReturnType<typeof loadJsPDF>>,
  title: string,
  y: number,
  color: [number, number, number] = ORION_BLUE
): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...color);
  doc.rect(10, y, w - 20, 6, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y + 4.2);
  return y + 6;
}

function triggerDownload(doc: InstanceType<ReturnType<typeof loadJsPDF>>, filename: string) {
  doc.save(filename);
}

// ─── B/L — Bill of Lading ─────────────────────────────────────────────────────

export function generateBL(data: BLData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, "CONNAISSEMENT / BILL OF LADING", data.blNumber, ORION_BLUE);

  // Issue info
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(8);
  doc.text(`Émis le : ${data.issueDate}`, w - 10, 34, { align: "right" });

  // Section Parties
  let y = addSection(doc, "PARTIES", 38) + 6;
  addField(doc, "Expéditeur / Shipper", data.shipper, 12, y, 85);
  addField(doc, "Destinataire / Consignee", data.consignee, 110, y, 85);

  // Section Navire
  y += 20;
  y = addSection(doc, "NAVIRE / VESSEL", y) + 6;
  addField(doc, "Nom du Navire", data.shipName, 12, y, 55);
  addField(doc, "IMO", data.imo, 75, y, 40);
  addField(doc, "Pavillon / Flag", data.flag, 122, y, 35);
  addField(doc, "Port d'Origine", data.origin, 12, y + 20, 85);
  addField(doc, "Port de Destination", data.destination, 110, y + 20, 85);

  y += 40;
  y = addSection(doc, "MARCHANDISE / CARGO", y) + 6;
  addField(doc, "Description", data.cargo, 12, y, 120);
  addField(doc, "Tonnage (T)", String(data.tonnage), 140, y, 55);
  addField(doc, "ETA (Estimated Time of Arrival)", data.eta, 12, y + 20, 175);

  // Stamp zone
  y += 50;
  doc.setDrawColor(...ORION_BLUE);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 80, 30);
  doc.rect(105, y, 80, 30);

  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(7);
  doc.text("CACHET & SIGNATURE EXPÉDITEUR", 52, y + 5, { align: "center" });
  doc.text("CACHET & SIGNATURE DESTINATAIRE", 145, y + 5, { align: "center" });

  // Watermark
  doc.setTextColor(14, 165, 233);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.setGState(doc.GState({ opacity: 0.05 }));
  doc.text("ORION", w / 2, 160, { align: "center", angle: 45 });
  doc.setGState(doc.GState({ opacity: 1 }));

  addFooter(doc);
  triggerDownload(doc, `${data.blNumber}.pdf`);
}

// ─── LV — Lettre de Voiture Ferroviaire ───────────────────────────────────────

export function generateLV(data: LVData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "LETTRE DE VOITURE FERROVIAIRE", data.lvNumber, [248, 113, 113]);

  let y = addSection(doc, "TRANSPORT", 38, [248, 113, 113]) + 6;
  addField(doc, "Numéro de Train", data.trainId, 12, y, 85);
  addField(doc, "Corridor", data.corridor, 110, y, 85);
  addField(doc, "Expéditeur", data.shipper, 12, y + 20, 85);
  addField(doc, "Destinataire", data.consignee, 110, y + 20, 85);

  y += 45;
  y = addSection(doc, "MARCHANDISE", y, [248, 113, 113]) + 6;
  addField(doc, "Description Cargaison", data.cargo, 12, y, 175);
  addField(doc, "Date de Départ", data.departureDate, 12, y + 18, 85);
  addField(doc, "ETA", data.eta, 110, y + 18, 85);

  if (data.delay > 0) {
    y += 42;
    doc.setFillColor(254, 242, 242);
    doc.rect(12, y, 185, 14, "F");
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.4);
    doc.rect(12, y, 185, 14);
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const delayH = Math.floor(data.delay / 60);
    const delayM = data.delay % 60;
    const delayStr = delayH > 0 ? `+${delayH}h${delayM > 0 ? String(delayM).padStart(2, "0") : ""}` : `+${delayM}min`;
    doc.text(`⚠ RETARD EN COURS : ${delayStr} — Mise à jour ETA automatique`, 104, y + 9, { align: "center" });
  }

  addFooter(doc);
  triggerDownload(doc, `${data.lvNumber}.pdf`);
}

// ─── AWB — Air Waybill ─────────────────────────────────────────────────────────

export function generateAWB(data: AWBData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "AIR WAYBILL / LETTRE DE TRANSPORT AÉRIEN", data.awbNumber, [167, 139, 250]);

  let y = addSection(doc, "VOL / FLIGHT", 38, [167, 139, 250]) + 6;
  addField(doc, "Numéro de Vol", data.flightNumber, 12, y, 55);
  addField(doc, "Compagnie", data.airline, 75, y, 55);
  addField(doc, "Porte (Gate)", data.gate ?? "—", 138, y, 55);
  addField(doc, "Origine", data.origin, 12, y + 20, 85);
  addField(doc, "Destination", data.destination, 110, y + 20, 85);
  addField(doc, "ETA", data.eta, 12, y + 40, 85);
  if (data.cutoffTime) {
    addField(doc, "Cut-Off Fret", data.cutoffTime, 110, y + 40, 85);
  }

  y += 65;
  y = addSection(doc, "FRET / CARGO", y, [167, 139, 250]) + 6;
  addField(doc, "Description Marchandise", data.cargo, 12, y, 175);
  addField(doc, "Expéditeur", data.shipper, 12, y + 18, 85);
  addField(doc, "Destinataire", data.consignee, 110, y + 18, 85);
  addField(doc, "Date d'émission", data.issueDate, 12, y + 36, 85);

  addFooter(doc);
  triggerDownload(doc, `${data.awbNumber}.pdf`);
}

// ─── CMR — Convention Marchandises Routières ──────────────────────────────────

export function generateCMR(data: CMRData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "LETTRE DE VOITURE CMR", data.cmrNumber, [52, 211, 153]);

  let y = addSection(doc, "TRANSPORT ROUTIER", 38, [52, 211, 153]) + 6;
  addField(doc, "Immatriculation", data.plate, 12, y, 55);
  addField(doc, "Conducteur", data.driver, 75, y, 85);
  addField(doc, "Lieu de Chargement", data.origin, 12, y + 20, 85);
  addField(doc, "Lieu de Livraison", data.destination, 110, y + 20, 85);

  y += 45;
  y = addSection(doc, "MARCHANDISE", y, [52, 211, 153]) + 6;
  addField(doc, "Nature de la Marchandise", data.cargo, 12, y, 175);
  addField(doc, "ETA Livraison", data.eta, 12, y + 18, 85);

  if (data.delay > 0) {
    y += 38;
    doc.setFillColor(254, 252, 232);
    doc.rect(12, y, 185, 12, "F");
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`⚠ Retard en cours : +${data.delay} min — Frontière ou incident signalé`, 104, y + 8, { align: "center" });
  }

  addFooter(doc);
  triggerDownload(doc, `${data.cmrNumber}.pdf`);
}

// ─── BSC — Bordereau de Suivi de Cargaison ────────────────────────────────────

export function generateBSC(data: BSCData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "BORDEREAU DE SUIVI DE CARGAISON (BSC)", data.bscNumber, [245, 158, 11]);

  let y = addSection(doc, "PARTIES", 38, [245, 158, 11]) + 6;
  addField(doc, "Expéditeur", data.expediteur, 12, y, 85);
  addField(doc, "Destinataire", data.destinataire, 110, y, 85);
  addField(doc, "Transporteur", data.transporteur, 12, y + 20, 175);

  y += 45;
  y = addSection(doc, "MARCHANDISE", y, [245, 158, 11]) + 6;
  addField(doc, "Désignation", data.marchandise, 12, y, 175);
  addField(doc, "Poids Net (kg)", String(data.poidsNet), 12, y + 20, 55);
  addField(doc, "Poids Brut (kg)", String(data.poidsBrut), 75, y + 20, 55);
  addField(doc, "Valeur déclarée (FCFA)", new Intl.NumberFormat("fr-FR").format(data.valeurCFA), 138, y + 20, 55);
  addField(doc, "Date d'émission", data.dateEmission, 12, y + 40, 85);

  addFooter(doc);
  triggerDownload(doc, `${data.bscNumber}.pdf`);
}

// ─── TRIE — Transit Routier Inter-États (CEDEAO) ──────────────────────────────

const ECOWAS_GREEN = [0, 132, 61] as [number, number, number];

export function generateTRIE(data: TRIEData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, "TRANSIT ROUTIER INTER-ÉTATS (TRIE)", data.trieNumber, ECOWAS_GREEN);

  // ── Sous-titre CEDEAO ──
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(0, 132, 61);
  doc.rect(0, 28, w, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("COMMUNAUTÉ ÉCONOMIQUE DES ÉTATS DE L'AFRIQUE DE L'OUEST — ECOWAS / CEDEAO", w / 2, 33.5, { align: "center" });

  let y = 45;

  // ── Véhicule & Transporteur ──
  y = addSection(doc, "VÉHICULE & TRANSPORTEUR", y, ECOWAS_GREEN) + 6;
  addField(doc, "Immatriculation", data.plate, 12, y, 55);
  addField(doc, "Conducteur", data.driver, 75, y, 55);
  addField(doc, "Société Transporteur", data.transporteur, 138, y, 55);

  y += 22;

  // ── Itinéraire ──
  y = addSection(doc, "ITINÉRAIRE DOUANIER", y, ECOWAS_GREEN) + 6;
  addField(doc, "Pays d'Émission", data.paysEmission, 12, y, 55);
  addField(doc, "Pays de Transit", data.paysTransit.join(" → "), 75, y, 55);
  addField(doc, "Pays de Destination", data.paysDestination, 138, y, 55);
  addField(doc, "Point d'Entrée", data.pointEntree, 12, y + 20, 85);
  addField(doc, "Point de Sortie", data.pointSortie, 110, y + 20, 85);

  y += 44;

  // ── Marchandise ──
  y = addSection(doc, "DÉSIGNATION DE LA MARCHANDISE", y, ECOWAS_GREEN) + 6;
  addField(doc, "Nature des Marchandises", data.cargo, 12, y, 175);
  addField(doc, "Poids Net (kg)", String(data.poidsNet), 12, y + 20, 85);
  addField(doc, "Valeur déclarée (FCFA)", new Intl.NumberFormat("fr-FR").format(data.valeurCFA), 110, y + 20, 85);
  if (data.asycudaRef) {
    addField(doc, "Réf. ASYCUDA / Déclaration Douanière", data.asycudaRef, 12, y + 40, 175);
    y += 20;
  }

  y += 44;

  // ── Garantie TRIE ──
  y = addSection(doc, "GARANTIE & VALIDITÉ", y, ECOWAS_GREEN) + 6;
  doc.setFillColor(240, 253, 244);
  doc.rect(12, y, 85, 18, "F");
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Montant de la Caution TRIE", 55, y + 6, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${new Intl.NumberFormat("fr-FR").format(data.cautionMontant)} FCFA`, 55, y + 13, { align: "center" });

  addField(doc, "Date d'Émission", data.dateEmission, 110, y, 55);
  addField(doc, "Date d'Expiration", data.dateExpiration, 152, y, 55);

  y += 30;

  // ── Zone signature ──
  doc.setDrawColor(...ECOWAS_GREEN);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 85, 20);
  doc.rect(110, y, 85, 20);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Cachet & Signature Douane Départ", 55, y + 8, { align: "center" });
  doc.text("Cachet & Signature Douane Arrivée", 152, y + 8, { align: "center" });

  addFooter(doc);
  triggerDownload(doc, `${data.trieNumber}.pdf`);
}

// ─── Manifeste Cargo — Port d'Abidjan ─────────────────────────────────────────

const PORT_BLUE = [0, 82, 136] as [number, number, number];

export function generateManifest(data: ManifestData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFillColor(...ORION_DARK);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(...PORT_BLUE);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ORION", 12, 12);
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUTONOMOUS LOGISTICS PLATFORM", 12, 18);

  doc.setFillColor(...PORT_BLUE);
  doc.roundedRect(w - 110, 6, 100, 16, 3, 3, "F");
  doc.setTextColor(...ORION_DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MANIFESTE CARGO PORTUAIRE", w - 60, 14, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  doc.text(data.manifestNumber, w - 60, 20, { align: "center" });

  doc.setDrawColor(...ORION_GOLD);
  doc.setLineWidth(0.5);
  doc.line(0, 28, w, 28);

  // Infos port
  let y = 38;
  addField(doc, "Port", data.port, 12, y, 80);
  addField(doc, "Date d'Émission", data.dateEmission, 100, y, 60);
  addField(doc, "Navires listés", String(data.vessels.length), 168, y, 30);
  addField(doc, "Total Tonnage (T)",
    String(data.vessels.reduce((s, v) => s + (v.tonnage ?? 0), 0).toLocaleString("fr-FR")),
    206, y, 50);
  if (data.generatedBy) addField(doc, "Généré par", data.generatedBy, 264, y, 50);

  y += 22;

  // Table des navires
  const headers = [[
    "Navire", "IMO", "Pavillon", "Type",
    "Statut", "Destination", "ETA", "Cargo", "Tonnage (T)", "Vitesse (kn)"
  ]];
  const rows = data.vessels.map(v => [
    v.name, v.imo, v.flag, v.type,
    v.status, v.destination, v.eta,
    v.cargo ?? "—", v.tonnage ? v.tonnage.toLocaleString("fr-FR") : "—",
    String(v.speed),
  ]);

  const { jsPDF: JsPDF2 } = require("jspdf") as typeof import("jspdf");
  void JsPDF2;
  const autoTable = require("jspdf-autotable").default as typeof import("jspdf-autotable").default;
  autoTable(doc, {
    startY: y,
    head: headers,
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [0, 82, 136], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 247, 255] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      4: { fontStyle: "bold" },
    },
    didDrawCell: (hookData: Parameters<NonNullable<import("jspdf-autotable").UserOptions["didDrawCell"]>>[0]) => {
      // Colorisation statut (colonne index 4)
      if (hookData.section === "body" && hookData.column.index === 4) {
        const raw = hookData.row.raw as string[];
        const status = raw[4] ?? "";
        const color = status === "À quai" ? "#10B981" : status === "En alerte" ? "#EF4444" : "#0EA5E9";
        hookData.doc.setTextColor(color);
        hookData.doc.setFontSize(7.5);
        hookData.doc.setFont("helvetica", "bold");
        hookData.doc.text(status, hookData.cell.x + 2, hookData.cell.y + hookData.cell.height / 2 + 2.5);
      }
    },
    margin: { left: 12, right: 12 },
  });

  // Récapitulatif statuts en bas
  const transit = data.vessels.filter(v => v.status === "En transit").length;
  const berth   = data.vessels.filter(v => v.status === "À quai").length;
  const alert   = data.vessels.filter(v => v.status === "En alerte").length;
  const summaryY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 60;

  doc.setFillColor(240, 247, 255);
  doc.rect(12, summaryY + 6, w - 24, 12, "F");
  doc.setTextColor(0, 82, 136);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Récapitulatif : ${data.vessels.length} navires — En transit : ${transit} · À quai : ${berth} · En alerte : ${alert}`,
    w / 2, summaryY + 14, { align: "center" });

  addFooter(doc);
  triggerDownload(doc, `${data.manifestNumber}.pdf`);
}

// ─── Certificat Phytosanitaire ────────────────────────────────────────────────

const PHYTO_GREEN = [34, 139, 34] as [number, number, number];

export function generatePhytoCert(data: PhytoCertData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, "CERTIFICAT PHYTOSANITAIRE", data.certNumber, PHYTO_GREEN);

  // Bandeau ministère
  doc.setFillColor(...PHYTO_GREEN);
  doc.rect(0, 28, w, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("MINISTÈRE DE L'AGRICULTURE ET DU DÉVELOPPEMENT RURAL — CÔTE D'IVOIRE", w / 2, 33.5, { align: "center" });

  let y = 45;

  // Navire
  y = addSection(doc, "NAVIRE & TRANSPORT", y, PHYTO_GREEN) + 6;
  addField(doc, "Navire", data.shipName, 12, y, 55);
  addField(doc, "IMO", data.imo, 74, y, 35);
  addField(doc, "Pays d'Origine", data.paysOrigine, 116, y, 40);
  addField(doc, "Pays de Destination", data.paysDestination, 163, y, 42);
  y += 22;

  // Parties
  y = addSection(doc, "EXPORTATEUR / IMPORTATEUR", y, PHYTO_GREEN) + 6;
  addField(doc, "Exportateur", data.exportateur, 12, y, 88);
  addField(doc, "Importateur", data.importateur, 107, y, 88);
  y += 22;

  // Marchandise
  y = addSection(doc, "DESCRIPTION DES VÉGÉTAUX", y, PHYTO_GREEN) + 6;
  addField(doc, "Nature des Végétaux / Produits", data.marchandise, 12, y, 185);
  addField(doc, "Poids Net (kg)", String(data.poidsNet), 12, y + 20, 60);
  addField(doc, "Nombre de Colis", String(data.nombreColis), 80, y + 20, 55);
  if (data.numero_phyto) addField(doc, "Réf. ANADER / MINADER", data.numero_phyto, 142, y + 20, 55);
  y += 44;

  // Traitement
  y = addSection(doc, "TRAITEMENT PHYTOSANITAIRE", y, PHYTO_GREEN) + 6;
  addField(doc, "Traitement Appliqué", data.traitement, 12, y, 120);
  addField(doc, "Date du Traitement", data.dateTraitement, 139, y, 58);
  y += 22;

  // Déclaration
  y = addSection(doc, "DÉCLARATION PHYTOSANITAIRE", y, PHYTO_GREEN) + 5;
  doc.setFillColor(240, 255, 240);
  doc.rect(12, y, 185, 18, "F");
  doc.setDrawColor(...PHYTO_GREEN);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 185, 18);
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const declaration = "Les végétaux, produits végétaux ou articles réglementés décrits ci-dessus ont été inspectés conformément aux procédures officielles " +
    "et sont réputés exempts des organismes nuisibles de quarantaine spécifiés par le pays importateur. " +
    "Ils sont conformes aux exigences phytosanitaires actuelles du pays importateur.";
  const lines = doc.splitTextToSize(declaration, 181);
  doc.text(lines, 14, y + 6);
  y += 24;

  // Dates et inspecteur
  addField(doc, "Date d'Inspection", data.dateInspection, 12, y, 60);
  addField(doc, "Date d'Émission", data.dateEmission, 80, y, 60);
  addField(doc, "Inspecteur Phytosanitaire", data.inspecteur, 147, y, 58);

  y += 22;
  // Zone signature
  doc.setDrawColor(...PHYTO_GREEN);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 85, 20);
  doc.rect(110, y, 85, 20);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Cachet & Signature — Inspecteur", 55, y + 8, { align: "center" });
  doc.text("Cachet — Service Phytosanitaire Port d'Abidjan", 152, y + 8, { align: "center" });

  addFooter(doc);
  triggerDownload(doc, `${data.certNumber}.pdf`);
}

// ─── Certificat d'Origine ─────────────────────────────────────────────────────

const ORIGIN_RED = [185, 28, 28] as [number, number, number];

export function generateOriginCert(data: OriginCertData): void {
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, "CERTIFICAT D'ORIGINE", data.certNumber, ORIGIN_RED);

  // Bandeau chambre de commerce
  doc.setFillColor(...ORIGIN_RED);
  doc.rect(0, 28, w, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(data.chambreCommerce.toUpperCase(), w / 2, 33.5, { align: "center" });

  let y = 45;

  // Parties
  y = addSection(doc, "EXPORTATEUR", y, ORIGIN_RED) + 6;
  addField(doc, "Exportateur", data.exportateur, 12, y, 185);
  addField(doc, "Adresse", data.exportateurAdresse, 12, y + 20, 185);
  y += 40;

  y = addSection(doc, "DESTINATAIRE / IMPORTATEUR", y, ORIGIN_RED) + 6;
  addField(doc, "Importateur", data.importateur, 12, y, 185);
  addField(doc, "Adresse", data.importateurAdresse, 12, y + 20, 185);
  y += 40;

  // Transport
  y = addSection(doc, "MOYEN DE TRANSPORT", y, ORIGIN_RED) + 6;
  addField(doc, "Navire", data.shipName, 12, y, 55);
  addField(doc, "IMO", data.imo, 74, y, 30);
  addField(doc, "Pays de Destination", data.paysDestination, 111, y, 86);
  y += 22;

  // Marchandise
  y = addSection(doc, "DÉSIGNATION DES MARCHANDISES", y, ORIGIN_RED) + 6;
  addField(doc, "Description", data.marchandise, 12, y, 185);
  addField(doc, "Code SH (HS Code)", data.hsCode, 12, y + 20, 55);
  addField(doc, "Marques & Numéros", data.marques ?? "—", 74, y + 20, 123);
  addField(doc, "Nombre de Colis", String(data.nombreColis), 12, y + 40, 55);
  addField(doc, "Poids Net (kg)", String(data.poidsNet), 74, y + 40, 55);
  addField(doc, "Poids Brut (kg)", String(data.poidsBrut), 136, y + 40, 61);
  addField(doc, "Valeur FOB (FCFA)", new Intl.NumberFormat("fr-FR").format(data.valeurFOB), 12, y + 60, 88);
  addField(doc, "Pays d'Origine", data.paysOrigine, 107, y + 60, 90);
  y += 80;

  // Déclaration
  y = addSection(doc, "DÉCLARATION D'ORIGINE", y, ORIGIN_RED) + 5;
  doc.setFillColor(255, 245, 245);
  doc.rect(12, y, 185, 16, "F");
  doc.setDrawColor(...ORIGIN_RED);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 185, 16);
  doc.setTextColor(120, 30, 30);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const decl = `Le soussigné déclare que les marchandises décrites ci-dessus sont originaires de ${data.paysOrigine} ` +
    "et qu'elles répondent aux conditions requises pour l'obtention de ce certificat.";
  doc.text(doc.splitTextToSize(decl, 181), 14, y + 6);
  y += 22;

  // Date + signature
  addField(doc, "Date d'Émission", data.dateEmission, 12, y, 88);
  y += 22;
  doc.setDrawColor(...ORIGIN_RED);
  doc.setLineWidth(0.3);
  doc.rect(12, y, 85, 22);
  doc.rect(110, y, 85, 22);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Cachet & Signature — Exportateur", 55, y + 8, { align: "center" });
  doc.text("Cachet — Chambre de Commerce", 152, y + 8, { align: "center" });
  doc.text("(Visa & Certification)", 152, y + 14, { align: "center" });

  addFooter(doc);
  triggerDownload(doc, `${data.certNumber}.pdf`);
}

// ─── LTA — Lettre de Transport Aérien (Master AWB multi-shipments) ────────────

export function generateLTA(data: LTAData): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = (require("jspdf-autotable") as typeof import("jspdf-autotable")).default;
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, "LETTRE DE TRANSPORT AÉRIEN", data.ltaNumber, [167, 139, 250]);

  let y = 36;

  // ── Bloc informations vol ──────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(12, y, w - 24, 34, "F");

  const col1 = 17;
  const col2 = w / 2 + 2;

  const fieldPairs: Array<[string, string, string, string]> = [
    ["VOL", data.flightNumber,        "COMPAGNIE",  data.airline],
    ["ORIGINE", data.originAirport,   "DESTINATION", data.destinationAirport],
    ["DÉPART", data.departureDate,    "ETA",         data.eta],
    ["ÉMISSION", data.issueDate,      "ÉMIS PAR",    data.issuedBy ?? "ORION Cargo Abidjan"],
  ];

  fieldPairs.forEach(([l1, v1, l2, v2], idx) => {
    const fy = y + 6 + idx * 7;
    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(l1, col1, fy);
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.text(v1, col1 + 22, fy);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(l2, col2, fy);
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.text(v2, col2 + 25, fy);
  });

  y += 40;

  // ── Totaux ────────────────────────────────────────────────────────────────
  doc.setTextColor(167, 139, 250);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.totalPieces} colis  ·  ${data.totalWeightKg} kg total  ·  ${data.shipments.length} expéditions`, 12, y);
  y += 6;

  // ── Tableau des expéditions ────────────────────────────────────────────────
  doc.setTextColor(167, 139, 250);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAIL DES EXPÉDITIONS", 12, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Réf AWB", "Expéditeur", "Destinataire", "Marchandise", "Colis", "Poids (kg)", "Valeur déclarée"]],
    body: data.shipments.map(s => [
      s.awbRef,
      s.shipper,
      s.consignee,
      s.cargo,
      String(s.pieces),
      `${s.weightKg} kg`,
      s.declaredValue ?? "—",
    ]),
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2, textColor: TEXT_DARK },
    headStyles: { fillColor: ORION_DARK, textColor: [167, 139, 250] as [number, number, number], fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 12, halign: "center" as const },
      5: { cellWidth: 20, halign: "right" as const },
      6: { cellWidth: 22, halign: "right" as const },
    },
  });

  // ── Zones signature ────────────────────────────────────────────────────────
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 200;
  const sigY = finalY + 14;

  if (sigY + 30 < doc.internal.pageSize.getHeight() - 20) {
    const sigW = (w - 30) / 3;
    [["Signature Agent", col1], ["Signature Compagnie", col1 + sigW + 3], ["Signature Client", col1 + (sigW + 3) * 2]].forEach(([label, sx]) => {
      doc.setFillColor(245, 247, 250);
      doc.rect(Number(sx), sigY, sigW, 20, "F");
      doc.setTextColor(...TEXT_GRAY);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(String(label), Number(sx) + sigW / 2, sigY + 25, { align: "center" });
    });
  }

  addFooter(doc);
  triggerDownload(doc, `LTA-${data.ltaNumber}.pdf`);
}

// ─── Rapport Intermodal ───────────────────────────────────────────────────────

export interface RapportIntermodalShipment {
  id: string;
  origin: string;
  destination: string;
  modes: string[];
  status: string;
  eta: string;
  totalDelay: number;
  cargo: string;
  tonnage: number;
  clientRef: string;
  segments: Array<{ mode: string; from: string; to: string; status: string; delay: number; carrier: string; }>;
}

export interface RapportIntermodalData {
  generatedAt: string;
  kpis: { total: number; onTrack: number; delayed: number; critical: number; avgDelay: number; jonctions: number };
  shipments: RapportIntermodalShipment[];
}

const INTERMODAL_STATUS_LABEL: Record<string, string> = {
  on_track: "En cours", delayed: "Retardé", critical: "Critique", delivered: "Livré",
};

const INTERMODAL_MODE_LABEL: Record<string, string> = {
  sea: "Maritime", rail: "Ferroviaire", road: "Routier", air: "Aérien",
};

export function generateRapportIntermodal(data: RapportIntermodalData): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = (require("jspdf-autotable") as typeof import("jspdf-autotable")).default;
  const JsPDF = loadJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // ── PAGE 1 : Synthèse ──────────────────────────────────────────────────────
  addHeader(doc, "RAPPORT INTERMODAL", data.generatedAt, ORION_GOLD);

  let y = 36;

  doc.setTextColor(...ORION_GOLD);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SYNTHÈSE OPÉRATIONNELLE", 12, y);
  y += 8;

  // KPIs en grille 3×2
  const kpiItems: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: "Total Expéditions", value: String(data.kpis.total),    color: ORION_GOLD },
    { label: "On Track",          value: String(data.kpis.onTrack),  color: [16, 185, 129] },
    { label: "Retardées",         value: String(data.kpis.delayed),  color: [245, 158, 11] },
    { label: "Critiques",         value: String(data.kpis.critical), color: [239, 68, 68]  },
    { label: "Délai Moyen",       value: `${data.kpis.avgDelay} min`, color: data.kpis.avgDelay > 60 ? [239, 68, 68] : [245, 158, 11] },
    { label: "Jonctions Actives", value: String(data.kpis.jonctions), color: [56, 189, 248] },
  ];
  const kpiW = (w - 24) / 3;
  kpiItems.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = 12 + col * kpiW;
    const ky = y + row * 22;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(kx, ky, kpiW - 3, 18, 2, 2, "F");
    doc.setTextColor(...kpi.color);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, kx + (kpiW - 3) / 2, ky + 10, { align: "center" });
    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, kx + (kpiW - 3) / 2, ky + 15, { align: "center" });
  });
  y += 50;

  // Tableau récapitulatif
  doc.setTextColor(...ORION_GOLD);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TABLEAU RÉCAPITULATIF", 12, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["N° ORN", "Trajet", "Modes", "Statut", "ETA", "Retard"]],
    body: data.shipments.map(s => [
      s.id,
      `${s.origin} → ${s.destination}`,
      s.modes.map(m => INTERMODAL_MODE_LABEL[m] ?? m).join(" → "),
      INTERMODAL_STATUS_LABEL[s.status] ?? s.status,
      s.eta,
      s.totalDelay > 0 ? `+${s.totalDelay} min` : "—",
    ]),
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2, textColor: TEXT_DARK },
    headStyles: { fillColor: ORION_DARK, textColor: ORION_GOLD, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: 52 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: "center" as const },
    },
    didParseCell: (hookData: Parameters<NonNullable<Parameters<typeof autoTable>[1]["didParseCell"]>>[0]) => {
      if (hookData.section === "body" && hookData.column.index === 3) {
        const st = data.shipments[hookData.row.index]?.status;
        if (st === "critical")       hookData.cell.styles.textColor = [239, 68, 68]   as [number, number, number];
        else if (st === "delayed")   hookData.cell.styles.textColor = [245, 158, 11]  as [number, number, number];
        else if (st === "on_track")  hookData.cell.styles.textColor = [16, 185, 129]  as [number, number, number];
      }
    },
  });

  addFooter(doc, 1);

  // ── PAGES 2+ : Détail par expédition ──────────────────────────────────────
  data.shipments.forEach((ship, idx) => {
    doc.addPage();
    addHeader(doc, "DÉTAIL EXPÉDITION", ship.id, ORION_GOLD);

    let dy = 36;

    // Bloc info
    doc.setFillColor(15, 23, 42);
    doc.rect(12, dy, w - 24, 26, "F");
    doc.setTextColor(...ORION_GOLD);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(ship.id, 17, dy + 8);
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${ship.origin} → ${ship.destination}`, 17, dy + 15);
    doc.text(`Réf: ${ship.clientRef}  ·  ${ship.tonnage}T  ·  ${ship.cargo}`, 17, dy + 21);
    const stColor: [number, number, number] = ship.status === "critical" ? [239, 68, 68]
      : ship.status === "delayed" ? [245, 158, 11] : [16, 185, 129];
    doc.setTextColor(...stColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(INTERMODAL_STATUS_LABEL[ship.status] ?? ship.status, w - 17, dy + 10, { align: "right" });
    doc.setTextColor(...TEXT_GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`ETA: ${ship.eta}${ship.totalDelay > 0 ? `  ·  Retard: +${ship.totalDelay} min` : ""}`, w - 17, dy + 18, { align: "right" });
    dy += 32;

    // Tableau segments
    doc.setTextColor(...ORION_GOLD);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SEGMENTS DE TRANSPORT", 12, dy);
    dy += 4;

    autoTable(doc, {
      startY: dy,
      head: [["Mode", "Départ", "Arrivée", "Transporteur", "Statut", "Retard"]],
      body: ship.segments.map(seg => [
        INTERMODAL_MODE_LABEL[seg.mode] ?? seg.mode,
        seg.from,
        seg.to,
        seg.carrier,
        seg.status === "completed" ? "Terminé"
          : seg.status === "active" ? "Actif"
          : seg.status === "delayed" ? "Retardé"
          : "En attente",
        seg.delay > 0 ? `+${seg.delay} min` : "—",
      ]),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, textColor: TEXT_DARK },
      headStyles: { fillColor: ORION_DARK, textColor: ORION_GOLD, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
    });

    addFooter(doc, idx + 2);
  });

  triggerDownload(doc, `ORION-Intermodal-${data.generatedAt.replace(/\//g, "-")}.pdf`);
}
