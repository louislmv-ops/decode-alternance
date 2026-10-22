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
