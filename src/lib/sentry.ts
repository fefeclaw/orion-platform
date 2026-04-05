/**
 * Utilities Sentry pour ORION — Centralisation du tracking d'erreurs
 * Capture spécifique des erreurs APIs tierces avec contexte métier
 */
import * as Sentry from "@sentry/nextjs";

/**
 * Types d'erreurs API tierces monitorées
 */
export type ExternalApiError = 
  | "SHIP24_TIMEOUT"
  | "SHIP24_API_ERROR" 
  | "MARINETRAFFIC_TIMEOUT"
  | "MARINETRAFFIC_API_ERROR"
  | "AIS_WEBSOCKET_ERROR"
  | "ORANGE_SMS_TIMEOUT"
  | "ORANGE_SMS_API_ERROR"
  | "OPENWEATHER_ERROR";

/**
 * Capture une erreur API tierce avec contexte enrichi
 * Utilisé par tous les services appelant des APIs externes
 */
export function captureExternalApiError(
  errorType: ExternalApiError,
  error: Error | unknown,
  context: {
    endpoint?: string;
    params?: Record<string, string | number | boolean>;
    responseStatus?: number;
    retryAttempt?: number;
    fallbackUsed?: boolean;
    recipient?: string;
    duration?: number;
  } = {}
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Enrichir avec tags
  Sentry.captureException(err, {
    level: errorType.includes("TIMEOUT") ? "warning" : "error",
    tags: {
      error_category: "external_api",
      api_service: errorType.split("_")[0].toLowerCase(),
      error_type: errorType,
      has_fallback: context.fallbackUsed ? "yes" : "no",
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Capture une erreur de timeout spécifique avec sévérité adaptée
 */
export function captureTimeoutError(
  service: "ship24" | "marinetraffic" | "ais" | "orange_sms" | "openweather",
  operation: string,
  duration: number,
  retryAttempt: number
): void {
  const err = new Error(`${service.toUpperCase()}_TIMEOUT: ${operation}`);
  
  Sentry.captureException(err, {
    level: retryAttempt >= 3 ? "error" : "warning",
    tags: {
      error_category: "api_timeout",
      api_service: service,
      api_operation: operation,
      requires_investigation: "true",
    },
    extra: {
      duration_ms: duration,
      retry_attempt: retryAttempt,
      threshold_ms: 5000, // Seuil de timeout
    },
  });
}

/**
 * Démarre une transaction Sentry pour une opération critique
 * Utilisé pour suivre les performances de génération de documents, etc.
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, unknown>
): ReturnType<typeof Sentry.startSpan> | null {
  if (typeof window === "undefined") {
    // Server-side: utiliser Sentry pour créer une transaction
    return Sentry.startSpan(
      { name, op },
      () => null
    ) as ReturnType<typeof Sentry.startSpan>;
  }
  return null;
}

/**
 * Méasure d'une fonction avec Sentry
 */
export async function withSentrySpan<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const activeScope = Sentry.getCurrentScope();
  if (activeScope && tags) {
    activeScope.setTags(tags);
  }
  return Sentry.startSpan(
    { name, op: operation },
    async () => fn()
  );
}

/**
 * Ajouter une breadcrumb manuellement
 * Utile pour tracer les étapes d'un flux complexe (ex: génération BL -> PDF -> archivage)
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context pour Sentry
 * À appeler après authentification
 */
export function setSentryUser(
  user: { id: string; email?: string; role?: string } | null
): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture les erreurs de base de données SQLite
 */
export function captureDatabaseError(
  operation: string,
  error: Error,
  query?: string
): void {
  Sentry.captureException(error, {
    level: "error",
    tags: {
      error_category: "database",
      db_type: "sqlite",
      db_operation: operation,
    },
    extra: {
      query: query?.substring(0, 1000), // Tronquer longues requêtes
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Logging conditionnel basé sur l'environnement
 */
export function logLevel(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  const env = process.env.NODE_ENV;
  
  // En production, logger uniquement warn/error + envoyer vers Sentry
  if (env === "production" && (level === "warn" || level === "error")) {
    const sentrySeverity: Sentry.SeverityLevel = level === "warn" ? "warning" : "error";
    Sentry.captureMessage(message, sentrySeverity);
  }
  
  // Toujours logger en console en dév
  if (env !== "production" || level === "error") {
    console[level](`[ORION] ${message}`, data || "");
  }
}
