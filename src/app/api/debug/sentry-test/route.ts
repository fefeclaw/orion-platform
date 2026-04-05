/**
 * Route API de test Sentry — ORION
 * 
 * GET  /api/debug/sentry-test — Test capture erreur serveur
 * POST /api/debug/sentry-test — Test capture avec body personnalisé
 * 
 * @file src/app/api/debug/sentry-test/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { captureExternalApiError, captureTimeoutError, addBreadcrumb } from "@/lib/sentry";

/**
 * GET — Test basique : throw erreur simple
 */
export async function GET(): Promise<NextResponse> {
  console.log("[Sentry Test] Déclenchement erreur test...");

  try {
    // Simuler une erreur API tierce
    throw new Error("TEST_ERROR_SENTRY: Simulation erreur Ship24 timeout");
  } catch (error) {
    // Capture avec contexte enrichi
    captureExternalApiError("SHIP24_TIMEOUT", error, {
      endpoint: "/api/tracking/ship24",
      params: { trackingNumber: "TEST123456" },
      duration: 5200,
      retryAttempt: 3,
      fallbackUsed: true,
    });

    return NextResponse.json({
      success: true,
      message: "Erreur test envoyée à Sentry",
      check: "Vérifiez votre dashboard Sentry dans les prochaines secondes",
      errorType: "SHIP24_TIMEOUT",
      sentryDsnConfigured: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
}

/**
 * POST — Test avancé : multiples types d'erreurs
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const testType = body.type || "all";

  console.log(`[Sentry Test] Type: ${testType}`);

  const results: string[] = [];

  // Test 1: Timeout MarineTraffic
  if (testType === "all" || testType === "timeout") {
    const testError = new Error("Connection timeout after 10000ms");
    captureTimeoutError("marinetraffic", "fetchVesselPositions", 10000, 2);
    results.push("✅ Timeout MarineTraffic capturé");
  }

  // Test 2: Erreur API Orange
  if (testType === "all" || testType === "api") {
    const orangeError = new Error("ORANGE_API_401: Invalid credentials");
    captureExternalApiError("ORANGE_SMS_API_ERROR", orangeError, {
      endpoint: "/oauth/token",
      responseStatus: 401,
      recipient: "+225XXXX",
      duration: 850,
    });
    results.push("✅ Erreur API Orange capturée");
  }

  // Test 3: Breadcrumb personnalisé
  if (testType === "all" || testType === "breadcrumb") {
    addBreadcrumb("test_flow", "Étape de test Sentry", {
      step: 1,
      data: { test: true, timestamp: Date.now() },
    }, "info");
    
    addBreadcrumb("document_generation", "Génération BL simulée", {
      documentType: "BL",
      shipId: "VESSEL-001",
    }, "info");
    
    Sentry.captureMessage("Test breadcrumb trail", "info");
    results.push("✅ Breadcrumbs ajoutés");
  }

  // Test 4: Erreur critique
  if (testType === "all" || testType === "critical") {
    const criticalError = new Error("DATABASE_CONNECTION_FAILED: SQLite unreachable");
    Sentry.captureException(criticalError, {
      level: "fatal",
      tags: {
        error_category: "database_critical",
        requires_pager: "true",
      },
      extra: {
        dbPath: "/data/orion.db",
        retryCount: 5,
      },
    });
    results.push("✅ Erreur critique capturée (level: fatal)");
  }

  // Test 5: Transaction avec span
  if (testType === "all" || testType === "performance") {
    await Sentry.startSpan(
      { name: "test-transaction", op: "test.performance" },
      async (span) => {
        span?.setAttribute("test.attribute", "value");
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await Sentry.startSpan(
          { name: "nested-operation", op: "test.nested" },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        );
      }
    );
    results.push("✅ Transaction performance créée");
  }

  return NextResponse.json({
    success: true,
    message: `Tests Sentry exécutés: ${results.length}`,
    results,
    testType,
    sentryDsnConfigured: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
