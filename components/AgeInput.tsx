'use client';

import { useState } from 'react';

/** L'âge : on tape librement (« 2 » puis « 21 »), ou on ajuste avec − et +. Seul un âge valide est retenu. */
export function AgeInput({ id, value, onChange, min = 15, max = 60 }: { id?: string; value: number; onChange: (age: number) => void; min?: number; max?: number }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="age-stepper">
      <button type="button" aria-label="Un an de moins" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        −
      </button>
      <input
        id={id}
        className="ui-input num"
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={text ?? String(value)}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, '');
          setText(t);
          const n = Number(t);
          if (n >= min && n <= max) onChange(n);
        }}
        onBlur={() => setText(null)}
      />
      <button type="button" aria-label="Un an de plus" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        +
      </button>
    </div>
  );
}
