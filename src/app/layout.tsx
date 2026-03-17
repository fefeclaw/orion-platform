import type { Metadata } from "next";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Orion Group — Plateforme Logistique Unifiée",
  description:
    "Maritime, Ferroviaire, Routier, Aéroportuaire — 4 piliers, une seule plateforme.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
