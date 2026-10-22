/** Un SIRET : 14 chiffres et une clé de Luhn (La Poste, 356 000 000, a sa propre règle). */
export function isValidSiret(input: string): boolean {
  const siret = input.replace(/\s/g, '');
  if (!/^\d{14}$/.test(siret)) return false;
  if (siret.startsWith('356000000')) return [...siret].reduce((n, d) => n + Number(d), 0) % 5 === 0;
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    let d = Number(siret[13 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
