import { redirect } from 'next/navigation'
import { Users as UsersIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, getCurrentUserProfile } from '@/lib/auth/permissions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InviteUserDialog } from './invite-dialog'
import { DeleteUserButton } from './delete-button'
import { RoleSelector } from './role-selector'

async function getUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export default async function UsersPage() {
  // Require admin access
  try {
    await requireAdmin()
  } catch {
    redirect('/admin')
  }

  const users = await getUsers()
  const currentUser = await getCurrentUserProfile()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </div>
        <InviteUserDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-500">総ユーザー数</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-500">管理者</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-500">一般ユーザー</div>
          <div className="text-2xl font-bold text-gray-600">
            {users.filter(u => u.role === 'regular').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>表示名</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.display_name || '-'}</TableCell>
                <TableCell>
                  <RoleSelector
                    userId={user.id}
                    currentRole={user.role}
                    disabled={user.id === currentUser?.id}
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell className="text-right">
                  {user.id !== currentUser?.id && (
                    <DeleteUserButton
                      userId={user.id}
                      email={user.email}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  ユーザーがいません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
