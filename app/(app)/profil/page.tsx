import type { Metadata } from 'next';
import { ProfileView } from '@/components/tools/ProfileView';

export const metadata: Metadata = { title: 'Mon profil' };

export default function ProfilePage() {
  return <ProfileView />;
}
