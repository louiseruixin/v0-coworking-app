import { LoginForm } from '@/components/auth/login-form'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-pretty text-muted-foreground">
            Sign in to your coworking account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
