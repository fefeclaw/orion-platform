# Orion Platform — Active Roadmap

> Mis à jour : 2026-03-17

---

## ✅ Terminé — Sprint 2

- [x] Auth NextAuth v5 beta (credentials, edge middleware)
- [x] Dashboard 4 piliers (Maritime, Rail, Routier, Aérien)
- [x] Satellite background Leaflet + ArcGIS (fiable, no-auth)
- [x] Photos Unsplash réelles sur les cards piliers
- [x] ContainerDrawer (Maritime) — Radar map, ShipTimeline, Delay Protocol, Nadia badge
- [x] BSCDrawer — Magic Fill, formulaire DGD, timeline soumission
- [x] Light mode fix (glassmorphism)
- [x] WelcomeText taille réduite
- [x] i18n complet — 7 langues (FR/EN/PT/NL/ZH/KO/JA), tout l'UI traduit

---

## 🔄 En cours

*(vide)*

---

## 📋 Backlog — Priorité haute

### Pilier Routier — Quick Action "Transit CEDEAO"
- Drawer "Suivre un convoi" avec corridors ABJ → Ouaga → Bamako
- GPS tracking simulé, alertes trafic, postes frontière
- Carte routière avec checkpoints

### Intermodal Bridge (Victor)
- Si navire delayed → suggestion automatique Road/Rail
- Calcul fenêtre de livraison maintenue
- UI : notification dans ContainerDrawer avec alternatives

### Intelligence Layer — Predictive Engine
- Règle Recalculate : délai > 5% → recalcul ETA automatique
- Variables : congestion port, trafic frontalier, météo
- Affichage "Solution" dans drawer (pas juste alerte)

---

## 📋 Backlog — Priorité moyenne

### Nadia — Capteurs périsssables
- Intégrer temp/humidité sur tracking cards Cacao
- Protocole conservation automatique si seuils dépassés
- Badge "Nadia" visible sur ContainerDrawer ORION-1337

### Crisis Mode — Black Box
- Trigger : Force Majeure détecté
- 3 plans de contingence (A: Reroute, B: Buffer Storage, C: Intermodal)
- Interface dédiée avec simulation side-by-side

### Air Waybill Drawer
- Même pattern que BSCDrawer
- Magic Fill pour vols cargo
- Champs : vol, hub, AWB number, type marchandise

### Dashboard global `/dashboard`
- Vue consolidée 4 piliers
- KPIs agrégés + carte monde avec tous les assets live

---

## 📋 Backlog — Nice to have

- Mobile responsiveness (iPhone via Termius)
- Notifications push (délais, arrivées)
- Export PDF des documents (BSC, Waybill)
- Dark/Light mode switcher dans dashboard
