import { createClient } from '@/lib/supabase/server'
import { Profile, UserRole } from '@/lib/types/user'

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'admin'
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  return profile
}

export async function checkPermission(requiredRole: UserRole): Promise<boolean> {
  const profile = await getCurrentUserProfile()

  if (!profile) return false
  if (requiredRole === 'regular') return true
  return profile.role === 'admin'
}
