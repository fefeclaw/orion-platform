"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SkySpecification } from "@maplibre/maplibre-gl-style-spec";
import type { Vessel } from "@/hooks/useMaritimeData";
import { Layers, Satellite, Map, Route } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type MapStyle = "satellite" | "dark" | "plan";

// ─── Styles MapLibre ─────────────────────────────────────────────────────────
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sprite: "https://demotiles.maplibre.org/sprite",
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri, DigitalGlobe",
    },
  },
  layers: [{ id: "satellite-bg", type: "raster", source: "esri", paint: { "raster-opacity": 1 } }],
};

const DARK_STYLE_URL   = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const PLAN_STYLE_URL   = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// ─── Couleurs ORION Maritime ────────────────────────────────────────────────
const ORION_COLORS = {
  // Accents principaux
  maritime: {
    primary: "#38bdf8",      // cyan-400 — accent maritime
    secondary: "#0284c7",   // sky-600 — hover/actif
    glow: "rgba(56,189,248,0.4)",
  },
  gold: {
    primary: "#D4AF37",      // or — ports, accents premium
    glow: "rgba(212,175,55,0.4)",
  },
  status: {
    berth: "#10B981",        // émeraude — à quai
    transit: "#38bdf8",      // cyan — en transit (aligné maritime)
    alert: "#EF4444",        // rouge — alerte
  },
  cargo: {
    container: "#22d3ee",     // cyan-400 — porte-conteneurs (maritime)
    tanker: "#fb923c",      // orange — pétrolier
    bulk: "#facc15",        // jaune — vraquier
    roro: "#a78bfa",        // violet — roulier
    general: "#94a3b8",     // slate-400 — cargo général
  },
  map: {
    bg: "#030712",           // slate-950 — fond
    panel: "rgba(6,14,26,0.95)",
    border: "rgba(56,189,248,0.15)",
    text: "#F3F4F6",
    textMuted: "rgba(255,255,255,0.4)",
  }
};

// ─── Sky/Atmosphère par style ─────────────────────────────────────────────────
const SKY: Record<MapStyle, SkySpecification> = {
  satellite: {
    "sky-color": "#000814",
    "horizon-color": "#001a3a",
    "fog-color": "#001020",
    "fog-ground-blend": 0.9,
    "horizon-fog-blend": 0.4,
    "sky-horizon-blend": 0.6,
    "atmosphere-blend": 0.95,
  },
  dark: {
    "sky-color": "#050a1e",
    "horizon-color": "#0a1432",
    "fog-color": "#050a18",
    "fog-ground-blend": 0.9,
    "horizon-fog-blend": 0.3,
    "sky-horizon-blend": 0.5,
    "atmosphere-blend": 0.85,
  },
  plan: {
    "sky-color": "#c8dcf0",
    "horizon-color": "#e8f0f8",
    "fog-color": "#d0e4f4",
    "fog-ground-blend": 0.8,
    "horizon-fog-blend": 0.5,
    "sky-horizon-blend": 0.6,
    "atmosphere-blend": 0.6,
  },
};

// ─── Ports ────────────────────────────────────────────────────────────────────
const PORTS = [
  { id: "ABJ", name: "Port Autonome d'Abidjan", lat: 5.3083,  lng: -3.9780, importance: "major" },
  { id: "LOS", name: "Port de Lagos",           lat: 6.4474,  lng:  3.3553, importance: "major" },
  { id: "DKR", name: "Port de Dakar",           lat: 14.6879, lng: -17.4337, importance: "major" },
  { id: "TEM", name: "Port de Tema",            lat: 5.6333,  lng:  0.0167,  importance: "major" },
  { id: "CTN", name: "Port de Cotonou",         lat: 6.3536,  lng:  2.4197,  importance: "medium" },
  { id: "SYC", name: "San Pedro",               lat: 4.7500,  lng: -6.6333,  importance: "minor" },
];

// ─── Couleurs statut ──────────────────────────────────────────────────────────
const STATUS_COLOR: Record<Vessel["status"], string> = {
  berth:   ORION_COLORS.status.berth,
  transit: ORION_COLORS.status.transit,
  alert:   ORION_COLORS.status.alert,
};

// ─── Routes commerciales — couleurs harmonisées ─────────────────────────────
const TRADE_ROUTES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [3.3553, 6.4474]] }, properties: { importance: "major" } },  // ABJ → LOS
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [-17.4337, 14.6879]] }, properties: { importance: "major" } }, // ABJ → DKR
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [0.0167, 5.6333]] }, properties: { importance: "major" } },   // ABJ → TEM
    { type: "Feature", geometry: { type: "LineString", coordinates: [[3.3553, 6.4474], [2.4197, 6.3536]] }, properties: { importance: "medium" } },   // LOS → CTN
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-17.4337, 14.6879], [-7.59, 33.59]] }, properties: { importance: "international" } },   // DKR → Europe
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [-25.0, 22.0], [-43.18, -22.91]] }, properties: { importance: "transatlantic" } }, // ABJ → Brésil
  ],
};

