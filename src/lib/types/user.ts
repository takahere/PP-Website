export type UserRole = 'admin' | 'regular'

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface UserWithProfile {
  id: string
  email: string
  profile: Profile | null
}
