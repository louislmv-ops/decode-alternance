import { z } from 'zod/v4';
import { sendEmail } from '@/lib/account/senders';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';
import { ContactRefused, recordContact, recruiterByAccount } from '@/lib/recruiters/store';
import { SITE_URL } from '@/lib/site';

const Body = z.object({ handle: z.string().min(3).max(20), message: z.string().trim().min(30).max(1000) });

/** Le message part par e-mail au candidat ; il répond directement au recruteur. Son adresse n'est jamais montrée. */
export async function POST(request: Request) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  const recruiter = account ? await recruiterByAccount(account.id) : null;
  if (!account || !recruiter?.verified) return Response.json({ error: 'Réservé aux entreprises vérifiées.' }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Message de 30 à 1 000 caractères.' }, { status: 400 });
  try {
    const target = await recordContact(account.id, parsed.data.handle, parsed.data.message);
    await sendEmail(
      target.email,
      `${recruiter.company} veut te parler de ton alternance`,
      `Bonjour ${target.name},\n\n${recruiter.contactName}${recruiter.role ? ` (${recruiter.role})` : ''} chez ${recruiter.company} t'a écrit via Décode :\n\n${parsed.data.message}\n\n${recruiter.website ? `Leur site : ${recruiter.website}\n` : ''}Pour répondre, réponds simplement à cet e-mail : ta réponse part chez ${recruiter.company}.\n\nTu ne veux plus être contacté ? Décoche « Les entreprises vérifiées peuvent me trouver » sur ton profil : ${SITE_URL}/membres/${parsed.data.handle.toLowerCase()}${process.env.LEGAL_CONTACT ? `\nUn message déplacé ? Signale-le à ${process.env.LEGAL_CONTACT}.` : ''}`,
      account.email,
    );
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ContactRefused) return Response.json({ error: error.message }, { status: 409 });
    console.error(error);
    return Response.json({ error: 'Le message n’est pas parti. Réessaie.' }, { status: 502 });
  }
}
