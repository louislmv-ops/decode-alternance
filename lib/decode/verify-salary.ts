// Garde-fou : un salaire lu par l'IA n'est gardé que s'il est écrit dans l'annonce.
// L'IA peut se tromper de ligne, convertir de travers ou inventer un chiffre plausible :
// sans trace du montant dans le texte (mensuel, ou annuel sur 12 mois), on n'affiche rien.

import type { DecodedOffer } from './schema';

/** Tous les nombres de l'annonce, en euros entiers : « 1 300 », « 1.300 », « 1300,50 », « 18 000 € ». */
export function numbersInText(text: string): number[] {
  const out: number[] = [];
  const re = /\d{1,3}(?:[   .]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
  for (const m of text.match(re) ?? []) {
    const thousands = /[   .]\d{3}(?:,|$)/.test(m) && !/^\d+\.\d{1,2}$/.test(m);
    const clean = thousands ? m.replace(/[   .]/g, '').replace(',', '.') : m.replace(',', '.');
    const n = Number(clean);
    if (Number.isFinite(n)) out.push(Math.round(n));
  }
  return out;
}

/** Le montant mensuel figure-t-il dans le texte, tel quel ou en annuel (12 mois) ? */
export function amountInText(text: string, monthlyEuros: number): boolean {
  if (!Number.isFinite(monthlyEuros) || monthlyEuros <= 0) return false;
  return numbersInText(text).some((n) => Math.abs(n - monthlyEuros) <= 1 || Math.abs(n - monthlyEuros * 12) <= 12);
}

/** Retire de la traduction tout montant que l'annonce ne contient pas. */
export function keepOnlyWrittenSalary(decoded: DecodedOffer, text: string): DecodedOffer {
  const min = decoded.salaire.mensuelBrutEuros;
  const max = decoded.salaire.maxBrutEuros ?? null;
  const minOk = min !== null && amountInText(text, min);
  const maxOk = max !== null && amountInText(text, max);
  if ((min === null || minOk) && (max === null || maxOk)) return decoded;
  return {
    ...decoded,
    salaire: { ...decoded.salaire, mensuelBrutEuros: minOk ? min : null, maxBrutEuros: maxOk ? max : null },
  };
}
