import { type ConventionGrid as Grid, legifranceArticle } from '@/lib/rules/convention-grids';

const LEVELS: Record<number, string> = { 5: 'bac+2', 6: 'bac+3/4', 7: 'bac+5' };

function ageLabel(min: number, max: number): string {
  if (min <= 0) return `Moins de ${max + 1} ans`;
  if (max >= 120) return `${min} ans et plus`;
  return `${min} à ${max} ans`;
}

/** La grille de salaire des apprentis prévue par la convention de l'entreprise, quand elle paie plus que la loi. */
export function ConventionGrid({ grid }: { grid: Grid }) {
  const a = grid.apprentissage;
  if (!a) return null;
  return (
    <section className="e-block" aria-labelledby="conv-grid">
      <h2 id="conv-grid">Ce que paie sa convention ({grid.name})</h2>
      <p className="c-note">
        Cette convention paie les apprentis plus que le minimum légal, en % du SMIC{grid.months === 13 ? ', sur 13 mois' : ''}
        {grid.orConventionMinimum ? ' (ou plus si le minimum du poste dans la convention est plus haut)' : ''}.
      </p>
      <div className="table-scroll">
        <table className="conv-table">
          <thead>
            <tr>
              <th scope="col">Âge</th>
              <th scope="col">1re année</th>
              <th scope="col">2e année</th>
              <th scope="col">3e année</th>
            </tr>
          </thead>
          <tbody>
            {a.brackets.map((b) => (
              <tr key={`${b.minAge}-${b.levels?.join('') ?? ''}`}>
                <th scope="row">
                  {ageLabel(b.minAge, b.maxAge)}
                  {b.levels ? `, ${b.levels.map((l) => LEVELS[l]).join(' ou ')}` : ''}
                </th>
                {b.byYear.map((r, i) => (
                  <td key={i} className="num">
                    {r} %
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="c-post__meta">
        Source :{' '}
        <a href={legifranceArticle(a.source.article)} target="_blank" rel="noopener noreferrer" className="link">
          {a.source.text}
        </a>
        {a.source.extended ? '' : ' (accord non étendu : entreprises adhérentes des organisations signataires)'}.
      </p>
    </section>
  );
}
