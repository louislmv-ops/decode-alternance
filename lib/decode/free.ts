import 'server-only';
import { z } from 'zod/v4';
import { DecodeError } from './claude';
import { DecodedOfferSchema, type DecodedOffer } from './schema';
import { SYSTEM_PROMPT, userPrompt } from './prompt';

// Traduction des offres par une IA à palier gratuit (Google Gemini, Mistral, Groq), toutes appelées
// au même format « chat completions ». Le texte d'une offre est public : on peut l'envoyer à un
// palier gratuit, qui peut s'en servir pour s'entraîner. Les CV, eux, n'y passent jamais.

// Plusieurs modèles par fournisseur, du meilleur au plus sûr : Google retire régulièrement des modèles aux
// nouveaux comptes et sature parfois les autres. Testé en octobre 2026 : gemini-3.1-flash-lite répond en une
// quinzaine de secondes, en français correct ; les « flash » complets réfléchissent trop longtemps.
const PROVIDERS = {
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'],
    extra: { reasoning_effort: 'low' },
  },
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-small-latest'], extra: {} },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.3-70b-versatile'], extra: {} },
} as const;

type Provider = keyof typeof PROVIDERS;
type Target = { url: string; models: readonly string[]; extra: Record<string, unknown> };

function provider(): Target | null {
  const name = (process.env.AI_PROVIDER || 'gemini').toLowerCase() as Provider;
  const preset = PROVIDERS[name];
  if (!process.env.AI_API_KEY || !preset) return null;
  return { url: process.env.AI_API_URL || preset.url, models: process.env.AI_MODEL ? [process.env.AI_MODEL] : preset.models, extra: preset.extra };
}

export function isFreeAiConfigured(): boolean {
  return provider() !== null;
}

/** Les paliers gratuits limitent le nombre d'appels par jour : on s'arrête avant, pour tout le serveur. */
const DAILY = Number(process.env.AI_DAILY_LIMIT || 200);
let day = { date: '', calls: 0 };

const JSON_RULES = `

Écris en français correct, avec tous les accents. Réponds uniquement par un objet JSON valide, sans texte autour, qui respecte exactement ce schéma JSON (mêmes clés, mêmes valeurs possibles) :
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

/** Un appel ; un modèle retiré (404) ou saturé (500, 503) passe la main au suivant de la liste. */
async function complete(p: Target, messages: { role: string; content: string }[], json = true): Promise<{ text: string; model: string }> {
  for (const [i, model] of p.models.entries()) {
    const last = i === p.models.length - 1;
    const res = await fetch(p.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: json ? 0.2 : 0.4, ...(json ? { response_format: { type: 'json_object' } } : {}), ...p.extra }),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (!res) {
      if (last) throw new DecodeError('L’IA ne répond pas pour le moment. Réessaie plus tard.', 502);
      continue;
    }
    if (res.status === 429) throw new DecodeError('Le quota gratuit de l’IA est atteint pour le moment. Réessaie plus tard.', 429);
    if (res.status === 401 || res.status === 403) throw new DecodeError('La clé d’API n’est pas valide.', 500);
    if ((res.status === 404 || res.status >= 500) && !last) continue;
    if (!res.ok) throw new DecodeError('L’IA ne répond pas pour le moment. Réessaie plus tard.', 502);
    const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
    return { text: data?.choices?.[0]?.message?.content ?? '', model };
  }
  throw new DecodeError('L’IA ne répond pas pour le moment. Réessaie plus tard.', 502);
}

/** Compte un appel dans le quota du jour, partagé entre traductions et assistant. */
function takeDailySlot(message: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, calls: 0 };
  if (day.calls >= DAILY) throw new DecodeError(message, 429);
  day.calls += 1;
}

/** Une réponse en texte libre, pour l'assistant du site. */
export async function chatWithFreeAi(system: string, messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const p = provider();
  if (!p) throw new DecodeError('L’assistant n’est pas encore activé sur ce site.', 503);
  takeDailySlot('L’assistant a beaucoup travaillé aujourd’hui : son quota gratuit est atteint. Reviens demain.');
  const { text } = await complete(p, [{ role: 'system', content: system }, ...messages], false);
  return text;
}

export async function decodeWithFreeAi(offerText: string): Promise<{ decoded: DecodedOffer; model: string }> {
  const p = provider();
  if (!p) throw new DecodeError('La traduction par l’IA n’est pas encore activée sur ce site.', 503);
  takeDailySlot('Le quota gratuit de traductions du jour est atteint. Réessaie demain.');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + JSON_RULES },
    { role: 'user', content: userPrompt(offerText) },
  ];
  const first = await complete(p, messages);
  let model = first.model;
  let parsed = DecodedOfferSchema.safeParse(extractJson(first.text));
  if (!parsed.success) {
    // Une seconde chance, en montrant au modèle ce qui ne va pas.
    const problems = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join('.')} : ${i.message}`)
      .join('\n');
    const second = await complete(p, [
      ...messages,
      { role: 'assistant', content: first.text },
      { role: 'user', content: `Ce JSON ne respecte pas le schéma :\n${problems}\nRenvoie l’objet JSON complet et corrigé, rien d’autre.` },
    ]);
    model = second.model;
    parsed = DecodedOfferSchema.safeParse(extractJson(second.text));
  }
  if (!parsed.success) throw new DecodeError('La traduction n’a pas abouti. Réessaie dans un instant.', 502);
  return { decoded: parsed.data, model };
}
