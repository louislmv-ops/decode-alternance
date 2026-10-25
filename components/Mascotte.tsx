/** Décode, la mascotte du site (rendue en 3D dans Blender). Décorative : le texte voisin porte le sens. */
export type MascottePose = 'diplome' | 'lunettes' | 'surpris' | 'clin-oeil' | 'loupe' | 'content' | 'pense' | 'logo';

export function Mascotte({ pose, size, className, eager = false }: { pose: MascottePose; size: string | number; className?: string; eager?: boolean }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`mascotte${className ? ` ${className}` : ''}`}
      src={`/decode/${pose}.webp`}
      // Une version légère suffit pour les petites tailles ; la grande reste pour les écrans très denses.
      srcSet={pose === 'logo' ? undefined : `/decode/${pose}-256.webp 256w, /decode/${pose}.webp 768w`}
      sizes={s}
      alt=""
      aria-hidden="true"
      width={768}
      height={768}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ width: s, height: s }}
    />
  );
}
