import Link from 'next/link'
import Image from 'next/image'

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
      { name: '会社概要', href: '/company' },
      { name: 'ブランドサイト', href: 'https://corp.partner-prop.com', external: true },
      { name: 'お問い合わせ', href: '/knowledge/demo' },
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
      { name: '情報セキュリティポリシー', href: '/security_policy' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        {/* Logo */}
        <div className="footer-logo">
          <Link href="/">
            <Image
              src="/img/img_logo.png"
              alt="PartnerProp"
              width={173}
              height={40}
              className="h-auto w-full"
            />
          </Link>
        </div>

        {/* Links */}
        <nav className="footer-nav">
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="footer-nav__col">
              <h3 className="footer-nav__heading">
                {section.title}
              </h3>
              <ul className="footer-nav__list">
                {section.links.map((link) => (
                  <li key={link.name} className="footer-nav__menu">
                    <Link
                      href={link.href}
                      target={'external' in link && link.external ? '_blank' : undefined}
                      rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                      className="footer-nav__link"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  )
}

