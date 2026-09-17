import PeriodInsights from './PeriodInsights'

export default function Weekly({ posts }) {
  return <PeriodInsights posts={posts} granularity="week" />
}
