'use client'

import { Button } from '@/components/ui/button'
import { logout } from '@/app/(site)/login/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        ログアウト
      </Button>
    </form>
  )
}







