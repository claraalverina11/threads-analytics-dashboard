import {
  IconOverview,
  IconAnalytics,
  IconTable,
  IconWeek,
  IconMonth,
  IconSpark,
} from './Icons'

const NAV = [
  { id: 'overview', label: 'Overview', icon: IconOverview },
  { id: 'analytics', label: 'Analytics', icon: IconAnalytics },
  { id: 'content', label: 'Content Performance', icon: IconTable },
  { id: 'weekly', label: 'Weekly Insights', icon: IconWeek },
  { id: 'monthly', label: 'Monthly Insights', icon: IconMonth },
  { id: 'ai', label: 'AI Recommendations', icon: IconSpark },
]

export default function Sidebar({ active, onNavigate, account }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark" aria-hidden>
          <svg viewBox="0 0 32 32">
            <path
              d="M16 7c-4.6 0-7.7 2.6-7.9 7.6-.2 4.6 2.4 8 6.9 8.4 3 .3 5.4-.9 6.4-3.3.6-1.5.5-3.2-.4-4.4-.8-1.1-2.1-1.8-3.7-1.9-2-.1-3.4.9-3.5 2.5-.1 1.3.8 2.2 2.1 2.3.9.1 1.6-.3 1.8-1"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="brand__name">Threads Analytics</div>
          <div className="brand__sub">Performance Studio</div>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        <div className="nav__label">Reporting</div>
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav__item${active === item.id ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__foot">
        <div className="avatar" aria-hidden>
          SA
        </div>
        <div className="meta">
          <b>Social Admin</b>
          <span>{account}</span>
        </div>
      </div>
    </aside>
  )
}

export { NAV }
