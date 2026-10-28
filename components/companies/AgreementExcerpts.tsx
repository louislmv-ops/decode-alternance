import { legifranceAgreement } from '@/lib/agreements/parse';
import { formatDate } from '@/lib/format';

/** Ce que les accords d'entreprise disent de la paie des alternants : le passage recopié tel quel, et le lien. */
export function AgreementExcerpts({ agreements }: { agreements: { id: string; title: string; signedAt: string | null; excerpts: string[] }[] }) {
  if (agreements.length === 0) return null;
  return (
    <ul className="agreements" role="list">
      {agreements.map((a) => (
        <li key={a.id}>
          {a.excerpts.slice(0, 2).map((x) => (
            <blockquote key={x}>« {x} »</blockquote>
          ))}
          <p className="c-post__meta">
            📄{' '}
            <a href={legifranceAgreement(a.id)} target="_blank" rel="noopener noreferrer" className="link">
              {a.title}
            </a>
            {a.signedAt ? `, signé le ${formatDate(a.signedAt)}` : ''} (accord d’entreprise publié par l’État)
          </p>
        </li>
      ))}
    </ul>
  );
}
