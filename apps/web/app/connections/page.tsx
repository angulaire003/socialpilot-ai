"use client";

import { Facebook, Instagram, Linkedin, Shield, ExternalLink } from "lucide-react";

const networks = [
  {
    id: "facebook",
    name: "Facebook Pages",
    description: "Connectez vos Pages Facebook pour publier et programmer automatiquement.",
    icon: Facebook,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    status: "ready" as const,
    note: "Nécessite une application Meta Developer + OAuth. Configuration en Phase 6.",
  },
  {
    id: "instagram",
    name: "Instagram professionnel",
    description: "Compte Instagram Business ou Creator lié à une Page Facebook.",
    icon: Instagram,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    status: "ready" as const,
    note: "Utilise les API officielles Meta (Instagram Graph API).",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Pages entreprise et profils personnels professionnels.",
    icon: Linkedin,
    color: "text-sky-600",
    bg: "bg-sky-600/10",
    status: "coming" as const,
    note: "Intégration LinkedIn Marketing API prévue après Meta.",
  },
];

export default function ConnectionsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Réseaux sociaux</h1>
        <p className="text-slate-400 text-sm mt-1">
          Préparez la connexion officielle de vos comptes. Aucune simulation de
          publication n&apos;est effectuée.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Sécurité & conformité</p>
          <p className="mt-1 text-amber-100/70">
            Les jetons d&apos;accès seront stockés de façon chiffrée côté serveur.
            Les publications réelles ne se feront qu&apos;après validation OAuth
            et confirmation de l&apos;API Meta. Aucun faux succès ne sera affiché.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {networks.map((net) => (
          <div
            key={net.id}
            className="rounded-2xl border border-slate-800 bg-[#111827] p-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${net.bg} flex items-center justify-center shrink-0`}
              >
                <net.icon className={`w-6 h-6 ${net.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white">{net.name}</h3>
                  {net.status === "ready" ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                      Prêt à configurer
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      Bientôt
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{net.description}</p>
                <p className="text-xs text-slate-500 mt-2">{net.note}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                disabled
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-medium cursor-not-allowed opacity-70"
              >
                Configurer OAuth (Phase 6)
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-300 mb-2">Prochaines étapes techniques</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Créer une application sur developers.facebook.com</li>
          <li>Ajouter les produits Facebook Login + Instagram Graph API</li>
          <li>Configurer les Redirect URIs vers ce domaine Vercel</li>
          <li>Implémenter le flux OAuth côté serveur (API routes Next.js)</li>
          <li>Stocker les tokens chiffrés et gérer le refresh</li>
        </ol>
        <a
          href="https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-sky-400 hover:text-sky-300"
        >
          Documentation Meta OAuth
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
