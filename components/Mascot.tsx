import Image from 'next/image';

// La mascotte de Décode : un même personnage en 3D, dans quelques poses, utilisé avec parcimonie
// (accueil du lieu, liste vide, questionnaire, invitation à décoder). Images : Fluent Emoji de
// Microsoft, licence MIT, converties en WebP (moins de 10 Ko chacune).

const POSES = { etudiant: 'etudiant', salut: 'salut', bof: 'bof', voila: 'voila' } as const;

/** Purement décorative : les lecteurs d'écran l'ignorent. */
export function Mascot({ pose, size = 72, className = '' }: { pose: keyof typeof POSES; size?: number; className?: string }) {
  return <Image src={`/mascotte/${POSES[pose]}.webp`} alt="" aria-hidden="true" width={size} height={size} className={`mascot ${className}`} />;
}
