import 'server-only';
import { decodeWithClaude, isClaudeConfigured } from './claude';
import { decodeWithFreeAi, isFreeAiConfigured } from './free';
import type { DecodedOffer } from './schema';

export { DecodeError, MAX_OFFER_CHARS } from './claude';

/** Une IA est-elle branchée pour traduire les offres ? Claude si sa clé est là, sinon une IA gratuite. */
export function isDecodeConfigured(): boolean {
  return isClaudeConfigured() || isFreeAiConfigured();
}

export function decodeOffer(offerText: string): Promise<{ decoded: DecodedOffer; model: string }> {
  return isClaudeConfigured() ? decodeWithClaude(offerText) : decodeWithFreeAi(offerText);
}
