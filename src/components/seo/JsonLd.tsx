const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'

interface ArticleJsonLdProps {
  title: string
  description?: string
  image?: string
  publishedAt?: string
  updatedAt?: string
  authorName?: string
  url: string
}

export function ArticleJsonLd({
  title,
  description,
  image,
  publishedAt,
  updatedAt,
  authorName = 'PartnerProp',
  url,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || '',
    image: image || undefined,
    datePublished: publishedAt || undefined,
    dateModified: updatedAt || publishedAt || undefined,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PartnerProp',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
  description?: string
}

export function OrganizationJsonLd({
  name = 'PartnerProp',
  url = BASE_URL,
  logo = `${BASE_URL}/logo.png`,
  description = 'パートナービジネスを科学し仕組みにするPRMツール',
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [
      // 必要に応じてSNSリンクを追加
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string
    answer: string
  }>
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface PersonJsonLdProps {
  name: string
  description?: string
  image?: string
  jobTitle?: string
  url: string
  worksFor?: {
    name: string
    url: string
  }
}

export function PersonJsonLd({
  name,
  description,
  image,
  jobTitle,
  url,
  worksFor = {
    name: 'PartnerProp',
    url: BASE_URL,
  },
}: PersonJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description: description || undefined,
    image: image || undefined,
    jobTitle: jobTitle || undefined,
    url,
    worksFor: {
      '@type': 'Organization',
      name: worksFor.name,
      url: worksFor.url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface EventJsonLdProps {
  name: string
  description?: string
  image?: string
  startDate?: string
  endDate?: string
  url: string
  location?: {
    type: 'VirtualLocation' | 'Place'
    name?: string
    url?: string
  }
  organizer?: {
    name: string
    url: string
  }
  eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventMovedOnline'
  eventAttendanceMode?: 'OnlineEventAttendanceMode' | 'OfflineEventAttendanceMode' | 'MixedEventAttendanceMode'
}

export function EventJsonLd({
  name,
  description,
  image,
  startDate,
  endDate,
  url,
  location = {
    type: 'VirtualLocation',
    url: BASE_URL,
  },
  organizer = {
    name: 'PartnerProp',
    url: BASE_URL,
  },
  eventStatus = 'EventScheduled',
  eventAttendanceMode = 'OnlineEventAttendanceMode',
}: EventJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description: description || undefined,
    image: image || undefined,
    startDate: startDate || undefined,
    endDate: endDate || startDate || undefined,
    url,
    location: location.type === 'VirtualLocation'
      ? {
          '@type': 'VirtualLocation',
          url: location.url || url,
        }
      : {
          '@type': 'Place',
          name: location.name,
          url: location.url,
        },
    organizer: {
      '@type': 'Organization',
      name: organizer.name,
      url: organizer.url,
    },
    eventStatus: `https://schema.org/${eventStatus}`,
    eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface WebSiteJsonLdProps {
  name?: string
  url?: string
  description?: string
  potentialAction?: {
    target: string
    queryInput: string
  }
}

export function WebSiteJsonLd({
  name = 'PartnerProp',
  url = BASE_URL,
  description = 'パートナービジネスを科学し仕組みにするPRMツール',
  potentialAction,
}: WebSiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    inLanguage: 'ja',
    ...(potentialAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: potentialAction.target,
        'query-input': potentialAction.queryInput,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}


















