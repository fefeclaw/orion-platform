/**
 * Sentry configuration côté client — ORION Unified Logistics
 * Captures erreurs React et monitoring performances
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    
    // Traces : 1.0 en staging, 0.1 en production
    tracesSampleRate: ENV === "production" ? 0.1 : 1.0,
    
    // Replay sessions - échantillonnage réduit
    replaysSessionSampleRate: ENV === "production" ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // BeforeSend pour filtrer les erreurs sensibles
    beforeSend(event) {
      // Filtrer les erreurs de timeout API tierces pour les isoler
      const exception = event.exception?.values?.[0];
      if (exception) {
        const isTimeoutError = 
          exception.type === "AbortError" ||
          exception.type === "TimeoutError" ||
          exception.value?.includes("timeout") ||
          exception.value?.includes("ETIMEDOUT") ||
          exception.value?.includes("abort");
        
        // Taguer les erreurs de timeout APIs
        if (isTimeoutError) {
          event.tags = { 
            ...event.tags, 
            error_category: "api_timeout",
            requires_investigation: "true" 
          };
          
          // Identifier Ship24 et AIS
          if (exception.value?.toLowerCase().includes("ship24")) {
            event.tags = { ...event.tags, api_source: "ship24" };
          }
          if (exception.value?.toLowerCase().includes("ais") || 
            exception.value?.toLowerCase().includes("marinetraffic")) {
            event.tags = { ...event.tags, api_source: "ais" };
          }
        }
      }
      
      return event;
    },
    
    // Ignorer certaines erreurs non pertinentes
    ignoreErrors: [
      // Erreurs de navigateur tierces
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      "Failed to fetch",
      "Cannot read properties of undefined (reading 'removeEventListener')",
      // Erreurs Next.js internes
      "NEXT_NOT_FOUND",
    ],
    
    // Denylist URLs
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
  
  console.log(`[Sentry] Initialisé en environnement: ${ENV}, tracesSampleRate: ${ENV === "production" ? 0.1 : 1.0}`);
} else {
  console.warn("[Sentry] DSN non configuré - monitoring désactivé");
}

// Export pour utilisation manuelle
export { Sentry };
