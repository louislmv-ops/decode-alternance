import { afterEach, describe, expect, it, vi } from 'vitest';
import { coreName, nameCandidates, pageNames, resolveLogo, sameName } from './logo-resolve';
import { logoSrc } from './logo';

afterEach(() => vi.unstubAllGlobals());

describe('noms', () => {
  it('ignore forme juridique, accents et espaces', () => {
    expect(coreName('GROUPE ORVANE SAS')).toBe('orvane');
    expect(sameName('Décathlon France', 'DECATHLON')).toBe(true);
    expect(sameName('Air Liquide', 'AirLiquide')).toBe(true);
    expect(sameName('Orange', 'Orange Bank')).toBe(false);
  });

  it('lit le titre et le nom de site d’une page', () => {
    expect(pageNames('<title>Kerlog | Logiciels</title><meta property="og:site_name" content="Kerlog">')).toEqual(['Kerlog | Logiciels', 'Kerlog']);
  });

  it('ne cherche pas de logo pour une entreprise fictive ou sans nom', () => {
    expect(logoSrc({ company: 'Studio Mistral', source: 'exemple' })).toBeNull();
    expect(logoSrc({ company: 'Entreprise non nommée' })).toBeNull();
    expect(logoSrc({ company: 'Kerlog' })).toBe('/api/logo?n=Kerlog');
  });
});

describe('resolveLogo', () => {
  it('prend le logo Wikidata quand le nom correspond', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('wbsearchentities')) return Response.json({ search: [{ id: 'Q1' }, { id: 'Q2' }] });
      return Response.json({
        entities: {
          Q1: { labels: { fr: { value: 'Decathlon Pro' } }, claims: { P154: [{ mainsnak: { datavalue: { value: 'Mauvais.svg' } } }] } },
          Q2: { labels: { fr: { value: 'Decathlon' } }, claims: { P154: [{ mainsnak: { datavalue: { value: 'Decathlon Logo.svg' } } }] } },
        },
      });
    });
    expect(await resolveLogo('DECATHLON FRANCE SAS')).toEqual({ kind: 'image', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Decathlon_Logo.svg?width=256' });
  });

  it('vérifie un domaine deviné par le titre de sa page, et refuse un homonyme', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('wikidata')) return Response.json({ search: [] });
      if (url === 'https://kerlogtest.fr') return new Response('<title>Kerlogtest, logiciels</title>', { status: 200 });
      if (url === 'https://autrenom.fr') return new Response('<title>Site parking à vendre</title>', { status: 200 });
      throw new Error('introuvable');
    });
    expect(await resolveLogo('Kerlogtest')).toEqual({ kind: 'domain', domain: 'kerlogtest.fr' });
    expect(await resolveLogo('Autrenom')).toBeNull();
  });

  it('prend le logo du groupe quand la filiale n’est pas connue', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('wbsearchentities')) {
        return Response.json({ search: decodeURIComponent(url).includes('search=vinci energies&') || decodeURIComponent(url).endsWith('search=vinci energies') ? [{ id: 'Q9' }] : [] });
      }
      if (url.includes('wbgetentities')) {
        return Response.json({ entities: { Q9: { labels: { fr: { value: 'Vinci Energies' } }, claims: { P154: [{ mainsnak: { datavalue: { value: 'Vinci Energies.svg' } } }] } } } });
      }
      throw new Error('introuvable');
    });
    expect(await resolveLogo('VINCI ENERGIES FRANCE TERTIAIRE NORD EST')).toEqual({
      kind: 'image',
      url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vinci_Energies.svg?width=256',
    });
  });
});

describe('nameCandidates', () => {
  it('raccourcit vers le nom du groupe, sans s’arrêter sur un nom commun', () => {
    expect(nameCandidates('VINCI ENERGIES FRANCE TERTIAIRE NORD EST')).toEqual(['vinci energies tertiaire nord', 'vinci energies tertiaire', 'vinci energies', 'vinci']);
    expect(nameCandidates('Boulangerie Dupont')).toEqual(['boulangerie dupont']);
    expect(nameCandidates('Safran')).toEqual(['safran']);
  });
});
