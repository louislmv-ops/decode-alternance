'use client';

import Link from 'next/link';
import { MatchButton } from '@/components/MatchButton';
import { useProfile } from '@/components/useProfile';
import { DEPARTMENT_NAMES } from '@/lib/departments';

const LEVEL_SHORT: Record<number, string> = { 3: 'CAP', 4: 'Bac', 5: 'Bac+2', 6: 'Bac+3', 7: 'Bac+5' };

/** En haut des offres : tes critères en un clic, ou le questionnaire pour les poser. */
export function ForYou() {
  const [profile] = useProfile();
  const hasCriteria = profile.filled && (profile.job || profile.department);

  if (!hasCriteria) {
    return (
      <div className="for-you">
        <p className="for-you__text">
          <strong>Pas envie de filtrer ?</strong> Ton CV ou 4 questions.
        </p>
        <MatchButton className="btn btn--small">Mes offres</MatchButton>
      </div>
    );
  }

  const params = new URLSearchParams();
  if (profile.job) params.set('q', profile.job);
  if (profile.department) params.set('dep', profile.department);
  params.set('niveau', String(profile.level));
  const summary = [profile.job, profile.department ? DEPARTMENT_NAMES[profile.department] : 'Toute la France', LEVEL_SHORT[profile.level], `${profile.age} ans`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="for-you">
      <p className="for-you__text">
        <strong>Ton profil :</strong> {summary}
      </p>
      <div className="for-you__actions">
        <Link href={`/offres?${params}`} className="btn btn--small">
          Mes offres
        </Link>
        <MatchButton className="for-you__edit">Modifier</MatchButton>
      </div>
    </div>
  );
}
