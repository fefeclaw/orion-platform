# Troubleshooting ORION — Guide de Dépannage

**Pour** : Équipe Ops et Développeurs  
**Mise à jour** : 2026-04-02  

---

## 🔴 Problèmes Critiques (P0)

### 1. Application inaccessible (502/503)

**Symptômes** : Page blanche, "This Serverless Function has crashed"

**Diagnostic** :
```bash
# Voir logs temps réel
vercel logs orion.ci --json --since=5m

# Vérifier statut Vercel
vercel status
```

**Causes fréquentes** :
- Erreur `better-sqlite3` (binaire natif incompatible)
- Memory limit exceeded (SQLite trop lourd)
- Build failed (erreur TypeScript)

**Solutions** :
```bash
# 1. Redéployer avec clean cache
vercel --prod --force

# 2. Si erreur better-sqlite3 :
npm install better-sqlite3 --save
# Ou passer en mode fallback mock DB

# 3. Vérifier build en local
npm run build
```

---

### 2. Erreurs Sentry (non capturées)

**Symptômes** : Erreurs absentes de Sentry Dashboard

**Vérifications** :
```bash
# Tester Sentry
curl -X POST http://localhost:3000/api/debug/sentry-test
# Ou
npx tsx scripts/test-sentry.ts
```

**Vérifier DSN** :
```bash
# Doit afficher une valeur
vercel env ls | grep SENTRY
```

**Réparer** :
```bash
# Si DSN manquant
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_DSN production
```

---

### 3. Database SQLite corrompue

**Symptômes** : `SQLITE_CORRUPT`, `database disk image is malformed`

**Action immédiate** :
```bash
# 1. Backup si possible
cp /data/orion.db /data/orion.db.backup.$(date +%Y%m%d)

# 2. Réparer
sqlite3 /data/orion.db ".recover" | sqlite3 /data/orion_fixed.db

# 3. Remplacer
mv /data/orion_fixed.db /data/orion.db
```

---

## 🟡 Problèmes Majeurs (P1)

### 4. API Orange SMS ne fonctionne pas

**Symptômes** : `Impossible d'obtenir le token Orange`, SMS non reçus

**Diagnostic** :
```bash
# Vérifier credentials
echo $ORANGE_SMS_CLIENT_ID
echo $ORANGE_SMS_CLIENT_SECRET

# Tester avec verbose
curl -v -X POST https://api.orange.com/oauth/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -d "grant_type=client_credentials"
```

**Codes erreur** :
- `401` : Credentials invalides → Regénérer sur Orange Developer
- `403` : App non approuvée → Contacter support Orange
- `429` : Rate limiting → Attendre 1 min

**Fallback Moov** :
```bash
# Basculer vers Moov
export SMS_MODE="moov"
# Ou configurer Vercel env
```

---

### 5. Ship24 Rate Limit (429)

**Symptômes** : Erreur HTTP 429 sur `/api/tracking/ship24`

**Solutions** :
1. **Attendre** : Rate limit reset après 1 minute
2. **Vérifier quota** : Dashboard Ship24
3. **Fallback** : Mock data activé automatiquement après 3 retries

**Optimisation** :
```typescript
// Augmenter intervalle de polling
const POLLING_INTERVAL = 30000; // 30s au lieu de 15s
```

---

### 6. MarineTraffic indisponible

**Symptômes** : Pas de positions navires, timeout AIS

**Chaîne de fallback automatique** :
```
1. MarineTraffic (API officielle)
2. VesselFinder (si API key configurée)
3. Données mock (cache SQLite si < 15min)
4. Aucune data (affichage "dernière position connue")
```

**Vérifier** :
```bash
# Clé API présente ?
echo $MARINETRAFFIC_API_KEY
```

---

## 🟢 Problèmes Mineurs (P2)

### 7. Erreurs timeout tests k6

**Symptômes** : `http_req_duration p95 > 2000ms`

**Optimisations** :
```bash
# 1. Vérifier Sentry sample rate (trop élevé = ralentissement)
# sentry.server.config.ts → tracesSampleRate: 0.1 (prod)

# 2. Activer Redis cache (si disponible)
REDIS_URL="redis://..."

# 3. Scaler Vercel Functions
# Dashboard → Functions → Memory/Timeout
```

---

### 8. PDF ne génère pas

**Symptômes** : B/L, CMR, AWB bloquent ou vides

**Vérifier** :
```bash
# Espace disque suffisant ?
df -h

# jsPDF chargé ?
npm list jspdf
```

**Réparer** :
```bash
npm install jspdf jspdf-autotable --save
```

---

### 9. Dark mode qui ne persiste pas

**Symptômes** : Thème retourne à "light" au refresh

**Cause** : `localStorage` vide ou `class` non appliquée

**Fix** :
```typescript
// Dans _app.tsx ou layout.tsx
// S'assurer que ThemeProvider englobe tout
document.documentElement.classList.add('dark');
```

---

## 🔧 Commandes Utiles

### Vercel CLI

```bash
# Voir les builds
vercel builds

# Inspecter déploiement
vercel inspect orion.ci

# Rollback
vercel promote [deployment-id]

# Redémarrer fonction
vercel --prod --force
```

### Database

```bash
# Lister tables
sqlite3 data/orion.db ".tables"

# Requête rapide
sqlite3 data/orion.db "SELECT COUNT(*) FROM vessels;"

# Liste des documents
sqlite3 data/orion.db "SELECT type, COUNT(*) FROM documents GROUP BY type;"
```

### Logs

```bash
# Logs temps réel
vercel logs orion.ci --json --since=10m

# Que erreurs
vercel logs orion.ci --json --since=1h | jq 'select(.level=="ERROR")'
```

---

## 📊 Dashboards

| Service | URL | Usage |
|---------|-----|-------|
| Vercel Dashboard | https://vercel.com/orion-logistics | Déploiements, logs |
| Sentry | https://orion-logistics.sentry.io | Erreurs, performance |
| Vercel Analytics | Built-in | Traffic, Core Web Vitals |

---

## 📞 Escalade

| Situation | Action |
|-----------|--------|
| Incident P0 + 30min sans résolution | Pager CTO (+225 XX XX XX XX) |
| API Orange/Moov down | Appeler Orange Dev Support + contacter CTO |
| Vercel outage | Check https://status.vercel.com + Slack #incidents |
| Database perdue | Restaurer backup GCP + notifier clients SMS |

---

## 📝 Checklist Maintenance Routine

**Weekly** :
- [ ] Vérifier Sentry → trier erreurs non résolues
- [ ] Vérifier quotas APIs (Ship24, MarineTraffic, Orange)
- [ ] Vérifier logs Vercel → erreurs 500+

**Monthly** :
- [ ] Rotation secrets (AUTH_SECRET, API keys)
- [ ] Archiver vieilles données SQLite (> 90 jours)
- [ ] Review costs Vercel (bandwidth, functions)

**Quarterly** :
- [ ] Run k6 test complet
- [ ] Review dépendances npm (security)
- [ ] Test plan disaster recovery

---

**ORION Unified Logistics** — Runbook v1.0
