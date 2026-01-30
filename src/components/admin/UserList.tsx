'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteUserButton } from '@/app/admin/users/delete-button'
import { RoleSelector } from '@/app/admin/users/role-selector'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { UserRole } from '@/lib/types/user'

interface User {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  created_at: string
}

interface UserListProps {
  users: User[]
  currentUserId: string | null
}

export function UserList({ users, currentUserId }: UserListProps) {
  const isDesktop = useIsDesktop()

  return (
    <>
      {isDesktop ? (
        // デスクトップ: テーブル
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
                      disabled={user.id === currentUserId}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUserId && (
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
      ) : (
        // モバイル: カードリスト
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
              ユーザーがいません
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="rounded-lg border bg-white p-4 space-y-3">
                {/* メールアドレス */}
                <div className="font-medium break-all">{user.email}</div>

                {/* 表示名 */}
                {user.display_name && (
                  <div className="text-sm text-gray-500">{user.display_name}</div>
                )}

                {/* ロール + 日付 */}
                <div className="flex items-center justify-between">
                  <RoleSelector
                    userId={user.id}
                    currentRole={user.role}
                    disabled={user.id === currentUserId}
                  />
                  <span className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                {/* 削除ボタン（自身以外） */}
                {user.id !== currentUserId && (
                  <div className="pt-2 border-t">
                    <DeleteUserButton
                      userId={user.id}
                      email={user.email}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
