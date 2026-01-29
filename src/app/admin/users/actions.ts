'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { UserRole } from '@/lib/types/user'

export async function createUser(
  email: string,
  password?: string
): Promise<{ success: boolean; error?: string; method?: 'created' | 'invited' }> {
  try {
    await requireAdmin()

    const supabaseAdmin = createAdminClient()

    if (password) {
      // Direct creation with password
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return { success: false, error: 'このメールアドレスは既に登録されています' }
        }
        return { success: false, error: error.message }
      }

      revalidatePath('/admin/users')
      return { success: true, method: 'created' }
    } else {
      // Invite via email
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      })

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'このメールアドレスは既に登録されています' }
        }
        return { success: false, error: error.message }
      }

      revalidatePath('/admin/users')
      return { success: true, method: 'invited' }
    }
  } catch (err) {
    console.error('Error creating user:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Prevent removing the last admin
    if (role !== 'admin') {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins?.length === 1 && admins[0].id === userId) {
        return { success: false, error: '最後の管理者のロールは変更できません' }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Error updating user role:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentProfile = await requireAdmin()

    // Prevent self-deletion
    if (currentProfile.id === userId) {
      return { success: false, error: '自分自身は削除できません' }
    }

    const supabaseAdmin = createAdminClient()

    // Delete from auth.users (profile will be deleted via CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Error deleting user:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}
