# Lessons Learned — Orion Platform

> Corrections et apprentissages accumulés. À relire avant chaque session.

---

## Règle fondamentale

**"Ne jamais casser ce qui marche."**
Avant toute modification, vérifier ce qui est en production et le préserver.
→ Source : Zep, 2026-03-17

---

## Maps & Géolocalisation

### ❌ Google Maps iframe — BANNI en production
- **Problème** : Google bloque `maps.google.com/maps?output=embed` sans clé API valide
- **Symptôme** : Carte disparaît après déploiement Vercel
- **Solution** : Leaflet + ArcGIS World Imagery tiles (gratuit, no-auth, jamais bloqué)
- **Tiles** : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

### ❌ react-leaflet — INCOMPATIBLE avec React 18
- **Problème** : `react-leaflet@5` nécessite React 19
- **Solution** : Leaflet vanilla avec `dynamic(() => import(...), { ssr: false })`

---

## NextAuth v5 — Edge Runtime

### ❌ Import direct de `auth` dans middleware — INTERDIT
- **Problème** : `next-auth` utilise `DecompressionStream` (Node.js API), incompatible Edge
- **Solution** : Créer `auth.config.ts` sans credentials provider, l'utiliser dans `middleware.ts`
- **Pattern** :
  ```ts
  // auth.config.ts — edge-safe, no credentials
  export const authConfig: NextAuthConfig = { ... };

  // middleware.ts
  import { authConfig } from "@/auth.config";
  export const { auth: middleware } = NextAuth(authConfig);
  ```

---

## TypeScript

### ❌ Cast direct sur AdapterUser
- **Problème** : `session.user as Record<string, unknown>` → erreur TS
- **Solution** : `session.user as unknown as Record<string, unknown>`

### ❌ `tap: false` dans MapOptions Leaflet
- **Problème** : Propriété `tap` n'existe pas dans le type `MapOptions`
- **Solution** : Supprimer `tap: false`

---

## npm / Dépendances

### ⚠️ Conflits peer deps en local
- **Problème** : Erreurs lors de `npm install`
- **Solution** : `npm install --legacy-peer-deps`

---

## UI / Design

### 🎨 Mode Light — Points d'attention
- `.satellite-wrapper > div:first-child` → filter brightness(1.3) pour lisibilité
- `.glass` → background blanc frosted avec shadow
- Body bg : `#c8d4e8` en light mode
- Ne pas oublier les composants glassmorphism dans le dashboard

### 📐 WelcomeText — Taille
- Réduit de `text-7xl/8xl` → `text-4xl/5xl` (coupait sur mobile)
- Container height : `7rem` → `4.5rem`

---

## i18n

### ✅ Pattern retenu — Contexte React custom (pas de lib)
- `LanguageContext` → `lang` + `setLang`
- `useTranslation()` → retourne `t(key)` lié à la langue active
- `LanguageProvider` wrap dans `layout.tsx` (root, couvre tout)
- Pas de next-i18next ni react-i18next → trop lourd pour ce projet

---

## Workflow

### 📝 Toujours vérifier visuellement après un changement CSS
- Un changement dans `globals.css` peut casser plusieurs composants à la fois
- Tester en dark mode ET light mode
- Vérifier que la carte satellite est toujours visible en background
