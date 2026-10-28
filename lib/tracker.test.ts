import { describe, expect, it } from 'vitest';
import { columnOf, funnel, moveTo, observations, weekly, type Application } from './tracker';

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

describe('tableau du suivi', () => {
  const app = (status: Application['status'], sentAt: string | null = null): Application => ({
    id: 'a',
    company: 'Alpha',
    title: 'Alternance',
    url: '',
    channel: 'offre',
    status,
    sentAt,
    followedUpAt: null,
    notes: '',
  });

  it('range « Relancée » avec « Envoyée »', () => {
    expect(columnOf('relancee')).toBe('envoyee');
    expect(columnOf('entretien')).toBe('entretien');
  });

  it('date l’envoi quand une carte quitte « À postuler »', () => {
    expect(moveTo(app('a-envoyer'), 'envoyee', '2026-10-28')).toEqual({ status: 'envoyee', sentAt: '2026-10-28' });
    expect(moveTo(app('a-envoyer'), 'entretien', '2026-10-28')).toEqual({ status: 'entretien', sentAt: '2026-10-28' });
  });

  it('garde la date d’envoi déjà connue', () => {
    expect(moveTo(app('envoyee', '2026-10-01'), 'refus', '2026-10-28')).toEqual({ status: 'refus', sentAt: '2026-10-01' });
  });

  it('ne touche à rien dans la même colonne, et efface les dates en revenant à « À postuler »', () => {
    expect(moveTo(app('relancee', '2026-10-01'), 'envoyee', '2026-10-28')).toEqual({});
    expect(moveTo(app('envoyee', '2026-10-01'), 'a-envoyer', '2026-10-28')).toEqual({ status: 'a-envoyer', sentAt: null, followedUpAt: null });
  });
});
