import { z } from 'zod/v4';
import { isAccountsConfigured } from '@/lib/account/store';
import { allow, clientKey } from '@/lib/rate-limit';
import { activeSponsors, recordSponsorStat } from '@/lib/sponsors/store';

const Body = z.object({ id: z.string().uuid(), kind: z.enum(['impression', 'click']) });

/** Une vue ou un clic sur une offre mise en avant. Rien n'est gardé sur la personne : juste un compteur par jour. */
export async function POST(request: Request) {
  if (!isAccountsConfigured()) return new Response(null, { status: 204 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  // Un compteur, pas une preuve : on limite simplement ce qu'une même adresse peut ajouter.
  if (!allow(`stat:${clientKey(request)}:${parsed.data.id}:${parsed.data.kind}`, 30, 3_600_000)) return new Response(null, { status: 204 });
  if (!(await activeSponsors()).some((s) => s.accountId === parsed.data.id)) return new Response(null, { status: 204 });
  await recordSponsorStat(parsed.data.id, parsed.data.kind).catch(() => {});
  return new Response(null, { status: 204 });
}
