import { describe, expect, it } from 'vitest';
import { daysLeft, formatDeadline } from './CampaignCard';

describe('date limite des campagnes', () => {
  it('compte les jours restants à l’heure de Paris', () => {
    // 23 h 30 à Paris le 14 mars : la veille de la date limite.
    expect(daysLeft('2027-03-15', new Date('2027-03-14T22:30:00Z'))).toBe(1);
    // 0 h 30 à Paris le 15 mars, alors qu'il est encore le 14 en UTC.
    expect(daysLeft('2027-03-15', new Date('2027-03-14T23:30:00Z'))).toBe(0);
  });

  it('affiche la date en clair', () => {
    expect(formatDeadline('2027-03-15')).toBe('15 mars');
  });
});
