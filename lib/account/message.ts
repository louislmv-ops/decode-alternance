import type { Candidate } from './store';

/** Le message de candidature, prêt à copier : court, poli, avec ce que la personne a rempli. Rien d'inventé. */
export function applicationMessage(c: Candidate, offer: { title: string; company: string | null }): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
  const where = offer.company ? ` chez ${offer.company}` : '';
  const lines = [
    'Bonjour,',
    '',
    `${name ? `Je m’appelle ${name}${c.school ? `, je suis en ${c.school}` : ''}` : c.school ? `Je suis en ${c.school}` : 'Je'}${name || c.school ? ' et je' : ''} candidate à votre offre d’alternance « ${offer.title} »${where}.`,
  ];
  if (c.pitch) lines.push('', c.pitch);
  lines.push('', `${c.available ? `Je suis disponible à partir de ${c.available}. ` : ''}Vous trouverez mon CV en pièce jointe.`);
  if (c.linkedin || c.portfolio) lines.push([c.linkedin, c.portfolio].filter(Boolean).join(' · '));
  lines.push('', 'Je serais ravi(e) d’en parler avec vous.', '', 'Bien à vous,', [name, c.phone].filter(Boolean).join('\n') || '');
  return lines.join('\n').trim();
}
