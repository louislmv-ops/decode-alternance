import 'server-only';
import { decodeWithClaude, isClaudeConfigured } from './claude';
import { decodeWithFreeAi, isFreeAiConfigured } from './free';
import type { DecodedOffer } from './schema';
import { keepOnlyWrittenSalary } from './verify-salary';

export { DecodeError, MAX_OFFER_CHARS } from './claude';

/** Une IA est-elle branchée pour traduire les offres ? Claude si sa clé est là, sinon une IA gratuite. */
export function isDecodeConfigured(): boolean {
  return isClaudeConfigured() || isFreeAiConfigured();
}

/** Traduit une offre ; un salaire que l'annonce ne contient pas est retiré (voir verify-salary). */
export async function decodeOffer(offerText: string): Promise<{ decoded: DecodedOffer; model: string }> {
  const { decoded, model } = isClaudeConfigured() ? await decodeWithClaude(offerText) : await decodeWithFreeAi(offerText);
  return { decoded: keepOnlyWrittenSalary(decoded, offerText), model };
}
