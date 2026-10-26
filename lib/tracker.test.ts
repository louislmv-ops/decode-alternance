import { describe, expect, it } from 'vitest';
import { funnel, observations, weekly, type Application } from './tracker';

describe('graphiques du suivi', () => {
  const app = (over: Partial<Application>): Application => ({ id: crypto.randomUUID(), company: 'A', title: '', url: '', channel: 'offre', status: 'envoyee', sentAt: null, followedUpAt: null, notes: '', ...over });

  it('range les envois par semaine', () => {
    const w = weekly([app({ sentAt: '2026-10-26' }), app({ sentAt: '2026-10-20' }), app({ sentAt: '2026-01-01' })], '2026-10-27', 4);
    expect(w.map((b) => b.sent)).toEqual([0, 0, 1, 1]);
    expect(w[3]!.start).toBe('2026-10-26');
  });

  it('compte chaque étape', () => {
    expect(funnel([app({ status: 'a-envoyer' }), app({ status: 'entretien' }), app({ status: 'refus' })]).map((f) => f.count)).toEqual([3, 2, 2, 1, 0]);
  });

  it('ne dit rien sans données', () => {
    expect(observations([], '2026-10-27')).toEqual([]);
    expect(observations([app({ sentAt: '2026-09-01' })], '2026-10-27')).toContain('1 candidature sans réponse depuis plus de 3 semaines.');
  });
});
