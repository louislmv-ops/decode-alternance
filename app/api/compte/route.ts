import { z } from 'zod/v4';
import { clearSessionCookies, currentAccount, notConfigured, publicAccount } from '@/lib/account/http';
import { deleteAccount, isAccountsConfigured, SavedSearch, updateAccount } from '@/lib/account/store';

const Patch = z.object({
  alertEmail: z.boolean().optional(),
  alertSms: z.boolean().optional(),
  alertFrequency: z.enum(['quotidien', 'hebdo']).optional(),
  savedSearch: SavedSearch.optional(),
  // Le profil et le suivi sont relus et nettoyés par la page avant usage ; on borne seulement leur taille.
  profile: z.record(z.string(), z.unknown()).optional(),
  tracker: z.array(z.record(z.string(), z.unknown())).max(500).optional(),
});

export async function GET() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  return Response.json({ account: publicAccount(account) });
}

export async function PATCH(request: Request) {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 300_000) return Response.json({ error: 'Trop de données.' }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Données invalides.' }, { status: 400 });
  if (parsed.data.alertSms && !account.phoneVerified) {
    return Response.json({ error: 'Ajoute d’abord ton numéro.' }, { status: 400 });
  }
  return Response.json({ account: publicAccount(await updateAccount(account.id, parsed.data)) });
}

/** Supprime le compte et tout ce qu'il contient. */
export async function DELETE() {
  if (!isAccountsConfigured()) return notConfigured();
  const account = await currentAccount();
  if (!account) return Response.json({ error: 'Pas connecté.' }, { status: 401 });
  await deleteAccount(account.id);
  await clearSessionCookies();
  return Response.json({ ok: true });
}
