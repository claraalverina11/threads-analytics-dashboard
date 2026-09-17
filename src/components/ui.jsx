// Small shared UI primitives.
import { formatCompact, formatNumber, formatPercent, formatDelta } from '../lib/format'
import { IconArrowUp, IconArrowDown, IconArrowRight } from './Icons'
import { pillarColor } from '../lib/theme'

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHead({ title, sub, right }) {
  return (
    <div className="card__head">
      <div>
        <h3>{title}</h3>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="spacer" />
      {right}
    </div>
  )
}

export function Section({ title, sub, right, children }) {
  return (
    <section className="section">
      {(title || right) && (
        <div className="section__head">
          {title && <h2>{title}</h2>}
          {sub && <p>{sub}</p>}
          <div className="spacer" />
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

/** Signed change pill. `invert` flips the good/bad coloring (rare). */
export function Delta({ value, suffix = '', invert = false }) {
  if (value == null || Number.isNaN(value)) {
    return <span className="delta delta--flat">—</span>
  }
  const flat = Math.abs(value) < 0.05
  const positive = invert ? value < 0 : value > 0
  const cls = flat ? 'delta--flat' : positive ? 'delta--pos' : 'delta--neg'
  const Icon = flat ? IconArrowRight : value > 0 ? IconArrowUp : IconArrowDown
  return (
    <span className={`delta ${cls}`}>
      <Icon />
      {formatDelta(value)}
      {suffix}
    </span>
  )
}

function formatValue(value, format) {
  switch (format) {
    case 'compact':
      return formatCompact(value)
    case 'percent':
      return formatPercent(value)
    case 'number':
    default:
      return formatNumber(value)
  }
}

export function KpiCard({ label, value, delta, format, icon: Icon, subLabel }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        {Icon && (
          <span className="kpi__icon" aria-hidden>
            <Icon />
          </span>
        )}
        <span className="kpi__label">{label}</span>
      </div>
      <div className="kpi__value">{formatValue(value, format)}</div>
      <div className="kpi__foot">
        {delta != null && <Delta value={delta} />}
        <span className="kpi__sub">{subLabel ?? 'vs previous period'}</span>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    Published: 'badge--published',
    Scheduled: 'badge--scheduled',
    Draft: 'badge--draft',
  }
  return <span className={`badge badge--dot ${map[status] || 'badge--neutral'}`}>{status}</span>
}

export function PillarBadge({ pillar }) {
  const { color, bg } = pillarColor(pillar)
  return (
    <span
      className="badge badge--pillar-colored"
      style={{ color, background: bg, borderColor: bg }}
    >
      <i className="dot" style={{ background: color }} aria-hidden />
      {pillar}
    </span>
  )
}
