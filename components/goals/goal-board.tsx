'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { GoalItem } from './goal-item'
import { AddGoalDialog } from './add-goal-dialog'

type Goal = {
  id: string
  room_id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export function GoalBoard({
  roomId,
  userId,
}: {
  roomId: string
  userId: string
}) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const fetchGoals = async () => {
      console.log('[v0] Fetching goals for room:', roomId)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      console.log('[v0] Goals fetch result:', { data, error, count: data?.length })

      if (!error && data) {
        setGoals(data as Goal[])
      } else if (error) {
        console.error('[v0] Error fetching goals:', error.message)
      }
    }

    fetchGoals()

    // Subscribe to goal changes
    const supabase = getSupabaseBrowserClient()
    console.log('[v0] Setting up real-time subscription for goals')
    const channel = supabase
      .channel('goals-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[v0] Real-time goal update received:', payload)
          fetchGoals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const activeGoals = goals.filter((g) => !g.is_completed)
  const completedGoals = goals.filter((g) => g.is_completed)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Shared Goals</CardTitle>
          <AddGoalDialog roomId={roomId} userId={userId} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {activeGoals.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No active goals yet. Add one to get started!
              </p>
            </div>
          ) : (
            activeGoals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} userId={userId} />
            ))
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full"
            >
              {showCompleted ? 'Hide' : 'Show'} Completed ({completedGoals.length})
            </Button>
            {showCompleted &&
              completedGoals.map((goal) => (
                <GoalItem key={goal.id} goal={goal} userId={userId} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
