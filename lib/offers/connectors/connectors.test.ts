import { describe, expect, it } from 'vitest';
import { isAllowed, parseRobots } from './http';
import { extractJobPostings, jobPostingToOffer } from './job-posting';

const site = { company: 'Groupe Exemple', careersUrl: 'https://carrieres.exemple.fr', size: 'grande' as const };

const page = `<!doctype html><html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Groupe Exemple"},
{"@type":"JobPosting","title":"Alternance - Assistant(e) achats H/F","description":"<p>Tu prépares un <strong>BTS</strong> ou un bac+3.</p>",
"datePosted":"2026-10-10","validThrough":"2099-01-01","employmentType":"OTHER","identifier":{"value":"REQ-1042"},
"jobLocation":{"@type":"Place","address":{"addressLocality":"Lyon","postalCode":"69007"}},
"baseSalary":{"currency":"EUR","value":{"minValue":1300,"unitText":"MONTH"}}}]}</script>
<script type="application/ld+json">{ cassé </script>
</head></html>`;

describe('extractJobPostings', () => {
  it('trouve un JobPosting dans un @graph et ignore un bloc cassé', () => {
    const found = extractJobPostings(page);
    expect(found).toHaveLength(1);
    expect(found[0]?.title).toBe('Alternance - Assistant(e) achats H/F');
  });
});

describe('jobPostingToOffer', () => {
  it('normalise une offre d’alternance', () => {
    const ld = extractJobPostings(page)[0]!;
    const offer = jobPostingToOffer(ld, 'https://carrieres.exemple.fr/offre/1042', site);
    expect(offer).not.toBeNull();
    expect(offer?.id).toBe('site-carriere:Groupe Exemple:REQ-1042');
    expect(offer?.department).toBe('69');
    expect(offer?.diplomaLevel).toBe(5);
    expect(offer?.salaryMonthlyCents).toBe(130_000);
    expect(offer?.direct).toBe(true);
    expect(offer?.companySize).toBe('grande');
  });
  it('écarte une offre qui n’est pas de l’alternance ou qui a expiré', () => {
    expect(jobPostingToOffer({ '@type': 'JobPosting', title: 'Ingénieur CDI', description: 'CDI' }, 'https://x.fr/1', site)).toBeNull();
    expect(
      jobPostingToOffer({ '@type': 'JobPosting', title: 'Alternance RH', validThrough: '2020-01-01' }, 'https://x.fr/2', site),
    ).toBeNull();
  });
});

describe('robots.txt', () => {
  const rules = parseRobots(`
User-agent: *
Disallow: /candidature/
Allow: /candidature/offres
Crawl-delay: 2
Sitemap: https://carrieres.exemple.fr/sitemap-jobs.xml
`);
  it('lit les sitemaps et le délai', () => {
    expect(rules.sitemaps).toEqual(['https://carrieres.exemple.fr/sitemap-jobs.xml']);
    expect(rules.crawlDelayMs).toBe(2000);
  });
  it('applique la règle la plus précise', () => {
    expect(isAllowed(rules, 'https://carrieres.exemple.fr/offre/12')).toBe(true);
    expect(isAllowed(rules, 'https://carrieres.exemple.fr/candidature/12')).toBe(false);
    expect(isAllowed(rules, 'https://carrieres.exemple.fr/candidature/offres/12')).toBe(true);
  });
  it('préfère le groupe qui nomme notre robot', () => {
    const specific = parseRobots('User-agent: *\nDisallow:\n\nUser-agent: DecodeBot\nDisallow: /');
    expect(isAllowed(specific, 'https://x.fr/page')).toBe(false);
  });
});
