// Ce que le serveur et les pages partagent : les limites, les types de message, les formes des données.

export const POST_MAX = 500;
/** Au-delà de ce nombre de signalements, un message est masqué en attendant la modération. */
export const REPORTS_TO_HIDE = 3;
export const FEED_PAGE = 30;

export const KINDS = ['temoignage', 'question', 'astuce', 'libre'] as const;
export type PostKind = (typeof KINDS)[number];
export const KIND_LABELS: Record<PostKind, string> = { temoignage: 'Témoignage', question: 'Question', astuce: 'Astuce', libre: 'Libre' };

export interface Member {
  accountId: string;
  handle: string;
  name: string;
  bio: string;
  domain: string;
  city: string;
  school: string;
  followers: number;
  following: number;
  posts: number;
  /** La carte alternant : ce qu'un recruteur veut voir en dix secondes. */
  formation: string;
  level: number | null;
  rhythm: string;
  startMonth: string | null;
  seeking: boolean;
  visibleToCompanies: boolean;
  /** Les entreprises dont la personne a aimé une offre peuvent voir son profil. */
  shareLikes?: boolean;
  skills: string[];
  linkedin: string;
}

export interface Post {
  id: string;
  kind: PostKind;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: { handle: string; name: string; domain: string; city: string };
  likes: number;
  replies: number;
  likedByMe: boolean;
  mine: boolean;
}

export const LEVEL_SHORT: Record<number, string> = { 3: 'CAP', 4: 'Bac', 5: 'Bac+2', 6: 'Bac+3', 7: 'Bac+5' };

/** « 2027-09 » devient « sept. 2027 ». */
export function formatMonth(month: string | null): string | null {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}
