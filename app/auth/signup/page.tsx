import { SignupForm } from '@/components/auth/signup-form'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
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
            Create Account
          </h1>
          <p className="text-pretty text-muted-foreground">
            Join the coworking community today
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
