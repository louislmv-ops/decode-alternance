/** « Alternance - Chargé(e) d'études marketing H/F » devient « Chargé(e) d'études marketing » : sur une liste d'alternances, le reste est du bruit. */
export function cleanTitle(title: string): string {
  const cleaned = title
    .replace(/\(?\b[HF]\s*\/\s*[HFX]\b\)?/gi, '')
    .replace(/^\s*(alternance|apprentissage|apprenti\(?e?\)?)\s*[-–:|]\s*/i, '')
    .replace(/\s*[-–:|]\s*(en\s+)?(alternance|apprentissage|contrat\s+pro(fessionnalisation)?)\s*$/i, '')
    .replace(/\s+(en\s+)(alternance|apprentissage)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-–:|]+$/, '')
    .trim();
  return cleaned.length >= 4 && !/^(alternance|apprentissage|alternant\(?e?\)?)$/i.test(cleaned) ? cleaned : title.trim();
}
