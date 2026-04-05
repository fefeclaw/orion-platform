/**
 * Script de test Sentry — ORION
 * 
 * Teste l'envoi d'events à Sentry sans démarrer le serveur Next.js
 * 
 * Usage: npx tsx scripts/test-sentry.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Charger env avant Sentry
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (!DSN) {
  console.error("❌ ERREUR: SENTRY_DSN ou NEXT_PUBLIC_SENTRY_DSN non configuré");
  console.log("\nAjoutez dans .env.local:");
  console.log('  NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx');
  process.exit(1);
}

console.log("=== Test Sentry — ORION ===\n");
console.log(`DSN configuré: ${DSN.substring(0, 40)}...`);
console.log(`Environnement: ${process.env.NODE_ENV || "development"}\n`);

// Init Sentry
Sentry.init({
  dsn: DSN,
  environment: process.env.NODE_ENV || "development",
  beforeSend(event) {
    console.log("📤 Event prêt à être envoyé:", event.event_id);
    return event;
  },
});

console.log("✅ Sentry initialisé\n");

async function runTests() {
  console.log("--- Test 1: Message simple ---");
  Sentry.captureMessage("Test message from ORION script", "info");
  console.log("✅ Message envoyé\n");

  console.log("--- Test 2: Exception avec contexte ---");
  try {
    throw new Error("TEST_ERROR: Simulation erreur Ship24");
  } catch (error) {
    Sentry.captureException(error, {
      level: "warning",
      tags: {
        error_category: "external_api",
        api_service: "ship24",
        test: "true",
      },
      extra: {
        endpoint: "/api/tracking/test",
        duration: 1234,
        testRun: true,
      },
    });
    console.log("✅ Exception capturée avec tags et extra\n");
  }

  console.log("--- Test 3: Erreur critique ---");
  const criticalError = new Error("DATABASE_FAILURE: Connection refused");
  Sentry.captureException(criticalError, {
    level: "fatal",
    tags: {
      requires_pager: "true",
      error_category: "database",
    },
    extra: {
      retryCount: 5,
      dbPath: "/data/orion.db",
    },
  });
  console.log("✅ Erreur critique (fatal) capturée\n");

  console.log("--- Test 4: Breadcrumbs ---");
  Sentry.addBreadcrumb({
    category: "test_flow",
    message: "Étape 1: Initialisation",
    level: "info",
    data: { step: 1 },
  });
  Sentry.addBreadcrumb({
    category: "test_flow", 
    message: "Étape 2: Traitement",
    level: "info",
    data: { step: 2, items: 42 },
  });
  Sentry.captureMessage("Test avec breadcrumbs", "info");
  console.log("✅ Breadcrumbs ajoutés\n");

  console.log("--- Test 5: User context ---");
  Sentry.setUser({
    id: "TEST-USER-001",
    email: "test@orion.ci",
    role: "admin",
  });
  Sentry.captureMessage("Action utilisateur test", "info");
  console.log("✅ Contexte utilisateur défini\n");

  // Attendre que les events soient flushés
  console.log("⏳ Flush des events vers Sentry...");
  await Sentry.close(2000);
  
  console.log("\n✅ Tous les tests ont été envoyés à Sentry!");
  console.log("\n📊 Vérifiez votre dashboard Sentry:");
  console.log("   https://orion-logistics.sentry.io/issues/");
  console.log("\nLes events apparaissent généralement sous 5-10 secondes.\n");
}

runTests().catch((err) => {
  console.error("❌ Erreur pendant le test:", err);
  process.exit(1);
});
