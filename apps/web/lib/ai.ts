// Couche IA multi-fournisseurs : essaie plusieurs IA dans l'ordre et passe
// automatiquement à la suivante en cas d'erreur (crédit épuisé, limite, panne...).

export type Provider = {
  id: string;
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  extra?: Record<string, unknown>;
};

const DEFAULT_ORDER = ["openai", "deepseek", "grok", "gemini"];

export function getProviders(): Provider[] {
  const env = process.env;

  const all: Record<string, Provider | null> = {
    openai: env.OPENAI_API_KEY
      ? {
          id: "openai",
          label: "OpenAI",
          apiKey: env.OPENAI_API_KEY,
          baseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          model: env.OPENAI_MODEL || "gpt-4o-mini",
        }
      : null,
    deepseek: env.DEEPSEEK_API_KEY
      ? {
          id: "deepseek",
          label: "DeepSeek",
          apiKey: env.DEEPSEEK_API_KEY,
          baseUrl: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
          model: env.DEEPSEEK_MODEL || "deepseek-v4-flash",
          // Les modèles V4 réfléchissent par défaut : on coupe pour aller vite.
          extra: { thinking: { type: "disabled" } },
        }
      : null,
    grok:
      env.GROK_API_KEY || env.XAI_API_KEY
        ? {
            id: "grok",
            label: "Grok (xAI)",
            apiKey: (env.GROK_API_KEY || env.XAI_API_KEY) as string,
            baseUrl: env.GROK_BASE_URL || "https://api.x.ai/v1",
            model: env.GROK_MODEL || "grok-4.7",
          }
        : null,
    gemini: env.GEMINI_API_KEY
      ? {
          id: "gemini",
          label: "Gemini",
          apiKey: env.GEMINI_API_KEY,
          baseUrl:
            env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
          model: env.GEMINI_MODEL || "gemini-2.5-flash",
        }
      : null,
  };

  const custom = (env.AI_PROVIDER_ORDER || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const order = [...custom, ...DEFAULT_ORDER.filter((id) => !custom.includes(id))];

  return order.map((id) => all[id]).filter((p): p is Provider => !!p);
}

export function hasAnyProvider(): boolean {
  return getProviders().length > 0;
}

function extractJSON(text: string): any | null {
  const t = (text || "").trim();
  try {
    return JSON.parse(t);
  } catch {
    /* continue */
  }
  const cleaned = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* continue */
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

type CallResult =
  | { ok: true; json: any }
  | { ok: false; status: number; message: string };

async function callProvider(
  p: Provider,
  system: string,
  user: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number,
  useExtra: boolean
): Promise<CallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isOpenAI = p.baseUrl.includes("api.openai.com");
  const body: Record<string, unknown> = {
    model: p.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };
  // Certains modèles récents d'OpenAI n'acceptent pas de température personnalisée.
  if (!(isOpenAI && /^(gpt-5|o\d)/.test(p.model))) body.temperature = temperature;
  if (isOpenAI) body.max_completion_tokens = maxTokens;
  else body.max_tokens = maxTokens;
  if (useExtra && p.extra) Object.assign(body, p.extra);

  try {
    const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[AI:${p.id}] ${res.status}`, text.slice(0, 500));
      return { ok: false, status: res.status, message: text.slice(0, 200) };
    }

    const data = await res.json();
    const json = extractJSON(data.choices?.[0]?.message?.content || "");
    if (!json) return { ok: false, status: 0, message: "Réponse illisible" };
    return { ok: true, json };
  } catch (e: any) {
    const timedOut = e?.name === "AbortError";
    return { ok: false, status: timedOut ? 408 : 0, message: timedOut ? "Délai dépassé" : "Réseau" };
  } finally {
    clearTimeout(timer);
  }
}

const HINTS: Record<number, string> = {
  401: "clé invalide",
  402: "solde insuffisant",
  403: "accès refusé",
  404: "modèle introuvable",
  408: "délai dépassé",
  429: "crédit épuisé ou trop de requêtes",
};

export async function chatJSON(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  budgetMs?: number;
}): Promise<
  | { ok: true; json: any; provider: string }
  | { ok: false; error: string }
> {
  const providers = getProviders();
  if (providers.length === 0) {
    return { ok: false, error: "Aucune clé IA configurée dans Vercel." };
  }

  const started = Date.now();
  const budget = opts.budgetMs ?? 55000;
  const failures: string[] = [];

  for (const p of providers) {
    const remaining = budget - (Date.now() - started);
    if (remaining < 4000) break;
    const timeout = Math.min(opts.timeoutMs ?? 22000, remaining);

    let r = await callProvider(
      p,
      opts.system,
      opts.user,
      opts.temperature ?? 0.8,
      opts.maxTokens ?? 1800,
      timeout,
      true
    );

    // Paramètre spécifique refusé : on réessaie sans.
    if (!r.ok && r.status === 400 && p.extra) {
      const left = budget - (Date.now() - started);
      if (left > 4000) {
        r = await callProvider(
          p,
          opts.system,
          opts.user,
          opts.temperature ?? 0.8,
          opts.maxTokens ?? 1800,
          Math.min(timeout, left),
          false
        );
      }
    }

    if (r.ok) return { ok: true, json: r.json, provider: p.label };
    failures.push(`${p.label} (${r.status ? `${r.status}, ` : ""}${HINTS[r.status] || r.message})`);
  }

  return {
    ok: false,
    error: `Toutes les IA ont échoué : ${failures.join(" ; ")}. Vérifiez les clés, le crédit et les noms de modèles dans Vercel.`,
  };
}
