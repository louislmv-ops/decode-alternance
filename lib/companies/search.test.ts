import { describe, expect, it } from 'vitest';
import { tidyName } from './search';

describe('tidyName', () => {
  it('remet les noms en capitales en casse normale', () => {
    expect(tidyName('DECATHLON FRANCE (DECATHLON)')).toBe('Decathlon France (Decathlon)');
    expect(tidyName('L’OREAL SA')).toBe('L’Oreal SA');
    expect(tidyName('VILLENEUVE-D’ASCQ')).toBe('Villeneuve-d’Ascq');
    expect(tidyName('BOULOGNE-SUR-MER')).toBe('Boulogne-sur-Mer');
  });

  it('laisse un nom déjà écrit normalement', () => {
    expect(tidyName('Blablacar')).toBe('Blablacar');
  });
});
