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
    { id: "maritime", label: t("nav_maritime"), icon: Anchor, color: "#38bdf8" },
    { id: "rail",     label: t("nav_rail"),     icon: Train,  color: "#f87171" },
    { id: "road",     label: t("nav_road"),     icon: Truck,  color: "#34d399" },
    { id: "air",      label: t("nav_air"),      icon: Plane,  color: "#a78bfa" },
  ];

  // ── RBAC SILO ─────────────────────────────────────────────────────────────
  // Maritime pro → dedicated deep-menu sidebar (zero other pillars in DOM)
  if (isPro && pillar === "maritime") {
    return <MaritimeSidebar />;
  }

  // Other pro → only their pillar shown (rail/road/air)
  const PILLARS = isPro
    ? ALL_PILLARS.filter((p) => p.id === pillar)
    : ALL_PILLARS;

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[#060d1a] border-r border-white/5">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40" />
            <div className="absolute inset-[3px] rounded-full border border-[#D4AF37]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>
          </div>
          <span className="text-xs tracking-[0.2em] text-white/40 uppercase group-hover:text-white/70 transition-colors">
            Orion Logistics
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 py-1 text-[10px] tracking-[0.2em] text-white/20 uppercase mb-2">
          {isPro ? "Mon Module" : "Modules"}
        </p>

        {PILLARS.map((pillarItem) => {
          const Icon = pillarItem.icon;
          const isActive = pathname === `/dashboard/${pillarItem.id}`;
          return (
            <Link key={pillarItem.id} href={`/dashboard/${pillarItem.id}`}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/5 border border-white/8"
                    : "hover:bg-white/3 border border-transparent"
                }`}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? pillarItem.color : "rgba(255,255,255,0.3)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm transition-colors duration-200"
                  style={{ color: isActive ? pillarItem.color : "rgba(255,255,255,0.45)" }}
                >
                  {pillarItem.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: pillarItem.color }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {!isPro && (
          <div className="pt-4">
            <p className="px-3 py-1 text-[10px] tracking-[0.2em] text-white/20 uppercase mb-2">
              Système
            </p>
            <Link href="/dashboard">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-all cursor-pointer border border-transparent">
                <LayoutDashboard size={16} className="text-white/20" aria-hidden="true" />
                <span className="text-sm text-white/30">{t("nav_dashboard")}</span>
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/20 transition-all group"
        >
          <LogOut size={16} className="text-white/20 group-hover:text-red-400 transition-colors" aria-hidden="true" />
          <span className="text-sm text-white/30 group-hover:text-red-400 transition-colors">{t("nav_logout")}</span>
        </button>
      </div>
    </aside>
  );
}
