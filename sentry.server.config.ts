/**
 * Sentry configuration côté serveur — ORION Unified Logistics
 * Captures erreurs API, base de données, et APIs tierces
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENV = process.env.NODE_ENV ?? "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    
    // Traces serveur : 1.0 en staging, 0.1 en production
    tracesSampleRate: ENV === "production" ? 0.1 : 1.0,
    
    // Profiling samples (requires @sentry/profiling-node pour détails CPU)
    profilesSampleRate: ENV === "production" ? 0.05 : 0.5,
    
    // BeforeSend for API error enrichment 
    beforeSend(event) { 
      const exception = event.exception?.values?.[0];
      
      if (exception) {
        // Detect Ship24 timeout 
        if (exception.type === "Ship24Error" || 
            (exception.value &&
             (exception.value.toLowerCase().includes("ship24") &&
              (exception.value.includes("timeout") || exception.value.includes("ETIMEDOUT"))))) {
          event.tags = { 
            ...event.tags, 
            api_timeout: "ship24",
            error_category: "third_party_api_timeout",
            alert_level: "warning"
          };
        }
        
        // Detect timeout AIS / MarineTraffic
        if (exception.value?.toLowerCase().includes("marinetraffic") ||
            exception.value?.toLowerCase().includes("ais") ||
            exception.value?.toLowerCase().includes("vesselfinder")) {
          if (exception.value?.toLowerCase().includes("timeout")) {
            event.tags = { 
              ...event.tags, 
              api_timeout: "ais",
              error_category: "third_party_api_timeout",
              alert_level: "warning"
            };
          }
        }
        
        // SQLite errors
        if (exception.value?.toLowerCase().includes("sqlite") ||
            exception.value?.toLowerCase().includes("better-sqlite3")) {
          event.tags = { ...event.tags, database_error: "sqlite" };
        }
      }
      
      return event;
    },
    
    // Fonction pour enrichir les événements avec contexte métier
    beforeSendTransaction(event) {
      // Ajouter des tags personnalisés selon la route
      if (event.transaction) {
        if (event.transaction.includes("/api/maritime")) {
          event.tags = { ...event.tags, pillar: "maritime" };
        } else if (event.transaction.includes("/api/rail")) {
          event.tags = { ...event.tags, pillar: "rail" };
        } else if (event.transaction.includes("/api/tracking")) {
          event.tags = { ...event.tags, pillar: "tracking" };
        }
      }
      return event;
    },
  });
  
  console.log(`[Sentry Server] Initialisé en environnement: ${ENV}`);
} else {
  console.warn("[Sentry Server] DSN non configuré");
}

export { Sentry };
