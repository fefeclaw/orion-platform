# ORION API Documentation

**Version:** 1.0.0  
**Date:** 2026-03-31  
**Base URL:** `https://api.orion-ci.com` (prod) / `http://localhost:3000` (dev)

---

## 🔐 Authentification

ORION supporte l'authentification via **NextAuth Credentials** pour l'interface web,
et via **API Key** pour l'accès programmatique (offre Business uniquement).

### API Key (Business uniquement)

```http
Authorization: Bearer orion_api_{votre_clé_api}
```

### Session Web (Cookie next-auth)

Utilisé automatiquement par le navigateur après connexion.

---

## 📱 Endpoints Publics

### Tracking Colis

**Endpoint:** `GET /api/tracking/ship24`

Suivi public d'un colis par sa référence ORION (accessible sans auth).

#### Paramètres

| Paramètre | Type   | Requis | Description                        |
|-----------|--------|--------|------------------------------------|
| `ref`     | string | Oui    | Référence ORN-XX-YYYY-NNNN        |

#### Réponse 200 OK

```json
{
  "reference": "ORN-RD-2026-0042",
  "mode": "road",
  "status": "on_track",
  "origin": "Abidjan (Port Bouët)",
  "destination": "Ouagadougou",
  "eta": "2026-04-01",
  "carrier": "SahelRoute Logistics",
  "cargo": "Équipements industriels — 12T",
  "steps": [
    {
      "date": "2026-03-28 08:00",
      "location": "Port d'Abidjan",
      "status": "Départ confirmé",
      "description": "Chargement validé",
      "completed": true
    }
  ]
}
```

#### Codes d'erreur

| Code | Description                        |
|------|------------------------------------|
| 400  | Référence invalide                 |
| 404  | Colis non trouvé                   |
| 429  | Limite d'appels dépassée (Standard 50/mois) |

---

### Tarifs et Devises

**Endpoint:** `GET /api/rates`

Taux de change FCFA vis-à-vis des principales devises.

#### Réponse 200 OK

```json
{
  "base": "XOF",
  "rates": {
    "EUR": 0.001524,
    "USD": 0.001650,
    "GBP": 0.001310
  },
  "updated_at": "2026-03-31T14:30:00Z"
}
```

---

## 🔒 Endpoints Professionnels (Auth requise)

### Maritime

#### Positions AIS — Temps réel

**Endpoint:** `GET /api/maritime/ais`

Accessible:
- **Standard:** Données différées 15min
- **Business:** Temps réel

#### Paramètres

| Paramètre   | Type    | Requis | Description                        |
|-------------|---------|--------|-------------------------------------|
| `zone`      | string  | Non    | Zone géographique ("abidjan", "golfe") |
| `vesselType`| string  | Non    | Filtrer par type (container, tanker, bulk, roro) |
| `radius`    | number  | Non    | Rayon en km depuis centre zone (défaut: 50) |

#### Réponse 200 OK

```json
{
  "timestamp": "2026-03-31T14:30:00Z",
  "source": "MarineTraffic",
  "vessel_count": 15,
  "vessels": [
    {
      "mmsi": "123456789",
      "name": "AFRICA MERCHANT",
      "type": "container",
      "lat": 5.31,
      "lon": -4.02,
      "speed": 12.5,
      "course": 180,
      "destination": "Port d'Abidjan",
      "eta": "2026-04-01 08:00",
      "status": "underway"
    }
  ]
}
```

---

#### Génération B/L

**Endpoint:** `POST /api/maritime/bl/generate`

Génère un Bill of Lading digital et l'archive.

#### Headers

```http
Content-Type: application/json
Authorization: Bearer {token}
```

#### Corps de la requête

```json
{
  "bl_number": "BL-CI-2026-0042",
  "shipper": "Cacao Export CI",
  "consignee": "Europe Imports SA",
  "vessel": "AFRICA MERCHANT",
  "voyage": "AM-2026-18",
  "pol": "Abidjan",
  "pod": "Rotterdam",
  "containers": [
    {
      "number": "ABCU-123456-7",
      "type": "40HC",
      "seals": ["SEAL001", "SEAL002"],
      "cargo": "Cacao brut",
      "weight": 27000,
      "units": 1000
    }
  ],
  "incoterm": "FOB",
  "freight": "PREPAID"
}
```

#### Réponse 200 OK

```json
{
  "success": true,
  "document_id": "doc-uuid-123",
  "download_url": "/api/documents/download/doc-uuid-123",
  "expires_at": "2026-04-30T23:59:59Z"
}
```

#### Réponse 403 (Quota dépassé)

```json
{
  "error": "Quota exceeded",
  "feature": "doc_generation",
  "limit": 10,
  "used": 10,
  "reset_at": "2026-04-01 00:00:00"
}
```

---

