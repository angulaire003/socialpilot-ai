import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Ton professionnel, clair, crédible, posé. Autorité tranquille, zéro jargon inutile.",
  commercial: "Ton commercial et persuasif : bénéfices concrets, urgence honnête, appel à l'action net.",
  educational: "Ton éducatif : une idée utile et actionnable que le lecteur peut appliquer aujourd'hui.",
  humorous: "Ton humoristique, vif et sympathique, sans vulgarité. L'humour sert le message, il ne le remplace pas.",
};

const NETWORK_GUIDELINES: Record<string, string> = {
  facebook:
    "Facebook (Page). 80 à 200 mots. Première ligne = accroche qui arrête le scroll (avant le « Voir plus »). Paragraphes de 1 à 2 lignes, beaucoup d'air. 2 à 4 emojis maximum, utilisés comme repères visuels. Termine par UNE question ou UNE action simple. Hashtags : 3 à 5 maximum.",
  instagram:
    "Instagram (légende). 60 à 150 mots. Première ligne = hook fort (elle est tronquée après ~125 caractères). Structure aérée. Emojis possibles. CTA vers commentaire, enregistrement, partage ou DM. Hashtags : 6 à 10, mélange large / niche / marque.",
  linkedin:
    "LinkedIn. 120 à 250 mots. Hook d'une ligne, puis phrases courtes, une par ligne. Insight, leçon ou histoire vécue plutôt que promotion directe. Peu ou pas d'emojis. Termine par une question qui invite au débat. Hashtags : 3 à 5.",
};

const GOAL_INSTRUCTIONS: Record<string, string> = {
  sell: "OBJECTIF : VENDRE. Montre le problème, la transformation, la preuve, puis un appel à l'action d'achat clair (comment commander, où, jusqu'à quand).",
  leads: "OBJECTIF : GÉNÉRER DES CONTACTS. Pousse le lecteur à écrire en message privé / WhatsApp / commentaire avec un mot-clé. Réduis la friction : une seule action demandée.",
  engagement: "OBJECTIF : ENGAGEMENT. Provoque des commentaires, des partages et des enregistrements : question clivante mais respectueuse, opinion, mini-défi, choix A/B.",
  awareness: "OBJECTIF : NOTORIÉTÉ. Fais retenir la marque : une idée simple, mémorable et partageable, avec une signature de ton reconnaissable.",
  trust: "OBJECTIF : CONFIANCE. Montre la preuve : coulisses, résultats, avis, méthode, histoire d'un client. Lève une objection fréquente.",
  event: "OBJECTIF : PROMOTION / ÉVÉNEMENT. Date, lieu, offre, durée limitée, raison d'agir maintenant, et comment réserver.",
};

type Brand = {
  name?: string;
  sector?: string;
  audience?: string;
  offer?: string;
  market?: string;
  voice?: string;
};

function clean(v: unknown, max = 400): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function buildBrandBlock(brand: Brand): string {
  const lines: string[] = [];
  if (brand.name) lines.push(`- Marque / client : ${brand.name}`);
  if (brand.sector) lines.push(`- Secteur : ${brand.sector}`);
  if (brand.audience) lines.push(`- Cible : ${brand.audience}`);
  if (brand.offer) lines.push(`- Offre / produits / prix : ${brand.offer}`);
  if (brand.market) lines.push(`- Marché / pays : ${brand.market}`);
  if (brand.voice) lines.push(`- Voix de la marque : ${brand.voice}`);
  return lines.length
    ? `PROFIL DE LA MARQUE (à respecter strictement) :\n${lines.join("\n")}`
    : "PROFIL DE LA MARQUE : non renseigné. Reste crédible et général, sans inventer de faits.";
}

