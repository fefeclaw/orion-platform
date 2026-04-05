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
  { id: "ABJ", name: "Port Autonome d'Abidjan", lat: 5.3083,  lng: -3.9780 },  // Terminal à conteneurs, rive nord
  { id: "LOS", name: "Port de Lagos",           lat: 6.4474,  lng:  3.3553 },  // Apapa Port
  { id: "DKR", name: "Port de Dakar",           lat: 14.6879, lng: -17.4337 }, // Quai Port de Dakar
  { id: "TEM", name: "Port de Tema",            lat: 5.6333,  lng:  0.0167  }, // Port de Tema (corrigé : était 3,3 km au sud dans l'océan)
  { id: "CTN", name: "Port de Cotonou",         lat: 6.3536,  lng:  2.4197  }, // Port de Cotonou
];

// ─── Couleurs statut ──────────────────────────────────────────────────────────
const STATUS_COLOR: Record<Vessel["status"], string> = {
  berth:   "#10B981",
  transit: "#0EA5E9",
  alert:   "#EF4444",
};

// ─── Routes commerciales ──────────────────────────────────────────────────────
const TRADE_ROUTES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [3.3553, 6.4474]] }, properties: {} },  // ABJ → LOS
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [-17.4337, 14.6879]] }, properties: {} }, // ABJ → DKR
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [0.0167, 5.6333]] }, properties: {} },   // ABJ → TEM
    { type: "Feature", geometry: { type: "LineString", coordinates: [[3.3553, 6.4474], [2.4197, 6.3536]] }, properties: {} },   // LOS → CTN
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-17.4337, 14.6879], [-7.59, 33.59]] }, properties: {} },   // DKR → Europe
    { type: "Feature", geometry: { type: "LineString", coordinates: [[-3.9780, 5.3083], [-25.0, 22.0], [-43.18, -22.91]] }, properties: {} }, // ABJ → Brésil
  ],
};

