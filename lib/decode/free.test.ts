import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_DECODES } from '@/lib/offers/demo';

vi.mock('server-only', () => ({}));

const valid = Object.values(DEMO_DECODES)[0]!;
const reply = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

beforeEach(() => {
  vi.stubEnv('AI_PROVIDER', 'mistral');
  vi.stubEnv('AI_API_KEY', 'cle');
  vi.stubEnv('ANTHROPIC_API_KEY', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('traduction par une IA gratuite', () => {
  it('appelle le fournisseur choisi et valide la réponse contre le schéma', async () => {
    const fetchMock = vi.fn(async () => reply('```json\n' + JSON.stringify(valid) + '\n```'));
    vi.stubGlobal('fetch', fetchMock);
    const { decodeOffer, isDecodeConfigured } = await import('./ai');
    expect(isDecodeConfigured()).toBe(true);
    const { decoded, model } = await decodeOffer('Offre de test');
    expect(decoded.intitule).toBe(valid.intitule);
    expect(model).toBe('mistral-small-latest');
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe('https://api.mistral.ai/v1/chat/completions');
  });

  it('redemande une fois quand le JSON ne respecte pas le schéma', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply('{"intitule": 3}')).mockResolvedValueOnce(reply(JSON.stringify(valid)));
    vi.stubGlobal('fetch', fetchMock);
    const { decodeWithFreeAi } = await import('./free');
    await expect(decodeWithFreeAi('Offre')).resolves.toMatchObject({ decoded: { intitule: valid.intitule } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('traduit un quota épuisé en message clair', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    const { decodeWithFreeAi } = await import('./free');
    await expect(decodeWithFreeAi('Offre')).rejects.toMatchObject({ status: 429 });
  });
});
