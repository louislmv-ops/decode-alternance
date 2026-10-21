'use client';

import { useState } from 'react';

export function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="ui-btn ui-btn--small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        } catch {
          setDone(false);
        }
      }}
    >
      <span aria-live="polite">{done ? 'Copié' : label}</span>
    </button>
  );
}
