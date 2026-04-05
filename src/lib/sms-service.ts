/**
 * Service SMS Orange CI (OSMS) — ORION Unified Logistics
 * 
 * Documentation API Orange CI:
 * - Production: https://api.orange.com/sms
 * - Sandbox: https://api.orange.com/sandbox/sms
 * 
 * Flow OAuth2:
 * 1. Get Client Credentials token (POST /oauth/token)
 * 2. Send SMS (POST /sms/v1/outbound/{sender}/requests)
 * 
 * Prérequis:
 * - ORANGE_SMS_CLIENT_ID
 * - ORANGE_SMS_CLIENT_SECRET
 * - ORANGE_SMS_FROM (sender, max 11 caractères)
 */

import { isDbAvailable, getDb } from "./db";
import { captureExternalApiError, captureTimeoutError } from "./sentry";

// Mode SANDBOX switch
const SMS_MODE = process.env.SMS_MODE || "production";
const IS_SANDBOX = SMS_MODE === "sandbox";

// Configuration URLs selon le mode
const ORANGE_BASE_URL = IS_SANDBOX 
  ? "https://api.orange.com/sandbox" 
  : "https://api.orange.com";

// Log du mode au chargement
if (IS_SANDBOX) {
  console.log("[SMS SERVICE] Running in SANDBOX mode - No real SMS will be sent");
}

// Types Orange
interface OrangeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangeSMSSendResponse {
  outboundSMSMessageRequest: {
    address: string[];
    senderAddress: string;
    outboundSMSTextMessage: { message: string };
    receiptRequest?: {
      notifyURL: string;
      callbackData?: string;
    };
  };
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  remainingCredits?: number;
}

const SENDER_ID = process.env.ORANGE_SMS_FROM || "ORION";

// Cache token OAuth2 en mémoire (TTL 29min pour token 30min)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Récupère un token OAuth2 pour l'API Orange
 */
async function getOrangeToken(): Promise<string | null> {
  if (!process.env.ORANGE_SMS_CLIENT_ID || !process.env.ORANGE_SMS_CLIENT_SECRET) {
    console.error("[SMS] ORANGE_SMS_CLIENT_ID ou CLIENT_SECRET non configuré");
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.ORANGE_SMS_CLIENT_ID}:${process.env.ORANGE_SMS_CLIENT_SECRET}`
  ).toString("base64");

  const tokenUrl = IS_SANDBOX
    ? "https://api.orange.com/oauth/token"
    : `${ORANGE_BASE_URL}/token`;

  try {
    if (IS_SANDBOX) {
      console.log(`[SMS SANDBOX] Obtention token depuis: ${tokenUrl}`);
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }

    const data: OrangeTokenResponse = await response.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in * 1000) - 60000, // Marge 1min
    };

    console.log(`[SMS] Token ${IS_SANDBOX ? 'SANDBOX ' : ''}renouvelé, expire dans ${data.expires_in}s`);
    return cachedToken.token;

  } catch (error) {
    captureExternalApiError("ORANGE_SMS_API_ERROR", error, {
      endpoint: "/oauth/token",
    });
    return null;
  }
}

/**
 * Envoie un SMS via l'API Orange CI
 * 
 * @param to - Numéro destination format E.164 (+225XXXXXXXX)
 * @param message - Message (max 160 caractères pour 1 SMS, concatène automatiquement)
 * @param userId - ID utilisateur pour déduction crédits
 * @param metadata - Métadonnées optionnelles pour webhook
 */
export async function sendSMS(
  to: string,
  message: string,
  userId?: string,
  metadata?: { parcelRef?: string; status?: string }
): Promise<SMSResult> {
  const startTime = Date.now();

  // Validation format numéro
  if (!to.match(/^\+225\d{8,10}$/)) {
    return { success: false, error: "Format numéro invalide. Attendu: +225XXXXXXXX" };
  }

  // Vérification quota utilisateur
  if (userId && !await canSendSMS(userId)) {
    return { success: false, error: "Quota SMS épuisé pour ce mois" };
  }

  // Truncation message si nécessaire
  const finalMessage = message.length > 700 ? message.substring(0, 697) + "..." : message;

  try {
    const token = await getOrangeToken();
    if (!token) {
      return { success: false, error: "Impossible d'obtenir le token Orange" };
    }

    const smsUrl = IS_SANDBOX
      ? `${ORANGE_BASE_URL}/smsmessaging/v1/outbound/tel%3A%2B${SENDER_ID}/requests`
      : `${ORANGE_BASE_URL}/sms/v1/outbound/tel%3A%2B${SENDER_ID}/requests`;

    if (IS_SANDBOX) {
      console.log(`[SMS SANDBOX] Simulation d'envoi à ${to}`);
    }

    const response = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: [`tel:${to}`],
          senderAddress: `tel:+${SENDER_ID}`,
          outboundSMSTextMessage: { message: finalMessage },
          ...(metadata?.parcelRef && {
            receiptRequest: {
              notifyURL: `${process.env.NEXTAUTH_URL}/api/webhooks/sms/receipt`,
              callbackData: JSON.stringify({ parcelRef: metadata.parcelRef, userId }),
            }
          }),
        },
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMS send failed: ${response.status} - ${errorText}`);
    }

    const duration = Date.now() - startTime;
    const data: OrangeSMSSendResponse = await response.json();

    // Déduction des crédits
    if (userId) {
      await deductSMSCredit(userId);
    }

    if (IS_SANDBOX) {
      console.log(`[SMS SANDBOX] SMS simulé avec succès à ${to} (${duration}ms)`);
    } else {
      console.log(`[SMS] Envoi réussi à ${to} (${duration}ms)`);
    }

    return {
      success: true,
      messageId: data.outboundSMSMessageRequest.senderAddress,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof Error && error.name === "TimeoutError") {
      captureTimeoutError("orange_sms", "sendSMS", duration, 0);
      return { success: false, error: "Timeout API Orange (10s)" };
    }

    captureExternalApiError("ORANGE_SMS_API_ERROR", error, {
      endpoint: "/sms/v1/outbound/*/requests",
      recipient: to.replace(/\d{6}$/, "XXXXXX"), // Masquer partiellement
      duration,
    });

    return { success: false, error: `Erreur API Orange: ${error}` };
  }
}

/**
 * Vérifie si l'utilisateur peut encore envoyer des SMS ce mois-ci
 * Intégré avec la table feature_usage existante
 */
async function canSendSMS(userId: string): Promise<boolean> {
  if (!isDbAvailable()) return true; // Mode dégradé

  const db = getDb();

  // Récupérer plan utilisateur
  const sub = db.prepare(`
    SELECT plan FROM subscriptions WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as { plan: string } | undefined;

  // Gratuit : 5 SMS/mois inclus
  // Standard/Business : illimité
  if (!sub || sub.plan === "gratuit") {
    const usage = db.prepare(`
      SELECT count FROM feature_usage 
      WHERE user_id = ? AND feature = 'sms_notification'
    `).get(userId) as { count: number } | undefined;

    return (usage?.count ?? 0) < 5;
  }

  return true; // Standard/Business = illimité
}

