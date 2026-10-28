import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// L'image des liens partagés (WhatsApp, Instagram, LinkedIn, iMessage) : le titre de l'accueil
// sur l'aura Ultraviolet. Générée une fois au build, puis servie depuis le cache.

export const alt = 'Décode : trouve ton alternance, en clair';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  // Inter (licence SIL OFL), réduite aux lettres du français : la police du système n'existe pas côté serveur.
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), 'app/fonts/inter-display-bold.otf')),
    readFile(join(process.cwd(), 'app/fonts/inter-regular.otf')),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#ffffff',
          backgroundImage: [
            'radial-gradient(circle at 18% 88%, rgba(58, 28, 255, 0.55) 0%, rgba(58, 28, 255, 0) 38%)',
            'radial-gradient(circle at 42% 100%, rgba(138, 43, 255, 0.55) 0%, rgba(138, 43, 255, 0) 40%)',
            'radial-gradient(circle at 64% 96%, rgba(255, 62, 200, 0.55) 0%, rgba(255, 62, 200, 0) 36%)',
            'radial-gradient(circle at 88% 82%, rgba(92, 225, 255, 0.6) 0%, rgba(92, 225, 255, 0) 34%)',
          ].join(', '),
          color: '#1d1d1f',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', color: '#5b21ff' }}>décode</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>Trouve ton alternance.</div>
          <div style={{ display: 'flex', marginTop: 12 }}>
            <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, padding: '0 12px', background: '#ffd60a' }}>
              En clair.
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 32, fontSize: 34, fontWeight: 400, color: '#3a3a3c' }}>
            Les offres traduites, ton salaire calculé, les pièges écartés.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      ],
    },
  );
}
