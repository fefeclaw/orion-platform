# Documentation ORION — Table des Matières

**Projet** : ORION Unified Logistics Platform  
**Version** : 1.0.0  
**Dernière mise à jour** : 2026-04-02

---

## 📚 Documents disponibles

| Document | Description | Audience |
|----------|-------------|----------|
| **[OPS_DEPLOY.md](OPS_DEPLOY.md)** | Guide de déploiement production | Ops, DevOps |
| **[ENVIRONMENT.md](ENVIRONMENT.md)** | Variables d'environnement complètes | Développeurs, Ops |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Guide de dépannage et runbook | Ops, Support |

---

## 🚀 Quick Start

### Nouvelle installation

1. **Configurer les variables** : Voir [ENVIRONMENT.md](ENVIRONMENT.md)
2. **Déployer** : Suivre [OPS_DEPLOY.md](OPS_DEPLOY.md)
3. **Vérifier** : Exécuter les scripts de test ci-dessous

### Vérification rapide

```bash
# 1. Vérifier les variables d'env
npx tsx scripts/verify-env.ts

# 2. Tester Sentry
npx tsx scripts/test-sentry.ts

# 3. Tester SMS (sandbox)
SMS_MODE=sandbox npx tsx scripts/test-sms.ts +2250141424243

# 4. Test de charge
npm run test:load
```

---

## 🔄 Workflows

### Incident P0 (Application down)

```
1. Consulter TROUBLESHOOTING.md → Section "Problèmes Critiques"
2. Vérifier Vercel Dashboard
3. Escalader si > 30min (Contact CTO)
```

### Nouveau déploiement

```
1. Vérifier ENV avec scripts/verify-env.ts
2. Suivre OPS_DEPLOY.md → Étape 2
3. Vérifier avec tests sentry + health check
4. Monitor Sentry 24h
```

---

## 📞 Contacts Support

- **Documentation technique** : Ce repo `/docs`
- **Incidents** : Voir TROUBLESHOOTING.md → Escalade
- **API externe** : Référencées dans ENVIRONMENT.md

---

## 📝 Changelog Documentation

| Date | Changement |
|------|------------|
| 2026-04-02 | Création initiale (OPS_DEPLOY, ENVIRONMENT, TROUBLESHOOTING) |

---

**ORION Unified Logistics** — Port d'Abidjan, Côte d'Ivoire 🇨🇮