// ─── Couleurs type navire (harmonisées ORION) ─────────────────────────────────
const CARGO_TYPE_ICON: Record<string, string> = {
  container: "⊞",
  tanker:    "◉", 
  bulk:      "◎",
  roro:      "▶",
  general:   "◈",
};
const CARGO_TYPE_LABEL: Record<string, string> = {
  container: "Porte-conteneurs",
  tanker:    "Pétrolier / Tanker",
  bulk:      "Vraquier",
  roro:      "Roulier (RoRo)",
  general:   "Cargo général",
};
// Taille cercle (rayon) selon le type — ajusté pour meilleure visibilité
const CARGO_TYPE_RADIUS: Record<string, number> = {
  container: 10,
  tanker:     9,
  bulk:       8,
  roro:       7,
  general:    6,
};
// Couleurs harmonisées ORION Maritime
const CARGO_TYPE_STROKE: Record<string, string> = {
  container: ORION_COLORS.cargo.container,  // cyan
  tanker:    ORION_COLORS.cargo.tanker,     // orange
  bulk:      ORION_COLORS.cargo.bulk,       // jaune
  roro:      ORION_COLORS.cargo.roro,       // violet
  general:   ORION_COLORS.cargo.general,    // slate
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildVesselGeoJSON(vessels: Vessel[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vessels.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
      properties: { ...v, cargoType: v.cargoType ?? "general" },
    })),
  };
}

