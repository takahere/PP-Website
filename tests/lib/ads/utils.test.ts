import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mergeAdConfigs,
  isAdConfigEmpty,
  createEmptyAdConfig,
  createCustomEvent,
  fireGoogleAdsConversion,
  fireMetaPixelEvent,
  firePageViewConversions,
  fireFormSubmitConversions,
} from '@/lib/ads/utils'
import type { AdConfig, GoogleAdsConfig, MetaPixelConfig } from '@/lib/ads/types'

describe('ads/utils', () => {
  beforeEach(() => {
    // Reset window.dataLayer before each test
    if (typeof window !== 'undefined') {
      window.dataLayer = []
    }
  })

  describe('mergeAdConfigs', () => {
    it('should return global config when page config is null', () => {
      const globalConfig: AdConfig = {
        googleAds: { conversionId: 'AW-123', pageViewLabel: 'test' },
      }

      const result = mergeAdConfigs(globalConfig, null)

      expect(result.source).toBe('global')
      expect(result.googleAds?.conversionId).toBe('AW-123')
    })

    it('should return page config when useGlobalSettings is false', () => {
      const globalConfig: AdConfig = {
        googleAds: { conversionId: 'AW-123', pageViewLabel: 'global' },
      }
      const pageConfig: AdConfig = {
        googleAds: { conversionId: 'AW-456', pageViewLabel: 'page' },
        useGlobalSettings: false,
      }

      const result = mergeAdConfigs(globalConfig, pageConfig)

      expect(result.source).toBe('page')
      expect(result.googleAds?.conversionId).toBe('AW-456')
    })

    it('should return global config when page useGlobalSettings is true', () => {
      const globalConfig: AdConfig = {
        googleAds: { conversionId: 'AW-123', pageViewLabel: 'global' },
      }
      const pageConfig: AdConfig = {
        googleAds: { conversionId: 'AW-456', pageViewLabel: 'page' },
        useGlobalSettings: true,
      }

      const result = mergeAdConfigs(globalConfig, pageConfig)

      expect(result.source).toBe('global')
      expect(result.googleAds?.conversionId).toBe('AW-123')
    })

    it('should handle null global config', () => {
      const result = mergeAdConfigs(null, null)

      expect(result.source).toBe('global')
      expect(result.isEnabled).toBe(false)
    })
  })

  describe('isAdConfigEmpty', () => {
    it('should return true for null config', () => {
      expect(isAdConfigEmpty(null)).toBe(true)
    })

    it('should return true for undefined config', () => {
      expect(isAdConfigEmpty(undefined)).toBe(true)
    })

    it('should return true for empty config', () => {
      const config: AdConfig = {
        googleAds: { conversionId: '' },
        metaPixel: { pixelId: '' },
      }
      expect(isAdConfigEmpty(config)).toBe(true)
    })

    it('should return false for config with Google Ads', () => {
      const config: AdConfig = {
        googleAds: { conversionId: 'AW-123', pageViewLabel: 'test' },
      }
      expect(isAdConfigEmpty(config)).toBe(false)
    })

    it('should return false for config with Meta Pixel', () => {
      const config: AdConfig = {
        metaPixel: { pixelId: '123', pageViewEvent: 'ViewContent' },
      }
      expect(isAdConfigEmpty(config)).toBe(false)
    })

    it('should return false for config with custom events', () => {
      const config: AdConfig = {
        customEvents: [{
          id: '1',
          selector: '.btn',
          eventType: 'click',
          eventName: 'test',
          platforms: {},
        }],
      }
      expect(isAdConfigEmpty(config)).toBe(false)
    })
  })

  describe('createEmptyAdConfig', () => {
    it('should create empty config with all platforms', () => {
      const config = createEmptyAdConfig()

      expect(config.googleAds).toBeDefined()
      expect(config.metaPixel).toBeDefined()
      expect(config.yahooAds).toBeDefined()
      expect(config.customEvents).toEqual([])
      expect(config.useGlobalSettings).toBe(true)
    })
  })

  describe('createCustomEvent', () => {
    it('should create custom event with default values', () => {
      const event = createCustomEvent()

      expect(event.id).toBeDefined()
      expect(event.selector).toBe('')
      expect(event.eventType).toBe('click')
      expect(event.eventName).toBe('')
      expect(event.platforms).toEqual({})
    })

    it('should create unique IDs', () => {
      const event1 = createCustomEvent()
      const event2 = createCustomEvent()

      expect(event1.id).not.toBe(event2.id)
    })
  })

  describe('fireGoogleAdsConversion', () => {
    it('should not fire when conversionId is empty', () => {
      const mockDataLayer: unknown[] = []
      vi.stubGlobal('window', { dataLayer: mockDataLayer })

      const config: GoogleAdsConfig = { conversionId: '' }
      fireGoogleAdsConversion(config, 'label123')

      expect(mockDataLayer.length).toBe(0)
    })

    it('should not fire when label is empty', () => {
      const mockDataLayer: unknown[] = []
      vi.stubGlobal('window', { dataLayer: mockDataLayer })

      const config: GoogleAdsConfig = { conversionId: 'AW-123' }
      fireGoogleAdsConversion(config, '')

      expect(mockDataLayer.length).toBe(0)
    })
  })

  describe('fireMetaPixelEvent', () => {
    it('should not fire when pixelId is empty', () => {
      const mockFbq = vi.fn()
      vi.stubGlobal('window', { fbq: mockFbq })

      const config: MetaPixelConfig = { pixelId: '' }
      fireMetaPixelEvent(config, 'ViewContent')

      expect(mockFbq).not.toHaveBeenCalled()
    })

    it('should not fire when eventName is empty', () => {
      const mockFbq = vi.fn()
      vi.stubGlobal('window', { fbq: mockFbq })

      const config: MetaPixelConfig = { pixelId: '123' }
      fireMetaPixelEvent(config, '')

      expect(mockFbq).not.toHaveBeenCalled()
    })
  })

  describe('firePageViewConversions', () => {
    it('should fire all configured page view conversions', () => {
      const mockDataLayer: unknown[] = []
      const mockFbq = vi.fn()
      vi.stubGlobal('window', { dataLayer: mockDataLayer, fbq: mockFbq })

      const config: AdConfig = {
        googleAds: { conversionId: 'AW-123', pageViewLabel: 'pv_label' },
        metaPixel: { pixelId: '456', pageViewEvent: 'ViewContent' },
        yahooAds: { conversionId: 'yahoo123', pageViewLabel: 'yahoo_pv' },
      }

      firePageViewConversions(config)

      // Check dataLayer was updated
      expect(mockDataLayer.length).toBeGreaterThan(0)
      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.anything())
    })
  })

  describe('fireFormSubmitConversions', () => {
    it('should fire all configured form submit conversions', () => {
      const mockDataLayer: unknown[] = []
      const mockFbq = vi.fn()
      vi.stubGlobal('window', { dataLayer: mockDataLayer, fbq: mockFbq })

      const config: AdConfig = {
        googleAds: { conversionId: 'AW-123', formSubmitLabel: 'form_label' },
        metaPixel: { pixelId: '456', formSubmitEvent: 'Lead' },
      }

      fireFormSubmitConversions(config)

      // Check dataLayer was updated
      expect(mockDataLayer.length).toBeGreaterThan(0)
      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', expect.anything())
    })
  })
})
