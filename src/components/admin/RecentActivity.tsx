"use client";

import { useEffect, useState } from "react";
import { User, FileText, Activity, Bell, AlertTriangle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "user" | "document" | "system" | "alert";
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

const iconMap = {
  user: User,
  document: FileText,
  system: Activity,
  alert: AlertTriangle,
};

const colorMap = {
  user: "#38bdf8",
  document: "#D4AF37",
  system: "#a78bfa",
  alert: "#ef4444",
};

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then((data) => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(() => {
        setActivities([
          { id: "1", type: "user", action: "Nouveau compte pro", user: "transit@sahel.ci", timestamp: "2 min", details: "Abonnement Standard activé" },
          { id: "2", type: "document", action: "B/L généré", user: "admin@orion.ci", timestamp: "5 min", details: "Réf: ORN-MT-2026-0154" },
          { id: "3", type: "alert", action: "Alerte congestion", user: "Système", timestamp: "12 min", details: "Port Abidjan > 60% occupation" },
          { id: "4", type: "system", action: "Sync AIS complétée", user: "Système", timestamp: "15 min", details: "47 navires mis à jour" },
          { id: "5", type: "document", action: "CMR signé", user: "logistics@abj.ci", timestamp: "28 min", details: "Réf: ORN-RD-2026-0089" },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-white/10 bg-white/5">
        <p className="text-center text-white/40 py-8">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Activité récente</h2>
        <button className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
          Voir tout →
        </button>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          const color = colorMap[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <span className="text-xs text-white/30">{activity.timestamp}</span>
                </div>
                <p className="text-xs text-white/40">{activity.user}</p>
                {activity.details && (
                  <p className="text-xs text-white/50 mt-1">{activity.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
