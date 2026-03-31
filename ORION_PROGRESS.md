# ORION PROGRESS TRACKER
Dernière mise à jour : **2026-03-31**

---

## MODÈLE DE TARIFICATION ORION

### 3 offres
- **Gratuit**   : grand public, sans compte pro
- **Standard**  : PME / transitaires — ~15 000 XOF/mois — 2 piliers
- **Business**  : grandes entreprises — sur devis — 4 piliers complets

### Matrice fonctionnalités par offre
| Fonctionnalité                        | Gratuit | Standard      | Business     |
|---------------------------------------|---------|---------------|--------------|
| Suivi colis public (numéro référence) | ✓       | ✓             | ✓            |
| Notifications SMS livraison           | ✓       | ✓             | ✓            |
| Dashboard professionnel               | ✗       | 2 piliers     | 4 piliers    |
| Tracking conteneurs Ship24            | ✗       | 50/mois       | Illimité     |
| Suivi navires AIS (MarineTraffic)     | ✗       | Différé 15min | Temps réel   |
| Génération documents (B/L, LV, AWB)  | ✗       | 10/mois       | Illimité     |
| Prédiction retards IA                 | ✗       | ✗             | ✓            |
| Tracking multimodal unifié ORN-XX     | ✗       | ✗             | ✓            |
| Infos géopolitiques + taux de change  | ✗       | ✗             | ✓            |
| API Orion (accès programmatique)      | ✗       | ✗             | ✓            |
| Comptes employés                      | 1       | 5 max         | Illimité     |

### APIs et amortissement
- Ship24        : ~50$/mois  → couvert par 4 abonnés Standard
- MarineTraffic : ~100$/mois → couvert par 2 abonnés Business
- SMS Orange CI : variable   → mutualisé sur tous abonnés

### Rôle de Ship24 dans Orion
- Ship24 = tracking colis routiers (DHL, transporteurs locaux) + tracking conteneurs par numéro B/L
- Ship24 ≠ positions navires AIS (rôle de MarineTraffic)

### Stratégie lancement
6 mois gratuits pour les 50 premiers professionnels → constituer données réelles + témoignages → activer monétisation

---

## MONÉTISATION & SUBSCRIPTIONS (Agent 9 — extension) ✅ COMPLET
- [x] Table subscriptions migrée + seed (plan selon rôle : admin→business, pro→standard, user→gratuit)
- [x] Table feature_usage migrée (index unique user+feature, reset mensuel automatique)
- [x] src/lib/subscription.ts créé (canAccessPilier, canUseFeature, incrementUsage, resetMonthlyUsage)
- [x] Middleware withSubscription créé (HOF, 401/403/429, setImmediate pour usage async)
- [x] Routes protégées : /api/maritime/bl/generate (doc_generation), /api/maritime/ais (ais_realtime), /api/tracking/ship24 (ship24_tracking)
- [x] Page /pricing créée (dark mode ✓, 3 cards Gratuit/Standard/Business, bandeau lancement)
- [x] Hook useShip24Tracking créé (vérification plan, fallback mock si clé absente)
- [x] .env.example mis à jour (SHIP24_API_KEY, MARINETRAFFIC_API_KEY, ORANGE_SMS_API_KEY)

---

## État global — Mis à jour 2026-03-31

| Pilier | Avancement | Statut |
|--------|-----------|--------|
| Maritime | 100% | 🟢 AIS + icônes type + B/L API SQLite + Manifeste + Phyto + Origine |
| Ferroviaire | 100% | 🟢 LV PDF + cascade delay + douanes CI/BF — COMPLET |
| Routier | **100%** | 🟢 CMR/BSC/TRIE PDF + **Page suivi public ORN complète** — COMPLET |
| Aérien | 100% | 🟢 AWB PDF + EXA/IMP + LTA groupée multi-shipments — COMPLET |
| Intermodal | 100% | 🟢 4 hooks live + rapport PDF connecté — COMPLET |
| Auth/Sécurité | **95%** | 🟢 SQLite + audit trail + logs d'accès + **Chiffrement documents** |
| Docs/PDF | **100%** | 🟢 8 types documents + archivage SQLite + **Export Excel** — COMPLET |
| Tests/QA | **70%** | 🟡 Tests unitaires, d'intégration et cache créés |
| Data/APIs | **85%** | 🟢 **Webhook AIS temps réel** + Cache SQLite + Fallbacks |

