"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  Settings,
  Shield,
  ChevronRight,
  Database,
} from "lucide-react";

const menuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Utilisateurs" },
  { href: "/admin/documents", icon: FileText, label: "Documents" },
  { href: "/admin/audit", icon: Activity, label: "Audit & Logs" },
  { href: "/admin/database", icon: Database, label: "Base de données" },
  { href: "/admin/settings", icon: Settings, label: "Paramètres" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-[calc(100vh-64px)] border-r border-white/10 bg-[#0d1220]">
      <div className="p-4">
        <div className="mb-6 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold text-[#D4AF37] tracking-wider">
              CONTRÔLE TOTAL
            </span>
          </div>
          <p className="text-xs text-white/40">
            Gérez tous les aspects de la plateforme depuis un seul endroit avec des actions rapides 1-clic.
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-l-2 border-[#D4AF37] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : ""}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
