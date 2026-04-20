import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const PlayIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

export const TaskIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M8 10l3 3 5-6" />
  </svg>
);

export const ApprovalIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const FlagIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 22V4" />
    <path d="M4 4h14l-3 5 3 5H4" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const RunIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

export const ChevronIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const UndoIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </svg>
);

export const RedoIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
  </svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const HandleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const UploadIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const SunIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const SparkleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3l1.9 5.7L19.5 10.5 13.9 12.4 12 18l-1.9-5.6L4.5 10.5 10.1 8.7 12 3z" />
  </svg>
);

export const LogoIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
    <circle cx="10" cy="10" r="2.4" fill="white" />
    <circle cx="22" cy="10" r="2.4" fill="white" />
    <circle cx="16" cy="22" r="2.4" fill="white" />
    <path
      d="M10 10L16 22"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M22 10L16 22"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#E08666" />
        <stop offset="1" stopColor="#C26B4C" />
      </linearGradient>
    </defs>
  </svg>
);
