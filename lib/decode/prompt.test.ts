import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT } from './prompt';
import { DecodedOfferSchema } from './schema';

describe('garde-fou du décodeur', () => {
  it('demande de décrire l’annonce et interdit les accusations', () => {
    expect(SYSTEM_PROMPT).toMatch(/Tu décris l'annonce, pas l'entreprise/);
    expect(SYSTEM_PROMPT).toMatch(/n'affirmes jamais un fait sur l'entreprise qui n'est pas dans le texte/);
    expect(SYSTEM_PROMPT).toMatch(/Jamais d'accusation/);
  });
  it('ne pousse plus l’IA vers le vocabulaire de l’accusation', () => {
    const alertes = JSON.stringify(DecodedOfferSchema.shape.alertes.description);
    expect(alertes).not.toMatch(/arnaque|piège/i);
    expect(SYSTEM_PROMPT.replace(/pas de « arnaque », « piège »[^.]*\./, '')).not.toMatch(/arnaque|piège/i);
  });
});
