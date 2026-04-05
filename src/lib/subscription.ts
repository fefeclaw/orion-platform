/**
 * Service de contrôle d'accès aux fonctionnalités selon le plan de souscription.
 * Implémente la matrice de fonctionnalités du modèle de monétisation ORION.
 */
import { getDb, isDbAvailable } from "./db";

// Types d'abonnement disponibles
export type Plan = "gratuit" | "standard" | "business";

// Piliers logistiques disponibles
export type Pilier = "maritime" | "rail" | "road" | "air";

// Fonctionnalités soumises à contrôle d'accès
export type Feature =
  | "ais_realtime"
  | "ais_delayed"
  | "doc_generation"
  | "ship24_tracking"
  | "multimodal_tracking"
  | "ai_prediction"
  | "geopolitics"
  | "orion_api"
  | "sms_notification";

// Quotas mensuels par plan et par fonctionnalité
const QUOTAS: Record<Feature, Partial<Record<Plan, number>>> = {
  doc_generation:     { standard: 10 },      // 10/mois pour Standard, illimité pour Business
  ship24_tracking:    { standard: 50 },       // 50/mois pour Standard, illimité pour Business
  sms_notification:   { gratuit: 5 },         // 5/mois pour Gratuit, illimité pour Standard/Business
  ais_realtime:       {},                      // Business uniquement (pas de quota, juste accès)
  ais_delayed:        {},                      // Standard et Business (données 15min)
  multimodal_tracking: {},                     // Business uniquement
  ai_prediction:      {},                      // Business uniquement
  geopolitics:        {},                      // Business uniquement
  orion_api:          {},                      // Business uniquement
};

// Plan minimum requis par fonctionnalité
const REQUIRED_PLAN: Record<Feature, Plan> = {
  ais_delayed:        "standard",
  doc_generation:     "standard",
  ship24_tracking:    "standard",
  sms_notification:   "gratuit",               // Tout le monde peut recevoir SMS (quotas varient)
  ais_realtime:       "business",
  multimodal_tracking:"business",
  ai_prediction:      "business",
  geopolitics:        "business",
  orion_api:          "business",
};

// Hiérarchie des plans pour comparaison
const PLAN_RANK: Record<Plan, number> = {
  gratuit:  0,
  standard: 1,
  business: 2,
};

/**
 * Récupère l'abonnement actif d'un utilisateur.
 * Retourne null si la DB n'est pas disponible.
 */
