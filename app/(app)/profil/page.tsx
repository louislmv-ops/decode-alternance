import type { Metadata } from 'next';
import { ProfileView } from '@/components/tools/ProfileView';

export const metadata: Metadata = { title: 'Mon profil', robots: { index: false } };

export default function ProfilePage() {
  return <ProfileView />;
}
