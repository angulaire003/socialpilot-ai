"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Save, RefreshCw, Copy, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { addPost } from "@/lib/storage";
import { SocialNetwork, Tone, Post } from "@/lib/types";

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

export default function AssistantPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [network, setNetwork] = useState<SocialNetwork>("facebook");
  const [tone, setTone] = useState<Tone>("professional");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, network, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération");
      setContent(data.content || "");
      setHashtags(data.hashtags || []);
    } catch (e: any) {
      setError(e.message || "Impossible de générer le contenu");
    } finally {
      setLoading(false);
    }
  }

  function handleSave(status: "draft" | "scheduled" = "draft") {
    if (!content.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const post: Post = {
      id: uuidv4(),
      content: content.trim(),
      network,
      status,
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-400" />
          Assistant IA
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Décrivez votre idée, choisissez le réseau et le ton, puis générez.
        </p>
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
            placeholder="Ex : Annoncer le lancement de notre nouvelle offre premium avec 20% de réduction ce week-end..."
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none"
          />
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Ton
            </label>
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
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Générer le contenu
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
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
            rows={8}
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

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => handleSave("draft")}
              disabled={saving || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Enregistrer en brouillon
            </button>
            <button
              onClick={() => {
                handleSave("draft");
                router.push("/posts");
              }}
              disabled={saving || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium py-2.5 transition-colors disabled:opacity-50"
            >
              Enregistrer et voir les publications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
