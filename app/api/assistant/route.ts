import { z } from 'zod/v4';
import { chatReply, isChatConfigured } from '@/lib/assistant/chat';
import { DecodeError } from '@/lib/decode/claude';
import { allow, clientKey } from '@/lib/rate-limit';

export const maxDuration = 60;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
  page: z.string().max(200).optional(),
});

const PER_HOUR = Number(process.env.CHAT_PER_HOUR || 30);
const PER_DAY = Number(process.env.CHAT_PER_DAY || 80);

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') {
    return Response.json({ error: 'Écris ta question (2 000 caractères au plus).' }, { status: 400 });
  }
  if (!isChatConfigured()) return Response.json({ error: 'L’assistant n’est pas encore activé sur ce site.' }, { status: 503 });

  const key = `chat:${clientKey(request)}`;
  if (!allow(`${key}:jour`, PER_DAY, 86_400_000) || !allow(key, PER_HOUR, 3_600_000)) {
    return Response.json({ error: 'Tu as posé beaucoup de questions : fais une pause et reviens un peu plus tard.' }, { status: 429 });
  }

  try {
    // Seuls les derniers échanges partent : assez pour suivre la conversation, sans faire grossir la facture.
    const reply = await chatReply(parsed.data.messages.slice(-10), parsed.data.page ?? null);
    if (!reply) return Response.json({ error: 'Je n’ai pas su répondre. Reformule ta question ?' }, { status: 502 });
    return Response.json({ reply });
  } catch (error) {
    if (error instanceof DecodeError) return Response.json({ error: error.message }, { status: error.status });
    console.error(error);
    return Response.json({ error: 'Une erreur est survenue. Réessaie dans un instant.' }, { status: 500 });
  }
}
