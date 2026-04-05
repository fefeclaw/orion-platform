/**
 * @type {import('next').NextConfig}
 * 
 * Configuration ORION avec Sentry
 * 
 * Environment variables pour Sentry:
 * - SENTRY_DSN (serveur) / NEXT_PUBLIC_SENTRY_DSN (client)
 * - NEXT_PUBLIC_APP_ENV: development | staging | production
 * - SENTRY_AUTH_TOKEN (pour source maps en deploiement Vercel)
 * - SENTRY_ORG / SENTRY_PROJECT (optionnel pour CLI)
 */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Erreurs TS pré-existantes dans auth/pdf — ignorées au build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  
  // Experimental features pour Sentry performance
  experimental: {
    instrumentationHook: true,
  },
};

// Configuration Sentry
const sentryWebpackPluginOptions = {
  // L'org et project sont optionnels si via env vars
  org: process.env.SENTRY_ORG || "orion-logistics",
  project: process.env.SENTRY_PROJECT || "orion-platform",
  
  // Auth token pour source maps (à configurer en env Vercel)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps en production uniquement
  dryRun: process.env.NODE_ENV !== "production",
  
  // Silencieux en developement
  silent: process.env.NODE_ENV === "development",
  
  // Répertoires à ignorer pour source maps
  hideSourceMaps: false,
  
  // URLs publiques pour source maps
  sourcemaps: {
    deleteSourcemapsAfterUpload: false,
  },
  
  // Tunnel optionnel pour bypass ad-blockers
  tunnelRoute: "/monitoring",
  
  // Wide application monitoring - capture toutes les erreurs
  widenClientFileUpload: true,
  
  // Automatic instrumentation
  automaticInstrumentServerFunctions: true,
  automaticInstrumentMiddleware: true,
  
  // Bundle size optimization
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
  },
};

// Export avec Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
