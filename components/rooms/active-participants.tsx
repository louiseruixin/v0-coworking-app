'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Participant = {
  id: string
  user_id: string
  joined_at: string
  profiles: {
    full_name: string | null
  }
}

type ActiveSession = {
  user_id: string
  session_type: string
}

export function ActiveParticipants({ roomId }: { roomId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [activeSessions, setActiveSessions] = useState<
    Map<string, ActiveSession>
  >(new Map())

  useEffect(() => {
    const fetchParticipants = async () => {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('room_participants')
        .select('id, user_id, joined_at, profiles(full_name)')
        .eq('room_id', roomId)
        .eq('is_active', true)

      if (!error && data) {
        setParticipants(data as Participant[])
      }
    }

    const fetchActiveSessions = async () => {
      const supabase = getSupabaseBrowserClient()

      const { data } = await supabase
        .from('focus_sessions')
        .select('user_id, session_type')
        .eq('room_id', roomId)
        .is('ended_at', null)

      if (data) {
        const sessionsMap = new Map(
          data.map((s) => [s.user_id, s as ActiveSession])
        )
        setActiveSessions(sessionsMap)
      }
    }

    fetchParticipants()
    fetchActiveSessions()

    // Subscribe to participant changes
    const supabase = getSupabaseBrowserClient()
    const participantsChannel = supabase
      .channel('participants-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    const sessionsChannel = supabase
      .channel('sessions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'focus_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchActiveSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(sessionsChannel)
    }
  }, [roomId])

  const getSessionLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'focus':
        return 'Focusing'
      case 'short_break':
        return 'Short Break'
      case 'long_break':
        return 'Long Break'
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Active Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {participants.map((participant) => {
            const session = activeSessions.get(participant.user_id)
            return (
              <div key={participant.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {participant.profiles?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {participant.profiles?.full_name || 'Anonymous User'}
                  </p>
                  {session && (
                    <Badge
                      variant={
                        session.session_type === 'focus'
                          ? 'default'
                          : 'secondary'
                      }
                      className="mt-1 text-xs"
                    >
                      {getSessionLabel(session.session_type)}
                    </Badge>
                  )}
                </div>
                <div
                  className={`h-2 w-2 rounded-full ${
                    session ? 'bg-green-500' : 'bg-muted-foreground'
                  }`}
                />
              </div>
            )
          })}
          {participants.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No active participants
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