// ─── Icônes type navire (emoji + label) ──────────────────────────────────────
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
// Taille cercle (rayon) selon le type de navire
const CARGO_TYPE_RADIUS: Record<string, number> = {
  container: 9,
  tanker:    8,
  bulk:      7,
  roro:      6,
  general:   5,
};
// Couleur stroke selon le type
const CARGO_TYPE_STROKE: Record<string, string> = {
  container: "#22d3ee",  // cyan   — porte-conteneurs
  tanker:    "#fb923c",  // orange — pétrolier
  bulk:      "#facc15",  // jaune  — vraquier
  roro:      "#818cf8",  // violet — roulier
  general:   "#d1d5db",  // gris   — cargo général
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

function createPortMarker(id: string, color = "#F59E0B") {
  const el = document.createElement("div");
  el.style.cssText = `position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;`;
  el.innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;border:1.5px solid ${color}60;animation:orion-port-pulse 2.5s ease-in-out infinite;"></div>
    <div style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color}cc,0 0 20px ${color}44;"></div>
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

  const [activeStyle,  setActiveStyle]  = useState<MapStyle>("satellite");
  const [internalIs3D, setInternalIs3D] = useState(false);
  const [showRoutes,   setShowRoutes]   = useState(true);

  // Sync external is3D prop
  const effective3D = is3D !== undefined ? is3D : internalIs3D;

  // ─── Ajouter les layers custom après chargement du style ──────────────────
  const addCustomLayers = useCallback((map: maplibregl.Map) => {
    // Routes
    if (!map.getSource("orion-routes")) {
      map.addSource("orion-routes", { type: "geojson", data: TRADE_ROUTES });
    }
    if (!map.getLayer("orion-routes-glow")) {
      map.addLayer({ id: "orion-routes-glow", type: "line", source: "orion-routes",
        paint: { "line-color": "#0EA5E9", "line-opacity": 0.15, "line-width": 8, "line-blur": 6 } });
    }
    if (!map.getLayer("orion-routes-line")) {
      map.addLayer({ id: "orion-routes-line", type: "line", source: "orion-routes",
        paint: { "line-color": "#0EA5E9", "line-opacity": 0.4, "line-width": 1.5, "line-dasharray": [3, 5] } });
    }

    // Navires
    if (!map.getSource("orion-vessels")) {
      map.addSource("orion-vessels", { type: "geojson", data: buildVesselGeoJSON(vesselDataRef.current) });
    }
    if (!map.getLayer("orion-vessels-halo")) {
      map.addLayer({ id: "orion-vessels-halo", type: "circle", source: "orion-vessels",
        filter: ["==", ["get", "status"], "alert"],
        paint: { "circle-radius": 18, "circle-color": "#EF4444", "circle-opacity": 0.12 } });
    }
    if (!map.getLayer("orion-vessels-circle")) {
      map.addLayer({ id: "orion-vessels-circle", type: "circle", source: "orion-vessels",
        paint: {
          // Rayon variable : taille selon type de navire (container > tanker > bulk > roro > general)
          "circle-radius": ["match", ["get", "cargoType"],
            "container", 9,
            "tanker",    8,
            "bulk",      7,
            "roro",      6,
            5  // general (défaut)
          ],
          // Couleur de remplissage selon le statut opérationnel
          "circle-color": ["match", ["get", "status"],
            "berth", "#10B981",
            "alert", "#EF4444",
            "#0EA5E9"  // transit (défaut)
          ],
          // Épaisseur du contour selon le statut
          "circle-stroke-width": ["case", ["==", ["get", "status"], "alert"], 2.5, 1.8],
          // Couleur du contour selon le TYPE de navire (permet différenciation visuelle)
          "circle-stroke-color": ["case",
            ["==", ["get", "status"], "alert"], "rgba(255,100,100,0.8)",
            ["match", ["get", "cargoType"],
              "container", "#22d3ee",
              "tanker",    "#fb923c",
              "bulk",      "#facc15",
              "roro",      "#818cf8",
              "rgba(255,255,255,0.5)"  // general
            ]
          ],
        },
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
      // Démarre avec le style satellite (spec en mémoire, ArcGIS, fiable sans dépendance externe).
      // Si on démarre avec DARK_STYLE_URL et que Carto échoue, "load" ne se déclenche jamais → 0 navire.
      style: SATELLITE_STYLE,
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

    map.on("error", (e) => {
      console.warn("[MaritimeMapGL] Erreur style/tile, fallback satellite:", e.error?.message ?? e);
      if (mapRef.current && !mapRef.current.getSource("orion-vessels")) {
        try { mapRef.current.setStyle(SATELLITE_STYLE); } catch { /* ignore */ }
      }
    });

    map.on("load", () => {
      applyMapMeta(map, "satellite");
      addCustomLayers(map);

      // Smooth fly-in vers West Africa
      setTimeout(() => {
        map.flyTo({ center: [-2.5, 7.5], zoom: 4.8, duration: 3500, essential: true,
          easing: (t) => 1 - Math.pow(1 - t, 3) });
      }, 600);

      // Ports
      PORTS.forEach((port) => {
        const el = createPortMarker(port.id);
        const m = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([port.lng, port.lat])
          .setPopup(new maplibregl.Popup({ offset: 20, closeButton: false, className: "orion-popup" })
            .setHTML(`<div style="font-family:monospace;font-size:11px;padding:2px">
              <div style="font-weight:700;color:#F59E0B;letter-spacing:.06em">${port.id}</div>
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

      // Pulse halo animation
      let pulse = 0;
      const animatePulse = () => {
        pulse = (pulse + 1) % 100;
        const opacity = 0.06 + Math.sin((pulse / 100) * Math.PI * 2) * 0.12;
        const radius  = 15 + Math.sin((pulse / 100) * Math.PI * 2) * 6;
        if (map.getLayer("orion-vessels-halo")) {
          map.setPaintProperty("orion-vessels-halo", "circle-opacity", opacity);
          map.setPaintProperty("orion-vessels-halo", "circle-radius", radius);
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
                  color: active ? "#22d3ee" : "rgba(255,255,255,0.35)",
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
              color: showRoutes ? "#22d3ee" : "rgba(255,255,255,0.3)",
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
                      color: active ? "#22d3ee" : "rgba(255,255,255,0.3)",
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
