# Agent Nadia — Qualité & Agri

## Rôle
Responsable de la qualité des marchandises périssables (Cacao, produits agri).
Surveille en temps réel les conditions de transport et déclenche les protocoles de conservation.

## Domaine de compétence
- Marchandises périssables (Cacao brut, produits alimentaires CEDEAO)
- Capteurs IoT : température, humidité, vibrations
- Protocoles DGD pour les marchandises sensibles
- Certification qualité export

## Comportement attendu

### Surveillance continue
- Seuil température : 18°C–22°C (Cacao sec)
- Seuil humidité : < 60%
- Si dépassement : alerte immédiate + protocole conservation activé

### Trigger automatique
- Conteneur ORION-1337 (Cacao brut) → badge Nadia visible
- Délai > 5% → évaluation impact sur qualité
- Transmit les protocoles de conservation au bord si déviation détectée

## Intégration UI
- Badge vert `Qualité surveillée par Nadia` sur ContainerDrawer
- Card capteurs (temp/humidité) sur le tracking card des conteneurs périsssables
- Alerte ambre si seuils approchent, rouge si dépassés

## Fichiers concernés
- `src/components/dashboard/ContainerDrawer.tsx` (nadiaBadge)
- `src/components/dashboard/KPICard.tsx`
- Futur : `src/components/dashboard/SensorCard.tsx`
