/**
 * Script de vérification des variables d'environnement ORION
 * 
 * Usage: npx tsx scripts/verify-env.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface EnvCheck {
  name: string;
  required: boolean;
  production: boolean;
  pattern?: RegExp;
  hint?: string;
}

const checks: EnvCheck[] = [
  // Auth
  { name: "AUTH_SECRET", required: true, production: true, pattern: /^.{32,}$/, hint: "Min 32 caractères" },
  { name: "NEXTAUTH_URL", required: true, production: true, pattern: /^https?:\/\//, hint: "Doit commencer par http(s)://" },
  
  // Sentry
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, production: true, pattern: /^https:\/\/.*\.sentry\.io/, hint: "Format: https://xxx@sentry.io/xxx" },
  { name: "SENTRY_DSN", required: false, production: false },
  
  // APIs
  { name: "SHIP24_API_KEY", required: true, production: true, pattern: /^apik_/, hint: "Commence par 'apik_'" },
  { name: "MARINETRAFFIC_API_KEY", required: true, production: true },
  { name: "NEXT_PUBLIC_OPENWEATHER_API_KEY", required: true, production: true },
  
  // SMS
  { name: "ORANGE_SMS_CLIENT_ID", required: false, production: true },
  { name: "ORANGE_SMS_CLIENT_SECRET", required: false, production: true },
  { name: "ORANGE_SMS_FROM", required: false, production: true },
  { name: "SMS_MODE", required: false, production: false },
];

console.log("=== Vérification Variables d'Environnement — ORION ===\n");

let warnings = 0;
let errors = 0;

for (const check of checks) {
  const value = process.env[check.name];
  const isSet = !!value;
  const isProd = process.env.NODE_ENV === "production";
  
  const status = !isSet 
    ? (check.required ? "❌ MANQUANTE" : "⚠️  Manquante")
    : (check.pattern && !check.pattern.test(value) 
        ? "⚠️  Format invalide" 
        : "✅ OK");
  
  const icon = status.includes("❌") ? "🔴" : status.includes("⚠️") ? "🟡" : "🟢";
  
  console.log(`${icon} ${check.name}`);
  
  if (check.required && !isSet) {
    errors++;
    console.log(`   ${status}${isProd ? " (BLOQUANT EN PROD)" : ""}`);
    if (check.hint) console.log(`   💡 ${check.hint}`);
  } else if (!isSet && check.production) {
    warnings++;
    console.log(`   ⚠️  Requis pour production`);
  } else if (isSet && check.pattern && !check.pattern.test(value)) {
    warnings++;
    console.log(`   ${status}`);
    console.log(`   💡 ${check.hint}`);
    console.log(`   Valeur actuelle: ${value?.substring(0, 20)}...`);
  } else if (isSet) {
    console.log(`   ✅ Configuré${value ? " (" + value.substring(0, 20) + "...)" : ""}`);
  }
  
  console.log();
}

// Résumé
console.log("---");
console.log(`\n📊 Résumé:`);
console.log(`   🟢 OK: ${checks.length - warnings - errors}`);
console.log(`   🟡 Warnings: ${warnings}`);
console.log(`   🔴 Erreurs: ${errors}`);

if (errors > 0) {
  console.log("\n❌ Configuration incomplète — Corrigez les erreurs avant déploiement");
  process.exit(1);
} else if (warnings > 0) {
  console.log("\n⚠️  Configuration partielle — Quelques fonctionnalités seront dégradées");
  process.exit(0);
} else {
  console.log("\n✅ Toutes les variables sont configurées correctement !");
  process.exit(0);
}