function createPortMarker(id: string, importance: "major" | "medium" | "minor" = "medium") {
  const color = importance === "major" ? ORION_COLORS.gold.primary : "#64748b";
  const size = importance === "major" ? "10px" : "6px";
  const pulseScale = importance === "major" ? "3" : "2";
  const el = document.createElement("div");
  el.style.cssText = `position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;`;
  el.innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color}${importance === "major" ? "60" : "40"};animation:orion-port-pulse 2.5s ease-in-out infinite;"></div>
    ${importance === "major" ? `<div style="position:absolute;inset:0;border-radius:50%;border:1px solid ${color}30;animation:orion-port-pulse 2.5s ease-in-out infinite 0.5s;"></div>` : ""}
    <div style="width:${size};height:${size};border-radius:50%;background:${color};box-shadow:0 0 12px ${color}cc,0 0 24px ${color}44;"></div>
    <span style="position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%);font-size:9px;font-weight:800;color:${color};letter-spacing:.1em;white-space:nowrap;text-shadow:0 0 8px #00000099;">${id}</span>
  `;
  return el;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MaritimeMapGLProps {
  vessels: Vessel[];
  onVesselClick?: (vessel: Vessel) => void;
  is3D?: boolean; // pitch control from parent (optional — map also has internal toggle)
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function MaritimeMapGL({ vessels, onVesselClick, is3D }: MaritimeMapGLProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<maplibregl.Map | null>(null);
  const frameRef       = useRef<number>(0);
  const portMarkersRef = useRef<maplibregl.Marker[]>([]);
  const vesselDataRef  = useRef<Vessel[]>(vessels);

  const [activeStyle,  setActiveStyle]  = useState<MapStyle>("dark");
  const [internalIs3D, setInternalIs3D] = useState(false);
  const [showRoutes,   setShowRoutes]   = useState(true);

  // Sync external is3D prop
  const effective3D = is3D !== undefined ? is3D : internalIs3D;

  // ─── Ajouter les layers custom après chargement du style ──────────────────
  const addCustomLayers = useCallback((map: maplibregl.Map) => {
    // Routes commerciales — avec style selon importance
    if (!map.getSource("orion-routes")) {
      map.addSource("orion-routes", { type: "geojson", data: TRADE_ROUTES });
    }
    // Glow externe pour routes majeures
    if (!map.getLayer("orion-routes-glow-outer")) {
      map.addLayer({ 
        id: "orion-routes-glow-outer", 
        type: "line", 
        source: "orion-routes",
        filter: ["in", ["get", "importance"], ["literal", ["major", "transatlantic"]]],
        paint: { 
          "line-color": ORION_COLORS.maritime.primary, 
          "line-opacity": 0.08, 
          "line-width": 10, 
          "line-blur": 8 
        } 
      });
    }
    if (!map.getLayer("orion-routes-glow")) {
      map.addLayer({ 
        id: "orion-routes-glow", 
        type: "line", 
        source: "orion-routes",
        paint: { 
          "line-color": ORION_COLORS.maritime.primary, 
          "line-opacity": 0.12, 
          "line-width": 5, 
          "line-blur": 4 
        } 
      });
    }
    if (!map.getLayer("orion-routes-line")) {
      map.addLayer({ 
        id: "orion-routes-line", 
        type: "line", 
        source: "orion-routes",
        paint: { 
          "line-color": ORION_COLORS.maritime.primary, 
          "line-opacity": 0.5, 
          "line-width": 1.5, 
          "line-dasharray": [3, 5] 
        } 
      });
    }

    // NAVIRES — couches améliorées pour visibilité
    if (!map.getSource("orion-vessels")) {
      map.addSource("orion-vessels", { type: "geojson", data: buildVesselGeoJSON(vesselDataRef.current) });
    }

    // Halo externe pulsé pour ALERTES (rouge)
    if (!map.getLayer("orion-vessels-halo-outer")) {
      map.addLayer({ 
        id: "orion-vessels-halo-outer", 
        type: "circle", 
        source: "orion-vessels",
        filter: ["==", ["get", "status"], "alert"],
        paint: { 
          "circle-radius": 22, 
          "circle-color": ORION_COLORS.status.alert, 
          "circle-opacity": 0.06,
          "circle-blur": 3
        } 
      });
    }

    // Halo interne alerte
    if (!map.getLayer("orion-vessels-halo")) {
      map.addLayer({ 
        id: "orion-vessels-halo", 
        type: "circle", 
        source: "orion-vessels",
        filter: ["==", ["get", "status"], "alert"],
        paint: { 
          "circle-radius": 14, 
          "circle-color": ORION_COLORS.status.alert, 
          "circle-opacity": 0.15,
          "circle-blur": 1
        } 
      });
    }

    // Cercles principaux navires — VISIBILITÉ AMÉLIORÉE
    if (!map.getLayer("orion-vessels-circle")) {
      map.addLayer({ 
        id: "orion-vessels-circle", 
        type: "circle", 
        source: "orion-vessels",
        paint: {
          // Rayon variable selon type
          "circle-radius": [
            "match", ["get", "cargoType"],
            "container", CARGO_TYPE_RADIUS.container,
            "tanker",    CARGO_TYPE_RADIUS.tanker,
            "bulk",      CARGO_TYPE_RADIUS.bulk,
            "roro",      CARGO_TYPE_RADIUS.roro,
            CARGO_TYPE_RADIUS.general
          ],
          // Couleur selon statut — opacité augmentée
          "circle-color": [
            "match", ["get", "status"],
            "berth",   ORION_COLORS.status.berth,
            "alert",   ORION_COLORS.status.alert,
            ORION_COLORS.status.transit
          ],
          "circle-opacity": 0.95,
          // Bordure épaisse et visible
          "circle-stroke-width": [
            "case", 
            ["==", ["get", "status"], "alert"], 3, 
            2.5
          ],
          // Couleur bordure selon TYPE avec fallback
          "circle-stroke-color": [
            "case",
            ["==", ["get", "status"], "alert"], "rgba(255,100,100,0.9)",
            [
              "match", ["get", "cargoType"],
              "container", CARGO_TYPE_STROKE.container,
              "tanker",    CARGO_TYPE_STROKE.tanker,
              "bulk",      CARGO_TYPE_STROKE.bulk,
              "roro",      CARGO_TYPE_STROKE.roro,
              CARGO_TYPE_STROKE.general
            ]
          ],
          "circle-stroke-opacity": 0.9,
        },
      });
    }

    // Points centraux blancs pour contraste
    if (!map.getLayer("orion-vessels-dot")) {
      map.addLayer({ 
        id: "orion-vessels-dot", 
        type: "circle", 
        source: "orion-vessels",
        paint: { 
          "circle-radius": 3, 
          "circle-color": "#ffffff", 
          "circle-opacity": 0.9 
        } 
      });
    }
  }, []);

  // ─── Appliquer fog + projection ───────────────────────────────────────────
  const applyMapMeta = useCallback((map: maplibregl.Map, style: MapStyle) => {
    try { map.setSky(SKY[style]); } catch { /* ignore if not supported */ }
    try { map.setProjection({ type: "globe" }); } catch { /* ignore if not supported */ }
  }, []);

  // ─── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE_URL,
      center: [-2.5, 7.5],
      zoom: 1.8, // Start zoomed out to see globe
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "nautical" }), "bottom-left");
    mapRef.current = map;

    // Hover popup
    const popup = new maplibregl.Popup({
      closeButton: false, closeOnClick: false,
      className: "orion-popup", offset: 14, maxWidth: "230px",
    });

    map.on("load", () => {
      applyMapMeta(map, "dark");
      addCustomLayers(map);

      // Smooth fly-in vers West Africa
      setTimeout(() => {
        map.flyTo({ center: [-2.5, 7.5], zoom: 4.8, duration: 3500, essential: true,
          easing: (t) => 1 - Math.pow(1 - t, 3) });
      }, 600);

      // Ports — avec importance
      PORTS.forEach((port) => {
        const el = createPortMarker(port.id, (port.importance as "major" | "medium" | "minor") || "medium");
        const color = port.importance === "major" ? ORION_COLORS.gold.primary : "#64748b";
        const m = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([port.lng, port.lat])
          .setPopup(new maplibregl.Popup({ offset: 20, closeButton: false, className: "orion-popup" })
            .setHTML(`<div style="font-family:monospace;font-size:11px;padding:2px">
              <div style="font-weight:700;color:${color};letter-spacing:.06em">${port.id}</div>
              <div style="color:#9CA3AF;margin-top:3px">${port.name}</div>
            </div>`))
          .addTo(map);
        portMarkersRef.current.push(m);
      });

      // Curseur
      map.on("mouseenter", "orion-vessels-circle", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "orion-vessels-circle", () => { map.getCanvas().style.cursor = ""; });

      // Hover vessel
      map.on("mousemove", "orion-vessels-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as Record<string, string>;
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
        const color      = STATUS_COLOR[p.status as Vessel["status"]] ?? "#0EA5E9";
        const statusLabel = p.status === "berth" ? "À quai" : p.status === "alert" ? "En alerte" : "En transit";
        const typeIcon   = CARGO_TYPE_ICON[p.cargoType ?? "general"]  ?? "◈";
        const typeLabel  = CARGO_TYPE_LABEL[p.cargoType ?? "general"] ?? "Cargo général";
        const strokeClr  = CARGO_TYPE_STROKE[p.cargoType ?? "general"] ?? "#d1d5db";
        popup.setLngLat(coords).setHTML(`
          <div style="font-family:monospace;font-size:11px;line-height:1.6;padding:2px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="font-size:14px;color:${strokeClr};line-height:1">${typeIcon}</span>
              <div>
                <div style="font-size:12px;font-weight:700;color:#F3F4F6">${p.name}</div>
                <div style="color:#6B7280;font-size:10px">${p.flag ?? "—"} · IMO ${p.imo}</div>
              </div>
            </div>
            <div style="color:${strokeClr};font-size:10px;margin-bottom:3px">${typeLabel}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};display:inline-block"></span>
              <span style="color:${color};font-weight:600">${statusLabel}</span>
            </div>
            <div style="color:#6B7280;margin-top:2px">${p.destination} · ${p.speed} kn</div>
          </div>`).addTo(map);
      });
      map.on("mouseleave", "orion-vessels-circle", () => popup.remove());

      // Click vessel
      map.on("click", "orion-vessels-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat || !onVesselClick) return;
        const p = feat.properties as Record<string, unknown>;
        onVesselClick({
          id: String(p.id), name: String(p.name), imo: String(p.imo ?? "—"),
          type: String(p.type ?? "—"), flag: String(p.flag ?? "—"),
          lat: Number(p.lat), lng: Number(p.lng),
          speed: Number(p.speed ?? 0), heading: Number(p.heading ?? 0),
          status: p.status as Vessel["status"],
          destination: String(p.destination ?? "—"), eta: String(p.eta ?? "—"),
          lastUpdate: String(p.lastUpdate ?? "—"),
        });
      });

      // Pulse halo animation — améliorée pour halo double
      let pulse = 0;
      const animatePulse = () => {
        pulse = (pulse + 1) % 100;
        const opacityInner = 0.08 + Math.sin((pulse / 100) * Math.PI * 2) * 0.1;
        const radiusInner  = 14 + Math.sin((pulse / 100) * Math.PI * 2) * 5;
        const opacityOuter = 0.04 + Math.sin(((pulse + 30) / 100) * Math.PI * 2) * 0.06;
        const radiusOuter  = 22 + Math.sin(((pulse + 30) / 100) * Math.PI * 2) * 8;
        
        if (map.getLayer("orion-vessels-halo")) {
          map.setPaintProperty("orion-vessels-halo", "circle-opacity", opacityInner);
          map.setPaintProperty("orion-vessels-halo", "circle-radius", radiusInner);
        }
        if (map.getLayer("orion-vessels-halo-outer")) {
          map.setPaintProperty("orion-vessels-halo-outer", "circle-opacity", opacityOuter);
          map.setPaintProperty("orion-vessels-halo-outer", "circle-radius", radiusOuter);
        }
        frameRef.current = requestAnimationFrame(animatePulse);
      };
      frameRef.current = requestAnimationFrame(animatePulse);
    });

    // Re-add layers après changement de style
    map.on("style.load", () => {
      applyMapMeta(map, activeStyle);
      addCustomLayers(map);
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      portMarkersRef.current.forEach(m => m.remove());
      portMarkersRef.current = [];
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Mise à jour vessels ──────────────────────────────────────────────────
  useEffect(() => {
    vesselDataRef.current = vessels;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("orion-vessels") as maplibregl.GeoJSONSource | undefined;
    src?.setData(buildVesselGeoJSON(vessels));
  }, [vessels]);

  // ─── Changement de style ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const newStyle = activeStyle === "satellite" ? SATELLITE_STYLE
      : activeStyle === "plan" ? PLAN_STYLE_URL : DARK_STYLE_URL;
    map.setStyle(newStyle as string | maplibregl.StyleSpecification);
  }, [activeStyle]);

  // ─── Visibilité routes ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const vis = showRoutes ? "visible" : "none";
    ["orion-routes-glow", "orion-routes-line"].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
    });
  }, [showRoutes]);

  // ─── Toggle 2D / 3D ──────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.easeTo({
      pitch:   effective3D ? 55  : 0,
      bearing: effective3D ? -12 : 0,
      duration: 1200,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });
  }, [effective3D]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Styles globaux ── */}
      <style>{`
        .orion-popup .maplibregl-popup-content {
          background: rgba(5, 10, 22, 0.97) !important;
          border: 1px solid rgba(14, 165, 233, 0.22) !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.08) !important;
          color: #F3F4F6;
          backdrop-filter: blur(12px);
        }
        .orion-popup .maplibregl-popup-tip { display: none; }
        @keyframes orion-port-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%       { transform: scale(2.2); opacity: 0.06; }
        }
        .maplibregl-ctrl-bottom-right { bottom: 56px !important; }
        .maplibregl-ctrl-bottom-left  { bottom: 56px !important; }
        .maplibregl-ctrl-attrib       { display: none !important; }
        .maplibregl-canvas             { outline: none; }
      `}</style>

      {/* ── Canvas carte ── */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Style Switcher — bottom-left ── */}
      <div
        className="absolute bottom-14 left-4 z-20 flex flex-col gap-2"
      >
        {/* Style selector */}
        <div
          className="flex rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(5, 10, 22, 0.88)",
            border: "1px solid rgba(14, 165, 233, 0.16)",
            backdropFilter: "blur(14px)",
          }}
        >
          {(
            [
              { key: "satellite" as MapStyle, label: "Satellite", Icon: Satellite },
              { key: "dark"      as MapStyle, label: "Sombre",    Icon: Map },
              { key: "plan"      as MapStyle, label: "Plan",      Icon: Map },
            ] as { key: MapStyle; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ key, label, Icon }, i) => {
            const active = activeStyle === key;
            return (
              <button
                key={key}
                onClick={() => setActiveStyle(key)}
                title={label}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: active ? "rgba(14, 165, 233, 0.22)" : "transparent",
                  color: active ? "#38bdf8" : "rgba(255,255,255,0.35)",
                  borderLeft: i > 0 ? "1px solid rgba(14,165,233,0.12)" : undefined,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Routes toggle + 2D/3D */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoutes(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1"
            style={{
              background: showRoutes ? "rgba(14,165,233,0.14)" : "rgba(5,10,22,0.82)",
              border: `1px solid ${showRoutes ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.09)"}`,
              color: showRoutes ? "#38bdf8" : "rgba(255,255,255,0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Route className="h-3.5 w-3.5" />
            Routes
          </button>

          {/* 2D/3D interne */}
          {is3D === undefined && (
            <div
              className="flex rounded-lg overflow-hidden"
              style={{
                background: "rgba(5,10,22,0.88)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Layers className="h-3.5 w-3.5 self-center ml-2 text-white/25" />
              {(["2D", "3D"] as const).map((m) => {
                const active = (m === "3D") === internalIs3D;
                return (
                  <button key={m} onClick={() => setInternalIs3D(m === "3D")}
                    className="px-2.5 py-1.5 text-xs font-bold transition-all"
                    style={{
                      background: active ? "rgba(14,165,233,0.22)" : "transparent",
                      color: active ? "#38bdf8" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
