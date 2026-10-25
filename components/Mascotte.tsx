/** Décode, la mascotte du site (rendue en 3D dans Blender). Décorative : le texte voisin porte le sens. */
export type MascottePose = 'diplome' | 'lunettes' | 'surpris' | 'clin-oeil';

export function Mascotte({ pose, size, className, eager = false }: { pose: MascottePose; size: string | number; className?: string; eager?: boolean }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`mascotte${className ? ` ${className}` : ''}`}
      src={`/decode/${pose}.webp`}
      alt=""
      aria-hidden="true"
      width={640}
      height={640}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ width: s, height: s }}
    />
  );
}
