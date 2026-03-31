"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Shield, LogOut, Bell, Settings } from "lucide-react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  return (
    <header className="h-16 border-b border-white/10 bg-[#0d1220]/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#f0cc5c] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#0a0e1a]" />
          </div>
          <span className="font-bold text-lg">ORION</span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold tracking-wider">ADMIN</span>
        </Link>

        <div className="h-6 w-px bg-white/10 mx-2" />

        <nav className="flex items-center gap-2 text-sm text-white/50">
          <span>Admin</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-white/30">/</span>
              <span className="text-white/70">{crumb}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        <Link 
          href="/admin/settings"
          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name || user.email}</p>
            <p className="text-xs text-white/40">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
