import { describe, expect, it } from 'vitest';
import { assistantSystemPrompt, plainReply } from './prompt';

describe('assistant', () => {
  it('donne les vrais minimums légaux et ses limites', () => {
    const p = assistantSystemPrompt('/offres');
    expect(p).toContain('D6222-26');
    expect(p).toContain('1re année 27 % du SMIC');
    expect(p).toContain('Ne promets jamais un contrat');
    expect(p).toContain('sur la page /offres');
    expect(p).not.toContain('—');
  });

  it('retire le Markdown et le tiret cadratin', () => {
    expect(plainReply('## Salaire\n**Au minimum** — voilà\n* un point')).toBe('Salaire\nAu minimum, voilà\n- un point');
  });
});
