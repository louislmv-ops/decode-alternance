import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { BackLink } from '@/components/BackLink';
import { campaignFacts, Deadline } from '@/components/campaigns/CampaignCard';
import { isCommunityOpen } from '@/lib/community/http';
import { campaignById } from '@/lib/recruiters/campaigns';

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!isCommunityOpen()) return null;
  return campaignById(id).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).id);
  return c ? { title: `${c.title} · ${c.company}`, description: c.body.slice(0, 150) } : { title: 'Campagne introuvable' };
}

export default async function CampaignPage({ params }: Props) {
  await connection();
  const c = await load((await params).id);
  if (!c) notFound();
  return (
    <div className="screen c-screen">
      <div className="back-row">
        <BackLink fallback="/campagnes" label="Campagnes" />
      </div>
      <article className="c-main k-detail">
        <p className="k-card__company">{c.company}</p>
        <h1 className="c-charte__title">{c.title}</h1>
        <p className="c-card__facts">{campaignFacts(c).join(' · ')}</p>
        {c.open ? <Deadline day={c.deadline} /> : <span className="k-deadline is-soon">Campagne close</span>}
        <p className="k-detail__body">{c.body}</p>
        {c.open && (
          <a className="btn" href={c.applyUrl} target="_blank" rel="noopener noreferrer nofollow">
            Candidater chez {c.company}
          </a>
        )}
        <p className="c-note">
          La candidature se fait sur le site de l’entreprise.{' '}
          {c.website && (
            <a className="link" href={c.website} target="_blank" rel="noopener noreferrer nofollow">
              Son site
            </a>
          )}
        </p>
      </article>
    </div>
  );
}
