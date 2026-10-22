/** Une note sur 5, en barres pleines : lisible d'un coup d'œil, sans icône. */
export function Score({ value, label }: { value: number | null; label?: string }) {
  if (value === null) return null;
  return (
    <span className="e-score" aria-label={`${label ? `${label} : ` : ''}${value.toLocaleString('fr-FR')} sur 5`}>
      <span className="e-score__bar" aria-hidden="true">
        <span style={{ width: `${(value / 5) * 100}%` }} />
      </span>
      <span className="num">{value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
    </span>
  );
}
