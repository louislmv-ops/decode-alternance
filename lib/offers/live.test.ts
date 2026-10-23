import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { liveSearch } from './live';

const calls: string[] = [];

function reply(body: unknown, status = 200, range?: string) {
  return new Response(JSON.stringify(body), { status, headers: range ? { 'Content-Range': range } : {} });
}

beforeEach(() => {
  process.env.FRANCE_TRAVAIL_CLIENT_ID = 'id';
  process.env.FRANCE_TRAVAIL_CLIENT_SECRET = 'secret';
  calls.length = 0;
  vi.stubGlobal('fetch', async (url: string) => {
    calls.push(url);
    if (url.includes('access_token')) return reply({ access_token: 'jeton' });
    if (url.includes('naturesContrats')) {
      return reply([
        { code: 'E1', libelle: 'Contrat travail' },
        { code: 'E2', libelle: 'Contrat apprentissage' },
        { code: 'FS', libelle: 'Cont. professionnalisation' },
      ]);
    }
    const nature = new URL(url).searchParams.get('natureContrat');
    return reply(
      {
        resultats: [
          {
            id: `${nature}-1`,
            intitule: 'Assistant marketing en alternance',
            dateCreation: nature === 'E2' ? '2026-10-20T08:00:00Z' : '2026-10-21T08:00:00Z',
            natureContrat: nature === 'E2' ? 'Contrat apprentissage' : 'Cont. professionnalisation',
            lieuTravail: { libelle: '75 - PARIS 11', codePostal: '75011' },
          },
        ],
      },
      206,
      `offres 0-9/${nature === 'E2' ? 1200 : 300}`,
    );
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('liveSearch', () => {
  it('interroge chaque nature d’alternance du référentiel et additionne les totaux', async () => {
    const page = await liveSearch({ q: 'marketing digital', departments: ['75'], sort: 'recent' });
    expect(page.mode).toBe('direct');
    expect(page.total).toBe(1500);
    expect(page.offers.map((o) => o.id)).toEqual(['france-travail:FS-1', 'france-travail:E2-1']);
    expect(page.offers[0]?.contract).toBe('professionnalisation');
    const searches = calls.filter((u) => u.includes('/offres/search'));
    expect(searches).toHaveLength(2);
    expect(searches.every((u) => u.includes('departement=75') && u.includes('motsCles=marketing%2Cdigital'))).toBe(true);
    expect(searches.some((u) => u.includes('natureContrat=E1'))).toBe(false);
  });

  it('ne demande jamais une page au-delà de la limite de l’API', async () => {
    const page = await liveSearch({ page: 10_000 });
    expect(page.page).toBe(page.maxPage);
    const range = new URL(calls.find((u) => u.includes('/offres/search'))!).searchParams.get('range')!;
    expect(Number(range.split('-')[1])).toBeLessThanOrEqual(3149);
  });
});
