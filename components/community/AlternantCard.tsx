import { formatMonth, LEVEL_SHORT } from '@/lib/community/shared';
import type { PublicMember } from './ui';

/** La carte alternant : formation, niveau, date de début, rythme, compétences. Rien si le profil est vide. */
export function AlternantCard({ member: m }: { member: PublicMember }) {
  const start = formatMonth(m.startMonth);
  const facts = [m.formation, m.level ? LEVEL_SHORT[m.level] : null, start ? `dès ${start}` : null, m.rhythm].filter(Boolean);
  if (!m.seeking && facts.length === 0 && m.skills.length === 0 && !m.linkedin) return null;
  return (
    <section className="c-card" aria-label="Carte alternant">
      {m.seeking && <span className="c-card__flag">Cherche une alternance</span>}
      {facts.length > 0 && <p className="c-card__facts">{facts.join(' · ')}</p>}
      {m.skills.length > 0 && (
        <ul className="c-card__skills" role="list">
          {m.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {m.linkedin && (
        <a className="link c-card__link" href={m.linkedin} target="_blank" rel="noopener noreferrer nofollow">
          LinkedIn
        </a>
      )}
    </section>
  );
}
