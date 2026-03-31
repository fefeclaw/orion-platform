// Route API : POST /api/maritime/bl/generate
// Génère un PDF B/L côté serveur, le sauvegarde en SQLite et le retourne en stream.
// Compatible Next.js App Router (Node.js runtime uniquement — pas de Edge).

import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbAvailable } from "@/lib/db";
import type { BLData, BLContainer } from "@/lib/pdf/bl-generator";
import { withSubscription } from "@/middleware/withSubscription";

// ─── Génération PDF côté serveur (isomorphe — pas de browser API) ─────────────

function buildBLPdf(data: BLData): Buffer {
  // Chargement dynamique pour éviter les problèmes SSR
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require("jspdf") as typeof import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // ── En-tête ────────────────────────────────────────────────────────────────
  doc.setFillColor(3, 9, 18);
  doc.rect(0, 0, w, 30, "F");

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ORION", 12, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUTONOMOUS LOGISTICS PLATFORM", 12, 20);

  // Badge document
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(w - 72, 7, 62, 17, 3, 3, "F");
  doc.setTextColor(3, 9, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILL OF LADING", w - 41, 16, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(data.blNumber, w - 41, 21, { align: "center" });

  // Ligne séparatrice gold
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(0, 30, w, 30);

  // ── Corps ─────────────────────────────────────────────────────────────────
  let y = 40;

  const field = (label: string, value: string, x: number, yPos: number, maxW: number) => {
    doc.setTextColor(100, 120, 140);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), x, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFillColor(245, 247, 250);
    doc.rect(x, yPos + 1.5, maxW, 8, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(value || "—", x + 2, yPos + 7);
  };

  const section = (title: string, yPos: number): number => {
    doc.setFillColor(6, 24, 52);
    doc.rect(10, yPos, w - 20, 7, "F");
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPos + 5);
    return yPos + 7;
  };

  // Navire
  y = section("NAVIRE & VOYAGE", y) + 5;
  field("Navire", data.shipName, 10, y, 55);
  field("IMO", data.imo, 72, y, 35);
  field("Pavillon", data.flag, 114, y, 30);
  field("Voyage N°", data.voyage, 151, y, 48);
  y += 18;

  // Ports
  y = section("PORTS", y) + 5;
  field("Port de Chargement", data.portLoading, 10, y, 85);
  field("Port de Déchargement", data.portDischarge, 103, y, 96);
  field("Lieu de Livraison", data.placeDelivery, 10, y + 18, 85);
  field("ETA", data.eta, 103, y + 18, 96);
  y += 36;

  // Parties
  y = section("EXPÉDITEUR / DESTINATAIRE", y) + 5;
  field("Expéditeur (Shipper)", data.shipper, 10, y, 85);
  field("Destinataire (Consignee)", data.consignee, 103, y, 96);
  if (data.shipperAddress) field("Adresse", data.shipperAddress, 10, y + 18, 85);
  if (data.consigneeAddress) field("Adresse", data.consigneeAddress, 103, y + 18, 96);
  y += data.shipperAddress || data.consigneeAddress ? 36 : 18;
  if (data.notifyParty) {
    field("Notify Party", data.notifyParty, 10, y, 189);
    y += 18;
  }

  // Marchandise
  y = section("MARCHANDISE", y) + 5;
  field("Description", data.cargo, 10, y, 189);
  field("Poids Brut Total (kg)", String(data.grossWeight), 10, y + 18, 60);
  field("Volume Total (m³)", String(data.totalVolume), 78, y + 18, 60);
  field("Fret", data.freightTerms, 146, y + 18, 53);
  y += 36;

  // Conteneurs
  if (data.containers.length > 0) {
    y = section("CONTENEURS", y) + 5;
    const headers = [["N° Conteneur", "Type", "Colis", "N° Plomb", "Poids (kg)", "Volume (m³)"]];
    const rows = data.containers.map((c: BLContainer) => [
      c.number, c.type + "'", String(c.count), c.sealNo,
      String(c.weight), String(c.volume),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const autoTable = require("jspdf-autotable").default as typeof import("jspdf-autotable").default;
    autoTable(doc, {
      startY: y,
      head: headers, body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [6, 24, 52], textColor: [212, 175, 55] },
      margin: { left: 10, right: 10 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = autoY !== undefined ? autoY + 8 : y + 20;
  }

  // Instructions spéciales
  if (data.specialInstructions) {
    y = section("INSTRUCTIONS SPÉCIALES", y) + 5;
    doc.setTextColor(50, 60, 80);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(data.specialInstructions, 12, y, { maxWidth: w - 24 });
    y += 14;
  }

  // Date + signatures
  y = section("ÉMISSION", y) + 5;
  field("Date d'Émission", data.issueDate, 10, y, 55);
  field("Exemplaires Originaux", `${data.originalCount} (${["un", "deux", "trois"][data.originalCount - 1]})`, 72, y, 55);

  // Zone signature
  const sigY = y + 18;
  doc.setDrawColor(6, 24, 52);
  doc.setLineWidth(0.3);
  doc.rect(10, sigY, 85, 18);
  doc.rect(103, sigY, 96, 18);
  doc.setTextColor(100, 120, 140);
  doc.setFontSize(7);
  doc.text("Cachet & Signature — Transporteur", 53, sigY + 7, { align: "center" });
  doc.text("Cachet & Signature — Port d'Abidjan", 151, sigY + 7, { align: "center" });

  // ── Mention légale bas de page ─────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(10, footerY - 2, w - 10, footerY - 2);
  doc.setTextColor(120, 130, 150);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Ce connaissement est émis conformément aux Règles de La Haye-Visby (Convention de Bruxelles amendée). " +
    "En acceptant ce document, le destinataire reconnaît les conditions de transport publiées par ORION Logistics CI.",
    w / 2, footerY + 2, { align: "center", maxWidth: w - 20 }
  );
  doc.text(
    `ORION Autonomous Logistics Platform · Port Autonome d'Abidjan, Côte d'Ivoire · ref: ${data.blNumber}`,
    w / 2, footerY + 7, { align: "center" }
  );

  // Retour Buffer compatible Node.js
  return Buffer.from(doc.output("arraybuffer"));
}

// ─── Route POST (protégée — feature: doc_generation, quota 10/mois Standard) ──

async function postHandler(req: NextRequest) {
  let body: BLData;

  try {
    body = (await req.json()) as BLData;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.blNumber || !body.shipName || !body.consignee) {
    return NextResponse.json({ error: "Champs obligatoires manquants : blNumber, shipName, consignee" }, { status: 422 });
  }

  // Génération PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = buildBLPdf(body);
  } catch (err) {
    console.error("[bl/generate] Erreur génération PDF:", err);
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 });
  }

  // Persistance SQLite (si disponible)
  if (isDbAvailable()) {
    try {
      const db = getDb();
      db.prepare(`
        INSERT OR REPLACE INTO documents
          (id, type, pillar, reference, vessel_ref, origin, destination, cargo, metadata, created_at)
        VALUES
          (@id, @type, @pillar, @reference, @vessel_ref, @origin, @destination, @cargo, @metadata, unixepoch())
      `).run({
        id:          body.blNumber,
        type:        "BL",
        pillar:      "maritime",
        reference:   body.blNumber,
        vessel_ref:  body.shipName,
        origin:      body.portLoading,
        destination: body.portDischarge,
        cargo:       body.cargo,
        metadata:    JSON.stringify({
          imo: body.imo, flag: body.flag, voyage: body.voyage,
          shipper: body.shipper, consignee: body.consignee,
          grossWeight: body.grossWeight, freightTerms: body.freightTerms,
          containers: body.containers.length,
        }),
      });
    } catch (err) {
      // Ne pas bloquer si SQLite échoue — le PDF est déjà généré
      console.warn("[bl/generate] SQLite unavailable, skipping persist:", err);
    }
  }

  // Retour PDF en stream
  return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${body.blNumber}.pdf"`,
      "Content-Length":      String(pdfBuffer.length),
      "Cache-Control":       "no-store",
    },
  });
}

export const POST = withSubscription(postHandler, { feature: "doc_generation" });

// ─── Route GET — liste des B/L archivés ──────────────────────────────────────

export async function GET() {
  if (!isDbAvailable()) {
    return NextResponse.json({ documents: [], source: "localStorage" });
  }

  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT id, reference, vessel_ref, origin, destination, cargo, created_at FROM documents WHERE type = 'BL' ORDER BY created_at DESC LIMIT 100"
    ).all() as Array<{
      id: string; reference: string; vessel_ref: string;
      origin: string; destination: string; cargo: string; created_at: number;
    }>;

    return NextResponse.json({
      documents: rows.map(r => ({
        ...r,
        created_at_iso: new Date(r.created_at * 1000).toISOString(),
      })),
      source: "sqlite",
    });
  } catch (err) {
    console.error("[bl/generate] GET error:", err);
    return NextResponse.json({ error: "Erreur lecture base" }, { status: 500 });
  }
}
