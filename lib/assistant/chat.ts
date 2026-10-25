import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { DecodeError, isClaudeConfigured } from '@/lib/decode/claude';
import { chatWithFreeAi, isFreeAiConfigured } from '@/lib/decode/free';
import { assistantSystemPrompt, plainReply } from './prompt';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Un modèle rapide suffit pour discuter ; CHAT_MODEL permet d'en changer. */
const CHAT_MODEL = process.env.CHAT_MODEL || 'claude-haiku-5-5';

export function isChatConfigured(): boolean {
  return isClaudeConfigured() || isFreeAiConfigured();
}

let client: Anthropic | null = null;

export async function chatReply(history: ChatMessage[], page: string | null): Promise<string> {
  // La conversation envoyée commence toujours par une question.
  const start = history.findIndex((m) => m.role === 'user');
  const messages = history.slice(Math.max(start, 0));
  const system = assistantSystemPrompt(page);
  if (!isClaudeConfigured()) return plainReply(await chatWithFreeAi(system, messages));
  client ??= new Anthropic();
  try {
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 800,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
    });
    const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    return plainReply(text);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new DecodeError('Trop de questions en ce moment. Réessaie dans une minute.', 429);
    if (error instanceof Anthropic.APIError) throw new DecodeError('L’assistant ne répond pas. Réessaie plus tard.', 502);
    throw error;
  }
}
