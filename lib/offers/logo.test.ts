import { describe, expect, it } from 'vitest';
import { domainOf, isPublicHost, logoSrc } from './logo';

describe('logos', () => {
  it('extrait un domaine public', () => {
    expect(domainOf('https://www.decathlon.fr/carrieres')).toBe('decathlon.fr');
    expect(domainOf('kerlog.io')).toBe('kerlog.io');
    expect(domainOf('http://127.0.0.1/admin')).toBeNull();
    expect(domainOf('https://localhost:3000')).toBeNull();
    expect(domainOf('pas une url')).toBeNull();
  });

  it('refuse les hôtes internes', () => {
    expect(isPublicHost('intranet.local')).toBe(false);
    expect(isPublicHost('10.0.0.1')).toBe(false);
    expect(isPublicHost('cdn.exemple.fr')).toBe(true);
  });

  it('préfère le logo fourni, sinon l’icône du site, sinon rien', () => {
    expect(logoSrc({ logoUrl: 'https://cdn.exemple.fr/logo.png', companySite: 'https://exemple.fr' })).toBe('/api/logo?u=https%3A%2F%2Fcdn.exemple.fr%2Flogo.png');
    expect(logoSrc({ logoUrl: 'http://cdn.exemple.fr/logo.png', companySite: 'https://www.exemple.fr' })).toBe('/api/logo?d=exemple.fr');
    expect(logoSrc({ logoUrl: null, companySite: null })).toBeNull();
  });
});