const SYSTEM_PROMPT = `Tu es un directeur de stratégie social media et copywriter senior, avec plus de 20 ans de pratique en publicité, marketing direct, branding et community management, et des centaines de campagnes à ton actif pour des PME, des commerces et des marques personnelles.
Tu écris pour des publications qui doivent produire des résultats mesurables : messages, clics, contacts, ventes.

MÉTHODE (applique-la à chaque publication) :
1. Une publication = une seule idée, un seul public, une seule action.
2. Hook : la première ligne doit donner envie de lire la suivante (chiffre précis, question qui touche un point sensible, contraste, promesse concrète, mini-histoire). Jamais d'ouverture molle.
3. Structure éprouvée selon le cas : PAS (Problème, Agitation, Solution), AIDA, avant/après, histoire courte, ou liste utile.
4. Parle des bénéfices pour le client, pas des caractéristiques de l'entreprise. Sois spécifique : détails, situations vécues, chiffres fournis.
5. Lève une objection probable (prix, confiance, temps, qualité).
6. Un seul appel à l'action, concret et facile à faire.
7. Phrases courtes, vocabulaire du quotidien du public ciblé, rythme varié.

INTERDITS :
- Les clichés vides : « Découvrez », « N'hésitez pas à », « Dans un monde où », « Plus qu'un simple », « Que pensez-vous de cela ? », « Nous sommes ravis de ».
- Inventer des chiffres, prix, avis clients, promotions, résultats ou garanties qui ne sont pas fournis. S'il manque une information indispensable (prix, date, lieu, contact), écris un repère entre crochets, par exemple [PRIX] ou [NUMÉRO WHATSAPP].
- Les promesses mensongères ou irréalistes (guérison, gains garantis, etc.).

MARCHÉ : si le marché indiqué est l'Afrique francophone (Cameroun, Côte d'Ivoire, Sénégal, etc.), pense WhatsApp comme canal de conversion principal, prix en FCFA, Mobile Money comme moyen de paiement si pertinent, et un français naturel, proche du terrain. Ajuste la langue au marché et à la voix de la marque.

FORMAT DE SORTIE : réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni backticks, avec exactement ces clés :
{
  "content": "la publication complète, prête à publier, avec sauts de ligne (\\n)",
  "hashtags": ["sans le symbole #"],
  "variant_b": "une seconde version complète avec un hook et un angle différents, pour test A/B",
  "visual_idea": "idée précise de visuel ou de vidéo courte (quoi montrer, comment cadrer, texte à l'écran)",
  "best_time": "meilleur créneau conseillé pour publier et pourquoi, en une phrase",
  "why_it_works": "2 phrases : la logique stratégique de ce post et ce qu'il faut mesurer (commentaires, messages, clics)"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, network = "facebook", tone = "professional", goal = "engagement" } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 3) {
      return NextResponse.json(
        { error: "L'idée de publication est trop courte." },
        { status: 400 }
      );
    }

    const brandIn = (body.brand || {}) as Record<string, unknown>;
    const brand: Brand = {
      name: clean(brandIn.name, 120),
      sector: clean(brandIn.sector, 160),
      audience: clean(brandIn.audience, 300),
      offer: clean(brandIn.offer, 500),
      market: clean(brandIn.market, 120),
      voice: clean(brandIn.voice, 300),
    };

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(generateFallback(idea, network, tone));
    }

    const user = `${buildBrandBlock(brand)}

SUJET DE LA PUBLICATION : ${idea.trim().slice(0, 1500)}

RÉSEAU : ${network}
${NETWORK_GUIDELINES[network] || ""}

${GOAL_INSTRUCTIONS[goal] || GOAL_INSTRUCTIONS.engagement}

TON : ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional}

Écris maintenant la publication et les éléments demandés, en respectant le format JSON.`;

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
        max_tokens: 1800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      return NextResponse.json(
        {
          error: `Le service IA a refusé la requête (code ${response.status}). Vérifiez la clé, le crédit du compte et le nom du modèle.`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Réponse IA illisible. Réessayez." },
        { status: 502 }
      );
    }

    const hashtags: string[] = Array.isArray(parsed.hashtags)
      ? parsed.hashtags
          .filter((h: unknown) => typeof h === "string")
          .map((h: string) => h.replace(/^#+/, "").trim())
          .filter(Boolean)
      : [];

    return NextResponse.json({
      content: typeof parsed.content === "string" ? parsed.content : "",
      hashtags,
      variant_b: typeof parsed.variant_b === "string" ? parsed.variant_b : "",
      visual_idea: typeof parsed.visual_idea === "string" ? parsed.visual_idea : "",
      best_time: typeof parsed.best_time === "string" ? parsed.best_time : "",
      why_it_works: typeof parsed.why_it_works === "string" ? parsed.why_it_works : "",
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

  const content = `${tonePrefix[tone] || ""}\n\n${idea.trim()}\n\n(Mode démo : ajoutez OPENAI_API_KEY pour activer l'assistant stratège.)`;

  const networkTags: Record<string, string[]> = {
    facebook: ["facebook", "pagefacebook"],
    instagram: ["instagram", "instagood"],
    linkedin: ["linkedin", "professionnel"],
  };

  return {
    content,
    hashtags: [...(networkTags[network] || []), "marketing", "community"].slice(0, 6),
    variant_b: "",
    visual_idea: "",
    best_time: "",
    why_it_works: "",
  };
}