---

## AGENT 1 — Maritime Enhancer ✅ COMPLET
- [x] Audit code existant (MaritimeMapGL, VesselsTable, AlertsPanel, WeatherWidget)
- [x] Carte MapLibre GL avec navires temps réel (mock)
- [x] Météo marine (WeatherWidget en place)
- [x] Widget taux de change FCFA (EUR/USD/GBP · variation toutes les 30s)
- [x] ETA prédictif météo (×1.2 si THUNDERSTORM/HEAVY_RAIN, ×1.1 si FOG)
- [x] Génération B/L digital (bouton + BLFormPanel admin + historique localStorage)
- [x] Intégration AIS réelle (MarineTraffic → VesselFinder → mock fallback, polling 60s)
- [x] ArrivalsPanel — compteur navires < 24h, liste 5 arrivées, alerte ETA changé > 2h
- [x] Icônes navire différenciées par type (taille cercle + couleur stroke : cyan=container, orange=tanker, jaune=bulk, violet=roro)
- [x] Route API POST /api/maritime/bl/generate — PDF stream + persistance SQLite
- [x] Table SQLite `documents` — archivage B/L (type, pilier, navire, cargo, metadata JSON)
- [x] Manifeste cargo PDF multi-navires (paysage A4, tableau complet, récap statuts)
- [x] Certificat phytosanitaire (MINADER/ANADER, déclaration IPPC, zones signature)
- [x] Certificat d'origine (CCI-CI, code SH, valeur FOB, déclaration d'origine)

## AGENT 2 — Rail Builder ✅ COMPLET
- [x] Structure DeckLayout en place
- [x] Carte avec assets ferroviaires (DeckMapGL)
- [x] useRailData intégré — assets dynamiques, KPIs live
- [x] Panneau gauche : gares du corridor (statuts normal/congestion/fermée)
- [x] Panneau droit : détail train (trajet, cargo, vitesse, ETA, délai formaté)
- [x] Lettre de Voiture digitale (HTML Blob + jsPDF, bouton dans card train)
- [x] Prédiction retards dominos (banner cascade, alertes CascadePanel, dominoTrains)
- [x] Déclarations douanières CI/Burkina (MOCK_CUSTOMS, régimes EXP/IMP/TRN, postes frontière)

## AGENT 3 — Road Builder ✅ **COMPLET**
- [x] Structure DeckLayout en place
- [x] Carte avec assets routiers (DeckMapGL)
- [x] useRoadData intégré — assets dynamiques, KPIs live
- [x] Panneau gauche : postes & frontières avec temps d'attente (différenciant)
- [x] Barre flottante camions en retard avec sélection rapide
- [x] Panneau droit : détail camion (plaque, conducteur, trajet, retard rouge)
- [x] Boutons CMR + BSC PDF dans le détail camion
- [x] Widget suivi public colis par référence ORN (résultat mock avec ville + ETA)
- [x] Document TRIE — Transit Routier Inter-États CEDEAO (bouton + générateur PDF)
- [x] **Interface grand public complète** (page dédiée `/tracking` avec tunnel timeline, design responsive, dark mode)

## AGENT 4 — Air Builder ✅ COMPLET
- [x] Structure DeckLayout en place
- [x] Carte avec assets aériens (DeckMapGL)
- [x] useAirData intégré — assets dynamiques, KPIs live
- [x] Panneau gauche : vols triés par ETA avec cut-off times + badges urgence
- [x] Alerte "Risque Miss Flight" — banner fixed z-50, rouge animé, dismiss
- [x] Panneau droit : détail vol (altitude, vitesse, cargo, gate, cutoff)
- [x] Génération AWB PDF (bouton dans card vol sélectionné)
- [x] Déclarations EXA/IMP — statuts avec numéros de référence + droits estimés
- [x] LTA groupée multi-shipments (interface LTAData + generateLTA + bouton "LTA Groupée")

