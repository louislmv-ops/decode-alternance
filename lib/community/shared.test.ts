import { describe, expect, it } from 'vitest';
import { MemberInput } from './store';

describe('profil de membre', () => {
  it('normalise le pseudo', () => {
    expect(MemberInput.parse({ handle: ' Ines_MKT ', name: 'Inès' }).handle).toBe('ines_mkt');
  });

  it('refuse un pseudo avec espaces ou trop court', () => {
    expect(MemberInput.safeParse({ handle: 'in es', name: 'Inès' }).success).toBe(false);
    expect(MemberInput.safeParse({ handle: 'in', name: 'Inès' }).success).toBe(false);
  });
});
