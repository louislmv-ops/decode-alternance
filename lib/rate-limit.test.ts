import { describe, expect, it } from 'vitest';
import { allowAll } from './rate-limit';

describe('allowAll', () => {
  it('ne compte pas une demande refusée par un des plafonds', () => {
    const rules = (k: string) => [
      { key: `jour:${k}`, limit: 3, windowMs: 86_400_000 },
      { key: `heure:${k}`, limit: 1, windowMs: 3_600_000 },
    ];
    const t = 1_000_000;
    expect(allowAll(rules('a'), t)).toBe(-1);
    // Refusée à l'heure : le jour n'est pas entamé.
    expect(allowAll(rules('a'), t + 1)).toBe(1);
    expect(allowAll(rules('a'), t + 2)).toBe(1);
    expect(allowAll(rules('a'), t + 3_600_001)).toBe(-1);
    expect(allowAll(rules('a'), t + 7_200_002)).toBe(-1);
    expect(allowAll(rules('a'), t + 10_800_003)).toBe(0);
  });
});