#### Webhook AIS (Incoming)

**Endpoint:** `POST /api/maritime/webhook/ais`

Réception des positions AIS temps réel depuis fournisseurs externes.

#### Headers

```http
X-Webhook-Token: {AIS_WEBHOOK_SECRET}
Content-Type: application/json
```

#### Corps de la requête

```json
{
  "mmsi": "123456789",
  "vesselName": "AFRICA MERCHANT",
  "lat": 5.31,
  "lon": -4.02,
  "speed": 12.5,
  "course": 180,
  "timestamp": "2026-03-31T14:30:00Z",
  "source": "MarineTraffic",
  "destination": "Port d'Abidjan",
  "eta": "2026-04-01T08:00:00Z"
}
```

#### Réponse 200 OK

```json
{
  "success": true,
  "received": 1,
  "valid": 1,
  "invalid": 0
}
```

---

### Ferroviaire

#### Données Trains

**Endpoint:** `GET /api/rail/trains`

Récupère les données trains du corridor Abidjan-Ouagadougou.

#### Zones supportées

- `abidjan-ouagadougou` : Corridor principal
- `abidjan-bobo` : Section Sud
- `bobo-ouagadougou` : Section Nord

#### Réponse 200 OK

```json
{
  "trains": [
    {
      "id": "TR-ABJ-OUA-001",
      "status": "en_route",
      "progress": 65,
      "speed": 45,
      "position": {
        "lat": 6.5,
        "lon": -5.1
      },
      "stations": [
        { "name": "Abidjan", "status": "completed", "time": "06:00" },
        { "name": "Bouaké", "status": "completed", "time": "09:30" },
        { "name": "Ferkessedougou", "status": "active", "time": "14:00" },
        { "name": "Bobo-Dioulasso", "status": "pending", "time": "17:30" }
      ],
      "cargo": [
        { "type": "cacao", "weight": 150, "unit": "T" },
        { "type": "equipements", "weight": 80, "unit": "T" }
      ]
    }
  ]
}
```

---

#### Génération Lettre de Voiture

**Endpoint:** `POST /api/rail/lv/generate`

Génère une Lettre de Voiture (LV) ferroviaire.

```json
{
  "train_number": "TR-ABJ-OUA-001",
  "date": "2026-03-31",
  "shipper": "SOTRACI",
  "consignee": "SITARAIL",
  "wagon_count": 12,
  "cargo": [
    { "description": "Fûts d'acide", "weight": 45, "dangerous": true }
  ],
  "departure": "Abidjan",
  "arrival": "Ouagadougou"
}
```

---

### Routier

#### Données Camions

**Endpoint:** `GET /api/road/trucks`

Réseau CEDEAO — Positions camions et postes frontière.

#### Réponse 200 OK

```json
{
  "trucks": [
    {
      "plate": "AB-1234-IT",
      "driver": "Koné Amadou",
      "status": "en_route",
      "position": { "lat": 6.1, "lon": -5.3 },
      "route": "Abidjan → Yamoussoukro → Bouaké",
      "delay_minutes": 0,
      "next_checkpoint": "Barrage Yamoussoukro",
      "eta_next": "15:30"
    }
  ],
  "checkpoints": [
    {
      "name": "Frontière CI/BF",
      "wait_time_minutes": 45,
      "status": "normal",
      "open": true
    }
  ]
}
```

---

#### Génération Documents Routiers

**Endpoints:**
- `POST /api/road/cmr/generate` — CMR international
- `POST /api/road/bsc/generate` — Bordereau Suivi Cargaison
- `POST /api/road/trie/generate` — Transit Routier Inter-États

---

### Aérien

#### Données Vols

**Endpoint:** `GET /api/air/flights`

Hub FHB Abidjan — Vols cargo et passagers.

#### Réponse 200 OK

```json
{
  "flights": [
    {
      "flight": "AF-702",
      "airline": "Air France",
      "type": "cargo",
      "origin": "CDG",
      "scheduled": "07:10",
      "estimated": "07:10",
      "status": "landed",
      "gate": "C12",
      "cargo_weight_kg": 12500,
      "temperature_controlled": true
    }
  ]
}
```

---

#### Génération AWB

**Endpoint:** `POST /api/air/awb/generate`

Air Waybill — Lettre de transport aérien.

---

### Intermodal

#### Données Expéditions

**Endpoint:** `GET /api/intermodal/shipments`

Suivi multimodal unifié.

#### Réponse 200 OK — Expédition active

```json
{
  "shipments": [
    {
      "reference": "ORN-MT-2026-0088",
      "segments": [
        { "mode": "maritime", "status": "completed", "vessel": "MS CHICAGO" },
        { "mode": "rail", "status": "active", "train": "TR-ABJ-OUA-015" },
        { "mode": "road", "status": "pending", "estimated_start": "2026-04-02" }
      ],
      "overall_status": "on_track",
      "delay_hours": 0,
      "junctions": [
        {
          "from": "maritime",
          "to": "rail",
          "location": "Port d'Abidjan",
          "transfer_time_minutes": 180
        }
      ]
    }
  ]
}
```

