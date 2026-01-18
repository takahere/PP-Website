'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navigation = [
  { name: '導入事例', href: '/casestudy/' },
  { name: 'お役立ち資料', href: '/knowledge/' },
  { name: 'セミナー情報', href: '/seminar/' },
]

// Hydration mismatch を防ぐための安全なマウント状態管理
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between bg-white px-[14px] text-sm text-zinc-800 min-[1200px]:h-20 min-[1200px]:px-10"
      role="banner"
    >
      {/* Logo */}
      <div className="text-[1.75rem] leading-8">
        <Link
          href="/"
          aria-label="PartnerProp ホームへ"
          className="block transition-opacity hover:opacity-80 active:opacity-70"
        >
          <Image
            src="/img/img_logo.png"
            alt="PartnerProp"
            width={176}
            height={40}
            className="h-auto w-[134px] min-[1200px]:w-44"
            priority
          />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav
        className="hidden items-center gap-6 font-bold min-[1200px]:flex"
        aria-label="メインナビゲーション"
      >
        <div className="flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="transition-colors hover:text-red-500 active:text-red-600"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="flex gap-6">
          <Link
            href="/knowledge/service-form/"
            className="flex items-center justify-center rounded-full border-2 border-red-500 bg-red-500 px-4 py-3.5 text-white transition-all hover:border-red-600 hover:bg-red-600 active:scale-[0.98] active:bg-red-700"
          >
            資料をダウンロードする
          </Link>
          <Link
            href="/knowledge/demo/"
            className="flex items-center justify-center rounded-full border-2 border-red-500 bg-white px-4 py-3.5 text-red-500 transition-all hover:bg-red-50 active:scale-[0.98] active:bg-red-100"
          >
            無料デモを申し込む
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMounted ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="min-[1200px]:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="メニューを開く"
              className="h-10 w-10 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-[300px] sm:max-w-[400px]">
            <div className="flex flex-col gap-6 pt-6">
              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-4" aria-label="モバイルナビゲーション">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="py-2 text-base font-bold text-gray-900 transition-colors hover:text-red-500 active:text-red-600"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile CTAs */}
              <div className="flex flex-col gap-4 border-t pt-6">
                <Link
                  href="/knowledge/service-form/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-full border-2 border-red-500 bg-red-500 px-4 py-3.5 font-bold text-white transition-all hover:border-red-600 hover:bg-red-600 active:scale-[0.98] active:bg-red-700"
                >
                  資料をダウンロードする
                </Link>
                <Link
                  href="/knowledge/demo/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-full border-2 border-red-500 bg-white px-4 py-3.5 font-bold text-red-500 transition-all hover:bg-red-50 active:scale-[0.98] active:bg-red-100"
                >
                  無料デモを申し込む
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 min-[1200px]:hidden"
          aria-label="メニューを開く"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </header>
  )
}

