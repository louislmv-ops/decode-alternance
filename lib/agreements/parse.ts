// Les accords d'entreprise publiés par l'État (base ACCO de Légifrance, archives hebdomadaires de la DILA) : une
// fiche XML par accord (SIRET, IDCC, dates, chemin du document) et le texte de l'accord en .docx ou .odt.
// On ne garde que les passages qui parlent de la paie des alternants, recopiés tels quels : c'est une preuve
// citable, avec le lien vers l'accord sur Légifrance. Rien n'est résumé ni réécrit.

import { decodeEntities } from '@/lib/offers/normalize';

export interface AgreementMeta {
  id: string;
  title: string;
  siret: string;
  company: string;
  idcc: string | null;
  /** Date de signature, de début et de fin (AAAA-MM-JJ), quand l'accord les donne. */
  signedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  /** Chemin du texte dans l'archive (« /2025/06/25/T07525078887-37767891700024.docx »). */
  document: string | null;
}

const tag = (xml: string, name: string): string | null => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  const v = m?.[1] ? decodeEntities(m[1]).trim() : '';
  return v || null;
};

const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !v.startsWith('2999') ? v : null);

/** La fiche d'un accord ; null si ce n'est pas un accord d'entreprise lisible. */
export function parseAgreementXml(xml: string): AgreementMeta | null {
  const id = tag(xml, 'ID');
  const siret = tag(xml, 'SIRET')?.replace(/\s/g, '') ?? '';
  if (!id?.startsWith('ACCOTEXT') || !/^\d{14}$/.test(siret)) return null;
  const idcc = tag(xml, 'CODE_IDCC');
  return {
    id,
    title: tag(xml, 'TITRE_TXT') ?? 'Accord d’entreprise',
    siret,
    company: tag(xml, 'RAISON_SOCIALE') ?? '',
    // 9999 : « sans convention collective » dans la base.
    idcc: idcc && /^\d{1,4}$/.test(idcc) && idcc !== '9999' ? idcc.padStart(4, '0') : null,
    signedAt: day(tag(xml, 'DATE_TEXTE')),
    startsAt: day(tag(xml, 'DATE_EFFET')),
    endsAt: day(tag(xml, 'DATE_FIN')),
    document: tag(xml, 'DOCUMENT_BUREAUTIQUE'),
  };
}

/** Le texte d'un document Word (word/document.xml) ou OpenOffice (content.xml), un paragraphe par ligne. */
export function documentText(xml: string): string {
  return decodeEntities(
    xml
      .replace(/<w:tab\/>|<text:tab\/>/g, ' ')
      .replace(/<\/w:p>|<\/text:p>|<\/text:h>|<w:br\/>|<text:line-break\/>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const WHO = /\b(apprenti|apprentie|apprentis|apprenties|alternant|alternante|alternants|alternantes|contrats? de professionnalisation|contrats? d['’]apprentissage)\b/i;
const PAY = /(\d[\d\s.,]*\s?%|\d[\d\s.,]*\s?(€|euros?)\b|r[ée]mun[ée]ration|salaire|prime|gratification|treizi[eè]me mois|13e mois|tickets? restaurant|indemnit[ée])/i;
const MONEY = /\d[\d\s.,]*\s?(%|€|euros?\b)/i;

/**
 * Les passages de l'accord sur la paie des alternants : un paragraphe qui nomme les alternants et parle d'argent,
 * avec un chiffre (pourcentage ou montant), ou la ligne suivante quand le chiffre y est. Trois au plus, coupés à
 * 700 caractères.
 */
export function apprenticePayExcerpts(text: string, max = 3): string[] {
  const lines = text.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length && out.length < max; i++) {
    const line = lines[i]!;
    if (!WHO.test(line) || !PAY.test(line)) continue;
    const next = lines[i + 1] ?? '';
    const passage = MONEY.test(line) ? line : MONEY.test(next) ? `${line} ${next}` : null;
    if (!passage) continue;
    const clipped = passage.length > 700 ? `${passage.slice(0, 697).replace(/\s+\S*$/, '')}…` : passage;
    if (!out.includes(clipped)) out.push(clipped);
  }
  return out;
}

/** L'adresse de l'accord sur Légifrance. */
export function legifranceAgreement(id: string): string {
  return `https://www.legifrance.gouv.fr/acco/id/${id}`;
}
