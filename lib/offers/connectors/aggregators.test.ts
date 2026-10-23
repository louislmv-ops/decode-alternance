import { describe, expect, it } from 'vitest';
import { isAggregatorUrl, offerHref } from '../types';
import { adzunaToOffer } from './adzuna';
import { departmentFromPlace } from './aggregator';
import { joobleToOffer } from './jooble';

describe('Adzuna', () => {
  it('normalise une offre et ne garde que le salaire annoncé', () => {
    const offer = adzunaToOffer({
      id: 4242,
      title: 'Assistant marketing <strong>alternance</strong> H/F',
      description: 'Rejoins notre équipe en contrat d’apprentissage, BTS accepté.',
      created: '2026-10-20T10:12:03Z',
      redirect_url: 'https://www.adzuna.fr/land/ad/4242',
      company: { display_name: 'Groupe Orvane' },
      location: { display_name: 'Lyon, Rhône', area: ['France', 'Auvergne-Rhône-Alpes', 'Rhône', 'Lyon'] },
      salary_min: 15600,
      salary_is_predicted: '0',
    });
    expect(offer?.id).toBe('adzuna:4242');
    expect(offer?.title).toBe('Assistant marketing alternance H/F');
    expect(offer?.department).toBe('69');
    expect(offer?.city).toBe('Lyon');
    expect(offer?.contract).toBe('apprentissage');
    expect(offer?.salaryMonthlyCents).toBe(130_000);
  });

  it('ignore un salaire estimé par Adzuna et une offre qui n’est pas de l’alternance', () => {
    const base = { id: 1, redirect_url: 'https://www.adzuna.fr/land/ad/1', created: '2026-10-20T10:00:00Z' };
    expect(adzunaToOffer({ ...base, title: 'Alternance comptable', salary_min: 30000, salary_is_predicted: '1' })?.salaryMonthlyCents).toBeNull();
    expect(adzunaToOffer({ ...base, title: 'Comptable CDI', description: 'Poste en CDI.' })).toBeNull();
  });
});

describe('Jooble', () => {
  it('normalise une offre et lit le salaire écrit', () => {
    const offer = joobleToOffer({
      id: '-77',
      title: 'Alternant développeur web',
      location: 'Rennes, Ille-et-Vilaine',
      snippet: 'Apprentissage <b>bac+3</b>, équipe produit.',
      salary: '1 200 € par mois',
      link: 'https://fr.jooble.org/desc/-77',
      company: 'Kerlog',
      updated: '2026-10-19T00:00:00.0000000',
    });
    expect(offer?.id).toBe('jooble:-77');
    expect(offer?.department).toBe('35');
    expect(offer?.diplomaLevel).toBe(6);
    expect(offer?.salaryMonthlyCents).toBe(120_000);
  });
});

describe('lieux et liens', () => {
  it('retrouve le département par code postal, nom ou ville de Paris', () => {
    expect(departmentFromPlace(['33000 Bordeaux'])).toBe('33');
    expect(departmentFromPlace(['Paris 9e, Paris'])).toBe('75');
    expect(departmentFromPlace(['Quelque part'])).toBeNull();
  });

  it('ne renvoie que vers les agrégateurs connus, en https', () => {
    expect(isAggregatorUrl('https://www.adzuna.fr/land/ad/1')).toBe(true);
    expect(isAggregatorUrl('https://fr.jooble.org/desc/1')).toBe(true);
    expect(isAggregatorUrl('https://evil.example/adzuna.fr')).toBe(false);
    expect(isAggregatorUrl('http://www.adzuna.fr/x')).toBe(false);
    expect(offerHref({ id: 'adzuna:1', source: 'adzuna', sourceUrl: 'https://www.adzuna.fr/land/ad/1' })).toBe('/offres/adzuna%3A1?u=https%3A%2F%2Fwww.adzuna.fr%2Fland%2Fad%2F1');
  });
});

describe('La bonne alternance', async () => {
  const { lbaToOffer, pageOf } = await import('./la-bonne-alternance');
  const job = {
    identifier: { id: 'abc123', partner_job_id: 'p1', partner_label: 'La bonne alternance' },
    workplace: { name: 'GROUPE ORVANE', brand: 'Orvane', size: '50-99', location: { address: '12 rue de la Paix 75002 Paris' } },
    apply: { url: 'https://labonnealternance.apprentissage.beta.gouv.fr/emploi/abc123' },
    contract: { type: ['Apprentissage'], start: '2027-09-01T00:00:00.000Z' },
    offer: {
      title: 'Assistant marketing',
      description: 'Tu participes aux campagnes.',
      desired_skills: ['Canva'],
      access_conditions: [],
      publication: { creation: '2026-10-20T08:00:00.000Z' },
      target_diploma: { european: '6' },
      status: 'Active',
    },
  };

  it('normalise une offre', () => {
    const o = lbaToOffer(job)!;
    expect(o.id).toBe('la-bonne-alternance:abc123');
    expect(o.company).toBe('Orvane');
    expect(o.department).toBe('75');
    expect(o.city).toBe('Paris');
    expect(o.contract).toBe('apprentissage');
    expect(o.diplomaLevel).toBe(6);
    expect(o.companySize).toBe('pme');
    expect(o.startDate).toBe('2027-09-01');
    expect(o.description).toContain('Compétences attendues : Canva');
  });

  it('écarte une offre pourvue ou sans lien', () => {
    expect(lbaToOffer({ ...job, offer: { ...job.offer, status: 'Filled' } })).toBeNull();
    expect(lbaToOffer({ ...job, apply: {} })).toBeNull();
  });

  it('filtre par mots et pagine', () => {
    const a = lbaToOffer(job)!;
    const b = lbaToOffer({ ...job, identifier: { id: 'b' }, offer: { ...job.offer, title: 'Boulanger', publication: { creation: '2026-10-21T08:00:00.000Z' } } })!;
    expect(pageOf([a, b], 'marketing', 1, 10).offers.map((o) => o.title)).toEqual(['Assistant marketing']);
    expect(pageOf([a, b], undefined, 1, 1).offers[0]?.title).toBe('Boulanger');
    expect(pageOf([a, b], undefined, 1, 1).total).toBe(2);
  });
});
