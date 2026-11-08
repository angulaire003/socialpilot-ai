"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { CalendarRange, Loader2, Sparkles, Check, AlertTriangle } from "lucide-react";
import { addPost } from "@/lib/storage";
import { Post, SocialNetwork } from "@/lib/types";

type Brand = {
  id: string;
  name: string;
  sector: string;
  audience: string;
  offer: string;
  market: string;
  voice: string;
};

type PlanItem = {
  day: number;
  theme: string;
  goal: string;
  network: SocialNetwork;
  idea: string;
};

type Status = "idle" | "outlining" | "writing" | "done";

const BRANDS_KEY = "socialpilot_brands_v1";
const ACTIVE_KEY = "socialpilot_active_brand_v1";

const goalLabels: Record<string, string> = {
  sell: "Vendre",
  leads: "Contacts",
  engagement: "Engagement",
  awareness: "Notoriété",
  trust: "Confiance",
  event: "Promo",
};

const networkOptions: { value: SocialNetwork; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
];

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500";

export default function PlanPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [days, setDays] = useState(7);
  const [networks, setNetworks] = useState<SocialNetwork[]>(["facebook"]);
  const [focus, setFocus] = useState("");
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("18:00");
  const [status, setStatus] = useState<Status>("idle");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [failed, setFailed] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRANDS_KEY);
      const list: Brand[] = raw ? JSON.parse(raw) : [];
      setBrands(list);
      const active = localStorage.getItem(ACTIVE_KEY) || "";
      setBrandId(list.find((b) => b.id === active)?.id || list[0]?.id || "");
    } catch {
      /* ignore */
    }
  }, []);

  const brand = brands.find((b) => b.id === brandId);

  function toggleNetwork(n: SocialNetwork) {
    setNetworks((prev) =>
      prev.includes(n) ? (prev.length > 1 ? prev.filter((x) => x !== n) : prev) : [...prev, n]
    );
  }

  async function generateOne(item: PlanItem, b: Brand): Promise<{ content: string; hashtags: string[] } | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: `${item.theme}. ${item.idea}`,
            network: item.network,
            tone: item.goal === "sell" || item.goal === "event" ? "commercial" : "professional",
            goal: item.goal,
            brand: {
              name: b.name,
              sector: b.sector,
              audience: b.audience,
              offer: b.offer,
              market: b.market,
              voice: b.voice,
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.content) {
          return { content: data.content, hashtags: data.hashtags || [] };
        }
      } catch {
        /* retry */
      }
    }
    return null;
  }

  async function handleStart() {
    if (!brand) return;
    cancelRef.current = false;
    setError(null);
    setItems([]);
    setFailed([]);
    setDoneCount(0);
    setStatus("outlining");

    let plan: PlanItem[] = [];
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, days, networks, focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de création du plan");
      plan = data.items as PlanItem[];
      setItems(plan);
    } catch (e: any) {
      setError(e.message || "Impossible de créer le plan");
      setStatus("idle");
      return;
    }

    setStatus("writing");
    const failures: number[] = [];
    for (let i = 0; i < plan.length; i++) {
      if (cancelRef.current) break;
      const item = plan[i];
      const result = await generateOne(item, brand);
      if (result) {
        const when = addDays(new Date(`${startDate}T${time}:00`), i);
        const now = new Date().toISOString();
        const post: Post = {
          id: uuidv4(),
          title: item.theme,
          content: result.content.trim(),
          network: item.network,
          status: "scheduled",
          scheduledAt: when.toISOString(),
          createdAt: now,
          updatedAt: now,
          hashtags: result.hashtags,
        };
        addPost(post);
      } else {
        failures.push(item.day);
        setFailed([...failures]);
      }
      setDoneCount(i + 1);
    }
    setStatus("done");
  }

  const total = items.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const busy = status === "outlining" || status === "writing";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarRange className="w-6 h-6 text-emerald-400" />
          Plan de contenu
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Un mois ou une semaine de publications complètes, prêtes dans votre calendrier.
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 space-y-2">
          <p>Créez d&apos;abord un profil de marque : c&apos;est ce qui rend les textes précis.</p>
          <Link href="/assistant" className="inline-block font-medium text-sky-400 hover:text-sky-300">
            Aller à l&apos;Assistant →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Marque / client</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              disabled={busy}
              className={inputClass}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Durée</label>
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={busy}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    days === d ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {d} jours
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Réseaux</label>
            <div className="flex flex-wrap gap-2">
              {networkOptions.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  disabled={busy}
                  onClick={() => toggleNetwork(n.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    networks.includes(n.value)
                      ? "bg-sky-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Premier jour</label>
              <input
                type="date"
                value={startDate}
                disabled={busy}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Heure</label>
              <input
                type="time"
                value={time}
                disabled={busy}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Priorité du moment (facultatif)
            </label>
            <textarea
              rows={2}
              value={focus}
              disabled={busy}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex : lancer la nouvelle collection, remplir les rendez-vous du week-end..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={busy || !brand || !startDate}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 transition-colors"
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === "outlining" ? "Construction du plan..." : `Rédaction ${doneCount}/${total}`}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Créer le plan de {days} jours
              </>
            )}
          </button>

          {status === "writing" && (
            <button
              type="button"
              onClick={() => (cancelRef.current = true)}
              className="w-full text-sm text-slate-400 hover:text-white"
            >
              Arrêter (les posts déjà écrits sont conservés)
            </button>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Plan</h2>
            <span className="text-xs text-slate-400">{pct} %</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>

          <ul className="divide-y divide-slate-800">
            {items.map((it, i) => {
              const written = i < doneCount && !failed.includes(it.day);
              const bad = failed.includes(it.day);
              return (
                <li key={it.day} className="py-2.5 flex gap-3 text-sm">
                  <span className="w-12 shrink-0 text-slate-500">J{it.day}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{it.theme}</p>
                    <p className="text-xs text-slate-400">
                      {goalLabels[it.goal] || it.goal} · {it.network}
                    </p>
                  </div>
                  {written && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {bad && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                </li>
              );
            })}
          </ul>

          {status === "done" && (
            <div className="space-y-2 pt-1">
              <p className="text-sm text-emerald-300">
                {doneCount - failed.length} publication(s) ajoutée(s) au calendrier.
                {failed.length > 0 && ` ${failed.length} ont échoué (jours ${failed.join(", ")}) : relancez ou écrivez-les dans l'Assistant.`}
              </p>
              <div className="flex gap-2">
                <Link
                  href="/calendar"
                  className="flex-1 text-center rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium py-2.5"
                >
                  Voir le calendrier
                </Link>
                <Link
                  href="/posts"
                  className="flex-1 text-center rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5"
                >
                  Voir les publications
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
