/** Emoji 3D (Fluent Emoji de Microsoft, licence MIT) : le même rendu sur tous les téléphones. Décoratif, le texte voisin porte le sens. */
const EMOJI = { feu: 'feu', eclair: 'eclair', billets: 'billets', coeur: 'coeur', croix: 'croix' } as const;

export type EmojiName = keyof typeof EMOJI;

export function Emoji({ name, size = '1.2em' }: { name: EmojiName; size?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="emoji" src={`/emoji/${EMOJI[name]}.webp`} alt="" aria-hidden="true" width={72} height={72} style={{ width: size, height: size }} />
  );
}
