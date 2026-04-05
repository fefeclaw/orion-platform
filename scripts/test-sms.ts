/**
 * Script de test SMS Orange CI - ORION
 * 
 * Usage: npx ts-node scripts/test-sms.ts +2250141424243
 * 
 * Variables d'environnement requises:
 *   - ORANGE_SMS_CLIENT_ID
 *   - ORANGE_SMS_CLIENT_SECRET
 *   - ORANGE_SMS_FROM (optionnel, defaut: ORION)
 * 
 * @file scripts/test-sms.ts
 */

import { sendSMS, SMSTemplates, getSMSStats } from "../src/lib/sms-service";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  remainingCredits?: number;
}

async function main(): Promise<void> {
  const phoneNumber: string | undefined = process.argv[2] || process.env.TEST_PHONE_NUMBER;
  
  console.log("=== Test SMS Orange CI - ORION ===\n");
  
  // Verification configuration
  if (!process.env.ORANGE_SMS_CLIENT_ID || !process.env.ORANGE_SMS_CLIENT_SECRET) {
    console.error("[ERROR] ORANGE_SMS_CLIENT_ID ou CLIENT_SECRET non configure");
    console.log("\nConfiguration requise dans .env.local:");
    console.log("  ORANGE_SMS_CLIENT_ID=votre_client_id");
    console.log("  ORANGE_SMS_CLIENT_SECRET=votre_client_secret");
    console.log("  ORANGE_SMS_FROM=ORION");
    process.exit(1);
  }

  if (!phoneNumber) {
    console.error("[ERROR] Numero de telephone requis");
    console.log("\nUsage:");
    console.log("  npx ts-node scripts/test-sms.ts +2250141424243");
    console.log("\nFormat: +225 suivi de 8-10 chiffres");
    process.exit(1);
  }

  // Validation format
  const phonePattern: RegExp = /^\+225\d{8,10}$/;
  if (!phonePattern.test(phoneNumber)) {
    console.error("[ERROR] Format numero invalide");
    console.log("Format attendu: +225XXXXXXXX (ex: +2250141424243)");
    process.exit(1);
  }

  console.log("Configuration:");
  console.log(`  Client ID: ${process.env.ORANGE_SMS_CLIENT_ID?.substring(0, 8)}...`);
  console.log(`  Numero test: ${phoneNumber}`);
  console.log(`  Sender: ${process.env.ORANGE_SMS_FROM || "ORION"}\n`);

  // Test envoi SMS avec template douane
  const parcelRef: string = "ORN-ROU-2026-TEST";
  const message: string = SMSTemplates.parcelAtCustoms(parcelRef, "Pô");

  console.log("Message:");
  console.log(`  ${message}\n`);
  console.log("Envoi en cours...\n");

  try {
    const result: SMSResponse = await sendSMS(phoneNumber, message, undefined, { parcelRef });

    if (result.success) {
      console.log("[SUCCESS] SMS envoye avec succes!");
      console.log(`   Message ID: ${result.messageId}`);
      
      if (result.remainingCredits !== undefined) {
        console.log(`   Credits restants: ${result.remainingCredits}`);
      }
      
      console.log("\nVerifiez votre telephone...");
      console.log("   Le SMS devrait arriver sous 5-10 secondes.");
    } else {
      console.error("[FAILED] Echec de l'envoi:");
      console.error(`   ${result.error}`);
      process.exit(1);
    }

  } catch (error: unknown) {
    console.error("[CRITICAL ERROR] Erreur inattendue:");
    console.error(error);
    process.exit(1);
  }
}

main();
