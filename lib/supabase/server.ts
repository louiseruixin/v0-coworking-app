import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  })
}

export async function verifyAuth() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  
  if (!accessToken) {
    return { authenticated: false, userId: null }
  }

  try {
    // Decode JWT to get user info without making network request
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    
    // Check if token is expired
    if (Date.now() >= exp) {
      return { authenticated: false, userId: null }
    }
    
    return { authenticated: true, userId: payload.sub }
  } catch (error) {
    return { authenticated: false, userId: null }
  }
}
