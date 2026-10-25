// Les avantages d'une offre, repérés dans le texte de l'annonce : seulement ce qui y est écrit.
// L'IA de traduction en trouve parfois d'autres, plus précis ; on les fusionne sur la fiche.

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PERKS: { label: string; re: RegExp }[] = [
  { label: 'Télétravail', re: /teletravail|remote|full remote|hybride/ },
  { label: 'Tickets resto ou cantine', re: /tickets?[ -]?(resto|restaurant)|titres?[ -]restaurant|carte (swile|dejeuner|restaurant)|restaurant d.entreprise|cantine/ },
  { label: 'Transport remboursé', re: /navigo|forfait mobilite|(prise en charge|remboursement)[^.]{0,40}(transport|abonnement)/ },
  { label: 'Mutuelle', re: /mutuelle/ },
  { label: 'Primes ou 13e mois', re: /13 ?e(me)? mois|treizieme mois|\bprimes?\b/ },
  { label: 'Intéressement', re: /interessement|participation aux benefices|\bparticipation\b/ },
  { label: 'RTT', re: /\brtt\b/ },
  { label: 'CSE : réductions, sorties', re: /\bc\.?s\.?e\.?\b|comite d.entreprise/ },
  { label: 'Aide au logement', re: /(aide|participation|prise en charge)[^.]{0,20}logement|logement (fourni|offert|mis a disposition)/ },
  { label: 'Véhicule', re: /vehicule de (service|fonction)|voiture de (service|fonction)/ },
  { label: 'Sport', re: /salle de sport|\bgymlib\b|\bwellpass\b|\bgympass\b|activites sportives/ },
  { label: 'Horaires flexibles', re: /horaires? (flexibles?|libres|amenages|souples)/ },
  { label: 'Matériel fourni', re: /(ordinateur|pc|macbook|telephone)( portable)? (fourni|professionnel|mis a disposition)/ },
  { label: 'Embauche possible à la fin', re: /(possibilite|perspectives?)s? d.embauche|embauche (possible|envisagee|a l.issue)|cdi a la cle|vocation a (etre )?embauche/ },
];

export function extractPerks(...texts: (string | null | undefined)[]): string[] {
  const t = strip(texts.filter(Boolean).join(' '));
  return PERKS.filter((p) => p.re.test(t)).map((p) => p.label);
}

/** Avantages trouvés par l'IA + ceux repérés dans le texte, sans doublon : un avantage déjà cité par l'IA n'est pas répété. */
export function mergePerks(fromAi: string[], fromText: string[]): string[] {
  const ai = fromAi.map(strip);
  const extra = fromText.filter((label) => {
    const perk = PERKS.find((p) => p.label === label);
    return !ai.some((a) => (perk ? perk.re.test(a) : a.includes(strip(label))));
  });
  return [...fromAi, ...extra];
}
