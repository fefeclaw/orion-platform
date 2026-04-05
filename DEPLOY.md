# ORION — Guide de Déploiement Vercel

## Prérequis

- Compte Vercel avec accès au projet
- CLI Vercel installée : `npm i -g vercel`
- Variables d'environnement configurées

## Configuration

### 1. Variables d'environnement (Vercel Dashboard)

Variables **obligatoires** :
```
AUTH_SECRET=                    # Clé secrète NextAuth
NEXTAUTH_URL=                  # URL de production
NEXT_PUBLIC_APP_ENV=production
SHIP24_API_KEY=
MARINETRAFFIC_API_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
```

Variables **optionnelles** :
```
SENTRY_AUTH_TOKEN=             # Pour source maps
ORANGE_SMS_CLIENT_ID=          # Pour notifications SMS
ORANGE_SMS_CLIENT_SECRET=
```

### 2. Déploiement Preview (Staging)

```bash
# Se connecter à Vercel
vercel login

# Lier le projet
vercel link

# Déployer en preview
vercel --preview

# Ou avec message personnalisé
vercel --preview -m "Fix: correction TypeScript bl-generator"
```

### 3. Déploiement Production

```bash
vercel --prod
```

**⚠️ Nécessite validation du CTO pour production**

## Points d'attention

### SQLite sur Vercel
- better-sqlite3 ne fonctionne **pas** en serverless
- L'application fonctionne en mode "dégradé" (fallback mock)
- Pour persistance DB en production : migrer vers Turso ou PostgreSQL

### Build Time
- Limite : 45 min sur Vercel Pro
- Actuel : ~3-5 min (build local)

### Fonctions Serverless
- Timeout : 30s (API standard), 60s (admin/webhooks)
- Mémoire : 1024 MB par défaut
- Région : cdg1 (Paris) pour latence CI/Europe

## Health Checks

```bash
# Vérifier le statut
curl https://<url>/api/admin/health

# Test Sentry
curl https://<url>/api/debug/sentry-test
```

## Rollback

Si problèmes en production :
```bash
vercel rollback [deployment-url]
```

## Support

- Documentation Vercel : https://vercel.com/docs
- Issues Orion : https://github.com/123inov/orion-platform/issues
