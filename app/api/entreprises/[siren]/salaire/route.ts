import { ensureCompany, firstError } from '@/lib/companies/http';
import { addSalary, Duplicate, SalaryInput } from '@/lib/companies/store';
import { closed, isCommunityOpen, viewer } from '@/lib/community/http';

export async function POST(request: Request, { params }: { params: Promise<{ siren: string }> }) {
  if (!isCommunityOpen()) return closed();
  const { account } = await viewer();
  if (!account) return Response.json({ error: 'Connecte-toi d’abord.' }, { status: 401 });
  const { siren } = await params;
  const parsed = SalaryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error, 'Déclaration invalide.') }, { status: 400 });
  const missing = await ensureCompany(siren);
  if (missing) return missing;
  try {
    await addSalary(account.id, siren, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Duplicate) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
