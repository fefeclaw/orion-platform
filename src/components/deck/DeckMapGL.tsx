"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type DeckType = "rail" | "road" | "air";

export interface DeckAsset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "active" | "delayed" | "stopped";
  info: string;   // vitesse kn / vitesse km/h / altitude ft
}

interface DeckMapGLProps {
  deck: DeckType;
  assets: DeckAsset[];
  is3D: boolean;
  onAssetClick?: (asset: DeckAsset) => void;
}

// ─── Config par deck ─────────────────────────────────────────────────────────
const DECK_CONFIG = {
  rail: {
    center: [-3.5, 10.5] as [number, number],
    zoom: 5.2,
    color: "#f87171",
    routes: [
      // Corridor Abidjan → Ouagadougou (SITARAIL)
      [[-3.99, 5.35], [-3.60, 6.50], [-2.80, 7.90], [-1.62, 9.25], [-0.48, 10.44], [-0.15, 11.10], [-1.52, 12.36]],
      // Ouagadougou → Bamako (projeté)
      [[-1.52, 12.36], [-3.00, 12.65], [-4.00, 13.50], [-6.00, 13.25], [-8.00, 12.65]],
    ],
    hubs: [
      { id: "ABJ-GARE", name: "Gare d'Abidjan", lat: 5.35,  lng: -3.99 },
      { id: "BKF-GARE", name: "Gare Bouaké",    lat: 7.69,  lng: -5.04 },
      { id: "OUA-GARE", name: "Gare Ouagadougou", lat: 12.36, lng: -1.52 },
      { id: "BKO-GARE", name: "Gare Bamako",    lat: 12.65, lng: -8.00 },
    ],
    hubLabel: "GARE",
    routeLabel: "Corridor ferroviaire SITARAIL",
  },
  road: {
    center: [-4.5, 8.0] as [number, number],
    zoom: 5.0,
    color: "#34d399",
    routes: [
      // RN1 Abidjan → Yamoussoukro → Bouaké
      [[-3.99, 5.35], [-4.35, 6.82], [-5.04, 7.69]],
      // Abidjan → Ghana (Noé → Accra)
      [[-3.99, 5.35], [-3.20, 5.10], [-0.18, 5.57], [-0.02, 5.62]],
      // Abidjan → Dakar (corridor côtier)
      [[-3.99, 5.35], [-5.35, 6.37], [-8.48, 7.90], [-10.81, 8.49], [-13.68, 9.54], [-15.55, 11.86], [-17.44, 14.69]],
      // Abidjan → Ouagadougou (routier)
      [[-3.99, 5.35], [-4.03, 6.82], [-3.00, 8.88], [-1.52, 12.36]],
    ],
    hubs: [
      { id: "ABJ", name: "Abidjan — Hub Principal",  lat: 5.35,  lng: -3.99 },
      { id: "ACC", name: "Accra — Frontière Elubo",  lat: 5.57,  lng: -0.18 },
      { id: "DKR", name: "Dakar — Terminus Nord",    lat: 14.69, lng: -17.44 },
      { id: "OUA", name: "Ouagadougou — Relais",     lat: 12.36, lng: -1.52 },
    ],
    hubLabel: "HUB",
    routeLabel: "Réseau CEDEAO",
  },
  air: {
    center: [-5.0, 10.0] as [number, number],
    zoom: 4.2,
    color: "#a78bfa",
    routes: [
      // ABJ → CDG (Paris)
      [[-3.93, 5.36], [-5.0, 10.0], [-3.0, 18.0], [2.55, 49.01]],
      // ABJ → Lagos
      [[-3.93, 5.36], [3.32, 6.58]],
      // ABJ → Dakar
      [[-3.93, 5.36], [-10.0, 9.0], [-17.49, 14.74]],
      // ABJ → Johannesburg
      [[-3.93, 5.36], [5.0, 0.0], [15.0, -5.0], [28.23, -26.14]],
      // ABJ → Dubai
      [[-3.93, 5.36], [15.0, 10.0], [30.0, 15.0], [55.36, 25.25]],
    ],
    hubs: [
      { id: "ABJ", name: "Aéroport FHB Abidjan", lat: 5.36,  lng: -3.93 },
      { id: "LOS", name: "Aéroport Murtala Lagos", lat: 6.58, lng: 3.32  },
      { id: "DKR", name: "Aéroport LSS Dakar",   lat: 14.74, lng: -17.49 },
      { id: "CDG", name: "Aéroport CDG Paris",   lat: 49.01, lng: 2.55   },
      { id: "DXB", name: "Aéroport Dubai DXB",   lat: 25.25, lng: 55.36  },
    ],
    hubLabel: "AÉRO",
    routeLabel: "Routes aériennes cargo",
  },
};

const STATUS_COLOR: Record<DeckAsset["status"], string> = {
  active:  "#10B981",
  delayed: "#EF4444",
  stopped: "#F59E0B",
};

