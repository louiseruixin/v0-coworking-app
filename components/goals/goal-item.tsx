'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

export function GoalItem({ goal, userId }: { goal: Goal; userId: string }) {
  const [updating, setUpdating] = useState(false)
  const isOwner = goal.user_id === userId

  const toggleComplete = async () => {
    setUpdating(true)
    const supabase = getSupabaseBrowserClient()

    await supabase
      .from('goals')
      .update({
        is_completed: !goal.is_completed,
        completed_at: !goal.is_completed ? new Date().toISOString() : null,
      })
      .eq('id', goal.id)

    setUpdating(false)
  }

  const deleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    const supabase = getSupabaseBrowserClient()
    await supabase.from('goals').delete().eq('id', goal.id)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        goal.is_completed && 'bg-muted/50'
      )}
    >
      <Checkbox
        checked={goal.is_completed}
        onCheckedChange={toggleComplete}
        disabled={updating || !isOwner}
        className="mt-1"
      />
      <div className="flex-1 space-y-1">
        <p
          className={cn(
            'font-medium',
            goal.is_completed && 'text-muted-foreground line-through'
          )}
        >
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}
      </div>
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={deleteGoal}
          className="text-destructive hover:text-destructive"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      )}
    </div>
  )
}
