import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

describe('lien de secours vers l’annonce d’origine', () => {
  it('signe le lien et refuse une adresse modifiée', async () => {
    vi.stubEnv('AUTH_SECRET', 'secret-de-test');
    const { isTrustedSourceLink, offerHref } = await import('./link');
    const href = offerHref({ id: 'la-bonne-alternance:1', source: 'la-bonne-alternance', sourceUrl: 'https://www.hellowork.com/fr-fr/emplois/1.html' });
    const params = new URL(href, 'https://x').searchParams;
    expect(isTrustedSourceLink(params.get('u')!, params.get('s')!)).toBe(true);
    expect(isTrustedSourceLink('https://evil.example/phish', params.get('s')!)).toBe(false);
    expect(isTrustedSourceLink('https://evil.example/phish', undefined)).toBe(false);
    expect(isTrustedSourceLink('https://labonnealternance.apprentissage.beta.gouv.fr/emploi/1', undefined)).toBe(true);
    expect(isTrustedSourceLink('http://www.adzuna.fr/x', undefined)).toBe(false);
  });
  it('laisse les offres de la base sans paramètre', async () => {
    const { offerHref } = await import('./link');
    expect(offerHref({ id: 'france-travail:1', source: 'france-travail', sourceUrl: 'https://x' })).toBe('/offres/france-travail%3A1');
  });
});
