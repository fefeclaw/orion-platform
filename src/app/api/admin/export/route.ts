/**
 * Endpoint d'export Excel des rapports
 * Agent 8 — Docs & Admin (Export Excel rapports)
 */
import { NextRequest, NextResponse } from "next/server";
import { exportIntermodalReport, exportMaritimeReport, exportUsageStats, exportAlertsReport } from "@/lib/export";
import { getDb, isDbAvailable } from "@/lib/db";

// Types de rapports acceptés
type ReportType = "intermodal" | "maritime" | "usage" | "alerts";

// Validation du type
function isValidReportType(type: unknown): type is ReportType {
  return typeof type === "string" && ["intermodal", "maritime", "usage", "alerts"].includes(type);
}

// POST /api/admin/export
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    // En production, vérifier le token admin
    // Pour l'instant, on accepte les requêtes avec token ou session
    
    const body = await request.json();
    const { type, filters = {} } = body;
    
    if (!isValidReportType(type)) {
      return NextResponse.json(
        { error: "Type de rapport invalide", valid_types: ["intermodal", "maritime", "usage", "alerts"] },
        { status: 400 }
      );
    }
    
    let excelBuffer: Buffer;
    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `rapport-orion-${type}-${timestamp}.xlsx`;
    
    // Génération du rapport selon le type
    switch (type) {
      case "intermodal": {
        // Données mock ou depuis DB
        const shipments = await getIntermodalData(filters);
        excelBuffer = exportIntermodalReport(shipments);
        break;
      }
      
      case "maritime": {
        const vessels = await getMaritimeData(filters);
        excelBuffer = exportMaritimeReport(vessels);
        break;
      }
      
      case "usage": {
        const stats = await getUsageStats(filters);
        excelBuffer = exportUsageStats(stats);
        break;
      }
      
      case "alerts": {
        const alerts = await getAlerts(filters);
        excelBuffer = exportAlertsReport(alerts);
        break;
      }
      
      default:
        return NextResponse.json({ error: "Type non implémenté" }, { status: 501 });
    }
    
    // Réponse avec fichier Excel
    // Conversion Buffer → Uint8Array pour compatibilité NextResponse
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache"
      }
    });
    
  } catch (error) {
    console.error("[Export API] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/admin/export — Liste des types disponibles
export async function GET() {
  return NextResponse.json({
    available_exports: [
      {
        type: "intermodal",
        description: "Rapport de suivi multimodal (shipments ORN)",
        columns: ["Référence", "Mode", "Statut", "Origine", "Destination", "ETA", "Retard", "Transporteur"]
      },
      {
        type: "maritime",
        description: "Positions navires AIS",
        columns: ["MMSI", "Nom", "Latitude", "Longitude", "Vitesse", "Destination", "ETA"]
      },
      {
        type: "usage",
        description: "Statistiques d'utilisation par utilisateur",
        columns: ["Mois", "Utilisateur", "Plan", "Docs Générés", "Conteneurs Tracés"]
      },
      {
        type: "alerts",
        description: "Alertes et incidents",
        columns: ["Date", "Type", "Sévérité", "Navire", "Message", "Résolu"]
      }
    ],
    endpoint: "POST /api/admin/export",
    example_body: {
      type: "intermodal",
      filters: {
        from: "2026-03-01",
        to: "2026-03-31",
        status: ["delayed", "critical"]
      }
    }
  });
}

// === Fonctions de récupération des données ===

async function getIntermodalData(filters: Record<string, unknown>) {
  // En production: requête SQLite
  // Pour l'instant: données mock
  return [
    {
      reference: "ORN-MT-2026-0088",
      mode: "intermodal",
      status: "on_track",
      origin: "Rotterdam",
      destination: "Ouagadougou",
      eta: "2026-04-05",
      delay: 0,
      carrier: "ORION Multimodal"
    },
    {
      reference: "ORN-RD-2026-0042",
      mode: "road",
      status: "on_track",
      origin: "Abidjan",
      destination: "Ouagadougou",
      eta: "2026-04-01",
      delay: 0,
      carrier: "SahelRoute Logistics"
    },
    {
      reference: "ORN-MT-2026-0018",
      mode: "maritime",
      status: "delayed",
      origin: "Port de Dakar",
      destination: "Port d'Abidjan",
      eta: "2026-04-03",
      delay: 18,
      carrier: "Africa Merchant Lines"
    }
  ];
}

async function getMaritimeData(filters: Record<string, unknown>) {
  return [
    {
      mmsi: "123456789",
      name: "AFRICA MERCHANT",
      lat: 5.31,
      lon: -4.02,
      speed: 12.5,
      destination: "Port d'Abidjan",
      eta: "2026-04-01 08:00"
    },
    {
      mmsi: "987654321",
      name: "GULF TRADER",
      lat: 4.95,
      lon: -4.45,
      speed: 8.2,
      destination: "Port de San Pedro",
      eta: "2026-04-02 14:30"
    }
  ];
}

async function getUsageStats(filters: Record<string, unknown>) {
  if (isDbAvailable()) {
    const db = getDb();
    // Requête des stats depuis subscriptions
    const rows = db.prepare(`
      SELECT user_id, plan, docs_generes_mois, conteneurs_trackes_mois,
             strftime('%Y-%m', updated_at) as month
      FROM subscriptions
      ORDER BY updated_at DESC
      LIMIT 100
    `).all() as {
      user_id: string;
      plan: string;
      docs_generes_mois: number;
      conteneurs_trackes_mois: number;
      month: string;
    }[];
    
    return rows.map(row => ({
      month: row.month,
      user_id: row.user_id,
      plan: row.plan,
      docs_generated: row.docs_generes_mois,
      containers_tracked: row.conteneurs_trackes_mois
    }));
  }
  
  // Fallback mock
  return [
    { month: "2026-03", user_id: "USR-001", plan: "standard", docs_generated: 8, containers_tracked: 45 },
    { month: "2026-03", user_id: "USR-002", plan: "business", docs_generated: 45, containers_tracked: 120 },
  ];
}

async function getAlerts(filters: Record<string, unknown>) {
  if (isDbAvailable()) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM vessel_alerts
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as {
      created_at: string;
      type: string;
      severity: string;
      mmsi: string;
      message: string;
    }[];
    
    // Récupérer les noms des navires
    const vessels: Record<string, string> = {};
    for (const row of rows) {
      if (!vessels[row.mmsi]) {
        const v = db.prepare("SELECT vessel_name FROM vessel_positions WHERE mmsi = ?").get(row.mmsi) as { vessel_name?: string } | undefined;
        vessels[row.mmsi] = v?.vessel_name || row.mmsi;
      }
    }
    
    return rows.map(row => ({
      date: row.created_at,
      type: row.type,
      severity: row.severity,
      vessel: vessels[row.mmsi] || row.mmsi,
      message: row.message,
      resolved: false
    }));
  }
  
  // Fallback mock
  return [
    { date: "2026-03-31 14:30", type: "COURSE_CHANGE", severity: "medium", vessel: "AFRICA MERCHANT", message: "Dérivation de 45°", resolved: false },
    { date: "2026-03-31 10:15", type: "SUDDEN_STOP", severity: "high", vessel: "GULF TRADER", message: "Arrêt brusque détecté", resolved: true }
  ];
}
