import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { isCommunityOpen } from '@/lib/community/http';
import { type Campaign, openCampaigns } from '@/lib/recruiters/campaigns';

export const metadata: Metadata = {
  title: 'Campagnes d’alternance',
  description: 'Les entreprises qui recrutent plusieurs alternants en ce moment, avec les postes, les villes et la date limite.',
  alternates: { canonical: '/campagnes' },
};

export default async function CampaignsPage() {
  await connection();
  let campaigns: Campaign[] = [];
  if (isCommunityOpen()) campaigns = await openCampaigns().catch(() => []);
  return (
    <div className="screen c-screen">
      <div className="c-main">
        <h1 className="c-charte__title">Campagnes d’alternance</h1>
        <p className="c-profile__bio">Des entreprises qui recrutent plusieurs alternants d’un coup. Date limite en tête.</p>
        {campaigns.length === 0 ? (
          <p className="c-empty">Aucune campagne ouverte pour l’instant.</p>
        ) : (
          <div className="k-list">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
        <p className="c-note">
          Tu recrutes ? <Link href="/recruter">Lance ta campagne</Link>.
        </p>
      </div>
    </div>
  );
}
