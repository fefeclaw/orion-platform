"use client";

import { useState } from "react";
import {
  UserPlus,
  FilePlus,
  Database,
  RefreshCw,
  Zap,
  Bell,
  Shield,
  Download,
  CheckCircle,
} from "lucide-react";

interface Action {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => Promise<void>;
}

export function QuickActions() {
  const [executing, setExecuting] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  async function executeAction(action: Action) {
    setExecuting(action.id);
    
    await new Promise((r) => setTimeout(r, 1000));
    
    switch (action.id) {
      case "new-user":
        window.location.href = "/admin/users/new";
        break;
      case "generate-doc":
        window.location.href = "/admin/documents/generate";
        break;
      case "backup-db":
        await fetch("/api/admin/backup", { method: "POST" });
        break;
      case "sync-ais":
        await fetch("/api/admin/sync-ais", { method: "POST" });
        break;
      case "clear-cache":
        await fetch("/api/admin/clear-cache", { method: "POST" });
        break;
      case "broadcast":
        window.location.href = "/admin/notifications";
        break;
      case "security-check":
        await fetch("/api/admin/security-check", { method: "POST" });
        break;
      case "export-data":
        window.open("/api/admin/export", "_blank");
        break;
    }
    
    setExecuting(null);
    setCompleted((prev) => [...prev, action.id]);
    setTimeout(() => {
      setCompleted((prev) => prev.filter((id) => id !== action.id));
    }, 3000);
  }

  const actions: Action[] = [
    {
      id: "new-user",
      title: "Nouvel utilisateur",
      description: "Créer un compte pro en 10 secondes",
      icon: UserPlus,
      color: "#38bdf8",
      onClick: () => Promise.resolve(),
    },
    {
      id: "generate-doc",
      title: "Générer document",
      description: "BL, CMR, AWB instantanés",
      icon: FilePlus,
      color: "#D4AF37",
      onClick: () => Promise.resolve(),
    },
    {
      id: "backup-db",
      title: "Backup base",
      description: "Sauvegarde SQLite complète",
      icon: Database,
      color: "#4ade80",
      onClick: () => Promise.resolve(),
    },
    {
      id: "sync-ais",
      title: "Sync AIS",
      description: "Forcer maj positions navires",
      icon: RefreshCw,
      color: "#a78bfa",
      onClick: () => Promise.resolve(),
    },
    {
      id: "clear-cache",
      title: "Vider cache",
      description: "Redis + mémoire applicative",
      icon: Zap,
      color: "#f472b6",
      onClick: () => Promise.resolve(),
    },
    {
      id: "broadcast",
      title: "Notification",
      description: "Envoyer alerte à tous users",
      icon: Bell,
      color: "#fb923c",
      onClick: () => Promise.resolve(),
    },
    {
      id: "security-check",
      title: "Audit sécurité",
      description: "Scan rapide vulnérabilités",
      icon: Shield,
      color: "#ef4444",
      onClick: () => Promise.resolve(),
    },
    {
      id: "export-data",
      title: "Export CSV",
      description: "Données complètes plates",
      icon: Download,
      color: "#22d3ee",
      onClick: () => Promise.resolve(),
    },
  ];

  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Actions rapides 1-clic</h2>
          <p className="text-sm text-white/40">
            Automatisez les tâches courantes sans navigation complexe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const isExecuting = executing === action.id;
          const isCompleted = completed.includes(action.id);

          return (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={isExecuting || isCompleted}
              className="group p-4 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] 
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <action.icon
                      className={`w-5 h-5 ${isExecuting ? "animate-spin" : ""}`}
                      style={{ color: action.color }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-white/40 leading-tight">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
