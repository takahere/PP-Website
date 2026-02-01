import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: '設定 | PartnerProp Admin',
  description: 'サイト設定',
}

const settingsItems = [
  {
    title: '広告設定',
    description: 'Google Ads、Meta Pixel、Yahoo Ads などの広告タグ・コンバージョン設定',
    href: '/admin/settings/ads',
    icon: Target,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: '閾値設定',
    description: '異常検知の閾値をカスタマイズ',
    href: '/admin/settings/thresholds',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-600',
  },
]

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">サイト全体の設定を管理</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-gray-400 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
