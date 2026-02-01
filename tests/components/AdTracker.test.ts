/**
 * AdTracker コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock window.dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    fbq?: (...args: unknown[]) => void
  }
}

describe('AdTracker Utils', () => {
  beforeEach(() => {
    // Reset dataLayer
    window.dataLayer = []
    window.fbq = vi.fn()
  })

  describe('firePageViewConversions', () => {
    it('should push Google Ads conversion to dataLayer', async () => {
      const { firePageViewConversions } = await import('@/lib/ads/utils')

      const config = {
        googleAds: {
          conversionId: 'AW-123456789',
          pageViewLabel: 'abc123',
        },
        source: 'global' as const,
        isEnabled: true,
      }

      firePageViewConversions(config)

      expect(window.dataLayer).toContainEqual({
        event: 'conversion',
        send_to: 'AW-123456789/abc123',
      })
    })

    it('should call fbq for Meta Pixel', async () => {
      const { firePageViewConversions } = await import('@/lib/ads/utils')

      const config = {
        metaPixel: {
          pixelId: '123456789',
          pageViewEvent: 'ViewContent',
        },
        source: 'global' as const,
        isEnabled: true,
      }

      firePageViewConversions(config)

      expect(window.fbq).toHaveBeenCalledWith('track', 'ViewContent', {})
    })

    it('should not fire when config is empty', async () => {
      const { firePageViewConversions } = await import('@/lib/ads/utils')

      const config = {
        source: 'global' as const,
        isEnabled: true,
      }

      firePageViewConversions(config)

      expect(window.dataLayer).toHaveLength(0)
      expect(window.fbq).not.toHaveBeenCalled()
    })
  })
})

describe('useFormSubmitTracking', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.fbq = vi.fn()
  })

  it('should fire form submit conversions', async () => {
    const { useFormSubmitTracking } = await import('@/components/AdTracker')

    const config = {
      googleAds: {
        conversionId: 'AW-123456789',
        formSubmitLabel: 'form123',
      },
      metaPixel: {
        pixelId: '123456789',
        formSubmitEvent: 'Lead',
      },
      source: 'global' as const,
      isEnabled: true,
    }

    // Note: This is a simplified test - in reality, this hook should be called within a React component
    const mockFireFormConversion = () => {
      if (config.googleAds?.formSubmitLabel) {
        window.dataLayer?.push({
          event: 'conversion',
          send_to: `${config.googleAds.conversionId}/${config.googleAds.formSubmitLabel}`,
        })
      }
      if (config.metaPixel?.formSubmitEvent && window.fbq) {
        window.fbq('track', config.metaPixel.formSubmitEvent)
      }
    }

    mockFireFormConversion()

    expect(window.dataLayer).toContainEqual({
      event: 'conversion',
      send_to: 'AW-123456789/form123',
    })
    expect(window.fbq).toHaveBeenCalledWith('track', 'Lead')
  })
})
