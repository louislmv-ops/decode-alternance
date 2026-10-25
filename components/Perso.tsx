/** Décode, le personnage du site, dans une de ses poses. Décoratif : le texte voisin porte le sens. */
export type Pose =
  | 'salut'
  | 'salut-grand'
  | 'sourire'
  | 'clin-oeil'
  | 'youpi'
  | 'reflechit'
  | 'rire'
  | 'surpris'
  | 'cool'
  | 'serein'
  | 'coeur'
  | 'feu'
  | 'eclair';

export function Perso({ pose, size = 48, className, eager = false }: { pose: Pose; size?: number | string; className?: string; eager?: boolean }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`perso${className ? ` ${className}` : ''}`}
      src={`/perso/${pose}.webp`}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ width: s, height: s }}
    />
  );
}
