"use client";

import { useEffect, useRef, useState } from "react";
import type { Vessel } from "@/hooks/useMaritimeData";

interface MaritimeMapProps {
  vessels: Vessel[];
  onVesselClick?: (vessel: Vessel) => void;
}

// Projection Mercator simplifiée centrée sur l'Afrique de l'Ouest
function projectToCanvas(lat: number, lng: number, width: number, height: number) {
  // Pan/zoom centré sur le Golfe de Guinée
  const centerLng = 0;
  const centerLat = 5;
  const scale = 3.2;

  const x = width / 2 + ((lng - centerLng) / 360) * width * scale;
  const latRad = (lat * Math.PI) / 180;
  const centerLatRad = (centerLat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const centerMercN = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2));
  const y = height / 2 - ((mercN - centerMercN) * height * scale) / (2 * Math.PI);
  return { x, y };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: { lat: number; lng: number }[],
  width: number,
  height: number
) {
  if (points.length < 3) return;
  ctx.beginPath();
  const first = projectToCanvas(points[0].lat, points[0].lng, width, height);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const p = projectToCanvas(points[i].lat, points[i].lng, width, height);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

const AFRICA_WEST = [
  { lat: 15, lng: -18 }, { lat: 20, lng: -17 }, { lat: 25, lng: -13 }, { lat: 30, lng: -10 },
  { lat: 36, lng: -8 },  { lat: 37, lng: 10 },  { lat: 30, lng: 32 },  { lat: 20, lng: 38 },
  { lat: 12, lng: 44 },  { lat: 5,  lng: 42 },  { lat: -5, lng: 40 },  { lat: -10, lng: 38 },
  { lat: -20, lng: 35 }, { lat: -35, lng: 28 }, { lat: -35, lng: 16 }, { lat: -20, lng: 12 },
  { lat: -5, lng: 8 },   { lat: 0,  lng: 5 },   { lat: 5,  lng: 0 },   { lat: 10, lng: -16 },
  { lat: 12, lng: -18 },
];

const EUROPE_SOUTH = [
  { lat: 48, lng: -8 },  { lat: 51, lng: 2 },   { lat: 55, lng: 8 },  { lat: 57, lng: 25 },
  { lat: 48, lng: 35 },  { lat: 36, lng: 36 },  { lat: 36, lng: 28 }, { lat: 38, lng: 22 },
  { lat: 37, lng: 15 },  { lat: 38, lng: 12 },  { lat: 44, lng: 8 },  { lat: 43, lng: -3 },
  { lat: 37, lng: -10 }, { lat: 38, lng: -10 },
];

const PORT_ABIDJAN = { lat: 5.3083, lng: -3.9780 };
const PORT_LAGOS   = { lat: 6.4474, lng:  3.3553 };
const PORT_DAKAR   = { lat: 14.6879, lng: -17.4337 };
const PORT_TEMA    = { lat: 5.6333, lng:  0.0167 };  // corrigé : lng était négatif (-0.02) et lat trop sud

export function MaritimeMap({ vessels, onVesselClick }: MaritimeMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredVessel, setHoveredVessel] = useState<Vessel | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const pulseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth ?? window.innerWidth;
      canvas.height = parent?.clientHeight ?? window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawFrame = () => {
      pulseRef.current += 0.05;
      const { width, height } = canvas;

      // ── Background ──
      const gradient = ctx.createRadialGradient(
        width * 0.4, height * 0.55, 0,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.7
      );
      gradient.addColorStop(0, "#0a1628");
      gradient.addColorStop(0.5, "#060e1a");
      gradient.addColorStop(1, "#030712");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ── Grid ──
      ctx.strokeStyle = "rgba(14, 165, 233, 0.06)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 10) {
        ctx.beginPath();
        const s = projectToCanvas(lat, -30, width, height);
        const e = projectToCanvas(lat, 50, width, height);
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      }
      for (let lng = -30; lng <= 50; lng += 10) {
        ctx.beginPath();
        const s = projectToCanvas(-50, lng, width, height);
        const e = projectToCanvas(60, lng, width, height);
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      }

      // ── Continents ──
      ctx.fillStyle = "#0d1f35";
      ctx.strokeStyle = "rgba(14, 165, 233, 0.15)";
      ctx.lineWidth = 1;
      drawPolygon(ctx, AFRICA_WEST, width, height);
      drawPolygon(ctx, EUROPE_SOUTH, width, height);

      // ── Ports ──
      const ports = [
        { pos: PORT_ABIDJAN, label: "ABJ", accent: "#D4AF37" },
        { pos: PORT_LAGOS,   label: "LOS", accent: "#D4AF37" },
        { pos: PORT_DAKAR,   label: "DKR", accent: "#D4AF37" },
        { pos: PORT_TEMA,    label: "TEM", accent: "#D4AF37" },
      ];
      ports.forEach(({ pos, label, accent }) => {
        const p = projectToCanvas(pos.lat, pos.lng, width, height);
        // Pulse ring
        const radius = 8 + Math.sin(pulseRef.current) * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${accent}40`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
        // Label
        ctx.fillStyle = accent;
        ctx.font = "bold 9px 'Inter', monospace";
        ctx.fillText(label, p.x + 7, p.y - 5);
      });

      // ── Trade routes (dashed lines between ports) ──
      const routePairs = [
        [PORT_ABIDJAN, PORT_LAGOS],
        [PORT_ABIDJAN, PORT_DAKAR],
        [PORT_ABIDJAN, PORT_TEMA],
        [PORT_DAKAR,   { lat: 36, lng: -8 }], // Europe
      ];
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = "rgba(14, 165, 233, 0.12)";
      ctx.lineWidth = 1;
      routePairs.forEach(([from, to]) => {
        const f = projectToCanvas(from.lat, from.lng, width, height);
        const t = projectToCanvas(to.lat, to.lng, width, height);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // ── Vessels ──
      vessels.forEach((vessel) => {
        const pos = projectToCanvas(vessel.lat, vessel.lng, width, height);
        const color =
          vessel.status === "berth" ? "#10B981" :
          vessel.status === "alert" ? "#EF4444" : "#0EA5E9";

        // Alert halo (animated)
        if (vessel.status === "alert") {
          const haloRadius = 14 + Math.sin(pulseRef.current * 2) * 4;
          const halo = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, haloRadius);
          halo.addColorStop(0, "rgba(239, 68, 68, 0.35)");
          halo.addColorStop(1, "rgba(239, 68, 68, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Transit trail
        if (vessel.status === "transit") {
          const tailLen = vessel.speed * 1.5;
          const rad = ((vessel.heading - 180) * Math.PI) / 180;
          const tailGrad = ctx.createLinearGradient(
            pos.x, pos.y,
            pos.x + Math.sin(rad) * tailLen,
            pos.y - Math.cos(rad) * tailLen
          );
          tailGrad.addColorStop(0, `${color}60`);
          tailGrad.addColorStop(1, `${color}00`);
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + Math.sin(rad) * tailLen, pos.y - Math.cos(rad) * tailLen);
          ctx.stroke();
        }

        // Vessel dot
        const r = vessel.status === "alert" ? 6 : 4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(243, 244, 246, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(drawFrame);
    };

    animRef.current = requestAnimationFrame(drawFrame);

    // ── Mouse events ──
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x: e.clientX, y: e.clientY });

      let found: Vessel | null = null;
      for (const vessel of vessels) {
        const pos = projectToCanvas(vessel.lat, vessel.lng, canvas.width, canvas.height);
        if (Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 16) {
          found = vessel;
          break;
        }
      }
      setHoveredVessel(found);
      canvas.style.cursor = found ? "pointer" : "default";
    };

    const handleClick = () => {
      if (hoveredVessel && onVesselClick) onVesselClick(hoveredVessel);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [vessels, hoveredVessel, onVesselClick]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />

      {hoveredVessel && (
        <div
          className="fixed z-30 pointer-events-none px-3 py-2 rounded-xl shadow-2xl"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
            background: "rgba(6, 14, 26, 0.95)",
            border: "1px solid rgba(14, 165, 233, 0.25)",
          }}
        >
          <p className="text-sm font-semibold text-white">{hoveredVessel.name}</p>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {hoveredVessel.lat.toFixed(4)}°, {hoveredVessel.lng.toFixed(4)}°
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            {hoveredVessel.destination} · {hoveredVessel.speed} kn
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  hoveredVessel.status === "berth" ? "#10B981" :
                  hoveredVessel.status === "alert" ? "#EF4444" : "#0EA5E9",
              }}
            />
            <span className="text-[11px] text-white/50">
              {hoveredVessel.status === "berth" ? "À quai" :
               hoveredVessel.status === "alert" ? "Alerte" : "En transit"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
