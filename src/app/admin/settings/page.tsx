import { Settings } from "lucide-react";

export const metadata = {
  title: "Paramètres | ORION Admin",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-purple-400" />
          Paramètres Système
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Configuration globale de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "API Keys", desc: "Gestion des clés Ship24, MarineTraffic, Orange SMS" },
          { title: "Notifications", desc: "Configuration alertes email et SMS" },
          { title: "Sécurité", desc: "2FA, sessions, politique de mots de passe" },
          { title: "Tarification", desc: "Modification des plans et limites" },
        ].map((setting) => (
          <div key={setting.title} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors">
            <h3 className="font-medium mb-1">{setting.title}</h3>
            <p className="text-sm text-white/50">{setting.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
