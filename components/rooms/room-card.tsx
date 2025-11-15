'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Room = {
  id: string
  name: string
  description: string | null
  creator_id: string
  max_participants: number
  is_public: boolean
  created_at: string
}

export function RoomCard({ room, userId }: { room: Room; userId: string }) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  const handleJoinRoom = async () => {
    setJoining(true)
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.from('room_participants').insert({
      room_id: room.id,
      user_id: userId,
      is_active: true,
    })

    if (!error) {
      router.push(`/room/${room.id}`)
    } else {
      // Check if already joined
      if (error.code === '23505') {
        // Duplicate key - already joined
        router.push(`/room/${room.id}`)
      }
    }
    setJoining(false)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{room.name}</CardTitle>
          {room.is_public && <Badge variant="secondary">Public</Badge>}
        </div>
        <CardDescription className="line-clamp-2">
          {room.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Max {room.max_participants} participants</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleJoinRoom}
          disabled={joining}
          className="w-full"
        >
          {joining ? 'Joining...' : 'Join Room'}
        </Button>
      </CardFooter>
    </Card>
  )
}
