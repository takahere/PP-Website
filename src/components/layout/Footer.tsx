import Link from 'next/link'

const footerLinks = {
  resources: {
    title: 'お役立ち資料',
    links: [
      { name: 'パートナーマーケティングとは？', href: '/knowledge/partner-marketing' },
      { name: 'お役立ち資料', href: '/knowledge' },
      { name: 'アライアンスWEBメディア', href: '/lab' },
      { name: 'セミナー一覧', href: '/seminar' },
    ],
  },
  company: {
    title: '会社情報',
    links: [
      { name: '会社概要', href: '/about' },
      { name: 'ブランドサイト', href: 'https://corp.partner-prop.com', external: true },
      { name: 'お問い合わせ', href: '/contact' },
    ],
  },
  careers: {
    title: '採用情報',
    links: [
      { name: '採用サイト', href: 'https://recruit.partner-prop.com', external: true },
    ],
  },
  legal: {
    title: '各種ポリシー',
    links: [
      { name: 'プライバシーポリシー', href: '/privacy' },
      { name: '利用規約', href: '/terms' },
      { name: '情報セキュリティポリシー', href: '/security' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="bg-[var(--pp-dark)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Logo */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <PartnerPropLogoWhite />
              <span className="text-lg font-bold">PartnerProp</span>
            </Link>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-white">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        target={'external' in link && link.external ? '_blank' : undefined}
                        rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-[var(--pp-gray-light)] transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-[var(--pp-dark-lighter)] pt-8">
          <p className="text-center text-sm text-[var(--pp-gray)]">
            © {new Date().getFullYear()} PartnerProp Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function PartnerPropLogoWhite() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="4" fill="var(--pp-coral)" />
      <path
        d="M8 8h8v8H8V8Z"
        fill="white"
      />
      <path
        d="M16 16h8v8h-8v-8Z"
        fill="white"
        fillOpacity="0.6"
      />
      <path
        d="M8 16h8v8H8v-8Z"
        fill="white"
        fillOpacity="0.3"
      />
    </svg>
  )
}







