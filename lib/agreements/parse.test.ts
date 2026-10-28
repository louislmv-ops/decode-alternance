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
});
