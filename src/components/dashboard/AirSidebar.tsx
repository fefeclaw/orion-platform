"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, LayoutDashboard, FileText, ShieldCheck, BookOpen,
  Users, LogOut, ChevronDown, Radio, AlertTriangle,
  MapPin, Clock, PlaneTakeoff, PlaneLanding, Package,
  Warehouse, Briefcase
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/i18n/translations";

// ─── Live status badge ───────────────────────────────────────────────────────

type LiveStatus = "green" | "orange" | "red" | null;

function StatusDot({ status }: { status: LiveStatus }) {
  if (!status) return null;
  const color = status === "green" ? "#4ade80" : status === "orange" ? "#fb923c" : "#f87171";
  return (
    <span
      className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
    />
  );
}

// ─── Sub-item ────────────────────────────────────────────────────────────────

interface SubItem {
  labelKey: TranslationKey;
  href: string;
  status?: LiveStatus;
}

function SubNavItem({ item }: { item: SubItem }) {
  const pathname = usePathname();
  const t = useTranslation();
  const isActive = pathname === item.href;

  return (
    <Link href={item.href}>
      <motion.div
        whileHover={{ x: 3 }}
        className="flex items-center gap-2 pl-8 pr-3 py-2 rounded-lg transition-all duration-200 group"
        style={{
          background: isActive ? "rgba(167,139,250,0.06)" : "transparent",
          borderLeft: isActive ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
        }}
      >
        <span
          className="text-xs transition-colors duration-200 font-light"
          style={{ color: isActive ? "#a78bfa" : "rgba(255,255,255,0.35)" }}
        >
          {t(item.labelKey)}
        </span>
        {item.status && <StatusDot status={item.status} />}
      </motion.div>
    </Link>
  );
}

// ─── Accordion section ───────────────────────────────────────────────────────

interface Section {
  labelKey: TranslationKey;
  icon: React.ElementType;
  items: SubItem[];
  defaultOpen?: boolean;
  status?: LiveStatus;
}

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  const t = useTranslation();
  const Icon = section.icon;

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group"
        style={{
          background: open ? "rgba(167,139,250,0.04)" : "transparent",
        }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <Icon
          size={14}
          className="shrink-0 transition-colors duration-200"
          style={{ color: open ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
          aria-hidden="true"
        />
        <span
          className="text-xs font-medium tracking-wide flex-1 text-left transition-colors duration-200"
          style={{ color: open ? "#a78bfa" : "rgba(255,255,255,0.45)" }}
        >
          {t(section.labelKey)}
        </span>
        {section.status && !open && <StatusDot status={section.status} />}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown
            size={11}
            style={{ color: open ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.2)" }}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="ml-3 mt-0.5 mb-1 rounded-xl py-1"
              style={{
                background: "rgba(167,139,250,0.02)",
                backdropFilter: "blur(8px)",
                borderLeft: "1px solid rgba(167,139,250,0.08)",
              }}
            >
              {section.items.map((item) => (
                <SubNavItem key={item.href} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Air Sidebar ──────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    labelKey: "air_flights",
    icon: PlaneTakeoff,
    status: "green",
    defaultOpen: true,
    items: [
      { labelKey: "air_flights_arrivals", href: "/dashboard/air/arrivals", status: "green" },
      { labelKey: "air_flights_departures", href: "/dashboard/air/departures" },
      { labelKey: "air_flights_cutoff", href: "/dashboard/air/cutoff" },
    ],
  },
  {
    labelKey: "air_cargo",
    icon: Package,
    status: "green",
    items: [
      { labelKey: "air_cargo_inventory", href: "/dashboard/air/inventory", status: "green" },
      { labelKey: "air_cargo_dangerous", href: "/dashboard/air/dangerous", status: "orange" },
      { labelKey: "air_cargo_perishables", href: "/dashboard/air/perishables" },
    ],
  },
  {
    labelKey: "air_tracking",
    icon: MapPin,
    status: "green",
    items: [
      { labelKey: "air_tracking_live", href: "/dashboard/air/adsb", status: "green" },
      { labelKey: "air_tracking_history", href: "/dashboard/air/history" },
      { labelKey: "air_tracking_alerts", href: "/dashboard/air/alerts" },
    ],
  },
  {
    labelKey: "air_docs",
    icon: FileText,
    items: [
      { labelKey: "air_docs_awb", href: "/dashboard/air/awb" },
      { labelKey: "air_docs_manifest", href: "/dashboard/air/manifest" },
      { labelKey: "air_docs_customs", href: "/dashboard/air/customs" },
    ],
  },
  {
    labelKey: "air_ground",
    icon: Warehouse,
    items: [
      { labelKey: "air_ground_warehouse", href: "/dashboard/air/warehouse" },
      { labelKey: "air_ground_equipment", href: "/dashboard/air/equipment" },
      { labelKey: "air_ground_priority", href: "/dashboard/air/priority" },
    ],
  },
  {
    labelKey: "air_admin",
    icon: Users,
    items: [
      { labelKey: "air_admin_audit", href: "/dashboard/air/audit" },
      { labelKey: "air_team", href: "/dashboard/air/team" },
    ],
  },
];

export default function AirSidebar() {
  const pathname = usePathname();
  const t = useTranslation();
  const isDashboard = pathname === "/dashboard/air";

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "#060d1a",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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

      {/* Module header */}
      <div className="px-4 pt-5 pb-3">
        <div
          className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
          style={{
            background: "rgba(167,139,250,0.05)",
            border: "1px solid rgba(167,139,250,0.12)",
          }}
        >
          <Plane size={16} style={{ color: "#a78bfa" }} aria-hidden="true" />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#a78bfa" }}>
            {t("air_module")}
          </span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pb-2">
        <Link href="/dashboard/air">
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200"
            style={{
              background: isDashboard ? "rgba(167,139,250,0.08)" : "transparent",
              border: isDashboard ? "1px solid rgba(167,139,250,0.15)" : "1px solid transparent",
            }}
          >
            <LayoutDashboard
              size={14}
              style={{ color: isDashboard ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-medium"
              style={{ color: isDashboard ? "#a78bfa" : "rgba(255,255,255,0.45)" }}
            >
              {t("air_dash_strategic")}
            </span>
            {isDashboard && (
              <motion.div
                layoutId="air-active"
                className="ml-auto w-1 h-4 rounded-full"
                style={{ background: "#a78bfa" }}
              />
            )}
          </motion.div>
        </Link>
      </div>

      {/* Separator */}
      <div className="mx-4 mb-3" style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />

      {/* Accordion sections */}
      <nav className="flex-1 px-3 space-y-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {SECTIONS.map((section) => (
          <AccordionSection key={section.labelKey} section={section} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/20 transition-all group"
        >
          <LogOut size={14} className="text-white/20 group-hover:text-red-400 transition-colors" aria-hidden="true" />
          <span className="text-xs text-white/30 group-hover:text-red-400 transition-colors">
            {t("nav_logout")}
          </span>
        </button>
      </div>
    </aside>
  );
}
