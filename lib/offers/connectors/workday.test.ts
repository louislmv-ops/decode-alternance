import { describe, expect, it } from 'vitest';
import { atsJobToOffer, boardUrl } from './ats';
import { parseRobots } from './http';
import { parseWorkdayJob, parseWorkdayList, parseWorkdaySlug, sitesFromRobots } from './workday';

const board = { tenant: 'acme', host: 'wd3', site: 'Careers' };

describe('Workday', () => {
  it('lit et écrit l’identifiant d’un tableau', () => {
    expect(parseWorkdaySlug('acme.wd3/Careers')).toEqual(board);
    expect(parseWorkdaySlug('acme/Careers')).toBeNull();
    expect(boardUrl('workday', 'acme.wd103/Acme_External')).toBe('https://acme.wd103.myworkdayjobs.com/wday/cxs/acme/Acme_External/jobs');
  });

  it('trouve les sites carrière dans robots.txt, sans les sites internes', () => {
    const robots = parseRobots(
      ['User-agent: *', 'Disallow: /*/login', 'Sitemap: https://acme.wd3.myworkdayjobs.com/Careers/siteMap.xml', 'Sitemap: https://acme.wd3.myworkdayjobs.com/fr-FR/Careers/siteMap.xml', 'Sitemap: https://acme.wd3.myworkdayjobs.com/Acme_Internal/siteMap.xml', 'Sitemap: https://other.wd3.myworkdayjobs.com/Jobs/siteMap.xml'].join('\n'),
    );
    expect(sitesFromRobots(robots, 'acme', 'wd3')).toEqual(['Careers']);
  });

  it('lit une page de résultats et une annonce', () => {
    const list = parseWorkdayList(JSON.stringify({ total: 2, jobPostings: [{ title: 'Alternance - Contrôleur de gestion (H/F)', externalPath: '/job/Paris/Alternance---Contrleur-de-gestion_R123', locationsText: 'Paris' }, { title: 'sans lien', externalPath: '' }] }));
    expect(list).toEqual({ total: 2, jobs: [{ title: 'Alternance - Contrôleur de gestion (H/F)', path: '/job/Paris/Alternance---Contrleur-de-gestion_R123', place: 'Paris' }] });

    const job = parseWorkdayJob(
      JSON.stringify({
        jobPostingInfo: { title: 'Alternance - Contrôleur de gestion (H/F)', jobReqId: 'R123', location: 'Lyon', country: { descriptor: 'France' }, timeType: 'Full time', jobDescription: '<p>Contrat d’apprentissage de 2 ans. Bac+3.</p>', startDate: '2026-10-20' },
        hiringOrganization: { name: 'Acme France SAS' },
      }),
      board,
      '/job/Lyon/x_R123',
    )!;
    expect(job).toMatchObject({ id: 'R123', city: 'Lyon', country: 'FR', employer: 'Acme France SAS', url: 'https://acme.wd3.myworkdayjobs.com/Careers/job/Lyon/x_R123' });
    const offer = atsJobToOffer(job, { provider: 'workday', slug: 'acme.wd3/Careers', company: 'Acme', size: 'grande' })!;
    expect(offer).toMatchObject({ id: 'site-carriere:workday:acme.wd3/Careers:R123', department: '69', contract: 'apprentissage', direct: true });
  });

  it('une réponse d’une autre forme ne casse rien', () => {
    expect(parseWorkdayList('<html>')).toEqual({ total: null, jobs: [] });
    expect(parseWorkdayJob('{}', board, '/x')).toBeNull();
  });
});
