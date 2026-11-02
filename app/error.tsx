'use client';

import { ErrorState } from '@/components/states/ErrorState';

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