export function getSubscription(userId: string): {
  plan: Plan;
  piliers_actifs: Pilier[];
  docs_generes_mois: number;
  conteneurs_trackes_mois: number;
} | null {
  if (!isDbAvailable()) return null;

  const db = getDb();
  const sub = db.prepare(`
    SELECT plan, piliers_actifs, docs_generes_mois, conteneurs_trackes_mois
    FROM subscriptions
    WHERE user_id = ? AND (date_fin IS NULL OR date_fin > datetime('now'))
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as {
    plan: Plan;
    piliers_actifs: string;
    docs_generes_mois: number;
    conteneurs_trackes_mois: number;
  } | undefined;

  if (!sub) {
    // Utilisateur sans abonnement → plan gratuit par défaut
    return { plan: "gratuit", piliers_actifs: [], docs_generes_mois: 0, conteneurs_trackes_mois: 0 };
  }

  return {
    plan: sub.plan,
    piliers_actifs: JSON.parse(sub.piliers_actifs) as Pilier[],
    docs_generes_mois: sub.docs_generes_mois,
    conteneurs_trackes_mois: sub.conteneurs_trackes_mois,
  };
}

/**
 * Vérifie si un utilisateur peut accéder à un pilier logistique.
 * - Gratuit : aucun pilier professionnel
 * - Standard : piliers_actifs selon souscription
 * - Business : tous les piliers
 */
export function canAccessPilier(userId: string, pilier: Pilier): boolean {
  const sub = getSubscription(userId);

  // Sans DB disponible → laisser passer (mode dégradé)
  if (!sub) return true;

  if (sub.plan === "business") return true;
  if (sub.plan === "standard") return sub.piliers_actifs.includes(pilier);
  return false; // gratuit
}

/**
 * Vérifie si un utilisateur peut utiliser une fonctionnalité.
 * Retourne { allowed, remaining? } avec le quota restant si applicable.
 */
export function canUseFeature(
  userId: string,
  feature: Feature
): { allowed: boolean; remaining?: number; reset_at?: string; required_plan?: Plan } {
  const sub = getSubscription(userId);

  // Sans DB → laisser passer (mode dégradé gracieux)
  if (!sub) return { allowed: true };

  const required = REQUIRED_PLAN[feature];
  const userRank = PLAN_RANK[sub.plan];
  const requiredRank = PLAN_RANK[required];

  // Vérification du niveau de plan requis
  if (userRank < requiredRank) {
    return { allowed: false, required_plan: required };
  }

  // Pour Business : accès illimité à toutes les fonctionnalités
  if (sub.plan === "business") {
    return { allowed: true };
  }

  // Vérification des quotas mensuels pour Standard
  const quota = QUOTAS[feature]?.[sub.plan];
  if (quota !== undefined) {
    const usage = getOrCreateUsage(userId, feature);
    if (usage === null) return { allowed: true }; // Sans DB

    if (usage.count >= quota) {
      return { allowed: false, remaining: 0, reset_at: usage.reset_at };
    }

    return { allowed: true, remaining: quota - usage.count };
  }

  return { allowed: true };
}

/**
 * Calcule la date de reset mensuel (1er du mois prochain à minuit UTC).
 */
function nextMonthReset(): string {
  const now = new Date();
  const firstOfNext = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return firstOfNext.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Récupère ou crée l'entrée de suivi d'utilisation pour un utilisateur + feature.
 * Réinitialise automatiquement si reset_at est dépassé.
 */
function getOrCreateUsage(
  userId: string,
  feature: Feature
): { count: number; reset_at: string } | null {
  if (!isDbAvailable()) return null;

  const db = getDb();
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  // Vérifie si une entrée existe
  const existing = db.prepare(`
    SELECT count, reset_at FROM feature_usage
    WHERE user_id = ? AND feature = ?
  `).get(userId, feature) as { count: number; reset_at: string } | undefined;

  if (!existing) {
    // Création de l'entrée avec reset au 1er du mois prochain
    const reset_at = nextMonthReset();
    db.prepare(`
      INSERT INTO feature_usage (user_id, feature, count, reset_at)
      VALUES (?, ?, 0, ?)
    `).run(userId, feature, reset_at);
    return { count: 0, reset_at };
  }

  // Réinitialisation si la période est dépassée
  if (existing.reset_at <= now) {
    const reset_at = nextMonthReset();
    db.prepare(`
      UPDATE feature_usage SET count = 0, reset_at = ?
      WHERE user_id = ? AND feature = ?
    `).run(reset_at, userId, feature);
    return { count: 0, reset_at };
  }

  return existing;
}

/**
 * Incrémente le compteur d'utilisation d'une fonctionnalité.
 * Logue un warning si le quota est dépassé.
 */
export function incrementUsage(userId: string, feature: Feature): void {
  if (!isDbAvailable()) return;

  const db = getDb();
  const quota = QUOTAS[feature];

  // Crée l'entrée si elle n'existe pas
  getOrCreateUsage(userId, feature);

  db.prepare(`
    UPDATE feature_usage SET count = count + 1
    WHERE user_id = ? AND feature = ?
  `).run(userId, feature);

  // Vérification dépassement de quota pour warning
  const sub = getSubscription(userId);
  if (sub && sub.plan !== "business" && quota?.[sub.plan]) {
    const usage = db.prepare(
      "SELECT count FROM feature_usage WHERE user_id = ? AND feature = ?"
    ).get(userId, feature) as { count: number } | undefined;

    if (usage && usage.count > (quota[sub.plan] ?? 0)) {
      console.warn(`[ORION] Quota dépassé — user: ${userId}, feature: ${feature}, count: ${usage.count}`);
    }
  }

  // Mise à jour des compteurs agrégés dans subscriptions
  if (feature === "doc_generation") {
    db.prepare(
      "UPDATE subscriptions SET docs_generes_mois = docs_generes_mois + 1, updated_at = datetime('now') WHERE user_id = ?"
    ).run(userId);
  } else if (feature === "ship24_tracking") {
    db.prepare(
      "UPDATE subscriptions SET conteneurs_trackes_mois = conteneurs_trackes_mois + 1, updated_at = datetime('now') WHERE user_id = ?"
    ).run(userId);
  } else if (feature === "sms_notification") {
    // Les SMS sont déjà incrémentés via sms-service.ts
    db.prepare(
      "UPDATE subscriptions SET updated_at = datetime('now') WHERE user_id = ?"
    ).run(userId);
  }
}

/**
 * Remet à zéro les compteurs mensuels pour tous les utilisateurs.
 * À appeler via cron job le 1er de chaque mois.
 */
export function resetMonthlyUsage(): void {
  if (!isDbAvailable()) return;

  const db = getDb();
  const reset_at = nextMonthReset();

  db.prepare(`
    UPDATE feature_usage SET count = 0, reset_at = ?
  `).run(reset_at);

  db.prepare(`
    UPDATE subscriptions
    SET docs_generes_mois = 0,
        conteneurs_trackes_mois = 0,
        updated_at = datetime('now')
  `).run();

  console.info(`[ORION] Quotas mensuels réinitialisés. Prochain reset : ${reset_at}`);
}
