/**
 * Script de test SMS avec debug complet - ORION
 * Usage: npx tsx scripts/test-sms-debug.ts +2250709398673
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Mode SANDBOX detection
const SMS_MODE = process.env.SMS_MODE || "production";
const IS_SANDBOX = SMS_MODE === "sandbox";
const ORANGE_BASE_URL = IS_SANDBOX
  ? "https://api.orange.com/sandbox"
  : "https://api.orange.com";

if (IS_SANDBOX) {
  console.log("[SMS SERVICE] Running in SANDBOX mode - No real SMS will be sent");
}

async function getOrangeTokenDebug(): Promise<string | null> {
  const clientId = process.env.ORANGE_SMS_CLIENT_ID;
  const clientSecret = process.env.ORANGE_SMS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[ERROR] Credentials manquants");
    return null;
  }

  // Orange utilise Basic Auth avec client_id:client_secret en base64
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  console.log("[DEBUG] Tentative d'obtention du token...");
  console.log(`[DEBUG] Mode: ${IS_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
  
  // URL Token selon le mode
  const tokenUrl = IS_SANDBOX
    ? "https://api.orange.com/oauth/token"
    : `${ORANGE_BASE_URL}/token`;
  console.log(`[DEBUG] URL Token: ${tokenUrl}`);

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: "grant_type=client_credentials",
    });

    console.log(`[DEBUG] Status HTTP: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`[DEBUG] Reponse brute: ${responseText}`);

    if (!response.ok) {
      console.error(`[ERROR] Token request failed: ${response.status}`);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log(`[DEBUG] Token recu, expire dans ${data.expires_in}s`);
    return data.access_token;

  } catch (error) {
    console.error("[ERROR] Exception lors de l'appel token:", error);
    return null;
  }
}

async function sendSMSDebug(to: string, message: string): Promise<boolean> {
  const token = await getOrangeTokenDebug();
  if (!token) return false;

  const sender = process.env.ORANGE_SMS_FROM || "ORION";
  const smsUrl = IS_SANDBOX
    ? `${ORANGE_BASE_URL}/smsmessaging/v1/outbound/tel%3A%2B${sender}/requests`
    : `${ORANGE_BASE_URL}/sms/v1/outbound/tel%3A%2B${sender}/requests`;

  console.log(`\n[DEBUG] Envoi SMS vers: ${to}`);
  console.log(`[DEBUG] URL: ${smsUrl}`);
  console.log(`[DEBUG] Sender: ${sender}`);

  try {
    const response = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: [`tel:${to}`],
          senderAddress: `tel:+${sender}`,
          outboundSMSTextMessage: { message },
        },
      }),
    });

    console.log(`[DEBUG] Status HTTP SMS: ${response.status}`);
    const responseText = await response.text();
    console.log(`[DEBUG] Reponse SMS: ${responseText}`);

    if (!response.ok) {
      console.error(`[FAILED] SMS send failed: ${response.status}`);
      return false;
    }

    console.log("[SUCCESS] SMS envoye avec succes!");
    return true;

  } catch (error) {
    console.error("[ERROR] Exception lors de l'envoi:", error);
    return false;
  }
}

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.log("Usage: npx tsx scripts/test-sms-debug.ts +2250709398673");
    return;
  }

  console.log("=== Test SMS Orange CI (Mode Debug) ===\n");
  const success = await sendSMSDebug(phone, "ORION: Test de reception SMS. Si tu recois ce message, l'API fonctionne!");
  
  if (success) {
    console.log("\n[SUCCESS] SMS test envoye! Verifie ton telephone.");
  } else {
    console.log("\n[FAILED] Echec de l'envoi. Verifie les logs ci-dessus.");
    process.exit(1);
  }
}

main();
