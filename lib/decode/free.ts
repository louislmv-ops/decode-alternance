import 'server-only';
import { z } from 'zod/v4';
import { DecodeError } from './claude';
import { DecodedOfferSchema, type DecodedOffer } from './schema';
import { SYSTEM_PROMPT, userPrompt } from './prompt';

// Traduction des offres par une IA à palier gratuit (Google Gemini, Mistral, Groq), toutes appelées
// au même format « chat completions ». Le texte d'une offre est public : on peut l'envoyer à un
// palier gratuit, qui peut s'en servir pour s'entraîner. Les CV, eux, n'y passent jamais.

const PROVIDERS = {
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-small-latest' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
} as const;

type Provider = keyof typeof PROVIDERS;

function provider(): { url: string; model: string } | null {
  const name = (process.env.AI_PROVIDER || 'gemini').toLowerCase() as Provider;
  const preset = PROVIDERS[name];
  if (!process.env.AI_API_KEY || !preset) return null;
  return { url: process.env.AI_API_URL || preset.url, model: process.env.AI_MODEL || preset.model };
}

export function isFreeAiConfigured(): boolean {
  return provider() !== null;
}

/** Les paliers gratuits limitent le nombre d'appels par jour : on s'arrête avant, pour tout le serveur. */
const DAILY = Number(process.env.AI_DAILY_LIMIT || 200);
let day = { date: '', calls: 0 };

const JSON_RULES = `

Réponds uniquement par un objet JSON valide, sans texte autour, qui respecte exactement ce schéma JSON (mêmes clés, mêmes valeurs possibles) :
${JSON.stringify(z.toJSONSchema(DecodedOfferSchema))}`;

/** Le JSON de la réponse, même entouré de \`\`\`json par un modèle trop bavard. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function complete(p: { url: string; model: string }, messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: p.model, messages, temperature: 0.2, response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(90_000),
  }).catch(() => {
    throw new DecodeError('Le service de traduction ne répond pas. Réessaie plus tard.', 502);
  });
  if (res.status === 429) throw new DecodeError('Le quota gratuit de l’IA est atteint pour le moment. Réessaie plus tard.', 429);
  if (res.status === 401 || res.status === 403) throw new DecodeError('La clé d’API n’est pas valide.', 500);
  if (!res.ok) throw new DecodeError('Le service de traduction ne répond pas. Réessaie plus tard.', 502);
  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function decodeWithFreeAi(offerText: string): Promise<{ decoded: DecodedOffer; model: string }> {
  const p = provider();
  if (!p) throw new DecodeError('La traduction par l’IA n’est pas encore activée sur ce site.', 503);
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, calls: 0 };
  if (day.calls >= DAILY) throw new DecodeError('Le quota gratuit de traductions du jour est atteint. Réessaie demain.', 429);
  day.calls += 1;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + JSON_RULES },
    { role: 'user', content: userPrompt(offerText) },
  ];
  const first = await complete(p, messages);
  let parsed = DecodedOfferSchema.safeParse(extractJson(first));
  if (!parsed.success) {
    // Une seconde chance, en montrant au modèle ce qui ne va pas.
    const problems = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join('.')} : ${i.message}`)
      .join('\n');
    const second = await complete(p, [
      ...messages,
      { role: 'assistant', content: first },
      { role: 'user', content: `Ce JSON ne respecte pas le schéma :\n${problems}\nRenvoie l’objet JSON complet et corrigé, rien d’autre.` },
    ]);
    parsed = DecodedOfferSchema.safeParse(extractJson(second));
  }
  if (!parsed.success) throw new DecodeError('La traduction n’a pas abouti. Réessaie dans un instant.', 502);
  return { decoded: parsed.data, model: p.model };
}
