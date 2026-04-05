#!/bin/bash
# Script d'exécution des tests de charge ORION
# Usage: ./run-all-tests.sh [base_url]

set -e

BASE_URL="${1:-http://localhost:3000}"
API_TOKEN="${2:-}"

echo "═══════════════════════════════════════════════════"
echo "  ORION Load Testing Suite - k6"
echo "═══════════════════════════════════════════════════"
echo ""
echo "BASE_URL: $BASE_URL"
echo "API_TOKEN: ${API_TOKEN:+✅ Configuré}${API_TOKEN:-❌ Non configuré}"
echo ""

# Vérifier que k6 est installé
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 n'est pas installé"
    echo ""
    echo "Installation options:"
    echo "  1. Docker: docker pull grafana/k6"
    echo "  2. Snap: sudo snap install k6"
    echo "  3. Download: https://k6.io/docs/get-started/installation/"
    echo ""
    echo "Utilisation avec Docker:"
    echo "  docker run -v \$(pwd):/tests grafana/k6 run /tests/tracking-load-test.js"
    exit 1
fi

# Vérifier que le serveur est up
echo "🔍 Vérification du serveur..."
if ! curl -s "$BASE_URL/api/admin/health" > /dev/null 2>&1; then
    echo "⚠️  Serveur non disponible sur $BASE_URL"
    echo "   Assurez-vous que le serveur est démarré:"
    echo "   npm run dev"
    echo ""
    read -p "Continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Prêt pour les tests"
echo ""

# Création du dossier de résultats
mkdir -p ./k6-results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Test 1: Tracking API (Complet - 19 min)
echo "═══════════════════════════════════════════════════"
echo "  Test 1: Tracking Public API (19 minutes)"
echo "═══════════════════════════════════════════════════"
k6 run \
  --out json=./k6-results/tracking_${TIMESTAMP}.json \
  --summary-export=./k6-results/tracking_summary_${TIMESTAMP}.json \
  --env BASE_URL="$BASE_URL" \
  ./tracking-load-test.js || echo "⚠️  Test 1 terminé avec erreurs"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Test 2: API Professionnelles (13 minutes)"
echo "═══════════════════════════════════════════════════"
k6 run \
  --out json=./k6-results/professional_${TIMESTAMP}.json \
  --summary-export=./k6-results/professional_summary_${TIMESTAMP}.json \
  --env BASE_URL="$BASE_URL" \
  --env API_TOKEN="$API_TOKEN" \
  ./professional-api-test.js || echo "⚠️  Test 2 terminé avec erreurs"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Test 3: Stress Test - Spike (3 minutes)"
echo "═══════════════════════════════════════════════════"
k6 run \
  --out json=./k6-results/stress_${TIMESTAMP}.json \
  --summary-export=./k6-results/stress_summary_${TIMESTAMP}.json \
  --env BASE_URL="$BASE_URL" \
  ./stress-test.js || echo "⚠️  Test 3 terminé avec erreurs"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Tests de charge terminés"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Résultats disponibles dans: ./k6-results/"
ls -la ./k6-results/ | grep "$TIMESTAMP"
