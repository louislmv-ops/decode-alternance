import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { DecodedOfferSchema, type DecodedOffer } from './schema';
import { SYSTEM_PROMPT, userPrompt } from './prompt';

/** Modèle utilisé pour traduire les offres ; DECODE_MODEL permet d'en changer sans toucher au code. */
export const DECODE_MODEL = process.env.DECODE_MODEL || 'claude-opus-5-5';

/** Au-delà, une annonce est presque toujours une page entière collée par erreur. */
export const MAX_OFFER_CHARS = 12_000;

export function isDecodeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export class DecodeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;

export async function decodeOffer(offerText: string): Promise<{ decoded: DecodedOffer; model: string }> {
  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: DECODE_MODEL,
      max_tokens: 16_000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(DecodedOfferSchema) },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt(offerText.slice(0, MAX_OFFER_CHARS)) }],
    });

    if (response.stop_reason === 'refusal') {
      throw new DecodeError('Cette annonce n’a pas pu être analysée.', 422);
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new DecodeError('La traduction a été coupée. Réessaie avec une annonce plus courte.', 502);
    }
    return { decoded: response.parsed_output, model: response.model };
  } catch (error) {
    if (error instanceof DecodeError) throw error;
    if (error instanceof Anthropic.RateLimitError) throw new DecodeError('Trop de demandes en ce moment. Réessaie dans une minute.', 429);
    if (error instanceof Anthropic.AuthenticationError) throw new DecodeError('La clé d’API n’est pas valide.', 500);
    if (error instanceof Anthropic.APIError) throw new DecodeError('Le service de traduction ne répond pas. Réessaie plus tard.', 502);
    throw error;
  }
}
