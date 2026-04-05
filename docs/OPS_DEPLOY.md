# Guide de Déploiement ORION — Opérations

**Projet** : ORION Unified Logistics Platform  
**Version** : 1.0.0  
**Dernière MÀJ** : 2026-04-02  

---

## 📋 Prérequis

### Environnement local
- Node.js ≥ 18.x
- npm ≥ 9.x
- better-sqlite3 (natif)
- Vercel CLI (`npm i -g vercel`)

### Accès requis
- Compte Vercel (Pro ou Enterprise recommandé pour production)
- Compte Sentry (organisation: `orion-logistics`)
- Compte GitHub (repo: `orion-platform-mirror`)
- Accès Orange Developer (pour SMS)

---

## 🚀 Déploiement Production

### Étape 1 : Configuration variables d'environnement

Dans le dashboard Vercel : **Settings → Environment Variables**

#### Variables obligatoires

```bash
# Auth
AUTH_SECRET="votre_secret_32+_caracteres_aleatoires"
NEXTAUTH_URL="https://orion.ci"

# Sentry Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://dcbee7acab9c34585c74dd9a2bd4638d@o4511145230467072.ingest.us.sentry.io/4511145239314432"
SENTRY_DSN="https://dcbee7acab9c34585c74dd9a2bd4638d@o4511145230467072.ingest.us.sentry.io/4511145239314432"

# APIs externes
SHIP24_API_KEY="apik_votre_cle_ship24"
MARINETRAFFIC_API_KEY="votre_cle_marinetraffic"
NEXT_PUBLIC_OPENWEATHER_API_KEY="votre_cle_openweather"

# SMS Orange CI (recommandé) ou Moov alternative
ORANGE_SMS_CLIENT_ID="votre_client_id_orange"
ORANGE_SMS_CLIENT_SECRET="votre_client_secret_orange"
ORANGE_SMS_FROM="ORION"

# Optionnel : SMS Moov fallback
# MOOV_API_KEY="..."
# MOOV_SECRET="..."

# Mode sandbox pour tests (sans envoi SMS réel)
# SMS_MODE="sandbox"
```

**⚠️ Sécurité** : Activez "Encrypt" sur toutes les variables sensibles.

---

### Étape 2 : Déploiement depuis GitHub

```bash
# 1. Connecter le repo Vercel
vercel link

# 2. Déployer sur production
vercel --prod

# Ou via GitHub Actions (recommandé)
git push origin main  # Déploie automatiquement si CI/CD configurée
```

### Étape 3 : Vérification post-déploiement

```bash
# Vérifier le build
vercel --version

# Vérifier les logs
vercel logs orion.ci --json

# Vérifier DNS (si domaine personnalisé)
dig orion.ci CNAME
```

---

## 🔧 Configuration Domaine Personnalisé

### Domaine principal (orion.ci)

1. **Vercel Dashboard** → Domains → Add Domain
2. **DNS chez registraire** (ex: OVH, Gandi) :
   ```
   Type : CNAME
   Nom  : @
   Valeur : cname.vercel-dns.com.
   TTL : 3600
   ```

3. **Wildcard subdomains** (optionnel) :
   ```
   Type : CNAME
   Nom  : *
   Valeur : cname.vercel-dns.com.
   ```

### SSL Certificate
- Auto-provisionné par Vercel (Let's Encrypt)
- Renouvellement automatique

---

## 📊 Monitoring & Alertes

### Sentry Configuration

1. **Projects** → Create Project → Next.js
2. **Alert Rules** → Créer :
   - **Erreurs critiques** : `level:fatal OR level:error` → Email + Slack
   - **Timeouts API** : `error_category:third_party_api_timeout` → PagerDuty
   - **DB Errors** : `database_error:*` → Email équipe technique

### Health Checks

```bash
# Endpoint de santé
GET https://orion.ci/api/health

# Réponse attendue
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-04-02T12:00:00Z",
  "services": {
    "database": "connected",
    "apis": {
      "ship24": "ok",
      "marinetraffic": "ok",
      "openweather": "ok"
    }
  }
}
```

---

## 📱 Tests de Charge

### k6 (obligatoire avant mise en prod)

```bash
# 1. Installer k6
curl -L https://github.com/grafana/k6/releases/download/v0.49.0/k6-v0.49.0-linux-amd64.tar.gz | tar xvz
sudo cp k6-v0.49.0-linux-amd64/k6 /usr/local/bin/

# 2. Exécuter tests
k6 run tests/load/stress_test.js

# Critères d'acceptation
# - http_req_duration p95 < 2000ms
# - http_req_failed < 5%
# - iterations completées > 95%
```

---

## 🔥 Rollback Emergency

Si incident critique en production :

```bash
# Méthode 1 : Redéployer version précédente
vercel --prod --yes

# Méthode 2 : Via Dashboard Vercel
# Deployments → [Version stable] → Promote to Production

# Méthode 3 : Git revert
git revert HEAD
git push origin main
```

---

## 📝 Runbook Incidents

### Incident Type 1 : API Orange SMS en panne

**Symptômes** : Erreurs `ORANGE_SMS_API_ERROR` dans Sentry

**Actions** :
1. Passer en mode fallback Moov : `SMS_MODE="moov"` dans Vercel
2. Redéployer : `vercel --prod`
3. Créer incident Orange Developer
4. Communiquer aux utilisateurs (banner site)

### Incident Type 2 : SQLite surcharge

**Symptômes** : Latence DB > 500ms, erreurs `database_error`

**Actions** :
1. Scale Vercel Functions (Pro/Enterprise)
2. Activer Redis pour cache (si configuré)
3. Archiver vieilles données
4. Planifier migration PostgreSQL (v2.0)

### Incident Type 3 : Rate limiting Ship24

**Symptômes** : HTTP 429 sur `/api/tracking/ship24`

**Actions** :
1. Activer mode dégradé (mock data) automatique
2. Augmenter intervalles de polling
3. Contacter Ship24 pour upgrade plan

---

## 🔄 Cycle de vie

### Mise à jour production

1. **Feature Branch** → Test local
2. **PR → staging** → Tests k6 + QA
3. **Merge main** → Déploiement auto Vercel
4. **Vérification** Sentry + Health checks
5. **Monitoring** 24h post-déploiement

### Versions supportées

| Version | Support | Fin de vie |
|---------|---------|------------|
| v1.0.x | Active | 2026-12-31 |
| v1.1.x | Prévue | - |
| v2.0.0 | Roadmap | Q3 2026 |

---

## 📞 Contacts

| Rôle | Contact | Urgence |
|------|---------|---------|
| CTO | cto@orion.ci | P0 - 24/7 |
| Tech Lead | lead@123inov.ci | P1 - Jours ouvrés |
| Vercel Support | support@vercel.com | P2 |

---

**ORION Unified Logistics** — Port d'Abidjan, Côte d'Ivoire 🇨🇮