/**
 * Déduit un crédit SMS de l'utilisateur
 * Utilise la table feature_usage existante
 */
async function deductSMSCredit(userId: string): Promise<void> {
  if (!isDbAvailable()) return;

  const db = getDb();

  // Vérifier si entrée existe
  const existing = db.prepare(`
    SELECT 1 FROM feature_usage 
    WHERE user_id = ? AND feature = 'sms_notification'
  `).get(userId);

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);

  if (!existing) {
    db.prepare(`
      INSERT INTO feature_usage (user_id, feature, count, reset_at)
      VALUES (?, 'sms_notification', 1, ?)
    `).run(userId, nextMonth.toISOString());
  } else {
    db.prepare(`
      UPDATE feature_usage 
      SET count = count + 1
      WHERE user_id = ? AND feature = 'sms_notification'
    `).run(userId);
  }

  console.log(`[SMS] Crédit déduit pour user ${userId}`);
}

/**
 * Récupère les statistiques SMS pour un utilisateur
 */
export function getSMSStats(userId: string): {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
} {
  if (!isDbAvailable()) {
    return { used: 0, limit: 5, remaining: 5, plan: "gratuit" };
  }

  const db = getDb();

  const sub = db.prepare(`
    SELECT plan FROM subscriptions WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as { plan: string } | undefined;

  const plan = sub?.plan || "gratuit";
  const limit = plan === "gratuit" ? 5 : Infinity;

  const usage = db.prepare(`
    SELECT count FROM feature_usage 
    WHERE user_id = ? AND feature = 'sms_notification'
  `).get(userId) as { count: number } | undefined;

  const used = usage?.count ?? 0;

  return {
    used,
    limit: limit === Infinity ? -1 : limit,
    remaining: limit === Infinity ? -1 : Math.max(0, limit - used),
    plan,
  };
}

/**
 * Templates de messages SMS pour ORION
 */
export const SMSTemplates = {
  /**
   * Colis arrivé à la douane
   */
  parcelAtCustoms: (parcelRef: string, location: string) =>
    `ORION: Votre colis ${parcelRef} est arrivé à la douane de ${location}. Présentez-vous avec vos documents.`,

  /**
   * Colis en retard
   */
  parcelDelayed: (parcelRef: string, etaDelay: number) =>
    `ORION: Votre colis ${parcelRef} est en retard de ${etaDelay}h. Nouveau ETA disponible dans l'app.`,

  /**
   * Colis livré
   */
  parcelDelivered: (parcelRef: string, deliveredAt: string) =>
    `ORION: Votre colis ${parcelRef} a été livré le ${deliveredAt}. Merci de votre confiance!`,

  /**
   * Notification générique changement statut
   */
  statusChanged: (parcelRef: string, status: string, location?: string) =>
    location
      ? `ORION: Colis ${parcelRef} - ${status} à ${location}.`
      : `ORION: Colis ${parcelRef} - ${status}.`,

  /**
   * Alerte système (critical)
   */
  systemAlert: (message: string) =>
    `ORION ALERTE: ${message}`,
};

export default { sendSMS, getSMSStats, SMSTemplates };