function createHubEl(label: string, color: string) {
  const el = document.createElement("div");
  el.style.cssText = `position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;`;
  el.innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;border:1px solid ${color}55;animation:hub-pulse 2.8s ease-in-out infinite;"></div>
    <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
    <span style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;font-size:9px;font-weight:700;color:${color};letter-spacing:0.08em;white-space:nowrap;text-shadow:0 1px 4px #000a;">${label}</span>
  `;
  return el;
}

export function DeckMapGL({ deck, assets, is3D, onAssetClick }: DeckMapGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const frameRef     = useRef<number>(0);

  const cfg = DECK_CONFIG[deck];

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: cfg.center,
      zoom: cfg.zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      // ── Routes ──
      map.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: cfg.routes.map(coords => ({
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: {},
          })),
        },
      });

      map.addLayer({
        id: "routes-glow",
        type: "line",
        source: "routes",
        paint: {
          "line-color": cfg.color,
          "line-opacity": 0.12,
          "line-width": 6,
          "line-blur": 4,
        },
      });

      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": cfg.color,
          "line-opacity": 0.35,
          "line-width": 1.5,
          "line-dasharray": deck === "air" ? [2, 4] : [4, 6],
        },
      });

      // ── Assets GeoJSON ──
      map.addSource("assets", {
        type: "geojson",
        data: buildAssetGeoJSON([]),
      });

      // Halo delayed
      map.addLayer({
        id: "assets-halo",
        type: "circle",
        source: "assets",
        filter: ["==", ["get", "status"], "delayed"],
        paint: {
          "circle-radius": 18,
          "circle-color": "#EF4444",
          "circle-opacity": 0.12,
        },
      });

      // Cercle principal
      map.addLayer({
        id: "assets-circle",
        type: "circle",
        source: "assets",
        paint: {
          "circle-radius": ["case", ["==", ["get", "status"], "delayed"], 7, 5],
          "circle-color": [
            "match", ["get", "status"],
            "active",  "#10B981",
            "delayed", "#EF4444",
            "#F59E0B",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.45)",
        },
      });

      // Hover + click
      map.on("mouseenter", "assets-circle", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "assets-circle", () => { map.getCanvas().style.cursor = ""; });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "maritime-popup",
        offset: 12,
        maxWidth: "200px",
      });

      map.on("mousemove", "assets-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as Record<string, string>;
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
        const color = STATUS_COLOR[p.status as DeckAsset["status"]];
        const statusLabel = p.status === "active" ? "Actif" : p.status === "delayed" ? "Retardé" : "Arrêté";
        popup.setLngLat(coords).setHTML(`
          <div style="font-family:monospace;font-size:11px;line-height:1.6;padding:2px">
            <div style="font-size:12px;font-weight:600;color:#F3F4F6">${p.name}</div>
            <div style="color:#6B7280;margin-top:2px">${p.info}</div>
            <div style="margin-top:4px;display:flex;align-items:center;gap:6px">
              <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span>
              <span style="color:${color}">${statusLabel}</span>
            </div>
          </div>
        `).addTo(map);
      });
      map.on("mouseleave", "assets-circle", () => popup.remove());

      map.on("click", "assets-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat || !onAssetClick) return;
        const p = feat.properties as Record<string, string | number>;
        onAssetClick({
          id: String(p.id), name: String(p.name),
          lat: Number(p.lat), lng: Number(p.lng),
          status: p.status as DeckAsset["status"],
          info: String(p.info),
        });
      });

      // ── Hubs ──
      cfg.hubs.forEach(hub => {
        const el = createHubEl(hub.id, cfg.color);
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([hub.lng, hub.lat])
          .setPopup(new maplibregl.Popup({
            offset: 20, closeButton: false, className: "maritime-popup",
          }).setHTML(`
            <div style="font-family:monospace;font-size:11px;padding:2px">
              <div style="font-weight:600;color:${cfg.color}">${hub.id}</div>
              <div style="color:#9CA3AF;margin-top:2px">${hub.name}</div>
            </div>
          `))
          .addTo(map);
      });

      // ── Pulse halo animation ──
      let pulse = 0;
      const animatePulse = () => {
        pulse = (pulse + 1) % 100;
        const opacity = 0.05 + Math.sin((pulse / 100) * Math.PI * 2) * 0.10;
        const radius  = 16 + Math.sin((pulse / 100) * Math.PI * 2) * 5;
        if (map.getLayer("assets-halo")) {
          map.setPaintProperty("assets-halo", "circle-opacity", opacity);
          map.setPaintProperty("assets-halo", "circle-radius", radius);
        }
        frameRef.current = requestAnimationFrame(animatePulse);
      };
      frameRef.current = requestAnimationFrame(animatePulse);
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("assets") as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildAssetGeoJSON(assets));
  }, [assets]);

  useEffect(() => {
    mapRef.current?.easeTo({
      pitch:   is3D ? 55  : 0,
      bearing: is3D ? -12 : 0,
      duration: 1200,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });
  }, [is3D]);

  return (
    <>
      <style>{`
        .maritime-popup .maplibregl-popup-content {
          background: rgba(6, 14, 26, 0.96) !important;
          border: 1px solid rgba(14, 165, 233, 0.2) !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .maritime-popup .maplibregl-popup-tip { display: none; }
        @keyframes hub-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2); opacity: 0.08; }
        }
        .maplibregl-ctrl-bottom-right { bottom: 52px !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}

function buildAssetGeoJSON(assets: DeckAsset[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: assets.map(a => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [a.lng, a.lat] },
      properties: { id: a.id, name: a.name, lat: a.lat, lng: a.lng, status: a.status, info: a.info },
    })),
  };
}
