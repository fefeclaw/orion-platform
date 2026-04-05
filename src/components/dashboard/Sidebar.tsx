"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Anchor, Train, Truck, Plane, LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRole } from "@/hooks/useRole";
import MaritimeSidebar from "./MaritimeSidebar";

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslation();
  const { isPro, pillar } = useRole();

  const ALL_PILLARS = [
    { id: "maritime", label: t("nav_maritime"), icon: Anchor, color: "#22d3ee" },
    { id: "rail",     label: t("nav_rail"),     icon: Train,  color: "#fb923c" },
    { id: "road",     label: t("nav_road"),     icon: Truck,  color: "#4ade80" },
    { id: "air",      label: t("nav_air"),      icon: Plane,  color: "#818cf8" },
  ];

  // ── RBAC SILO ─────────────────────────────────────────────────────────────
  if (isPro && pillar === "maritime") {
    return <MaritimeSidebar />;
  }

  const PILLARS = isPro
    ? ALL_PILLARS.filter((p) => p.id === pillar)
    : ALL_PILLARS;

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #070d1c 0%, #04080f 100%)",
        borderRight: "1px solid rgba(245,158,11,0.08)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: "1px solid rgba(245,158,11,0.08)" }}
      >
        <Link href="/" className="flex items-center gap-3 group">
          {/* Orion logo — anneaux concentriques + point central */}
          <div className="relative w-8 h-8 shrink-0">
            {/* Halo externe pulsé */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: "0 0 16px rgba(245,158,11,0.4)", borderRadius: "50%" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(245,158,11,0.35)" }}
            />
            <div
              className="absolute inset-[4px] rounded-full"
              style={{ border: "1px solid rgba(245,158,11,0.18)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#F59E0B",
                  boxShadow: "0 0 8px rgba(245,158,11,0.8), 0 0 16px rgba(245,158,11,0.4)",
                }}
              />
            </div>
          </div>
          <div>
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Orion
            </span>
            <p className="text-[9px] tracking-[0.12em] uppercase" style={{ color: "rgba(245,158,11,0.5)" }}>
              Logistics
            </p>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 py-1 text-[9px] tracking-[0.25em] uppercase mb-2 font-semibold"
          style={{ color: "rgba(255,255,255,0.18)" }}>
          {isPro ? "Mon Module" : "Modules"}
        </p>

        {PILLARS.map((pillarItem) => {
          const Icon = pillarItem.icon;
          const isActive = pathname === `/dashboard/${pillarItem.id}`;
          return (
            <Link key={pillarItem.id} href={`/dashboard/${pillarItem.id}`}>
              <motion.div
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative"
                style={isActive ? {
                  background: `linear-gradient(135deg, ${pillarItem.color}18, ${pillarItem.color}08)`,
                  border: `1px solid ${pillarItem.color}28`,
                  boxShadow: `0 0 20px ${pillarItem.color}08, inset 0 1px 0 ${pillarItem.color}12`,
                } : {
                  border: "1px solid transparent",
                }}
              >
                {/* Accent line gauche si actif */}
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                    style={{ background: pillarItem.color, boxShadow: `0 0 6px ${pillarItem.color}` }}
                  />
                )}

                <Icon
                  size={15}
                  style={{
                    color: isActive ? pillarItem.color : "rgba(255,255,255,0.28)",
                    filter: isActive ? `drop-shadow(0 0 5px ${pillarItem.color}80)` : "none",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: isActive ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.40)" }}
                >
                  {pillarItem.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{
                      background: pillarItem.color,
                      boxShadow: `0 0 6px ${pillarItem.color}`,
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {!isPro && (
          <div className="pt-4">
            <p className="px-3 py-1 text-[9px] tracking-[0.25em] uppercase mb-2 font-semibold"
              style={{ color: "rgba(255,255,255,0.18)" }}>
              Système
            </p>
            <Link href="/dashboard">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                style={{ border: "1px solid transparent" }}>
                <LayoutDashboard size={15} style={{ color: "rgba(255,255,255,0.18)" }} aria-hidden="true" />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>{t("nav_dashboard")}</span>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Version badge ── */}
      <div className="px-4 py-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
            style={{ boxShadow: "0 0 6px #10B981" }} />
          <span className="text-[10px] tracking-widest uppercase font-medium"
            style={{ color: "rgba(245,158,11,0.6)" }}>
            Live · v1.0
          </span>
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,146,60,0.08)";
            (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(251,146,60,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
          }}
        >
          <LogOut size={15} className="text-white/20 group-hover:text-orange-400 transition-colors" aria-hidden="true" />
          <span className="text-sm text-white/30 group-hover:text-orange-400 transition-colors">{t("nav_logout")}</span>
        </button>
      </div>
    </aside>
  );
}
