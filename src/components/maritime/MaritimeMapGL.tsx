"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Vessel } from "@/hooks/useMaritimeData";

// ─── Ports stratégiques Afrique de l'Ouest ───────────────────────────────────
const PORTS = [
  { id: "ABJ", name: "Port Autonome d'Abidjan", lat: 5.32,  lng: -4.02 },
  { id: "LOS", name: "Port de Lagos (Apapa)",   lat: 6.43,  lng:  3.42 },
  { id: "DKR", name: "Port de Dakar",           lat: 14.69, lng: -17.44 },
  { id: "TEM", name: "Port de Tema",            lat: 5.62,  lng: -0.02  },
  { id: "CTN", name: "Port de Cotonou",         lat: 6.35,  lng:  2.42  },
];

// ─── Couleurs par statut ──────────────────────────────────────────────────────
const STATUS_COLOR: Record<Vessel["status"], string> = {
  berth:   "#10B981",
  transit: "#0EA5E9",
  alert:   "#EF4444",
};

interface MaritimeMapGLProps {
  vessels: Vessel[];
  is3D: boolean;
  onVesselClick?: (vessel: Vessel) => void;
}

export function MaritimeMapGL({ vessels, is3D, onVesselClick }: MaritimeMapGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const popupRef     = useRef<maplibregl.Popup | null>(null);
  const portMarkersRef = useRef<maplibregl.Marker[]>([]);
  const frameRef     = useRef<number>(0);

  // ─── Créer un élément port (or pulsé) ──────────────────────────────────────
  const createPortEl = useCallback((id: string) => {
    const el = document.createElement("div");
    el.className = "maritime-port-marker";
    el.innerHTML = `
      <div style="
        position:relative;
        width:32px; height:32px;
        display:flex; align-items:center; justify-content:center;
      ">
        <div style="
          position:absolute; inset:0; border-radius:50%;
          border:1px solid #D4AF3766;
          animation:port-pulse 2.5s ease-in-out infinite;
        "></div>
        <div style="
          width:8px; height:8px; border-radius:50%;
          background:#D4AF37;
          box-shadow:0 0 8px #D4AF37;
        "></div>
      </div>
      <span style="
        position:absolute; top:100%; left:50%; transform:translateX(-50%);
        margin-top:2px;
        font-size:9px; font-weight:700;
        color:#D4AF37; letter-spacing:0.08em;
        text-shadow:0 0 6px #00000099;
        pointer-events:none; white-space:nowrap;
      ">${id}</span>
    `;
    return el;
  }, []);

  // ─── Init carte ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // CARTO Dark Matter GL — dark theme, no API key needed
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-2.5, 7.5],
      zoom: 4.8,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "nautical" }), "bottom-left");

    mapRef.current = map;

    map.on("load", () => {
      // ── Routes commerciales (lignes) ──
      map.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            // ABJ → LOS
            { type: "Feature", geometry: { type: "LineString", coordinates: [[-4.02, 5.32], [3.42, 6.43]] }, properties: {} },
            // ABJ → DKR
            { type: "Feature", geometry: { type: "LineString", coordinates: [[-4.02, 5.32], [-17.44, 14.69]] }, properties: {} },
            // ABJ → TEM
            { type: "Feature", geometry: { type: "LineString", coordinates: [[-4.02, 5.32], [-0.02, 5.62]] }, properties: {} },
            // LOS → CTN
            { type: "Feature", geometry: { type: "LineString", coordinates: [[3.42, 6.43], [2.42, 6.35]] }, properties: {} },
            // DKR → Europe (Casablanca)
            { type: "Feature", geometry: { type: "LineString", coordinates: [[-17.44, 14.69], [-7.59, 33.59]] }, properties: {} },
          ],
        },
      });

      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#0EA5E9",
          "line-opacity": 0.18,
          "line-width": 1.5,
          "line-dasharray": [3, 5],
        },
      });

      // ── Source navires (GeoJSON) ──
      map.addSource("vessels", {
        type: "geojson",
        data: buildVesselGeoJSON([]),
      });

      // Halo alert (cercle large, transparent)
      map.addLayer({
        id: "vessels-alert-halo",
        type: "circle",
        source: "vessels",
        filter: ["==", ["get", "status"], "alert"],
        paint: {
          "circle-radius": 18,
          "circle-color": "#EF4444",
          "circle-opacity": 0.15,
          "circle-stroke-width": 0,
        },
      });

      // Cercle principal
      map.addLayer({
        id: "vessels-circle",
        type: "circle",
        source: "vessels",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "status"], "alert"], 7,
            5,
          ],
          "circle-color": [
            "match", ["get", "status"],
            "berth",   "#10B981",
            "alert",   "#EF4444",
            /* transit */ "#0EA5E9",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.5)",
        },
      });

      // ── Curseur pointer sur hover ──
      map.on("mouseenter", "vessels-circle", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "vessels-circle", () => { map.getCanvas().style.cursor = ""; });

      // ── Popup hover ──
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "maritime-popup",
        offset: 12,
        maxWidth: "220px",
      });
      popupRef.current = popup;

      map.on("mousemove", "vessels-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as Record<string, string>;
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
        const statusLabel = props.status === "berth" ? "À quai" : props.status === "alert" ? "En alerte" : "En transit";
        const color = STATUS_COLOR[props.status as Vessel["status"]] ?? "#0EA5E9";
        popup
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:monospace;font-size:11px;line-height:1.6;padding:4px 2px">
              <div style="font-size:12px;font-weight:600;color:#F3F4F6;margin-bottom:4px">${props.name}</div>
              <div style="color:#6B7280">IMO ${props.imo} · ${props.type}</div>
              <div style="margin-top:4px;display:flex;align-items:center;gap:6px">
                <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span>
                <span style="color:${color}">${statusLabel}</span>
              </div>
              <div style="color:#6B7280;margin-top:2px">${props.destination} · ${props.speed} kn</div>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseleave", "vessels-circle", () => popup.remove());

      // ── Click navire ──
      map.on("click", "vessels-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat || !onVesselClick) return;
        const p = feat.properties as Record<string, string | number>;
        onVesselClick({
          id: String(p.id),
          name: String(p.name),
          imo: String(p.imo),
          type: String(p.type),
          flag: String(p.flag ?? "—"),
          lat: Number(p.lat),
          lng: Number(p.lng),
          speed: Number(p.speed),
          heading: Number(p.heading ?? 0),
          status: p.status as Vessel["status"],
          destination: String(p.destination),
          eta: String(p.eta),
          lastUpdate: String(p.lastUpdate),
        });
      });

      // ── Ports markers ──
      PORTS.forEach((port) => {
        const el = createPortEl(port.id);
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([port.lng, port.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20, closeButton: false, className: "maritime-popup" }).setHTML(`
              <div style="font-family:monospace;font-size:11px;padding:2px">
                <div style="font-weight:600;color:#D4AF37">${port.id}</div>
                <div style="color:#9CA3AF;margin-top:2px">${port.name}</div>
              </div>
            `)
          )
          .addTo(map);
        portMarkersRef.current.push(marker);
      });

      // ── Pulse animation halo alert ──
      let pulse = 0;
      const animatePulse = () => {
        pulse = (pulse + 1) % 100;
        const opacity = 0.05 + Math.sin((pulse / 100) * Math.PI * 2) * 0.10;
        const radius  = 16 + Math.sin((pulse / 100) * Math.PI * 2) * 5;
        if (map.getLayer("vessels-alert-halo")) {
          map.setPaintProperty("vessels-alert-halo", "circle-opacity", opacity);
          map.setPaintProperty("vessels-alert-halo", "circle-radius", radius);
        }
        frameRef.current = requestAnimationFrame(animatePulse);
      };
      frameRef.current = requestAnimationFrame(animatePulse);
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      portMarkersRef.current.forEach(m => m.remove());
      portMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Mise à jour des navires ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("vessels") as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildVesselGeoJSON(vessels));
  }, [vessels]);

  // ─── Toggle 2D / 3D ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch:   is3D ? 55  : 0,
      bearing: is3D ? -12 : 0,
      duration: 1200,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, // ease-in-out
    });
  }, [is3D]);

  return (
    <>
      {/* Styles globaux injectés pour les popups et ports */}
      <style>{`
        .maritime-popup .maplibregl-popup-content {
          background: rgba(6, 14, 26, 0.96) !important;
          border: 1px solid rgba(14, 165, 233, 0.2) !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          color: #F3F4F6;
        }
        .maritime-popup .maplibregl-popup-tip {
          border-top-color: rgba(14, 165, 233, 0.2) !important;
          border-bottom-color: rgba(14, 165, 233, 0.2) !important;
        }
        @keyframes port-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0.1; }
        }
        .maplibregl-ctrl-bottom-right { bottom: 52px !important; }
        .maplibregl-ctrl-bottom-left  { bottom: 52px !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}

// ─── Helper GeoJSON ──────────────────────────────────────────────────────────
function buildVesselGeoJSON(vessels: Vessel[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vessels.map((v) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [v.lng, v.lat],
      },
      properties: {
        id: v.id,
        name: v.name,
        imo: v.imo,
        type: v.type,
        flag: v.flag,
        lat: v.lat,
        lng: v.lng,
        speed: v.speed,
        heading: v.heading,
        status: v.status,
        destination: v.destination,
        eta: v.eta,
        lastUpdate: v.lastUpdate,
      },
    })),
  };
}
