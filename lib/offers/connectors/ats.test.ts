import { describe, expect, it } from 'vitest';
import { slugCandidates, sameCompany } from '../ats-discovery';
import { atsJobToOffer, boardUrl, isInFrance, parseBoard } from './ats';

const board = { provider: 'greenhouse' as const, slug: 'acme', company: 'Acme', size: 'grande' as const };

describe('logiciels de recrutement : lecture des tableaux', () => {
  it('Greenhouse : HTML échappé, lieu en texte', () => {
    const body = JSON.stringify({
      jobs: [
        { id: 42, title: 'Alternance - Chargé(e) marketing', absolute_url: 'https://boards.greenhouse.io/acme/jobs/42', updated_at: '2026-10-20T10:00:00Z', location: { name: 'Paris, France' }, content: '&lt;p&gt;Rémunération : 1 400 € brut par mois.&lt;/p&gt;' },
        { id: 43, title: 'Senior Engineer', absolute_url: 'https://boards.greenhouse.io/acme/jobs/43', location: { name: 'Berlin, Germany' }, content: '' },
      ],
    });
    const jobs = parseBoard('greenhouse', body);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ id: '42', city: 'Paris', url: 'https://boards.greenhouse.io/acme/jobs/42' });
    expect(jobs[0]!.description).toContain('1 400 € brut par mois');
    const offer = atsJobToOffer(jobs[0]!, board)!;
    expect(offer).toMatchObject({ id: 'site-carriere:greenhouse:acme:42', source: 'site-carriere', direct: true, department: '75', company: 'Acme', salaryMonthlyCents: 140000 });
    expect(atsJobToOffer(jobs[1]!, board)).toBeNull();
  });

  it('Lever : texte brut, date en millisecondes, pays', () => {
    const body = JSON.stringify([
      { id: 'abc', text: 'Business Developer en alternance', hostedUrl: 'https://jobs.lever.co/acme/abc', createdAt: 1792000000000, country: 'FR', categories: { location: 'Lyon', commitment: 'Apprenticeship' }, descriptionPlain: 'Rejoins l’équipe.', lists: [{ text: 'Profil', content: '<li>Bac+3</li>' }] },
    ]);
    const [job] = parseBoard('lever', body);
    const offer = atsJobToOffer(job!, { ...board, provider: 'lever' })!;
    expect(offer).toMatchObject({ city: 'Lyon', department: '69', contract: 'apprentissage', diplomaLevel: 6 });
    expect(offer.publishedAt).toBe(new Date(1792000000000).toISOString());
  });

  it('SmartRecruiters, Ashby, Recruitee : les offres hors de France sont écartées', () => {
    const sr = parseBoard('smartrecruiters', JSON.stringify({ content: [{ id: '1', name: 'Apprenti RH', location: { city: 'Madrid', country: 'es' }, company: { identifier: 'Acme' } }] }));
    expect(isInFrance(sr[0]!)).toBe(false);
    const ashby = parseBoard('ashby', JSON.stringify({ jobs: [{ id: 'x', title: 'Alternant data', jobUrl: 'https://jobs.ashbyhq.com/acme/x', descriptionPlain: 'SQL', location: 'Nantes', address: { postalAddress: { addressLocality: 'Nantes', postalCode: '44000', addressCountry: 'France' } } }] }));
    expect(atsJobToOffer(ashby[0]!, { ...board, provider: 'ashby' })).toMatchObject({ department: '44', postalCode: '44000' });
    const rec = parseBoard('recruitee', JSON.stringify({ offers: [{ id: 7, title: 'Alternance comptable', careers_url: 'https://acme.recruitee.com/o/compta', city: 'Lille', country_code: 'fr', description: '<p>Contrat de professionnalisation</p>' }] }));
    expect(atsJobToOffer(rec[0]!, { ...board, provider: 'recruitee' })).toMatchObject({ contract: 'professionnalisation', department: '59' });
  });

  it('Personio : XML, lien construit à partir de l’identifiant', () => {
    const xml = `<?xml version="1.0"?><workzag-jobs><position><id>99</id><office>Bordeaux</office><name>Alternant(e) commercial</name><employmentType>trainee</employmentType><createdAt>2026-10-01T08:00:00+00:00</createdAt><jobDescriptions><jobDescription><name>Missions</name><value><![CDATA[<p>Prospection</p>]]></value></jobDescription></jobDescriptions></position></workzag-jobs>`;
    const [job] = parseBoard('personio', xml);
    const offer = atsJobToOffer(job!, { ...board, provider: 'personio' })!;
    expect(offer).toMatchObject({ sourceUrl: 'https://acme.jobs.personio.de/job/99', department: '33' });
    expect(offer.description).toContain('Prospection');
  });

  it('une réponse d’une autre forme ne casse rien', () => {
    expect(parseBoard('greenhouse', '<html>404</html>')).toEqual([]);
    expect(parseBoard('lever', '{"ok":true}')).toEqual([]);
  });

  it('les adresses suivent la documentation de chaque fournisseur', () => {
    expect(boardUrl('greenhouse', 'acme')).toBe('https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true');
    expect(boardUrl('recruitee', 'acme')).toBe('https://acme.recruitee.com/api/offers/');
  });
});

describe('logiciels de recrutement : recherche des tableaux', () => {
  it('tire des identifiants plausibles du nom', () => {
    expect(slugCandidates("L'Oréal")).toEqual(['loreal', 'l-oreal']);
    expect(slugCandidates('BNP Paribas SA')).toEqual(['bnpparibas', 'bnp-paribas', 'bnpparibassa']);
  });

  it('reconnaît le même employeur malgré la forme juridique', () => {
    expect(sameCompany('Doctolib SAS', 'Doctolib')).toBe(true);
    expect(sameCompany('Orange', 'Orange Bank')).toBe(true);
    expect(sameCompany('Alan', 'Acme')).toBe(false);
  });
});
