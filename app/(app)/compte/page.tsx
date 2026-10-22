import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AccountView } from '@/components/account/AccountView';
import { isSmsConfigured } from '@/lib/account/senders';
import { isAccountsConfigured } from '@/lib/account/store';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false } };

export default async function AccountPage() {
  // Lu à chaque visite : les clés des services peuvent arriver après la compilation.
  await connection();
  return <AccountView enabled={isAccountsConfigured()} sms={isSmsConfigured()} />;
}
