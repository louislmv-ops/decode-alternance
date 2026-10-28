import { describe, expect, it } from 'vitest';
import { apprenticePayExcerpts, documentText, parseAgreementXml } from './parse';

const XML = `<?xml version="1.0" encoding="UTF-8"?><TEXTE_ACCO><META><META_COMMUN><ID>ACCOTEXT000054962705</ID><NATURE>ACCORD</NATURE></META_COMMUN>
<META_SPEC><META_ACCO><TITRE_TXT>NAO 2026 : salaires et alternance</TITRE_TXT><DOCUMENT_BUREAUTIQUE>/2025/06/25/T07525078887-37767891700024.docx</DOCUMENT_BUREAUTIQUE>
<SIRET>37767891700024</SIRET><DATE_TEXTE>2025-06-25</DATE_TEXTE><DATE_EFFET>2025-07-01</DATE_EFFET><DATE_FIN>2999-01-01</DATE_FIN>
<CODE_IDCC>1672</CODE_IDCC><RAISON_SOCIALE>ACME &amp; FILS</RAISON_SOCIALE></META_ACCO></META_SPEC></META></TEXTE_ACCO>`;

describe('accords d’entreprise', () => {
  it('lit la fiche d’un accord', () => {
    expect(parseAgreementXml(XML)).toEqual({
      id: 'ACCOTEXT000054962705',
      title: 'NAO 2026 : salaires et alternance',
      siret: '37767891700024',
      company: 'ACME & FILS',
      idcc: '1672',
      signedAt: '2025-06-25',
      startsAt: '2025-07-01',
      endsAt: null,
      document: '/2025/06/25/T07525078887-37767891700024.docx',
    });
    expect(parseAgreementXml('<TEXTE_ACCO></TEXTE_ACCO>')).toBeNull();
  });

  it('lit le texte d’un document Word, un paragraphe par ligne', () => {
    const xml = '<w:body><w:p><w:r><w:t>Article 3 –</w:t></w:r><w:r><w:tab/><w:t>Alternants</w:t></w:r></w:p><w:p><w:r><w:t>Les apprentis perçoivent 60 % du SMIC.</w:t></w:r></w:p></w:body>';
    expect(documentText(xml)).toBe('Article 3 – Alternants\nLes apprentis perçoivent 60 % du SMIC.');
  });

  it('garde les passages sur la paie des alternants, avec un chiffre', () => {
    const text = [
      'Les salaires de base sont augmentés de 3 % au 1er avril.',
      'Les alternants bénéficient d’une rémunération majorée :',
      '70 % du SMIC en première année, 80 % en deuxième année.',
      'Les apprentis sont accueillis par un tuteur formé.',
      'Les apprentis perçoivent une prime de fin d’année de 500 euros.',
    ].join('\n');
    expect(apprenticePayExcerpts(text)).toEqual([
      'Les alternants bénéficient d’une rémunération majorée : 70 % du SMIC en première année, 80 % en deuxième année.',
      'Les apprentis perçoivent une prime de fin d’année de 500 euros.',
    ]);
    expect(apprenticePayExcerpts('Les apprentis sont accueillis par un tuteur.')).toEqual([]);
  });

  it('écarte les vrais faux positifs relevés sur une archive d’octobre 2026', () => {
    const noise = [
      'Augmentation de la valeur du point ETAM et du point Cadre de 1.2% au 1er janvier 2027 hors apprentis (non soumis aux coefficients), stagiaires, contrats d’intervention et contrats d’usage.',
      'Pour le personnel Ouvriers : une augmentation généralisée de 1,3% pour le personnel en CDI justifiant d’une ancienneté minimum de 6 mois dans l’année 2025 (hors stagiaires, alternants et apprentis).',
      "Les salariés à temps partiel et apprentis dont l'adhésion au système de garanties les conduirait à s'acquitter d'une cotisation au moins égale à 10 % de leur rémunération brute.",
      'La Fondation se fixe l’objectif d’atteindre 3% d’alternants (apprentissage, professionnalisation) au sein de ses effectifs à l’échéance du présent accord.',
      'Attribution d’une prime maître d’apprentissage de 250€ brut par an par apprentis.',
      "Les salariés sous contrats particuliers type contrats d'apprentissage, contrats de qualification, contrat de professionnalisation et autres contrats atypiques ne sont pas concernés car les évolutions des salaires de ces salariés sont régies par la législation en vigueur les concernant.",
      'A cet effet, chaque service disposera, pour l’exercice 2026, d’un budget de 100 euros TTC par salarié, alternant et stagiaire présent au moment de l’organisation du moment de convivialité.',
      'Augmentations légales et conventionnelles : correspondent à une enveloppe de + 0,40 % de la masse salariale pour les augmentations liées à l’application de la CCN (minima conventionnels), aux primes d’ancienneté et aux évolutions conventionnelles concernant les apprentis.',
    ];
    for (const line of noise) expect(apprenticePayExcerpts(line)).toEqual([]);
  });

  it('garde un vrai passage sur la paie des alternants', () => {
    const real =
      'Enfin, il est convenu que les alternants, titulaires d’un contrat de professionnalisation ou d’apprentissage, seront rémunérés en fonction d’un pourcentage basé sur le minima grille de rémunération de la catégorie professionnelle d’appartenance (OE1A, TAM1A, CAD1A). Exemple, pour un alternant en apprentissage de première année en catégorie TAM, qui devrait normalement toucher 27 % du Smic, soit 504,09 €, touchera 27% du salaire mini du TAM de la grille, soit 594€ (exemple avec les éléments 2026).';
    expect(apprenticePayExcerpts(real)).toHaveLength(1);
  });
});