## AGENT 5 — Intermodal Engine ✅ COMPLET
- [x] Format tracking unifié ORN-[MODE]-[ANNÉE]-[SÉQUENCE]
- [x] Hook useIntermodalData.ts — 8 expéditions, moteur simulation 15s
- [x] Dashboard intermodal complet avec DeckLayout
- [x] Jonctions Maritime → Routier, Maritime → Ferroviaire, Routier → Aérien, Ferroviaire → Aérien
- [x] Timeline segments avec statuts (completed/active/pending/delayed)
- [x] Panneau liste avec filtres et barre de progression modes (⚓🚂🚛✈️)
- [x] Banner critique rouge si expéditions status=critical
- [x] KPIs : total, on_track, delayed, critical, délai moyen, jonctions actives
- [x] Connexion aux hooks useMaritimeData / useRailData / useRoadData / useAirData — enrichissement live des délais et statuts par mode
- [x] Rapport PDF intermodal (generateRapportIntermodal connecté, bouton "Rapport PDF" en overlay carte)

## AGENT 6 — UI/UX Polisher ✅ 90%
- [x] Dark mode (en place)
- [x] DeckLayout harmonisé pour 4 piliers
- [x] Responsive mobile (KPIs condensés, colonne Position cachée, table h réduite)
- [x] Skeleton loaders (SkeletonRow animate-pulse dans la table)
- [x] État vide (overlay carte + message table si 0 assets)
- [x] **Page /tracking publique** design professionnel avec timeline
- [x] Panneaux gauche/droite enrichis pour Rail, Road, Air
- [x] Cohérence visuelle maritime ↔ autres piliers

## AGENT 7 — Data & APIs ✅ 85%
- [x] useMaritimeData.ts (données navires mock)
- [x] useWeather.ts (données météo)
- [x] useRailData.ts (trains, gares, retards — corridor ABJ-OUA)
- [x] useRoadData.ts (camions, checkpoints, barrages — réseau CEDEAO)
- [x] useAirData.ts (vols, cut-off, fret — hub FHB Abidjan)
- [x] **Cache SQLite** (positions, taux de change — TTL-based)
- [x] **Webhook AIS temps réel** (POST `/api/maritime/webhook/ais`, validation, alertes auto)
- [x] **Fallbacks API** (Ship24 indisponible → mock, MarineTraffic → VesselFinder → mock)
- [ ] Cache Redis (optionnel — SQLite suffisant pour MVP)

## AGENT 8 — Docs & Admin ✅ **COMPLET**
- [x] Moteur génération PDF (jsPDF + jspdf-autotable côté client)
- [x] Template B/L — Bill of Lading maritime
- [x] Template LV — Lettre de Voiture ferroviaire (HTML Blob + jsPDF)
- [x] Template CMR — Lettre de voiture internationale routière
- [x] Template BSC — Bordereau de Suivi de Cargaison
- [x] Template AWB — Air Waybill aérien
- [x] Template TRIE — Transit Routier Inter-États CEDEAO (avec caution, ASYCUDA, zones douane)
- [x] Charte graphique ORION (header dark, gold separator, footer)
- [ ] Système signature électronique simple (reporté v2.0 — solution tierce recommandée)
- [x] Archivage documents SQLite — endpoint générique POST `/api/documents/archive` (types: BL/LV/AWB/CMR/BSC/TRIE/LTA/INTERMODAL)
- [x] **Export Excel rapports** (POST `/api/admin/export`, lib/export.ts, types: intermodal/maritime/usage/alerts)

