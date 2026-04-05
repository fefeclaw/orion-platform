/**
 * Page /pricing — Offres ORION Logistics
 * 3 tiers : Gratuit / Standard / Business
 * Dark mode obligatoire, design cohérent avec DeckLayout.
 */
"use client";

import Link from "next/link";

// ─── Données des offres ────────────────────────────────────────────────────

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: "0 XOF",
    period: "",
    subtitle: "Grand public",
    badge: null,
    color: {
      border: "border-slate-700",
      badgeBg: "",
      buttonBg: "bg-slate-700 hover:bg-slate-600",
      buttonText: "text-white",
      headerBg: "bg-slate-800",
    },
    cta: "Commencer gratuitement",
    ctaHref: "/",
    ctaTarget: "_self",
    features: [
      { label: "Suivi colis public (référence ORN)", included: true },
      { label: "Notifications SMS livraison",        included: true },
      { label: "Dashboard professionnel",            included: false },
      { label: "Tracking conteneurs Ship24",         included: false, note: "—" },
      { label: "Suivi navires AIS temps réel",       included: false },
      { label: "Génération documents (B/L, LV…)",   included: false },
      { label: "Prédiction retards IA",              included: false },
      { label: "Tracking multimodal unifié ORN-XX",  included: false },
      { label: "Infos géopolitiques + taux de change", included: false },
      { label: "API Orion (accès programmatique)",   included: false },
      { label: "Comptes employés",                   included: true, note: "1 compte" },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "15 000 XOF",
    period: "/ mois",
    subtitle: "PME & transitaires",
    badge: "Recommandé PME",
    color: {
      border: "border-[#0F6E56]",
      badgeBg: "bg-[#0F6E56]",
      buttonBg: "bg-[#0F6E56] hover:bg-[#0d5c47]",
      buttonText: "text-white",
      headerBg: "bg-[#0a3d30]",
    },
    cta: "Commencer l'essai gratuit",
    ctaHref: "/",
    ctaTarget: "_self",
    features: [
      { label: "Suivi colis public (référence ORN)", included: true },
      { label: "Notifications SMS livraison",        included: true },
      { label: "Dashboard professionnel",            included: true, note: "2 piliers au choix" },
      { label: "Tracking conteneurs Ship24",         included: true, note: "50 / mois" },
      { label: "Suivi navires AIS (différé 15min)",  included: true },
      { label: "Génération documents (B/L, LV…)",   included: true, note: "10 / mois" },
      { label: "Prédiction retards IA",              included: false },
      { label: "Tracking multimodal unifié ORN-XX",  included: false },
      { label: "Infos géopolitiques + taux de change", included: false },
      { label: "API Orion (accès programmatique)",   included: false },
      { label: "Comptes employés",                   included: true, note: "5 max" },
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "Sur devis",
    period: "",
    subtitle: "Grandes entreprises",
    badge: null,
    color: {
      border: "border-[#185FA5]",
      badgeBg: "bg-[#185FA5]",
      buttonBg: "bg-[#185FA5] hover:bg-[#144d87]",
      buttonText: "text-white",
      headerBg: "bg-[#0e3766]",
    },
    cta: "Nous contacter",
    ctaHref: "mailto:contact@orion-logistique.ci",
    ctaTarget: "_blank",
    features: [
      { label: "Suivi colis public (référence ORN)", included: true },
      { label: "Notifications SMS livraison",        included: true },
      { label: "Dashboard professionnel",            included: true, note: "4 piliers complets" },
      { label: "Tracking conteneurs Ship24",         included: true, note: "Illimité" },
      { label: "Suivi navires AIS temps réel",       included: true },
      { label: "Génération documents (B/L, LV…)",   included: true, note: "Illimité" },
      { label: "Prédiction retards IA",              included: true },
      { label: "Tracking multimodal unifié ORN-XX",  included: true },
      { label: "Infos géopolitiques + taux de change", included: true },
      { label: "API Orion (accès programmatique)",   included: true },
      { label: "Comptes employés",                   included: true, note: "Illimité" },
    ],
  },
] as const;

// ─── Composant card offre ──────────────────────────────────────────────────

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  return (
    <div
      className={`
        relative flex flex-col rounded-xl border-2 ${plan.color.border}
        bg-[#0a0e1a] overflow-hidden
        transition-transform duration-200 hover:-translate-y-1
      `}
    >
      {/* Badge recommandé */}
      {plan.badge && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white ${plan.color.badgeBg}`}>
          {plan.badge}
        </div>
      )}

      {/* En-tête */}
      <div className={`px-6 py-6 ${plan.color.headerBg}`}>
        <p className="text-sm text-slate-400 mb-1">{plan.subtitle}</p>
        <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-white">{plan.price}</span>
          {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
        </div>
      </div>

      {/* Liste des fonctionnalités */}
      <div className="flex-1 px-6 py-5 space-y-3">
        {plan.features.map((f) => (
          <div key={f.label} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                f.included
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-600"
              }`}
            >
              {f.included ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${f.included ? "text-slate-200" : "text-slate-600"}`}>
                {f.label}
              </span>
              {"note" in f && f.note && (
                <span className="ml-2 text-xs text-[#F59E0B] font-medium">
                  {f.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton CTA */}
      <div className="px-6 pb-6 pt-4">
        <a
          href={plan.ctaHref}
          target={plan.ctaTarget}
          rel={plan.ctaTarget === "_blank" ? "noopener noreferrer" : undefined}
          className={`
            block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm
            transition-colors duration-150
            ${plan.color.buttonBg} ${plan.color.buttonText}
          `}
        >
          {plan.cta}
        </a>
      </div>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#05080f] text-white">
      {/* Navigation retour */}
      <div className="border-b border-slate-800 px-6 py-4">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Retour au dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-black text-[#F59E0B]">ORION</span>
            <span className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              Autonomous Logistics Platform
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Choisissez votre offre
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Accédez aux outils logistiques les plus avancés d'Afrique de l'Ouest.
            6 mois gratuits pour les 50 premiers professionnels inscrits.
          </p>

          {/* Bandeau promotion lancement */}
          <div className="mt-6 inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full px-6 py-2">
            <span className="text-[#F59E0B] text-sm font-semibold">
              🚀 Offre de lancement — 6 mois offerts pour les 50 premiers professionnels
            </span>
          </div>
        </div>

        {/* Cards offres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Section amortissement APIs */}
        <div className="mt-16 border border-slate-800 rounded-xl bg-slate-900/50 p-8">
          <h3 className="text-lg font-bold text-white mb-4">À propos des intégrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[#F59E0B] font-semibold mb-1">Ship24</p>
              <p className="text-slate-400">
                Tracking colis routiers (DHL, transporteurs locaux) et conteneurs par numéro B/L.
                Couvert dès 4 abonnés Standard.
              </p>
            </div>
            <div>
              <p className="text-[#F59E0B] font-semibold mb-1">MarineTraffic AIS</p>
              <p className="text-slate-400">
                Positions navires en temps réel. Données différées 15 min en Standard,
                temps réel en Business.
              </p>
            </div>
            <div>
              <p className="text-[#F59E0B] font-semibold mb-1">SMS Orange CI</p>
              <p className="text-slate-400">
                Notifications SMS mutualisées sur tous les abonnés.
                Inclus dans tous les plans.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            Questions sur les offres Enterprise ?{" "}
            <a
              href="mailto:contact@orion-logistique.ci"
              className="text-[#F59E0B] hover:underline font-medium"
            >
              contact@orion-logistique.ci
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
