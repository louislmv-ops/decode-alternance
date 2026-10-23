// Icônes au trait, 16 px, une seule famille.

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const IconList = () => (
  <svg {...base}>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
  </svg>
);

export const IconDecode = () => (
  <svg {...base}>
    <path d="M3 3.5h10M3 6.5h6M4 10.5l2.5 2.5L13 6.5" />
  </svg>
);

export const IconEuro = () => (
  <svg {...base}>
    <path d="M12 4.2A4.5 4.5 0 1 0 12 11.8M2.5 7h6.5M2.5 9h6.5" />
  </svg>
);

export const IconPeople = () => (
  <svg {...base}>
    <circle cx="6" cy="5.5" r="2.5" />
    <path d="M1.5 13.5c.6-2.3 2.3-3.5 4.5-3.5s3.9 1.2 4.5 3.5M10.5 3.2a2.5 2.5 0 0 1 0 4.6M12.2 10.3c1.1.5 1.9 1.6 2.3 3.2" />
  </svg>
);

export const IconTrack = () => (
  <svg {...base}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <path d="M5 6l1.3 1.3L8.8 4.8M5 10.5h6" />
  </svg>
);

export const IconUser = () => (
  <svg {...base}>
    <circle cx="8" cy="5.5" r="2.8" />
    <path d="M2.8 13.8c.8-2.6 2.8-4 5.2-4s4.4 1.4 5.2 4" />
  </svg>
);

export const IconMenu = () => (
  <svg {...base} width={20} height={20}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
  </svg>
);

export const IconClose = () => (
  <svg {...base} width={20} height={20}>
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
  </svg>
);

export const IconOut = () => (
  <svg {...base} width={14} height={14}>
    <path d="M9 3h4v4M13 3L7.5 8.5M11 9.5V13H3V5h3.5" />
  </svg>
);

export const IconPin = () => (
  <svg {...base}>
    <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14z" />
    <circle cx="8" cy="6.5" r="1.6" />
  </svg>
);

export const IconChat = () => (
  <svg {...base}>
    <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
    <path d="M5 6.5h6M5 8.5h4" />
  </svg>
);

export const IconStar = () => (
  <svg {...base}>
    <path d="M8 1.8l1.8 3.7 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4-2.9-2.8 4-.6z" />
  </svg>
);
