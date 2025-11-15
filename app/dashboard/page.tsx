import { verifyAuth } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { RoomsList } from '@/components/rooms/rooms-list'
import { CreateRoomButton } from '@/components/rooms/create-room-button'

export default async function DashboardPage() {
  const { authenticated, userId } = await verifyAuth()

  if (!authenticated || !userId) {
    redirect('/auth/login')
  }

  // Create mock user object for header
  const user = { id: userId }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Coworking Rooms
            </h1>
            <p className="text-muted-foreground">
              Join a room to start focusing with others
            </p>
          </div>
          <CreateRoomButton />
        </div>
        <RoomsList userId={userId} />
      </main>
    </div>
  )
}
