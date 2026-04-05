# Scripts ORION

## test-sms.ts
Script de test pour l'envoi SMS Orange CI.

### Prérequis
1. Configurer les variables dans `.env.local`:
   - `ORANGE_SMS_CLIENT_ID`
   - `ORANGE_SMS_CLIENT_SECRET`
   - `ORANGE_SMS_FROM`

2. Installer dotenv:
```bash
npm install dotenv
```

### Usage
```bash
npx ts-node scripts/test-sms.ts +2250141424243
```

### Message de test
Le script envoie un message de test simulant un colis arrivé à la douane:
> ORION: Votre colis ORN-ROU-2026-TEST est arrivé à la douane de Pô. Présentez-vous avec vos documents.

### Résultat attendu
- ✅ SMS envoyé avec succès
- 📱 Réception sous 5-10s sur le numéro +225

---

## test-subscriptions.ts
À venir...
