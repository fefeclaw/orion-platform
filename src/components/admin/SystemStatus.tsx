"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Server, Wifi } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  latency: number;
  icon: React.ElementType;
}

export function SystemStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "API Next.js", status: "up", latency: 45, icon: Server },
    { name: "SQLite DB", status: "up", latency: 12, icon: Database },
    { name: "Cache Redis", status: "up", latency: 8, icon: Activity },
    { name: "AIS Provider", status: "degraded", latency: 890, icon: Wifi },
  ]);
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/admin/health")
        .then((r) => r.json())
        .then((data) => {
          if (data.services) setServices(data.services);
          setLastCheck(new Date());
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    up: "bg-emerald-500",
    degraded: "bg-amber-500",
    down: "bg-red-500",
  };

  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">État système</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-white/50">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]"
          >
            <div className="flex items-center gap-3">
              <service.icon className="w-4 h-4 text-white/40" />
              <span className="text-sm">{service.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">{service.latency}ms</span>
              <span className={`w-2 h-2 rounded-full ${statusColors[service.status]}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/30 text-center">
          Dernière vérification : {lastCheck.toLocaleTimeString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
