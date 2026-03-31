import { Activity } from "lucide-react";

export const metadata = {
  title: "Audit & Logs | ORION Admin",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Activity className="w-7 h-7 text-emerald-400" />
          Audit & Logs
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Journal d&apos;activité et traçabilité complète.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-white/10 bg-white/5">
        <h2 className="font-semibold mb-4">Logs d&apos;accès récents</h2>
        <div className="space-y-2 text-sm">
          {[
            { user: "admin@orion.ci", action: "Connexion", time: "2 min", ip: "196.216.XXX.XXX" },
            { user: "transit@sahel.ci", action: "Génération B/L", time: "15 min", ip: "197.210.XXX.XXX" },
            { user: "logistics@abj.ci", action: "Export données", time: "1h", ip: "41.202.XXX.XXX" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
              <div>
                <span className="font-medium">{log.user}</span>
                <span className="text-white/50 mx-2">•</span>
                <span className="text-sky-400">{log.action}</span>
              </div>
              <div className="text-right text-xs text-white/40">
                <div>{log.time}</div>
                <div>{log.ip}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
