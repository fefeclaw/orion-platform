/**
 * HOF (Higher-Order Function) de contrôle d'accès par souscription.
 * Wrap les route handlers API Next.js pour vérifier le plan et les quotas.
 *
 * Usage :
 *   export const POST = withSubscription(handler, { feature: 'doc_generation' })
 *   export const GET  = withSubscription(handler, { pilier: 'maritime' })
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessPilier,
  canUseFeature,
  incrementUsage,
  type Feature,
  type Pilier,
} from "@/lib/subscription";

// Options du middleware de souscription
interface SubscriptionOptions {
  // Fonctionnalité soumise à quota ou restriction de plan
  feature?: Feature;
  // Pilier logistique dont l'accès est restreint selon le plan
  pilier?: Pilier;
}

// Type handler Next.js App Router
type RouteHandler = (
  req: NextRequest,
  context?: Record<string, unknown>
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap un route handler avec le contrôle d'accès par souscription.
 * Renvoie 401 si non authentifié, 403 si plan insuffisant, 429 si quota dépassé.
 */
export function withSubscription(
  handler: RouteHandler,
  options: SubscriptionOptions
): RouteHandler {
  return async (req: NextRequest, context?: Record<string, unknown>) => {
    // Récupération de la session NextAuth v5
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentification requise" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // Vérification de l'accès à un pilier logistique
    if (options.pilier) {
      const allowed = canAccessPilier(userId, options.pilier);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "PLAN_REQUIRED",
            pilier: options.pilier,
            required_plan: "standard",
            message: `Accès au pilier '${options.pilier}' réservé aux abonnés Standard et Business.`,
            upgrade_url: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    // Vérification de l'accès à une fonctionnalité (avec quota éventuel)
    if (options.feature) {
      const check = canUseFeature(userId, options.feature);

      if (!check.allowed) {
        // Quota mensuel dépassé
        if (check.remaining === 0) {
          return NextResponse.json(
            {
              error: "QUOTA_EXCEEDED",
              feature: options.feature,
              reset_at: check.reset_at,
              message: `Quota mensuel atteint pour '${options.feature}'. Réinitialisation le ${check.reset_at}.`,
              upgrade_url: "/pricing",
            },
            { status: 429 }
          );
        }

        // Plan insuffisant
        return NextResponse.json(
          {
            error: "PLAN_REQUIRED",
            feature: options.feature,
            required_plan: check.required_plan,
            message: `Fonctionnalité '${options.feature}' réservée au plan ${check.required_plan}.`,
            upgrade_url: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    // Accès autorisé → exécuter le handler
    const response = await handler(req, context);

    // Incrémenter le compteur d'utilisation en arrière-plan (sans bloquer la réponse)
    if (options.feature) {
      // Utilisation de setImmediate pour ne pas ajouter de latence à la réponse
      setImmediate(() => incrementUsage(userId, options.feature!));
    }

    return response;
  };
}
