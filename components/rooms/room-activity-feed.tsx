'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

type Activity = {
  id: string
  type: 'session_start' | 'session_end' | 'goal_complete' | 'join' | 'leave'
  user_name: string
  message: string
  timestamp: string
}

export function RoomActivityFeed({ roomId }: { roomId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Subscribe to multiple table changes
    const channel = supabase.channel('activity-feed')

    // Listen to focus sessions
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'focus_sessions',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single()

        const activity: Activity = {
          id: crypto.randomUUID(),
          type: 'session_start',
          user_name: data?.full_name || 'Someone',
          message: 'started a focus session',
          timestamp: new Date().toISOString(),
        }
        setActivities((prev) => [activity, ...prev].slice(0, 20))
      }
    )

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'focus_sessions',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        if (payload.new.ended_at) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single()

          const activity: Activity = {
            id: crypto.randomUUID(),
            type: 'session_end',
            user_name: data?.full_name || 'Someone',
            message: `completed a ${payload.new.duration_minutes}-minute session`,
            timestamp: new Date().toISOString(),
          }
          setActivities((prev) => [activity, ...prev].slice(0, 20))
        }
      }
    )

    // Listen to goals
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'goals',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        if (payload.new.is_completed && !payload.old.is_completed) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single()

          const activity: Activity = {
            id: crypto.randomUUID(),
            type: 'goal_complete',
            user_name: data?.full_name || 'Someone',
            message: `completed goal: ${payload.new.title}`,
            timestamp: new Date().toISOString(),
          }
          setActivities((prev) => [activity, ...prev].slice(0, 20))
        }
      }
    )

    // Listen to room participants
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single()

        const activity: Activity = {
          id: crypto.randomUUID(),
          type: 'join',
          user_name: data?.full_name || 'Someone',
          message: 'joined the room',
          timestamp: new Date().toISOString(),
        }
        setActivities((prev) => [activity, ...prev].slice(0, 20))
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'session_start':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
            <svg
              className="h-4 w-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )
      case 'session_end':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )
      case 'goal_complete':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
            <svg
              className="h-4 w-4 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
        )
      case 'join':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
            <svg
              className="h-4 w-4 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No activity yet. Start a session!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
