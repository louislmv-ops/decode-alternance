import { currentAccount, notConfigured } from '@/lib/account/http';
import { cvFile, deleteCv, isAccountsConfigured, saveCv } from '@/lib/account/store';
import { extension, readCv } from '@/lib/cv/read';
import { allow, clientKey } from '@/lib/rate-limit';

export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024;

/** Dépose (ou remplace) le CV du compte, dans n'importe quel format lisible. */
export async function POST(request: Request) {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  if (!allow(`cv-compte:${clientKey(request)}`, 20, 3_600_000)) return Response.json({ error: 'Trop d’envois. Réessaie plus tard.' }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('cv');
  if (!(file instanceof File)) return Response.json({ error: 'Ajoute ton CV.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Ton CV dépasse 5 Mo.' }, { status: 413 });

  const content = await readCv(file);
  if (content.kind === 'error') return Response.json({ error: content.message }, { status: 415 });
  const name = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 120) || `cv.${extension(file.name) || 'pdf'}`;
  const meta = await saveCv(account.id, {
    name,
    type: file.type || 'application/octet-stream',
    data: new Uint8Array(await file.arrayBuffer()),
    text: content.kind === 'text' ? content.text.slice(0, 20_000) : null,
  });
  return Response.json({ cv: meta });
}

/** Télécharge son CV, pour le joindre à une candidature. */
export async function GET() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  const cv = await cvFile(account.id);
  if (!cv) return Response.json({ error: 'Pas encore de CV.' }, { status: 404 });
  return new Response(new Uint8Array(cv.data), {
    headers: {
      'Content-Type': cv.type,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(cv.name)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function DELETE() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  await deleteCv(account.id);
  return Response.json({ ok: true });
}
