import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('informations de l’éditeur', () => {
  it('sans variable : rien, et un seul avertissement', async () => {
    vi.stubEnv('LEGAL_ADDRESS', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { legalAddress } = await import('./legal');
    expect(legalAddress()).toBeNull();
    expect(legalAddress()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it('lit CONTACT_EMAIL, puis les anciennes variables en secours', async () => {
    vi.stubEnv('CONTACT_EMAIL', '');
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', '');
    vi.stubEnv('LEGAL_CONTACT', 'ancien@exemple.fr');
    let { contactEmail } = await import('./legal');
    expect(contactEmail()).toBe('ancien@exemple.fr');
    vi.resetModules();
    vi.stubEnv('CONTACT_EMAIL', 'contact@exemple.fr');
    ({ contactEmail } = await import('./legal'));
    expect(contactEmail()).toBe('contact@exemple.fr');
  });
  it('nomme le fournisseur d’IA réellement branché', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('AI_API_KEY', 'x');
    vi.stubEnv('AI_PROVIDER', 'gemini');
    const { aiProvider } = await import('./legal');
    expect(aiProvider()).toEqual({ name: 'Google', freeTier: true });
    vi.stubEnv('ANTHROPIC_API_KEY', 'y');
    expect(aiProvider()).toEqual({ name: 'Anthropic', freeTier: false });
  });
});
