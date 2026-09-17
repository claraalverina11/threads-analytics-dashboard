// Lightweight inline icon set (stroke style, 24x24 viewBox).
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const wrap = (children) => (props) =>
  (
    <svg viewBox="0 0 24 24" {...S} {...props}>
      {children}
    </svg>
  )

export const IconOverview = wrap(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
)
export const IconAnalytics = wrap(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 4-6" />
  </>,
)
export const IconTable = wrap(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M3 14h18M9 4v16" />
  </>,
)
export const IconWeek = wrap(
  <>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
    <path d="M7 14h4" />
  </>,
)
export const IconMonth = wrap(
  <>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="12" cy="14" r="1" />
    <circle cx="16" cy="14" r="1" />
    <circle cx="8" cy="18" r="1" />
    <circle cx="12" cy="18" r="1" />
  </>,
)
export const IconSpark = wrap(
  <>
    <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5 10.1 7.6 12 3z" />
    <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </>,
)
export const IconEye = wrap(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const IconHeart = wrap(
  <path d="M20.8 8.6a5 5 0 0 0-8.8-2.3A5 5 0 0 0 3.2 8.6c0 4.3 5.6 7.9 8.8 10.4 3.2-2.5 8.8-6.1 8.8-10.4z" />,
)
export const IconComment = wrap(
  <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5z" />,
)
export const IconRepost = wrap(
  <>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 12V9a3 3 0 0 1 3-3h15" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 12v3a3 3 0 0 1-3 3H3" />
  </>,
)
export const IconShare = wrap(
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </>,
)
export const IconGauge = wrap(
  <>
    <path d="M12 13l4-4" />
    <path d="M4.5 18a9 9 0 1 1 15 0" />
    <circle cx="12" cy="13" r="1.2" />
  </>,
)
export const IconDoc = wrap(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </>,
)
export const IconLayers = wrap(
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>,
)
export const IconArrowUp = wrap(<path d="M12 19V5M5 12l7-7 7 7" />)
export const IconArrowDown = wrap(<path d="M12 5v14M19 12l-7 7-7-7" />)
export const IconArrowRight = wrap(<path d="M5 12h14M13 5l7 7-7 7" />)
export const IconExternal = wrap(
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </>,
)
export const IconDownload = wrap(
  <>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </>,
)
export const IconSearch = wrap(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>,
)
export const IconMenu = wrap(<path d="M4 6h16M4 12h16M4 18h16" />)
export const IconTrophy = wrap(
  <>
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
  </>,
)
export const IconAlert = wrap(
  <>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </>,
)
export const IconTrend = wrap(
  <>
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </>,
)
export const IconTarget = wrap(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </>,
)
export const IconBulb = wrap(
  <>
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
  </>,
)
export const IconFlask = wrap(
  <>
    <path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" />
    <path d="M7.5 15h9" />
  </>,
)
