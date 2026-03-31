import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Documents | ORION Admin",
};

export default async function AdminDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#D4AF37]" />
            Gestion des Documents
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Générez et archivez tous les documents logistiques.
          </p>
        </div>
        <Link
          href="/admin/documents/generate"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f0cc5c] text-[#0a0e1a] font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Générer document
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: "B/L Maritime", count: 248, icon: "🚢", color: "blue" },
          { type: "CMR Routier", count: 156, icon: "🚛", color: "amber" },
          { type: "LV Ferroviaire", count: 89, icon: "🚂", color: "emerald" },
          { type: "AWB Aérien", count: 124, icon: "✈️", color: "sky" },
        ].map((doc) => (
          <div key={doc.type} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors">
            <div className="text-2xl mb-2">{doc.icon}</div>
            <p className="text-sm text-white/50">{doc.type}</p>
            <p className="text-2xl font-bold">{doc.count}</p>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center">
        <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">
          Interface complète d&apos;archivage et recherche en cours d&apos;implémentation.
          <br />
          Actions rapides disponibles depuis le dashboard.
        </p>
      </div>
    </div>
  );
}
