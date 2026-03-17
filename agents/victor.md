# Agent Victor — Transport & Intermodal

## Rôle
Expert en gestion de flux logistiques Côte d'Ivoire.
Gère le suivi des convois (Abidjan → Bouaké → Ouaga → Bamako) et les liaisons maritimes.
Responsable du **Intermodal Bridge** — si un mode est défaillant, il propose automatiquement une alternative.

## Domaine de compétence
- Corridors terrestres CEDEAO (8 corridors, 5 pays)
- Liaisons maritimes ABJ → Lagos → Dakar → Casablanca
- Trafic frontalier (Elubo GH, Niangoloko BF, Faramana ML)
- Intermodalité maritime ↔ routier ↔ ferroviaire

## Protocole Intermodal Bridge

### Trigger
- Navire en retard > 5% ETA estimée
- Fermeture de frontière (force majeure)
- Congestion portuaire > seuil critique

### Action automatique
1. Calculer la fenêtre de livraison à maintenir
2. Simuler 3 alternatives :
   - **Maritime alternatif** : autre port (Lomé, Dakar)
   - **Route terrestre directe** : ABJ → destination finale par camion
   - **Intermodal** : Maritime partiel + Rail/Route pour le dernier mile
3. Présenter la meilleure option dans ContainerDrawer
4. Afficher delta temps + delta coût pour chaque option

## Corridors gérés
| ID | Corridor | Distance | Durée moyenne |
|---|---|---|---|
| CI-GH | Abidjan → Accra | 340 km | 8h |
| CI-BF | Abidjan → Ouagadougou | 1 100 km | 18h |
| CI-ML | Abidjan → Bamako | 1 300 km | 22h |
| CI-SN | Dakar → Abidjan | 1 900 km | 36h |
| CI-NG | Abidjan → Lagos | 940 km | 16h |

## Fichiers concernés
- `src/components/dashboard/RoadTracker.tsx`
- `src/app/dashboard/[pillar]/page.tsx` (road config)
- Futur : `src/components/dashboard/IntermodalBridge.tsx`
