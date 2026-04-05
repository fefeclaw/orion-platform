/**
 * Webhook Orange SMS — Notification de livraison
 * 
 * POST /api/webhooks/sms/receipt
 * 
 * Appelé par l'API Orange lorsqu'un SMS est livré ou échoue.
 * Stocke le statut de livraison pour suivi.
 * 
 * Body Orange:
 * {
 *   "deliveryInfoNotification": {
 *     "callbackData": "...",
 *     "deliveryInfo": {
 *       "address": "tel:+225...",
 *       "deliveryStatus": "DeliveredToTerminal | DeliveredToNetwork | DeliveryUncertain | DeliveryImpossible | MessageWaiting | DeliveryNotAllowed"
 *     }
 *   }
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable, getDb } from "@/lib/db";
import { addBreadcrumb } from "@/lib/sentry";

const VALID_DELIVERY_STATUSES = [
  "DeliveredToTerminal",
  "DeliveredToNetwork",
  "DeliveryUncertain",
  "DeliveryImpossible",
  "MessageWaiting",
  "DeliveryNotAllowed",
] as const;

type DeliveryStatus = typeof VALID_DELIVERY_STATUSES[number];

interface OrangeDeliveryPayload {
  deliveryInfoNotification: {
    callbackData?: string;
    deliveryInfo: {
      address: string;
      deliveryStatus: DeliveryStatus;
    };
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validation IP Orange (optionnel - à configurer en production)
    // const clientIp = request.headers.get('x-forwarded-for') || request.ip;
    // Orange IPs: filtrer si nécessaire
    
    const body: OrangeDeliveryPayload = await request.json();
    
    const { deliveryInfoNotification } = body;
    if (!deliveryInfoNotification?.deliveryInfo) {
      return NextResponse.json(
        { error: "Payload invalide" },
        { status: 400 }
      );
    }

    const { callbackData, deliveryInfo } = deliveryInfoNotification;
    const { address, deliveryStatus } = deliveryInfo;

    // Parsing callbackData pour récupérer metadata
    let metadata: { parcelRef?: string; userId?: string } = {};
    if (callbackData) {
      try {
        metadata = JSON.parse(callbackData);
      } catch {
        metadata = { parcelRef: callbackData };
      }
    }

    // Logging
    console.log(`[SMS Receipt] ${deliveryStatus} vers ${address.replace(/\d{8}$/, "XXXXXXXX")} (${deliveryStatus})`);
    
    addBreadcrumb(
      "notification",
      `SMS Delivery Receipt: ${deliveryStatus}`,
      { parcelRef: metadata.parcelRef, status: deliveryStatus }
    );

    // Stockage en base pour historique (si DB disponible)
    if (isDbAvailable()) {
      try {
        const db = getDb();
        
        // Créer table si existe pas
        db.exec(`
          CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_ref TEXT,
            user_id TEXT,
            recipient TEXT,
            status TEXT NOT NULL,
            delivered_at TEXT DEFAULT (datetime('now')),
            callback_data TEXT,
            raw_response TEXT
          )
        `);

        db.prepare(`
          INSERT INTO sms_logs (parcel_ref, user_id, recipient, status, callback_data, raw_response)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          metadata.parcelRef || null,
          metadata.userId || null,
          address,
          deliveryStatus,
          callbackData || null,
          JSON.stringify(body).substring(0, 2000)
        );

      } catch (dbErr) {
        console.error("[SMS Receipt] Erreur DB:", dbErr);
      }
    }

    // Alertes pour statuts problématiques
    if (["DeliveryImpossible", "DeliveryNotAllowed"].includes(deliveryStatus)) {
      console.warn(`[SMS Alert] Échec livraison: ${deliveryStatus} - ${address}`);
    }

    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      received: true,
      status: deliveryStatus,
      processed_ms: duration,
    });

  } catch (error) {
    console.error("[SMS Receipt] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur traitement receipt" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/sms/receipt
 * Vérification du webhook (pour Orange validation)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "webhook_ready",
    endpoint: "/api/webhooks/sms/receipt",
    supportedMethods: ["POST"],
    description: "Orange SMS delivery receipt webhook",
  });
}
