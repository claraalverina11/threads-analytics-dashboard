import PeriodInsights from './PeriodInsights'

export default function Monthly({ posts }) {
  return <PeriodInsights posts={posts} granularity="month" />
}
