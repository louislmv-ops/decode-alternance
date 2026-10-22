// Envoi des e-mails (Resend) et des SMS (Brevo). Sans clé, rien ne part : les comptes et
// les alertes restent éteints plutôt que de faire semblant.

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Décode <onboarding@resend.dev>', to: [to], subject, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend : HTTP ${res.status}`);
}

/** `to` au format international, par exemple +33612345678. */
export async function sendSms(to: string, content: string): Promise<void> {
  const res = await fetch(process.env.BREVO_API_URL || 'https://api.brevo.com/v3/transactionalSMS/sms', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: process.env.SMS_SENDER || 'Decode', recipient: to.replace(/^\+/, ''), content, type: 'transactional' }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Brevo : HTTP ${res.status}`);
}
