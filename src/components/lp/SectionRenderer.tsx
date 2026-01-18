'use client'

import {
  HeroSection,
  FeaturesGrid,
  Benefits,
  CTASection,
  ContactForm,
  type LPSection,
  type FeatureItem,
  type BenefitItem,
  type FormField,
} from '@/components/lp'

interface SectionRendererProps {
  sections: LPSection[]
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div>
      {sortedSections.map((section) => {
        const { type, content, variant } = section

        switch (type) {
          case 'hero':
            return (
              <HeroSection
                key={section.id}
                headline={content.headline as string}
                subheadline={content.subheadline as string}
                cta_text={content.cta_text as string}
                cta_link={content.cta_link as string}
                background_image={content.background_image as string}
                variant={variant as 'simple' | 'with-image' | 'centered'}
              />
            )

          case 'features':
            return (
              <FeaturesGrid
                key={section.id}
                title={content.title as string}
                subtitle={content.subtitle as string}
                items={content.items as FeatureItem[]}
                columns={content.columns as 2 | 3 | 4}
                variant={variant as 'simple' | 'cards' | 'icons-left'}
              />
            )

          case 'benefits':
            return (
              <Benefits
                key={section.id}
                title={content.title as string}
                subtitle={content.subtitle as string}
                items={content.items as BenefitItem[]}
                variant={variant as 'alternating' | 'list' | 'cards'}
              />
            )

          case 'cta':
            return (
              <CTASection
                key={section.id}
                headline={content.headline as string}
                description={content.description as string}
                button_text={content.button_text as string}
                button_link={content.button_link as string}
                variant={variant as 'simple' | 'gradient' | 'dark'}
              />
            )

          case 'form':
            return (
              <ContactForm
                key={section.id}
                title={content.title as string}
                description={content.description as string}
                fields={content.fields as FormField[]}
                submit_text={content.submit_text as string}
              />
            )

          default:
            return null
        }
      })}
    </div>
  )
}

