import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GOALS = ["sell", "leads", "engagement", "awareness", "trust", "event"];

const SYSTEM_PROMPT = `Tu es un directeur de stratégie social media senior (20 ans de pratique en marketing et publicité). Tu construis des plans de contenu qui font venir des clients, pas seulement des likes.

PRINCIPES :
- Mix de contenus équilibré sur la période : environ 40 % valeur (conseils, éducation, coulisses), 25 % confiance (preuves, avis fournis, méthode, histoires), 20 % engagement (questions, débats, jeux), 15 % vente directe (offre, promo, appel à commander).
- Aucun jour ne ressemble au précédent : varie les angles, les formats et les hooks.
- Chaque jour a UNE idée, UN objectif, UNE action demandée.
- Progression : commence par attirer et créer la confiance, place les pics de vente en milieu et fin de période.
- Chaque idée est un brief concret et rédigé (angle précis + accroche suggérée), pas un thème vague comme « parler du produit ».
- N'invente jamais de prix, chiffres, avis clients ou promotions qui ne sont pas fournis dans le profil. Quand c'est nécessaire, indique l'information à compléter entre crochets.

FORMAT : réponds UNIQUEMENT avec un objet JSON valide :
{
  "items": [
    {
      "day": 1,
      "theme": "titre court du jour (max 6 mots)",
      "goal": "sell | leads | engagement | awareness | trust | event",
      "network": "un des réseaux autorisés",
      "idea": "brief de 1 à 3 phrases : angle, accroche suggérée, action attendue"
    }
  ]
}
Le tableau doit contenir exactement le nombre de jours demandé, numérotés de 1 à N.`;

function clean(v: unknown, max = 400): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const days = Math.min(Math.max(parseInt(body.days, 10) || 7, 1), 30);
    const allowed = ["facebook", "instagram", "linkedin"];
    const networks: string[] = Array.isArray(body.networks)
      ? body.networks.filter((n: unknown) => typeof n === "string" && allowed.includes(n))
      : [];
    if (networks.length === 0) networks.push("facebook");

    const b = (body.brand || {}) as Record<string, unknown>;
    const brandLines = [
      clean(b.name, 120) && `- Marque / client : ${clean(b.name, 120)}`,
      clean(b.sector, 160) && `- Secteur : ${clean(b.sector, 160)}`,
      clean(b.audience, 300) && `- Cible : ${clean(b.audience, 300)}`,
      clean(b.offer, 500) && `- Offre / produits / prix : ${clean(b.offer, 500)}`,
      clean(b.market, 120) && `- Marché / pays : ${clean(b.market, 120)}`,
      clean(b.voice, 300) && `- Voix de la marque : ${clean(b.voice, 300)}`,
    ].filter(Boolean);

    if (brandLines.length < 2) {
      return NextResponse.json(
        { error: "Renseignez d'abord un profil de marque (nom, secteur, cible, offre) dans l'Assistant." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé IA manquante : ajoutez OPENAI_API_KEY dans Vercel." },
        { status: 400 }
      );
    }

    const focus = clean(body.focus, 400);
    const user = `PROFIL DE LA MARQUE :
${brandLines.join("\n")}

DURÉE : ${days} jours (1 publication par jour)
RÉSEAUX AUTORISÉS (répartis-les de façon naturelle) : ${networks.join(", ")}
${focus ? `PRIORITÉ DU MOMENT : ${focus}` : ""}

Construis le plan de contenu complet.`;

    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Plan API error:", response.status, errText);
      return NextResponse.json(
        { error: `Le service IA a refusé la requête (code ${response.status}).` },
        { status: 502 }
      );
    }

    const data = await response.json();
    let parsed: any;
    try {
      parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch {
      return NextResponse.json({ error: "Plan illisible. Réessayez." }, { status: 502 });
    }

    const raw: any[] = Array.isArray(parsed.items) ? parsed.items : [];
    const items = raw
      .slice(0, days)
      .map((it, i) => ({
        day: i + 1,
        theme: typeof it.theme === "string" ? it.theme.slice(0, 80) : `Jour ${i + 1}`,
        goal: GOALS.includes(it.goal) ? it.goal : "engagement",
        network: networks.includes(it.network) ? it.network : networks[i % networks.length],
        idea: typeof it.idea === "string" ? it.idea.slice(0, 600) : "",
      }))
      .filter((it) => it.idea.length > 3);

    if (items.length === 0) {
      return NextResponse.json({ error: "Plan vide. Réessayez." }, { status: 502 });
    }

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de la création du plan." }, { status: 500 });
  }
}
