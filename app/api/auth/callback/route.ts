import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { access_token, refresh_token } = await request.json()

  if (!access_token) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 400 })
  }

  const cookieStore = await cookies()
  
  // Set the auth cookie that the server can read
  cookieStore.set('sb-access-token', access_token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  if (refresh_token) {
    cookieStore.set('sb-refresh-token', refresh_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
  }

  return NextResponse.json({ success: true })
}
