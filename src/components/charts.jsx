// Recharts-based chart components with brand styling and custom tooltips.
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { formatCompact, formatNumber, formatPercent } from '../lib/format'

const AXIS = { fontSize: 11.5, fill: '#7f8c85', fontWeight: 500 }
const GRID = '#eef1ef'
const fmtByKind = { compact: formatCompact, number: formatNumber, percent: formatPercent }

function TooltipBox({ active, payload, label, series }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="tooltip">
      <div className="tooltip__title">{label}</div>
      {payload.map((p) => {
        const meta = series?.find((s) => s.key === p.dataKey)
        const fmt = fmtByKind[meta?.format || 'compact']
        return (
          <div className="tooltip__row" key={p.dataKey}>
            <span>
              <i style={{ background: p.color || meta?.color }} />
              {meta?.label || p.name}
            </span>
            <b>{fmt(p.value)}</b>
          </div>
        )
      })}
    </div>
  )
}

/** Multi-series area chart (used for views/engagement over time). */
export function AreaTimeChart({ data, xKey = 'label', series, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient id={`grad-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={18} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => fmtByKind[series[0].format || 'compact'](v)}
        />
        <Tooltip content={<TooltipBox series={series} />} cursor={{ stroke: '#cdd6d0' }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.2}
            fill={`url(#grad-${s.key})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Multi-series line chart (engagement rate / multi-metric). */
export function LineTimeChart({ data, xKey = 'label', series, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={18} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => fmtByKind[series[0].format || 'compact'](v)}
        />
        <Tooltip content={<TooltipBox series={series} />} cursor={{ stroke: '#cdd6d0' }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/** Horizontal or vertical bar chart with optional per-bar colors. */
export function BarBreakdownChart({
  data,
  xKey,
  bar,
  height = 280,
  layout = 'vertical',
  colors,
}) {
  const isVertical = layout === 'vertical' // bars go left->right, category on Y
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 12, left: isVertical ? 6 : -14, bottom: 0 }}
        barCategoryGap={isVertical ? '28%' : '22%'}
      >
        <CartesianGrid stroke={GRID} horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtByKind[bar.format || 'compact'](v)}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              width={120}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => fmtByKind[bar.format || 'compact'](v)}
            />
          </>
        )}
        <Tooltip
          content={<TooltipBox series={[{ key: bar.key, label: bar.label, color: bar.color, format: bar.format }]} />}
          cursor={{ fill: 'rgba(4,90,38,0.05)' }}
        />
        <Bar dataKey={bar.key} name={bar.label} radius={isVertical ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={38}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colors ? colors[i % colors.length] : bar.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Legend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((it) => (
        <span key={it.key || it.label}>
          <i style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}
