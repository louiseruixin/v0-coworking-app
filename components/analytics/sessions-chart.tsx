'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type DayData = {
  date: string
  minutes: number
}

export function SessionsChart({ userId }: { userId: string }) {
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient()

      // Get last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('started_at, duration_minutes')
        .eq('user_id', userId)
        .gte('started_at', sevenDaysAgo.toISOString())
        .not('ended_at', 'is', null)

      if (sessions) {
        // Group by date
        const grouped = sessions.reduce(
          (acc, session) => {
            const date = new Date(session.started_at).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric' }
            )
            acc[date] = (acc[date] || 0) + (session.duration_minutes || 0)
            return acc
          },
          {} as Record<string, number>
        )

        const chartData = Object.entries(grouped).map(([date, minutes]) => ({
          date,
          minutes,
        }))

        setData(chartData)
      }

      setLoading(false)
    }

    fetchData()
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Focus Time (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No session data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
