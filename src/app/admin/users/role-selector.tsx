'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from './actions'
import { UserRole } from '@/lib/types/user'

interface RoleSelectorProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean
}

export function RoleSelector({ userId, currentRole, disabled }: RoleSelectorProps) {
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === currentRole) return

    startTransition(async () => {
      await updateUserRole(userId, newRole)
    })
  }

  if (disabled) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        currentRole === 'admin'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {currentRole === 'admin' ? '管理者' : '一般'}
        <span className="ml-1 text-gray-500">(自分)</span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRole}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">管理者</SelectItem>
          <SelectItem value="regular">一般</SelectItem>
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  )
}
