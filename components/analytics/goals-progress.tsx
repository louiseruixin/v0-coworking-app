'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'

type GoalStats = {
  total: number
  completed: number
  active: number
}

export function GoalsProgress({ userId }: { userId: string }) {
  const [stats, setStats] = useState<GoalStats>({
    total: 0,
    completed: 0,
    active: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = getSupabaseBrowserClient()

      const { data: goals } = await supabase
        .from('goals')
        .select('id, is_completed')
        .eq('user_id', userId)

      if (goals) {
        const completed = goals.filter((g) => g.is_completed).length
        setStats({
          total: goals.length,
          completed,
          active: goals.length - completed,
        })
      }

      setLoading(false)
    }

    fetchStats()
  }, [userId])

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : stats.total === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">No goals created yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-2xl font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
              <div className="space-y-1 rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="space-y-1 rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.active}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
