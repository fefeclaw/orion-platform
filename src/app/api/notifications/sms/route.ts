/**
 * Webhook Notification SMS — ORION
 * 
 * POST /api/notifications/sms
 * 
 * Déclenche un SMS automatiquement lors du changement de statut d'un colis.
 * Connecté à la table feature_usage pour déduction des crédits.
 * 
 * Body:
 *   {
 *     "phone": "+2250141424243",
 *     "parcelRef": "ORN-ROU-2026-001",
 *     "status": "customs_cleared",
 *     "location": "Pô",
 *     "messageType": "customs_arrival" | "delayed" | "delivered" | "custom"
 *     "customMessage": "..." // optionnel si messageType=custom
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendSMS, SMSTemplates } from "@/lib/sms-service";
import { captureExternalApiError, addBreadcrumb } from "@/lib/sentry";

const VALID_STATUS_TYPES = [
  "customs_arrival",
  "customs_cleared", 
  "delayed",
  "delivered",
  "in_transit",
  "custom"
] as const;

type NotificationType = typeof VALID_STATUS_TYPES[number];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentification requise (pro ou admin)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Parsing body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const {
      phone,
      parcelRef,
      status,
      location,
      messageType,
      customMessage,
      notifyUrl
    } = body;

    // Validation champs requis
    if (!phone || !parcelRef || !messageType) {
      return NextResponse.json(
        { error: "Champs requis: phone, parcelRef, messageType" },
        { status: 400 }
      );
    }

    // Validation type message
    if (!VALID_STATUS_TYPES.includes(messageType)) {
      return NextResponse.json(
        { error: `Type invalide. Valeurs: ${VALID_STATUS_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Construction message selon template
    let message: string;
    switch (messageType) {
      case "customs_arrival":
        message = SMSTemplates.parcelAtCustoms(parcelRef, location || "destination");
        break;
      case "customs_cleared":
        message = SMSTemplates.statusChanged(parcelRef, "Libre circulation", location);
        break;
      case "delayed":
        message = SMSTemplates.parcelDelayed(parcelRef, location ? 24 : 12);
        break;
      case "delivered":
        message = SMSTemplates.parcelDelivered(parcelRef, new Date().toLocaleDateString("fr-CI"));
        break;
      case "in_transit":
        message = SMSTemplates.statusChanged(parcelRef, "En transit", location);
        break;
      case "custom":
        if (!customMessage) {
          return NextResponse.json(
            { error: "customMessage requis pour type 'custom'" },
            { status: 400 }
          );
        }
        message = customMessage;
        break;
      default:
        // Sécurité TypeScript - ne devrait jamais arriver grâce à VALID_STATUS_TYPES
        return NextResponse.json(
          { error: "Type de message non géré" },
          { status: 500 }
        );
    }

    // Log breadcrumb
    addBreadcrumb(
      "notification",
      `SMS ${messageType} pour ${parcelRef}`,
      { phone: phone.replace(/\d{6}$/, "XXXXXX"), userId: session.user.id }
    );

    // Envoi SMS
    const result = await sendSMS(phone, message, session.user.id, {
      parcelRef,
      status: messageType,
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      captureExternalApiError(
        "ORANGE_SMS_API_ERROR",
        new Error(result.error || "Unknown SMS error"),
        { endpoint: "/notifications/sms", recipient: phone.replace(/\d{6}$/, "XXXXXX") }
      );
      
      return NextResponse.json(
        { error: result.error, duration_ms: duration },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      parcelRef,
      messageId: result.messageId,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      remainingCredits: result.remainingCredits,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[SMS Webhook] Erreur:", error);
    
    captureExternalApiError(
      "ORANGE_SMS_API_ERROR",
      error,
      { endpoint: "/notifications/sms", params: { unexpected: "true" } }
    );

    return NextResponse.json(
      { error: "Erreur interne", duration_ms: duration },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/sms
 * Récupère les statistiques SMS de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { getSMSStats } = await import("@/lib/sms-service");
    const stats = getSMSStats(session.user.id);

    return NextResponse.json({
      userId: session.user.id,
      ...stats,
      remainingMessage: stats.remaining < 0 
        ? "Illimité" 
        : `${stats.remaining} SMS restants ce mois`,
    });

  } catch (error) {
    console.error("[SMS Stats] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
