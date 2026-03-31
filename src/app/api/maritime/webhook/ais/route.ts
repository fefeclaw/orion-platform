/**
 * Webhook AIS temps réel — Réception des positions navires
 * Agent 7 — Data & APIs (Webhook temps réel)
 * Supporte: MarineTraffic, VesselFinder, sources AIS externes
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbAvailable } from "@/lib/db";
import { cacheSet } from "@/lib/cache";

// Types pour les données AIS reçues
interface AISUpdate {
  mmsi: string;
  vesselName?: string;
  lat: number;
  lon: number;
  speed: number; // knots
  course: number; // degrés
  timestamp: string; // ISO 8601
  source: string; // MarineTraffic, VesselFinder, etc.
  destination?: string;
  eta?: string;
  status?: number; // 0=underway, 1=anchored, etc.
}

// Validation du token webhook
function validateWebhookToken(request: NextRequest): boolean {
  const token = request.headers.get("x-webhook-token") || 
                request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedToken = process.env.AIS_WEBHOOK_SECRET;
  
  if (!expectedToken) {
    console.warn("[AIS Webhook] AIS_WEBHOOK_SECRET non configuré");
    return true; // Mode développement: accepter sans token si non configuré
  }
  
  return token === expectedToken;
}

// Validation des données AIS
function validateAISData(data: unknown): data is AISUpdate {
  const update = data as AISUpdate;
  return (
    typeof update === "object" &&
    typeof update.mmsi === "string" &&
    typeof update.lat === "number" &&
    typeof update.lon === "number" &&
    typeof update.speed === "number" &&
    typeof update.course === "number" &&
    typeof update.timestamp === "string" &&
    update.lat >= -90 && update.lat <= 90 &&
    update.lon >= -180 && update.lon <= 180 &&
    update.speed >= 0 && update.speed <= 60 // max ~60 knots
  );
}

// Sauvegarde en base de données
function saveAISUpdate(update: AISUpdate): void {
  if (!isDbAvailable()) return;
  
  try {
    const db = getDb();
    
    // Insertion/mise à jour de la position
    db.prepare(`
      INSERT INTO vessel_positions (
        mmsi, vessel_name, lat, lon, speed, course, 
        timestamp, source, destination, eta, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(mmsi) DO UPDATE SET
        vessel_name = COALESCE(excluded.vessel_name, vessel_name),
        lat = excluded.lat,
        lon = excluded.lon,
        speed = excluded.speed,
        course = excluded.course,
        timestamp = excluded.timestamp,
        source = excluded.source,
        destination = COALESCE(excluded.destination, destination),
        eta = COALESCE(excluded.eta, eta),
        status = COALESCE(excluded.status, status),
        updated_at = datetime('now')
    `).run(
      update.mmsi,
      update.vesselName || null,
      update.lat,
      update.lon,
      update.speed,
      update.course,
      update.timestamp,
      update.source,
      update.destination || null,
      update.eta || null,
      update.status || null
    );
    
    // Mise en cache pour accès rapide (60 secondes)
    cacheSet(`ais:${update.mmsi}`, update, 60);
    
  } catch (error) {
    console.error("[AIS Webhook] Erreur sauvegarde:", error);
  }
}

// Vérification des alertes (entrée/sortie zone, changement brusque de cap/speed)
function checkAlerts(update: AISUpdate): void {
  if (!isDbAvailable()) return;
  
  try {
    const db = getDb();
    
    // Récupérer la position précédente
    const prevPosition = db.prepare(
      "SELECT lat, lon, speed, course, timestamp FROM vessel_positions WHERE mmsi = ? ORDER BY timestamp DESC LIMIT 1 OFFSET 1"
    ).get(update.mmsi) as { lat: number; lon: number; speed: number; course: number; timestamp: string } | undefined;
    
    if (!prevPosition) return;
    
    const alerts = [];
    
    // Vérifier changement brusque de cap (> 45°)
    const courseChange = Math.abs(update.course - prevPosition.course);
    if (courseChange > 45 && courseChange < 315) { // éviter le wrap 359->0
      alerts.push({
        type: 'COURSE_CHANGE',
        severity: courseChange > 90 ? 'high' : 'medium',
        message: `Changement de cap: ${prevPosition.course}° → ${update.course}° (${courseChange}°)`
      });
    }
    
    // Vérifier arrêt brusque (vitesse chute > 80%)
    if (prevPosition.speed > 5 && update.speed < prevPosition.speed * 0.2) {
      alerts.push({
        type: 'SUDDEN_STOP',
        severity: 'high',
        message: `Arrêt brusque: ${prevPosition.speed.toFixed(1)}kt → ${update.speed.toFixed(1)}kt`
      });
    }
    
    // Sauvegarder les alertes
    alerts.forEach(alert => {
      db.prepare(`
        INSERT INTO vessel_alerts (mmsi, type, severity, message, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(update.mmsi, alert.type, alert.severity, alert.message);
    });
    
  } catch (error) {
    console.error("[AIS Webhook] Erreur alertes:", error);
  }
}

// POST /api/maritime/webhook/ais — Réception des mises à jour AIS
export async function POST(request: NextRequest) {
  try {
    // Validation du token
    if (!validateWebhookToken(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Supporte les batches de mises à jour
    const updates: AISUpdate[] = Array.isArray(body) ? body : [body];
    
    const results = {
      received: updates.length,
      valid: 0,
      invalid: 0,
      errors: [] as string[]
    };
    
    for (const update of updates) {
      if (!validateAISData(update)) {
        results.invalid++;
        continue;
      }
      
      try {
        saveAISUpdate(update);
        checkAlerts(update);
        results.valid++;
      } catch (error) {
        results.errors.push(`MMSI ${update.mmsi}: ${(error as Error).message}`);
      }
    }
    
    console.info(`[AIS Webhook] Reçu ${results.received} mises à jour, validées: ${results.valid}`);
    
    return NextResponse.json({
      success: true,
      ...results
    }, { status: 200 });
    
  } catch (error) {
    console.error("[AIS Webhook] Erreur:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/maritime/webhook/ais — Statut du webhook
export async function GET() {
  return NextResponse.json({
    status: "active",
    supportedFormats: ["MarineTraffic", "VesselFinder", "Generic AIS"],
    endpoints: {
      post: "/api/maritime/webhook/ais",
      method: "POST",
      headers: {
        required: ["Content-Type: application/json"],
        optional: ["X-Webhook-Token: <secret>"],
        authorization: "Bearer <token> (si AIS_WEBHOOK_SECRET configuré)"
      }
    }
  });
}
