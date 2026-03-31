// Route API : POST /api/documents/archive
// Persiste un document généré côté client (LV, AWB, CMR, BSC, TRIE...) en SQLite.
// Retourne l'ID attribué pour traçabilité.

import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbAvailable } from "@/lib/db";

const VALID_TYPES   = ["BL", "LV", "AWB", "CMR", "BSC", "TRIE", "MANIFEST", "PHYTO", "ORIGIN", "LTA", "INTERMODAL"] as const;
const VALID_PILLARS = ["maritime", "rail", "road", "air", "intermodal"] as const;

type DocType   = typeof VALID_TYPES[number];
type DocPillar = typeof VALID_PILLARS[number];

interface ArchivePayload {
  type:        DocType;
  pillar:      DocPillar;
  reference:   string;
  vessel_ref?: string;
  origin?:     string;
  destination?: string;
  cargo?:      string;
  metadata?:   Record<string, unknown>;
  created_by?: string;
}

export async function POST(req: NextRequest) {
  if (!isDbAvailable()) {
    // SQLite absent — on accepte silencieusement (dégradé sans crash)
    return NextResponse.json({ ok: true, id: null, degraded: true });
  }

  let payload: ArchivePayload;
  try {
    payload = await req.json() as ArchivePayload;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { type, pillar, reference } = payload;

  if (!VALID_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: `Type inconnu : ${type}` }, { status: 400 });
  }
  if (!VALID_PILLARS.includes(pillar as DocPillar)) {
    return NextResponse.json({ error: `Pilier inconnu : ${pillar}` }, { status: 400 });
  }
  if (!reference?.trim()) {
    return NextResponse.json({ error: "Champ reference requis" }, { status: 400 });
  }

  const db = getDb();
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  db.prepare(`
    INSERT INTO documents (id, type, pillar, reference, vessel_ref, origin, destination, cargo, metadata, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    type,
    pillar,
    reference.trim(),
    payload.vessel_ref  ?? null,
    payload.origin      ?? null,
    payload.destination ?? null,
    payload.cargo       ?? null,
    JSON.stringify(payload.metadata ?? {}),
    payload.created_by  ?? null,
  );

  return NextResponse.json({ ok: true, id }, { status: 201 });
}

// GET /api/documents/archive?pillar=maritime&type=BL&limit=20
export async function GET(req: NextRequest) {
  if (!isDbAvailable()) {
    return NextResponse.json({ documents: [], degraded: true });
  }

  const { searchParams } = new URL(req.url);
  const pillar = searchParams.get("pillar");
  const type   = searchParams.get("type");
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  const db = getDb();

  let query = "SELECT id, type, pillar, reference, vessel_ref, origin, destination, cargo, created_by, created_at FROM documents";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (pillar) { conditions.push("pillar = ?"); params.push(pillar); }
  if (type)   { conditions.push("type = ?");   params.push(type); }

  if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const rows = db.prepare(query).all(...params) as Array<{
    id: string; type: string; pillar: string; reference: string;
    vessel_ref: string | null; origin: string | null; destination: string | null;
    cargo: string | null; created_by: string | null; created_at: number;
  }>;

  return NextResponse.json({ documents: rows });
}
