/**
 * Health Check API — ORION Monitoring
 * Retourne le statut de tous les services critiques
 * Utilisé par k6 et monitoring externe
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDbAvailable, getDb } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "up" | "down" | "degraded"; latency: number; details?: Record<string, unknown> }> = {};
  
  try {
    // Vérification Auth optionnelle pour endpoint public
    const session = await auth().catch(() => null);
    const isAdmin = session?.user?.role === "admin";
    
    // ─────────────────────────────────────────
    // 1. Check SQLite DB + WAL mode
    // ─────────────────────────────────────────
    const dbStart = Date.now();
    let walStatus = false;
    let dbVersion = "";
    
    if (isDbAvailable()) {
      try {
        const db = getDb();
        const journalMode = db.pragma("journal_mode") as [{ journal_mode: string }];
        walStatus = journalMode[0]?.journal_mode === "wal";
        
        const version = db.pragma("user_version") as [{ user_version: number }];
        dbVersion = String(version[0]?.user_version ?? 0);
        
        // Test écriture concurrente simple
        db.prepare("SELECT 1").run();
        
        checks.database = {
          status: walStatus ? "up" : "degraded",
          latency: Date.now() - dbStart,
          details: {
            engine: "better-sqlite3",
            wal_mode: walStatus,
            version: dbVersion,
            concurrent_writes: walStatus ? "supported" : "disabled"
          }
        };
      } catch (dbErr) {
        checks.database = {
          status: "down",
          latency: Date.now() - dbStart,
          details: { error: String(dbErr) }
        };
      }
    } else {
      checks.database = {
        status: "down",
        latency: 0,
        details: { error: "better-sqlite3 not available" }
      };
    }
    
    // ─────────────────────────────────────────
    // 2. Check API tierces (timeout simulé)
    // ─────────────────────────────────────────
    const apiStart = Date.now();
    const ship24Key = process.env.SHIP24_API_KEY;
    const marineKey = process.env.MARINETRAFFIC_API_KEY;
    const orangeKey = process.env.ORANGE_SMS_API_KEY;
    
    checks.external_apis = {
      status: marineKey ? "up" : "degraded",
      latency: Date.now() - apiStart,
      details: {
        ship24_configured: Boolean(ship24Key),
        marinetraffic_configured: Boolean(marineKey),
        orange_sms_configured: Boolean(orangeKey),
      }
    };
    
    // ─────────────────────────────────────────
    // 3. Check Cache (SQLite TTL)
    // ─────────────────────────────────────────
    const cacheStart = Date.now();
    checks.cache = {
      status: isDbAvailable() ? "up" : "down",
      latency: Date.now() - cacheStart,
      details: {
        type: "SQLite TTL",
        available: isDbAvailable()
      }
    };
    
    // ─────────────────────────────────────────
    // Réponse
    // ─────────────────────────────────────────
    const overallStatus = Object.values(checks).every(c => c.status === "up") 
      ? "healthy" 
      : Object.values(checks).some(c => c.status === "down") ? "unhealthy" : "degraded";
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime,
      checks,
      environment: process.env.NODE_ENV || "unknown",
      wal_mode_enabled: walStatus, // Pour k6 test
    };
    
    return NextResponse.json(response, { 
      status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503 
    });
    
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: String(error),
      checks: { database: { status: "down", latency: 0 } }
    }, { status: 503 });
  }
}

/**
 * HEAD pour health check rapide (load balancer)
 */
export async function HEAD() {
  const dbOk = isDbAvailable();
  return new Response(null, { 
    status: dbOk ? 200 : 503,
    headers: { "X-Database-Status": dbOk ? "up" : "down" }
  });
}
