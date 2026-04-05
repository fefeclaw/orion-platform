/**
 * Export des rapports en format Excel (.xlsx)
 * Agent 8 — Docs & Admin (Export Excel rapports)
 * Génération côté serveur avec formatage professionnel
 */
import * as XLSX from "xlsx-js-style";

// Types de données pour l'export
type ExportData = Record<string, string | number | boolean | Date | null | undefined>[];

interface ExportOptions {
  sheetName?: string;
  title?: string;
  subtitle?: string;
  author?: string;
  date?: Date;
  columns?: { key: string; header: string; width?: number; format?: string }[];
}

/**
 * Génère un fichier Excel à partir de données JSON
 */
export function generateExcel(
  data: ExportData,
  options: ExportOptions = {}
): Buffer {
  const {
    sheetName = "Rapport",
    title = "Rapport ORION",
    subtitle = "",
    author = "ORION Logistics",
    date = new Date(),
    columns
  } = options;

  // Création du workbook
  const wb = XLSX.utils.book_new();
  
  // Préparation des lignes (tableau 2D pour xlsx)
  const rows: any[][] = [];
  
  // En-tête avec titre
  rows.push([title]);
  if (subtitle) {
    rows.push([subtitle]);
  }
  rows.push([`Généré le: ${date.toLocaleDateString("fr-FR")} par ${author}`]);
  rows.push([]); // Ligne vide
  
  // En-têtes des colonnes
  if (columns && columns.length > 0) {
    rows.push(columns.map(col => col.header));
  } else if (data.length > 0) {
    // Auto-détection des colonnes depuis les clés
    rows.push(Object.keys(data[0]));
  }
  
  // Données
  data.forEach(row => {
    if (columns && columns.length > 0) {
      rows.push(columns.map(col => {
        const value = row[col.key];
        return formatCellValue(value, col.format);
      }));
    } else {
      rows.push(Object.values(row).map(v => formatCellValue(v)));
    }
  });
  
  // Création de la feuille
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Stylisation
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "0D1220" }, patternType: "solid" },
    border: {
      top: { style: "thin", color: { rgb: "D4AF37" } },
      bottom: { style: "thin", color: { rgb: "D4AF37" } }
    }
  };
  
  const titleStyle = {
    font: { bold: true, size: 16, color: { rgb: "0D1220" } },
    fill: { fgColor: { rgb: "D4AF37" }, patternType: "solid" }
  };
  
  // Application des styles (si supporté par xlsx-js-style)
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns ? columns.length - 1 : 5 } });
  
  // Dimensions des colonnes
  if (columns) {
    ws["!cols"] = columns.map(col => ({ wch: col.width || 15 }));
  }
  
  // Ajout au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Génération du buffer
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Formate une valeur pour l'affichage Excel
 */
function formatCellValue(
  value: string | number | boolean | Date | null | undefined,
  format?: string
): string | number {
  if (value === null || value === undefined) return "";
  
  if (value instanceof Date) {
    return value.toLocaleDateString("fr-FR");
  }
  
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }
  
  if (typeof value === "number" && format === "currency") {
    return value; // Excel gère le formatage monétaire
  }
  
  return value;
}

/**
 * Export des données de suivi multimodal
 */
export function exportIntermodalReport(
  shipments: {
    reference: string;
    mode: string;
    status: string;
    origin: string;
    destination: string;
    eta: string;
    delay: number;
    carrier: string;
  }[]
): Buffer {
  return generateExcel(shipments, {
    sheetName: "Suivi Multimodal",
    title: "Rapport de Suivi Multimodal ORION",
    subtitle: `Corridor Logistique Abidjan — ${shipments.length} expéditions`,
    columns: [
      { key: "reference", header: "Référence", width: 20 },
      { key: "mode", header: "Mode", width: 15 },
      { key: "status", header: "Statut", width: 12 },
      { key: "origin", header: "Origine", width: 20 },
      { key: "destination", header: "Destination", width: 20 },
      { key: "eta", header: "ETA", width: 15 },
      { key: "delay", header: "Retard (h)", width: 12 },
      { key: "carrier", header: "Transporteur", width: 25 }
    ]
  });
}

/**
 * Export des positions navires
 */
export function exportMaritimeReport(
  vessels: {
    mmsi: string;
    name: string;
    lat: number;
    lon: number;
    speed: number;
    destination: string;
    eta: string;
  }[]
): Buffer {
  return generateExcel(vessels, {
    sheetName: "Positions Navires",
    title: "Rapport Maritimes — Positions AIS",
    subtitle: `Zone: Golfe de Guinée — ${vessels.length} navires`,
    columns: [
      { key: "mmsi", header: "MMSI", width: 12 },
      { key: "name", header: "Nom", width: 30 },
      { key: "lat", header: "Latitude", width: 12 },
      { key: "lon", header: "Longitude", width: 12 },
      { key: "speed", header: "Vitesse (kt)", width: 12 },
      { key: "destination", header: "Destination", width: 25 },
      { key: "eta", header: "ETA", width: 15 }
    ]
  });
}

/**
 * Export des statistiques d'utilisation
 */
export function exportUsageStats(
  stats: {
    user_id: string;
    plan: string;
    docs_generated: number;
    containers_tracked: number;
    month: string;
  }[]
): Buffer {
  return generateExcel(stats, {
    sheetName: "Statistiques",
    title: "Rapport d'Utilisation ORION",
    columns: [
      { key: "month", header: "Mois", width: 12 },
      { key: "user_id", header: "Utilisateur", width: 20 },
      { key: "plan", header: "Plan", width: 12 },
      { key: "docs_generated", header: "Docs Générés", width: 14 },
      { key: "containers_tracked", header: "Conteneurs Tracés", width: 18 }
    ]
  });
}

/**
 * Export des alertes et incidents
 */
export function exportAlertsReport(
  alerts: {
    date: string;
    type: string;
    severity: string;
    vessel: string;
    message: string;
    resolved: boolean;
  }[]
): Buffer {
  return generateExcel(alerts, {
    sheetName: "Alertes",
    title: "Rapport des Alertes et Incidents",
    subtitle: `Période: ${new Date().toLocaleDateString("fr-FR")}`,
    columns: [
      { key: "date", header: "Date", width: 18 },
      { key: "type", header: "Type", width: 18 },
      { key: "severity", header: "Sévérité", width: 12 },
      { key: "vessel", header: "Navire", width: 25 },
      { key: "message", header: "Message", width: 50 },
      { key: "resolved", header: "Résolu", width: 10 }
    ]
  });
}
