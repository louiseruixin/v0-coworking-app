'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { RoomCard } from './room-card'
import { Skeleton } from '@/components/ui/skeleton'

type Room = {
  id: string
  name: string
  description: string | null
  creator_id: string
  max_participants: number
  is_public: boolean
  created_at: string
  participant_count?: number
}

export function RoomsList({ userId }: { userId: string }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('rooms')
        .select(
          `
          *,
          room_participants!inner(count)
        `
        )
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRooms(data)
      }
      setLoading(false)
    }

    fetchRooms()

    // Subscribe to room changes
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('rooms-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold">No rooms available</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the first room to start coworking!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} userId={userId} />
      ))}
    </div>
  )
}
