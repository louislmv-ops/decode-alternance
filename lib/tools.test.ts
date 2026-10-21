import { describe, expect, it } from 'vitest';
import { connectionMessage, MESSAGE_MAX, teamSearches } from './linkedin';
import { daysLeftWithoutEmployer, decodePayCookie, encodePayCookie, sanitizeProfile } from './profile';
import { followUpDate, isFollowUpDue, stats, type Application } from './tracker';

const app = (over: Partial<Application>): Application => ({
  id: 'x',
  company: 'Kerlog',
  title: 'Dev',
  url: '',
  channel: 'offre',
  status: 'envoyee',
  sentAt: '2026-10-01',
  followedUpAt: null,
  notes: '',
  ...over,
});

describe('suivi', () => {
  it('propose une relance 7 jours après l’envoi, une seule fois', () => {
    expect(followUpDate(app({}))).toBe('2026-10-08');
    expect(isFollowUpDue(app({}), '2026-10-07')).toBe(false);
    expect(isFollowUpDue(app({}), '2026-10-08')).toBe(true);
    expect(followUpDate(app({ status: 'relancee' }))).toBeNull();
    expect(followUpDate(app({ status: 'a-envoyer', sentAt: null }))).toBeNull();
  });

  it('calcule le taux de réponse sur les candidatures envoyées', () => {
    const s = stats([
      app({ status: 'envoyee' }),
      app({ status: 'refus' }),
      app({ status: 'entretien', channel: 'linkedin' }),
      app({ status: 'a-envoyer', sentAt: null }),
    ]);
    expect(s.sent).toBe(3);
    expect(s.answered).toBe(2);
    expect(s.interviews).toBe(1);
    expect(s.answerRate).toBe(67);
    expect(s.byChannel.find((c) => c.channel === 'linkedin')).toEqual({ channel: 'linkedin', sent: 1, answered: 1, interviews: 1 });
  });

  it('n’affiche pas de taux sans envoi', () => {
    expect(stats([]).answerRate).toBeNull();
  });
});

describe('LinkedIn', () => {
  it('ne cherche rien sans entreprise', () => {
    expect(teamSearches({ company: ' ', service: 'RH', city: '', school: '' })).toEqual([]);
  });
  it('commence par les alternants du service et encode la recherche', () => {
    const links = teamSearches({ company: 'Kerlog', service: 'produit', city: 'Rennes', school: 'IUT de Lannion' });
    expect(links[0]?.query).toBe('Kerlog produit alternant');
    expect(links[0]?.url).toBe('https://www.linkedin.com/search/results/people/?keywords=Kerlog%20produit%20alternant');
    expect(links.some((l) => l.query.includes('IUT de Lannion'))).toBe(true);
    expect(links.at(-1)?.query).toBe('site:linkedin.com/in "Kerlog" "produit" (alternant OR apprenti) "Rennes"');
  });
  it('garde le message sous 300 caractères', () => {
    const m = connectionMessage({ company: 'Kerlog Solutions', service: 'Produit', city: '', school: '', firstName: 'Inès', formation: 'licence pro développement web' });
    expect(m.length).toBeLessThanOrEqual(MESSAGE_MAX);
  });
});

describe('profil', () => {
  it('fait l’aller-retour par le cookie', () => {
    const p = sanitizeProfile({ age: 23, contract: 'professionnalisation', year: 2, hasBacPro: true, filled: true });
    expect(decodePayCookie(encodePayCookie(p))).toEqual({ age: 23, contract: 'professionnalisation', year: 2, hasBacPro: true, filled: true });
  });
  it('ignore un cookie invalide', () => {
    expect(decodePayCookie('abc').filled).toBe(false);
  });
  it('compte les jours restants sur les 3 mois', () => {
    expect(daysLeftWithoutEmployer('2026-09-01', new Date(2026, 9, 21))).toBe(41);
  });
});
