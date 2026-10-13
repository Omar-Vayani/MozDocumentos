// Minimal inline icon set (stroke icons, 24px grid). Decorative by default.

const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.35-4.35',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  download: 'M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14',
  print: 'M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z',
  share: 'M12 15V4m0 0L8 8m4-4l4 4M6 12v7h12v-7',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12.5l4.5 4.5L19 7',
  alert: 'M12 4l9 16H3L12 4zm0 6v4m0 3v.01',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 8v5m0-8v.01',
  edit: 'M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
  building: 'M4 20V5l8-2v17M12 9h8v11M8 8h.01M8 12h.01M8 16h.01M16 13h.01M16 17h.01M2 20h20',
  arrowLeft: 'M19 12H5m0 0l6-6m-6 6l6 6',
  arrowRight: 'M5 12h14m0 0l-6-6m6 6l-6 6',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  zoomIn: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.35-4.35M11 8v6M8 11h6',
  zoomOut: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.35-4.35M8 11h6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  upload: 'M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 19h14',
  book: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h9',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  coins: 'M12 5c4 0 7 1.3 7 3s-3 3-7 3-7-1.3-7-3 3-3 7-3zM5 8v4c0 1.7 3 3 7 3s7-1.3 7-3V8M5 12v4c0 1.7 3 3 7 3s7-1.3 7-3v-4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  scale: 'M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z',
  landmark: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z',
  gavel: 'M14 4l6 6M11 7l6 6M12.5 5.5l-6 6M4 21l6-6M17.5 10.5l-6 6M3 21h8',
  handshake: 'M2 12l4-4 4 2 3-3 4 1 5 4M2 12l5 5 2-1 2 2 2-1 2 2 4-4M9 10l3 3',
  family: 'M7 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 21v-6a4 4 0 0 1 8 0v6M13 21v-6a4 4 0 0 1 8 0v6',
  logout: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  calculator: 'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',
  layers: 'M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className, title }: { name: IconName; size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
