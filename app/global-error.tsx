'use client';

// Dernier recours, quand même la mise en page du site a planté : un document complet, sans les styles du site.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#08061a', color: '#f4f1ff', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <title>Décode est en panne</title>
        <main>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/decode/surpris-256.webp" alt="" width={140} height={140} />
          <h1 style={{ fontSize: 28, margin: '12px 0' }}>Décode est en panne</h1>
          <p style={{ margin: '0 0 20px', opacity: 0.85 }}>Ce n’est pas toi, c’est nous. Réessaie dans un instant.</p>
          <button type="button" onClick={() => retry()} style={{ font: 'inherit', fontWeight: 700, padding: '12px 22px', borderRadius: 999, border: 0, background: '#ffe066', color: '#08061a', cursor: 'pointer' }}>
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
