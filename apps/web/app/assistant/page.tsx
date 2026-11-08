"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Save,
  RefreshCw,
  Copy,
  Check,
  Briefcase,
  ChevronDown,
  Lightbulb,
  Clock,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { addPost } from "@/lib/storage";
import { SocialNetwork, Tone, Post } from "@/lib/types";

type Goal = "sell" | "leads" | "engagement" | "awareness" | "trust" | "event";

type Brand = {
  id: string;
  name: string;
  sector: string;
  audience: string;
  offer: string;
  market: string;
  voice: string;
};

type Extras = {
  variant_b: string;
  visual_idea: string;
  best_time: string;
  why_it_works: string;
};

const networks: { value: SocialNetwork; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
];

const tones: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professionnel" },
  { value: "commercial", label: "Commercial" },
  { value: "educational", label: "Éducatif" },
  { value: "humorous", label: "Humoristique" },
];

const goals: { value: Goal; label: string }[] = [
  { value: "sell", label: "Vendre" },
  { value: "leads", label: "Générer des contacts" },
  { value: "engagement", label: "Engagement" },
  { value: "trust", label: "Confiance" },
  { value: "event", label: "Promo / événement" },
  { value: "awareness", label: "Notoriété" },
];

const BRANDS_KEY = "socialpilot_brands_v1";
const ACTIVE_KEY = "socialpilot_active_brand_v1";

const emptyBrand = (): Brand => ({
  id: "",
  name: "",
  sector: "",
  audience: "",
  offer: "",
  market: "",
  voice: "",
});

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

