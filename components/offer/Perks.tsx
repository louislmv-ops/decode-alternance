/** Les avantages de l'offre, bien en vue : ceux écrits dans l'annonce, et ceux que l'IA a relevés. */
export function PerksPanel({ perks }: { perks: string[] }) {
  return (
    <section className="panel perks" aria-labelledby="perks-title">
      <div className="panel__head">
        <h2 id="perks-title">Les avantages</h2>
      </div>
      {perks.length > 0 ? (
        <ul className="perks__list">
          {perks.map((p) => (
            <li key={p} className="perks__item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel__note">
          Aucun avantage cité. Demande en entretien.
        </p>
      )}
    </section>
  );
}

/** Télétravail et compétences lus dans l'annonce : rien quand elle n'en dit rien. */
export function AskedPanel({ remote, skills }: { remote: string | null; skills: string[] }) {
  if (!remote && skills.length === 0) return null;
  return (
    <section className="panel asked" aria-labelledby="asked-title">
      <div className="panel__head">
        <h2 id="asked-title">Ce que dit l’annonce</h2>
      </div>
      {remote && <p className="asked__remote">{remote}</p>}
      {skills.length > 0 && (
        <ul className="asked__skills" aria-label="Compétences citées">
          {skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
