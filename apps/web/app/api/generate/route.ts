import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Ton professionnel, clair, crédible et soigné.",
  commercial: "Ton commercial, persuasif, orienté bénéfices et appel à l'action.",
  educational: "Ton éducatif, pédagogique, utile et structuré.",
  humorous: "Ton humoristique, léger, engageant et sympathique (sans vulgarité).",
};

const NETWORK_GUIDELINES: Record<string, string> = {
  facebook: "Publication Facebook (Pages). Texte engageant, 1 à 3 paragraphes courts, emojis modérés si pertinents.",
  instagram: "Légende Instagram professionnelle. Style captivant, emojis possibles, structure aérée.",
  linkedin: "Publication LinkedIn. Ton plus formel, valeur ajoutée, storytelling ou insight professionnel.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, network = "facebook", tone = "professional" } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 3) {
      return NextResponse.json(
        { error: "L'idée de publication est trop courte." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      // Fallback local intelligent (sans clé) pour que le MVP reste utilisable
      const fallback = generateFallback(idea, network, tone);
      return NextResponse.json(fallback);
    }

    const system = `Tu es un expert en community management et copywriting pour les réseaux sociaux.
Tu génères des publications prêtes à publier.
Réponds UNIQUEMENT en JSON valide avec exactement ces clés :
{
  "content": "le texte complet de la publication",
  "hashtags": ["hashtag1", "hashtag2", ...]
}
Ne mets jamais de markdown, de backticks ou de texte hors du JSON.`;

    const user = `Idée de l'utilisateur : ${idea.trim()}

Réseau : ${network}
${NETWORK_GUIDELINES[network] || ""}

Ton : ${tone}
${TONE_INSTRUCTIONS[tone] || ""}

Génère le contenu adapté + 4 à 8 hashtags pertinents (sans le symbole # dans le tableau).`;

    // Compatible OpenAI et endpoints OpenAI-compatible (Grok, etc.)
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
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.75,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      // Fallback si l'API échoue
      const fallback = generateFallback(idea, network, tone);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = generateFallback(idea, network, tone);
    }

    return NextResponse.json({
      content: parsed.content || "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la génération." },
      { status: 500 }
    );
  }
}

function generateFallback(idea: string, network: string, tone: string) {
  const tonePrefix: Record<string, string> = {
    professional: "Voici une publication professionnelle :",
    commercial: "Découvrez cette offre exclusive !",
    educational: "Saviez-vous que...",
    humorous: "Petite anecdote du jour 😄",
  };

  const content = `${tonePrefix[tone] || ""}

${idea.trim()}

Que pensez-vous de cela ? N'hésitez pas à commenter et partager !`;

  const baseTags = ["socialmedia", "contenu", "marketing", "community"];
  const networkTags: Record<string, string[]> = {
    facebook: ["facebook", "pagefacebook"],
    instagram: ["instagram", "instagood"],
    linkedin: ["linkedin", "professionnel"],
  };

  return {
    content,
    hashtags: [...(networkTags[network] || []), ...baseTags].slice(0, 7),
  };
}
