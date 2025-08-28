
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { Charts } from '@/components/admin/dashboard/Charts'
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Charts />
        <RecentActivity />
      </div>
    </div>
  )
}