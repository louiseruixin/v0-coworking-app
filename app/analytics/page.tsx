import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AnalyticsOverview } from '@/components/analytics/analytics-overview'
import { SessionsChart } from '@/components/analytics/sessions-chart'
import { GoalsProgress } from '@/components/analytics/goals-progress'

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your focus time and productivity
          </p>
        </div>
        <AnalyticsOverview userId={user.id} />
        <div className="grid gap-6 lg:grid-cols-2">
          <SessionsChart userId={user.id} />
          <GoalsProgress userId={user.id} />
        </div>
      </main>
    </div>
  )
}
