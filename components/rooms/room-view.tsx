'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ActiveParticipants } from './active-participants'
import { PomodoroTimer } from '../pomodoro/pomodoro-timer'
import { GoalBoard } from '../goals/goal-board'
import { RoomActivityFeed } from './room-activity-feed'

type Room = {
  id: string
  name: string
  description: string | null
  creator_id: string
  max_participants: number
  is_public: boolean
  created_at: string
}

export function RoomView({ room, userId }: { room: Room; userId: string }) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  const handleLeaveRoom = async () => {
    setLeaving(true)
    const supabase = getSupabaseBrowserClient()

    await supabase
      .from('room_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('room_id', room.id)
      .eq('user_id', userId)

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{room.name}</h1>
              {room.description && (
                <p className="text-sm text-muted-foreground">
                  {room.description}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleLeaveRoom} disabled={leaving}>
            {leaving ? 'Leaving...' : 'Leave Room'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PomodoroTimer roomId={room.id} userId={userId} />
          <GoalBoard roomId={room.id} userId={userId} />
        </div>
        <div className="space-y-6">
          <ActiveParticipants roomId={room.id} />
          <RoomActivityFeed roomId={room.id} />
        </div>
      </main>
    </div>
  )
}
