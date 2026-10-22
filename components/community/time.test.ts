import { describe, expect, it } from 'vitest';
import { timeAgo } from './ui';

describe('timeAgo', () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  it('affiche des durées courtes', () => {
    expect(timeAgo('2026-10-22T11:59:30Z', now)).toBe('à l’instant');
    expect(timeAgo('2026-10-22T11:45:00Z', now)).toBe('15 min');
    expect(timeAgo('2026-10-22T09:00:00Z', now)).toBe('3 h');
    expect(timeAgo('2026-10-20T12:00:00Z', now)).toBe('2 j');
  });
});
