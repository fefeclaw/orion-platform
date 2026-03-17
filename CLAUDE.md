# CLAUDE.md — Orion Unified Logistics System (OULS)

> Architecture référence pour tous les agents et sessions de développement.
> Dernière mise à jour : 2026-03-17

---

## 🎯 Mission

Construire la plateforme logistique la plus intelligente, prédictive et unifiée au monde. Pas un dashboard — un **Autonomous Logistics Brain** qui synchronise les flux Maritime, Ferroviaire, Routier et Aérien via une interface "Zero-Friction".

> "We don't just move cargo. We synchronize the world."

---

## 🏗️ Architecture 3 couches (OULS Core Stack)

### 1. Execution Layer — "1-Click" Admin

- **Objectif** : Neutraliser la bureaucratie administrative.
- **Protocole** : Tout document (BSC, DGD, Waybill, Air Waybill) généré en 1-clic via **Magic-Fill** (OCR + Session Data).
- **UX** : Toutes les actions dans un **Glassmorphism Drawer** sans quitter le dashboard principal.

### 2. Intelligence Layer — Real-time & Prédictif

- **Tracking** : Protocole "**Aeronautical Pulse**" pour le suivi live de tous les assets.
- **Predictive Engine** : Analyse permanente des variables (congestion portuaire, trafic frontalier, météo, prix carburant).
- **Règle "Recalculate"** : Si délai > 5% détecté → recalcul automatique ETA + route optimale. Ne pas signaler le problème. Présenter la solution.

### 3. Crisis Management Layer — The Black Box

- **Trigger** : Force Majeure (grèves, fermetures de frontières, accidents).
- **Action** : Activer **Crisis Mode** → 3 plans de contingence simultanés :
  - **Plan A** : Reroute (nouvelle route optimale)
  - **Plan B** : Buffer Storage (entrepôt tampon)
  - **Plan C** : Intermodal Shift (changement de mode de transport)

---

## 💎 Standards Visuels & Opérationnels

| Élément | Standard |
|---|---|
| Thème | Premium Stealth — Dark mode |
| Accent | `#D4AF37` Gold |
| Glow | `#38bdf8` Neon |
| UI niveau | Staff Engineer — pas de compromis |
| Animations | 60 FPS sur map pulse |
| Mobile | iPhone-ready (Termius tunnel) |
| Vérification | Screenshot après chaque modification UI |

**Tone** : Direct · Souverain · Orienté-solution — voir `brand-voice.md`

---

## 🤖 Sub-Agents & Responsabilités

| Agent | Domaine | Mission principale |
|---|---|---|
| **Nadia** | Agri / Qualité | Capteurs temps réel (temp/humidité) sur les cards de suivi pour marchandises périssables (Cacao) |
| **Victor** | Transport | Intermodal Bridge — si navire en retard, suggérer automatiquement Road/Rail pour maintenir la fenêtre de livraison |
| **Dev** | UI/UX | 60 FPS, mobile responsiveness, screenshots de vérification |

---

## 🚀 Stack Technique

- **Framework** : Next.js 14 App Router
- **Auth** : NextAuth v5 beta (edge-compatible)
- **Animations** : Framer Motion
- **Styles** : Tailwind CSS v4 (`@import "tailwindcss"`)
- **Cartes** : Leaflet + ArcGIS World Imagery (fiable, no-auth)
- **i18n** : Contexte React custom — 7 langues (fr/en/pt/nl/zh/ko/ja)
- **UI** : Glassmorphism dark, backdrop-filter blur

---

## 📝 Workflow Discipline

1. **Plan First** : Mettre à jour `tasks/todo.md` avant de coder.
2. **Learn Always** : Mettre à jour `tasks/lessons.md` après chaque correction utilisateur.
3. **Zero Laziness** : Aucun code placeholder. Uniquement du code production-ready.
4. **Never Break** : Ne jamais casser ce qui fonctionne. Tester visuellement après chaque changement.

---

## 📁 Structure des fichiers de contexte

```
tasks/
  todo.md         ← Roadmap active et tâches en cours
  lessons.md      ← Corrections et apprentissages
agents/
  nadia.md        ← Contexte agent qualité/agri
  victor.md       ← Contexte agent transport
brand-voice.md    ← Ton et style de communication
```

---

## 🔐 Contraintes de Sécurité

- Scope limité au répertoire projet
- Credentials dans `.env` (jamais commités)
- GitHub : `fefeclaw/orion-platform`
- Déploiement : Vercel (auto-deploy sur push main)

---

## UI Verification Protocol

1. Vérifier si `pnpm ui:dev` tourne sur le port 5173 avant de coder.
2. Après chaque modification de composant UI : screenshot sur `http://localhost:5173`.
3. Si le rendu ne correspond pas aux specs → corriger immédiatement, refaire screenshot.
4. Logger les corrections dans `tasks/lessons.md`.