## AGENT 9 — Auth & Security ✅ **95%**
- [x] next-auth Credentials (pro + public)
- [x] Rôles basiques : professional / user
- [x] Rôle admin Orion (ADM-0001 / admin@orion.ci)
- [x] Type UserRole + OrionUser dans types/index.ts
- [x] Extensions next-auth (Session, User, JWT typés)
- [x] Fonctions utilitaires : canAccessPillar, isAdmin, isProfessional
- [x] Utilisateur ADM-0001 accès tous piliers
- [x] SQLite DB (src/lib/db.ts + db-migrate.ts) avec seed 7 utilisateurs
- [x] auth-db.ts : findUserByEmail, verifyPassword, refresh tokens (30j)
- [x] auth.ts : utilise DB si better-sqlite3 installé, fallback mock sinon
- [x] `npm install better-sqlite3 bcryptjs @types/*` ✅ installé le 2026-03-28
- [x] **Chiffrement documents sensibles** (src/lib/encryption.ts — AES-256-GCM, encrypt/decrypt object, hashIdentifier)
- [x] Logs d'accès et audit trail (table access_logs, logAccess(), getAllAccessLogs(), route GET `/api/admin/audit`)

## AGENT 10 — Testing & QA ✅ **70%**
- [x] **Tests unitaires calcul ETA** (src/__tests__/lib/eta-calculations.test.ts)
- [x] **Tests intégration APIs** (src/__tests__/api/tracking.test.ts — Ship24 fallback, AIS positions)
- [x] **Tests cache** (src/__tests__/lib/cache.test.ts — TTL, suppression, perfs)
- [x] **Tests subscription** (src/__tests__/lib/subscription.test.ts — matrice plans, quotas)
- [x] Structure de tests Jest configurée
- [ ] Tests de charge (Playwright / k6) — prêt pour implémentation
- [ ] Monitoring Sentry — configuré via Vercel
- [x] **Documentation ORION_API.md** (complète avec endpoints, auth, webhooks, SDK)

---

## Phases d'exécution — MÀJ 2026-03-31

### PHASE 1 ✅ TERMINÉE
- ✅ Agent 9 (Auth) — Chiffrement ajouté
- ✅ Agent 7 (Data/APIs) — Webhook AIS + fallbacks
- ✅ Agent 6 (UI/UX) — Page /tracking publique

### PHASE 2 ✅ TERMINÉEE
- ✅ Agent 1 (Maritime Enhancer) — Webhook complet
- ✅ Agent 2 (Rail Builder) — Complet
- ✅ Agent 3 (Road Builder) — Page publique ajoutée
- ✅ Agent 4 (Air Builder) — Complet
- ✅ Agent 8 (Docs) — Export Excel ajouté

### PHASE 3 🟢 EN COURS
- ✅ Agent 5 (Intermodal Engine) — Complet
- ✅ Agent 10 (Tests/QA) — 70% (tests unitaires/intégration OK, manque charge)

---

## 🎯 Points Critiques Résolus (Session du 2026-03-31)

| Point Critique | Action | Statut |
|----------------|--------|--------|
| **Page /tracking publique** | Création complète avec mock data, timeline, dark mode | ✅ Terminé |
| **Tests/QA** | 4 fichiers de tests créés (eta, subscription, cache, tracking API) | ✅ Terminé |
| **Webhook AIS temps réel** | Route POST `/api/maritime/webhook/ais` avec validation, persistence, alertes | ✅ Terminé |
| **Cache Redis** | Utilisation du cache SQLite existant (suffisant pour MVP, Redis optionnel) | ✅ Terminé |
| **Chiffrement documents** | Lib encryption.ts (AES-256-GCM) avec encrypt/decrypt object | ✅ Terminé |
| **Export Excel** | Route `/api/admin/export` + lib/export.ts avec 4 types de rapports | ✅ Terminé |
| **Documentation ORION_API.md** | Documentation complète 500+ lignes, endpoints, auth, webhooks | ✅ Terminé |

---

## 📋 Prochaines étapes recommandées

### Priorité Haute (Production Ready)
1. **Tests de charge (k6)** — Simuler 100+ utilisateurs simultanés
2. **Monitoring Sentry** — Capturer erreurs en production
3. **Clé ORANGE_SMS_API_KEY** — Pour notifications SMS réelles

### Priorité Moyenne (v1.1)
4. Signature électronique — Intégration DocuSign ou solution locale Côte d'Ivoire
5. Migration Redis — Si volume cache SQLite > 100MB

### Priorité Basse (v2.0)
6. App mobile React Native
7. Intelligence prédictive IA (modèle retard)

---

**ORION Unified Logistics** — Port d'Abidjan, Côte d'Ivoire 🇨🇮
