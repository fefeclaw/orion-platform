import Link from "next/link";
import { Plus, Users } from "lucide-react";

export const metadata = {
  title: "Gestion Utilisateurs | ORION Admin",
};

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-sky-400" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Créez et gérez les comptes professionnels et administrateurs.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </Link>
      </div>

      <div className="p-8 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center">
        <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">
          Le module de gestion des utilisateurs est en cours d&apos;implémentation.
          <br />
          Les fonctionnalités incluent : création rapide 1-clic, attribution des rôles,
          <br />
          gestion des abonnements et historique d&apos;activité.
        </p>
        <p className="text-sm text-sky-400 mt-4">
          → Utilisez l&apos;action rapide &quot;Nouvel utilisateur&quot; depuis le dashboard
        </p>
      </div>
    </div>
  );
}
