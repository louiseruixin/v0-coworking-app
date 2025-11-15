import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear the auth cookies
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')

  return NextResponse.json({ success: true })
}