---

## 📊 Endpoints Administration (Rôle Admin requis)

### Audit et Logs

**Endpoint:** `GET /api/admin/audit`

Récupère les logs d'accès et actions utilisateurs.

#### Paramètres

| Paramètre | Type   | Description                        |
|-----------|--------|------------------------------------|
| `user_id` | string | Filtrer par utilisateur            |
| `action`  | string | Type d'action (login, download, etc.) |
| `from`    | date   | Date début (ISO 8601)              |
| `to`      | date   | Date fin (ISO 8601)                |

#### Réponse 200 OK

```json
{
  "total": 156,
  "page": 1,
  "logs": [
    {
      "timestamp": "2026-03-31T14:30:00Z",
      "user_id": "USR-001",
      "action": "document_generated",
      "resource": "BL-CI-2026-0042",
      "ip": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

---

### Export Rapports

**Endpoint:** `POST /api/admin/export`

Génère des rapports Excel pour téléchargement.

#### Types de rapports

- `intermodal` — Suivi multimodal
- `maritime` — Positions navires
- `usage` — Statistiques d'utilisation
- `alerts` — Alertes et incidents

#### Exemple de requête

```json
{
  "type": "intermodal",
  "filters": {
    "from": "2026-03-01",
    "to": "2026-03-31",
    "status": ["delayed", "critical"]
  }
}
```

#### Réponse 200 OK

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="rapport-orion-2026-03.xlsx"
```

---

## ⚠️ Gestion des Erreurs

### Format d'erreur standard

```json
{
  "error": "ErrorType",
  "message": "Description lisible de l'erreur",
  "code": "ERR_CODE",
  "details": {
    "field": "value",
    "reason": "specific reason"
  }
}
```

### Codes d'erreur communs

| Code HTTP | Code ORION | Description                           |
|-----------|------------|----------------------------------------|
| 400       | INVALID_REQUEST | Requête malformée              |
| 401       | UNAUTHORIZED | Authentification requise              |
| 403       | FORBIDDEN | Accès interdit (rôle/permission)      |
| 429       | RATE_LIMITED | Quota dépassé                         |
| 500       | INTERNAL_ERROR | Erreur serveur                     |

---

## 📋 Limites et Quotas

| Plan      | Requêtes/min | Ship24/mois | Documents/mois | Stockage |
|-----------|--------------|-------------|----------------|----------|
| Gratuit   | 10           | 0           | 0              | 100MB    |
| Standard  | 60           | 50          | 10             | 1GB      |
| Business  | 300          | Illimité    | Illimité       | 10GB     |

---

## 🔄 Webhooks Sortants (Business)

ORION peut notifier vos systèmes externes via webhook.

Configuration via `POST /api/admin/webhooks`

### Événements disponibles

- `shipment.status_changed` — Changement de statut d'expédition
- `document.generated` — Document généré
- `alert.triggered` — Alerte critique déclenchée
- `vessel.eta_changed` — ETA navire modifié > 2h

### Format de webhook

```json
{
  "event": "shipment.status_changed",
  "timestamp": "2026-03-31T14:30:00Z",
  "data": {
    "reference": "ORN-RD-2026-0042",
    "old_status": "on_track",
    "new_status": "delayed",
    "reason": "Congestion poste frontière"
  }
}
```

---

## 📱 SDK et Clients

### JavaScript/TypeScript

```bash
npm install @orion-ci/sdk
```

```typescript
import { OrionClient } from '@orion-ci/sdk';

const client = new OrionClient({
  apiKey: 'orion_api_votre_clé',
  baseUrl: 'https://api.orion-ci.com'
});

// Tracking
const tracking = await client.tracking.get('ORN-RD-2026-0042');

// AIS temps réel
const vessels = await client.maritime.ais({ zone: 'abidjan' });

// Génération B/L
const bl = await client.maritime.generateBL({
  bl_number: 'BL-CI-2026-0042',
  shipper: 'Export SA',
  consignee: 'Import SA'
});
```

---

## 🔒 Sécurité

- Tous les endpoints utilisent HTTPS en production
- Les clés API doivent être conservées côté serveur
- Les documents sensibles sont chiffrés (AES-256-GCM)
- Les logs d'audit conservés 1 an (offre Business)

---

## 📞 Support

- **Email:** api-support@orion-ci.com
- **Documentation:** https://docs.orion-ci.com
- **Status:** https://status.orion-ci.com

---

**ORION Unified Logistics** — Port d'Abidjan, Côte d'Ivoire