export default function AssistantPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [network, setNetwork] = useState<SocialNetwork>("facebook");
  const [tone, setTone] = useState<Tone>("professional");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extras | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrand] = useState<Brand>(emptyBrand());
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRANDS_KEY);
      const list: Brand[] = raw ? JSON.parse(raw) : [];
      setBrands(list);
      const activeId = localStorage.getItem(ACTIVE_KEY);
      const active = list.find((b) => b.id === activeId);
      if (active) setBrand(active);
    } catch {
      /* ignore */
    }
  }, []);

  function persistBrands(list: Brand[], activeId: string) {
    setBrands(list);
    try {
      localStorage.setItem(BRANDS_KEY, JSON.stringify(list));
      localStorage.setItem(ACTIVE_KEY, activeId);
    } catch {
      /* ignore */
    }
  }

  function saveBrand() {
    if (!brand.name.trim()) return;
    const id = brand.id || uuidv4();
    const updated: Brand = { ...brand, id };
    const exists = brands.some((b) => b.id === id);
    const list = exists
      ? brands.map((b) => (b.id === id ? updated : b))
      : [updated, ...brands];
    setBrand(updated);
    persistBrands(list, id);
  }

  function selectBrand(id: string) {
    if (!id) {
      setBrand(emptyBrand());
      try {
        localStorage.setItem(ACTIVE_KEY, "");
      } catch {
        /* ignore */
      }
      return;
    }
    const found = brands.find((b) => b.id === id);
    if (found) {
      setBrand(found);
      try {
        localStorage.setItem(ACTIVE_KEY, id);
      } catch {
        /* ignore */
      }
    }
  }

  function deleteBrand() {
    if (!brand.id) return;
    persistBrands(
      brands.filter((b) => b.id !== brand.id),
      ""
    );
    setBrand(emptyBrand());
  }

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          network,
          tone,
          goal,
          brand: {
            name: brand.name,
            sector: brand.sector,
            audience: brand.audience,
            offer: brand.offer,
            market: brand.market,
            voice: brand.voice,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération");
      setContent(data.content || "");
      setHashtags(data.hashtags || []);
      setExtras({
        variant_b: data.variant_b || "",
        visual_idea: data.visual_idea || "",
        best_time: data.best_time || "",
        why_it_works: data.why_it_works || "",
      });
    } catch (e: any) {
      setError(e.message || "Impossible de générer le contenu");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const post: Post = {
      id: uuidv4(),
      content: content.trim(),
      network,
      status: "draft",
      scheduledAt: null,
      createdAt: now,
      updatedAt: now,
      hashtags,
    };
    addPost(post);
    setSaving(false);
    router.push("/posts");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(
      content + (hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function useVariantB() {
    if (!extras?.variant_b) return;
    const previousA = content;
    setContent(extras.variant_b);
    setExtras({ ...extras, variant_b: previousA });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-400" />
          Assistant stratège
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Renseignez la marque, l&apos;objectif et l&apos;idée : l&apos;IA écrit comme un directeur
          de stratégie social media.
        </p>
      </div>

      {/* Brand profile */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827]">
        <button
          type="button"
          onClick={() => setShowBrand(!showBrand)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Briefcase className="w-4 h-4 text-violet-400" />
            {brand.name ? `Marque : ${brand.name}` : "Profil de la marque / du client"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${showBrand ? "rotate-180" : ""}`}
          />
        </button>

        {showBrand && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
            <p className="text-xs text-slate-400">
              Plus le profil est précis, meilleurs sont les textes. Créez un profil par client
              pour gérer plusieurs comptes.
            </p>

            <select
              value={brand.id}
              onChange={(e) => selectBrand(e.target.value)}
              className={inputClass}
            >
              <option value="">+ Nouveau profil</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              placeholder="Nom de la marque / du client"
              value={brand.name}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Secteur (ex : restaurant, boutique de mode, coiffure...)"
              value={brand.sector}
              onChange={(e) => setBrand({ ...brand, sector: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Cible (ex : femmes 25-40 ans à Douala)"
              value={brand.audience}
              onChange={(e) => setBrand({ ...brand, audience: e.target.value })}
            />
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Offre, produits et prix (ex : coupe + soin 5 000 FCFA, livraison gratuite)"
              value={brand.offer}
              onChange={(e) => setBrand({ ...brand, offer: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Marché / pays (ex : Cameroun)"
              value={brand.market}
              onChange={(e) => setBrand({ ...brand, market: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Voix de la marque (ex : chaleureuse, directe, un peu d'humour)"
              value={brand.voice}
              onChange={(e) => setBrand({ ...brand, voice: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveBrand}
                disabled={!brand.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-medium py-2.5"
              >
                <Save className="w-4 h-4" />
                Enregistrer le profil
              </button>
              {brand.id && (
                <button
                  type="button"
                  onClick={deleteBrand}
                  className="px-3 rounded-xl border border-slate-700 text-slate-300 hover:text-red-400 hover:bg-slate-800"
                  title="Supprimer le profil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Idée de publication
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ex : Annoncer notre promo du week-end : -20% sur les coupes + soin, jusqu'à dimanche..."
            rows={4}
            className={`${inputClass} py-3 resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Objectif du post
          </label>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  goal === g.value
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Réseau social
            </label>
            <div className="flex flex-wrap gap-2">
              {networks.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNetwork(n.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    network === n.value
                      ? "bg-sky-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ton</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tone === t.value
                      ? "bg-violet-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !idea.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Le stratège rédige...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Générer le contenu
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Result */}
      {(content || loading) && (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Résultat</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Copier"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Régénérer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-y"
            placeholder="Le texte généré apparaîtra ici. Vous pouvez le modifier librement."
          />

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {extras && (extras.visual_idea || extras.best_time || extras.why_it_works || extras.variant_b) && (
            <div className="space-y-3 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5">
              {extras.visual_idea && (
                <div className="flex gap-2.5 text-sm">
                  <ImageIcon className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Visuel : </span>
                    {extras.visual_idea}
                  </p>
                </div>
              )}
              {extras.best_time && (
                <div className="flex gap-2.5 text-sm">
                  <Clock className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Quand publier : </span>
                    {extras.best_time}
                  </p>
                </div>
              )}
              {extras.why_it_works && (
                <div className="flex gap-2.5 text-sm">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Stratégie : </span>
                    {extras.why_it_works}
                  </p>
                </div>
              )}
              {extras.variant_b && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Variante B (test A/B)
                  </p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{extras.variant_b}</p>
                  <button
                    type="button"
                    onClick={useVariantB}
                    className="text-sm text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Échanger avec la version actuelle
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium py-2.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Enregistrer en brouillon
          </button>
        </div>
      )}
    </div>
  );
}
