// Lecture des accords d'entreprise publiés par l'État (archives hebdomadaires ACCO de la DILA) : chaque archive
// (100 à 250 Mo, un millier d'accords) est téléchargée, ouverte, lue, puis effacée. Seuls les accords qui parlent
// de la paie des alternants sont gardés, avec les passages concernés.
//   pnpm accords              lit jusqu'à 4 archives pas encore lues, les plus récentes d'abord
//   pnpm accords --max 10     en lit davantage (rattrapage)
//   pnpm accords --dry        lit sans rien écrire en base (affiche ce qui serait gardé)
// L'archive complète (45 Go) n'est pas lue : les archives hebdomadaires suffisent pour les accords récents.

import { execFileSync } from 'node:child_process';
import { createWriteStream, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { apprenticePayExcerpts, documentText, parseAgreementXml } from '@/lib/agreements/parse';
import { markArchive, readArchives, saveAgreement } from '@/lib/agreements/store';
import { USER_AGENT } from '@/lib/offers/connectors/http';
import { closeDb } from '@/lib/offers/store';

const BASE = process.env.ACCO_URL || 'https://echanges.dila.gouv.fr/OPENDATA/ACCO/';
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dry = args.includes('--dry');
const max = Math.max(1, Number(flag('--max')) || 4);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** Le texte d'un .docx ou .odt, lu avec unzip (présent sur les machines de GitHub Actions). */
function readDocument(path: string): string {
  const inner = path.endsWith('.odt') ? 'content.xml' : 'word/document.xml';
  try {
    return documentText(execFileSync('unzip', ['-p', path, inner], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8'));
  } catch {
    return '';
  }
}

async function readArchive(name: string): Promise<{ agreements: number; kept: number }> {
  const dir = mkdtempSync(join(tmpdir(), 'acco-'));
  try {
    const file = join(dir, 'a.tar.gz');
    const res = await fetch(`${BASE}${name}`, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok || !res.body) throw new Error(`${name} : HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body as import('node:stream/web').ReadableStream), createWriteStream(file));
    execFileSync('tar', ['xzf', file, '-C', dir]);
    rmSync(file);
    const files = walk(dir);
    const documents = new Map(files.filter((f) => /\.(docx|odt)$/i.test(f)).map((f) => [basename(f), f]));
    let agreements = 0;
    let kept = 0;
    for (const path of files.filter((f) => f.endsWith('.xml'))) {
      const meta = parseAgreementXml(readFileSync(path, 'utf8'));
      if (!meta) continue;
      agreements += 1;
      const doc = meta.document ? documents.get(basename(meta.document)) : undefined;
      if (!doc) continue;
      const excerpts = apprenticePayExcerpts(readDocument(doc));
      if (excerpts.length === 0) continue;
      kept += 1;
      if (dry) console.log(`${meta.company} (${meta.siret.slice(0, 9)}) · ${meta.title}\n  « ${excerpts[0]} »`);
      else await saveAgreement(meta, excerpts);
    }
    return { agreements, kept };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const res = await fetch(BASE, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Liste des archives : HTTP ${res.status}`);
  const names = [...new Set([...(await res.text()).matchAll(/href="(ACCO_\d{8}-\d{6}\.tar\.gz)"/g)].map((m) => m[1]!))].sort().reverse();
  const done = dry ? new Set<string>() : await readArchives();
  const todo = names.filter((n) => !done.has(n)).slice(0, max);
  console.log(`Accords d'entreprise : ${names.length} archives publiées, ${done.size} déjà lues, ${todo.length} à lire`);
  for (const name of todo) {
    const started = Date.now();
    try {
      const { agreements, kept } = await readArchive(name);
      if (!dry) await markArchive(name, agreements, kept);
      console.log(`${name} : ${agreements} accords, ${kept} parlent de la paie des alternants (${Math.round((Date.now() - started) / 1000)} s)`);
    } catch (error) {
      console.error(`${name} : échec (${(error as Error).message})`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
