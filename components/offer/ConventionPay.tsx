'use client';

import { formatEuros } from '@/lib/format';
import { legifranceArticle } from '@/lib/rules/convention-grids';
import type { ConventionMinimum } from '@/lib/rules/salary';

/** « Ta convention paie plus que la loi » : le chiffre, la convention et le lien vers l'article sur Légifrance. */
export function ConventionPay({ conv, legalCents }: { conv: ConventionMinimum; legalCents: number }) {
  return (
    <section className="panel conv-pay" aria-label="Minimum de la convention collective">
      <p>
        💸 <strong>Bonne nouvelle :</strong> cette boîte relève de la convention <strong>{conv.name}</strong>, qui paie les alternants plus que
        la loi. Pour toi : au moins <strong className="num">{formatEuros(conv.cents, 0)}</strong> brut par mois
        {conv.months === 13 ? ' (sur 13 mois, ramené au mois)' : ''}, contre {formatEuros(legalCents, 0)} de minimum légal.
      </p>
      <p className="panel__note">
        {conv.orConventionMinimum ? 'C’est un plancher : le texte prévoit plus si le minimum de ton poste dans la convention est plus haut. ' : ''}
        {conv.source.extended ? '' : 'Accord non étendu : il s’applique aux entreprises adhérentes des organisations signataires. '}
        Source :{' '}
        <a href={legifranceArticle(conv.source.article)} target="_blank" rel="noopener noreferrer" className="link">
          {conv.source.text}
        </a>
        .
      </p>
    </section>
  );
}
