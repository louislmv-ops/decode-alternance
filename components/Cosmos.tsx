/**
 * Le ciel de tout le site : trois couches d'étoiles qui dérivent lentement, la voie lactée et des étoiles
 * filantes de temps en temps. Uniquement des dégradés et des déplacements : la carte graphique s'en charge,
 * rien n'est recalculé pendant le défilement.
 */
const SHOOTING = [
  { top: '12%', left: '78%', delay: '2s', duration: '11s' },
  { top: '30%', left: '96%', delay: '7s', duration: '15s' },
  { top: '6%', left: '52%', delay: '12s', duration: '19s' },
  { top: '46%', left: '88%', delay: '17s', duration: '23s' },
];

export function Cosmos() {
  return (
    <div className="cosmos" aria-hidden="true">
      <div className="cosmos__milky" />
      <div className="cosmos__stars cosmos__stars--far" />
      <div className="cosmos__stars cosmos__stars--mid" />
      <div className="cosmos__stars cosmos__stars--near" />
      {SHOOTING.map((s) => (
        <span
          key={s.left + s.top}
          className="cosmos__shoot"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, animationDuration: s.duration } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
