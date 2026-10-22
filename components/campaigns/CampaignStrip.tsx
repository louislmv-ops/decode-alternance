import Link from 'next/link';
import { isCommunityOpen } from '@/lib/community/http';
import { openCampaigns } from '@/lib/recruiters/campaigns';
import { CampaignCard } from './CampaignCard';

/** Les campagnes qui ferment le plus tôt, en tête des offres. Rien s'il n'y en a pas. */
export async function CampaignStrip() {
  if (!isCommunityOpen()) return null;
  const campaigns = await openCampaigns().catch(() => []);
  if (campaigns.length === 0) return null;
  return (
    <section className="k-strip" aria-label="Campagnes en cours">
      <div className="k-strip__head">
        <h2>Campagnes en cours</h2>
        <Link href="/campagnes" className="link">
          Tout voir
        </Link>
      </div>
      <div className="k-strip__row">
        {campaigns.slice(0, 6).map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </section>
  );
}
