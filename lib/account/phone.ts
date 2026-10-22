/** Un numéro de portable français (métropole et outre-mer) au format international, ou null. */
export function normalizeFrenchMobile(input: string): string | null {
  const digits = input.replace(/[\s.()-]/g, '');
  const national = digits.startsWith('+33') ? `0${digits.slice(3)}` : digits.startsWith('0033') ? `0${digits.slice(4)}` : digits;
  if (/^0[67]\d{8}$/.test(national)) return `+33${national.slice(1)}`;
  // Outre-mer : accepté au format international (+262, +590, +594, +596).
  if (/^\+(262|590|594|596)\d{9}$/.test(digits)) return digits;
  return null;
}

export function maskPhone(e164: string): string {
  const national = e164.startsWith('+33') ? `0${e164.slice(3)}` : e164;
  return `${national.slice(0, 2)} •• •• •• ${national.slice(-2)}`;
}
