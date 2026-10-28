// Les tables des comptes, de la commu, des entreprises… sont créées au premier usage. Sans garde-fou,
// chaque démarrage d'une fonction relançait une cinquantaine d'instructions SQL, une par une, avant la
// première page : plusieurs secondes quand la base est loin. Ici, chaque bloc ne tourne qu'une fois par
// version du code : son empreinte est gardée dans la base, et une seule requête suffit ensuite.

import { db } from './store';

let versions: Promise<Map<string, string>> | null = null;

async function loadVersions(): Promise<Map<string, string>> {
  const s = db();
  try {
    const rows = await s<{ name: string; version: string }[]>`select name, version from decode_schema`;
    return new Map(rows.map((r) => [r.name, r.version]));
  } catch (error) {
    // 42P01 : la table n'existe pas encore (première fois sur cette base).
    if ((error as { code?: string }).code !== '42P01') throw error;
    await s`create table if not exists decode_schema (name text primary key, version text not null, applied_at timestamptz not null default now())`;
    return new Map();
  }
}

/** Une empreinte courte du code qui crée les tables : elle change dès que ce code change. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Lance `create` si ce bloc de tables n'a pas encore été appliqué dans cette version, puis le note. */
export async function ensureOnce(name: string, create: () => Promise<void>): Promise<void> {
  const version = fingerprint(create.toString());
  const map = await (versions ??= loadVersions().catch((error) => {
    versions = null;
    throw error;
  }));
  if (map.get(name) === version) return;
  await create();
  await db()`insert into decode_schema (name, version) values (${name}, ${version})
    on conflict (name) do update set version = excluded.version, applied_at = now()`;
  map.set(name, version);
}
