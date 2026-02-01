import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AdTracker } from '@/components/AdTracker'
import type { MergedAdConfig } from '@/lib/ads/types'

describe('AdTracker', () => {
  let mockDataLayer: unknown[]
  let mockFbq: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockDataLayer = []
    mockFbq = vi.fn()

    vi.stubGlobal('window', {
      dataLayer: mockDataLayer,
      fbq: mockFbq,
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('should render nothing (null)', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: true,
      googleAds: { conversionId: 'AW-123', pageViewLabel: 'test' },
    }

    const { container } = render(
      <AdTracker pageId="page-1" config={config} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('should not fire conversions when isEnabled is false', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: false,
      googleAds: { conversionId: 'AW-123', pageViewLabel: 'test' },
    }

    render(<AdTracker pageId="page-1" config={config} />)

    expect(mockDataLayer.length).toBe(0)
    expect(mockFbq).not.toHaveBeenCalled()
  })

  it('should fire Google Ads conversion on page view', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: true,
      googleAds: { conversionId: 'AW-123456', pageViewLabel: 'pv123' },
    }

    render(<AdTracker pageId="page-1" config={config} />)

    expect(mockDataLayer).toContainEqual({
      event: 'conversion',
      send_to: 'AW-123456/pv123',
    })
  })

  it('should fire Meta Pixel event on page view', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: true,
      metaPixel: { pixelId: '789', pageViewEvent: 'ViewContent' },
    }

    render(<AdTracker pageId="page-1" config={config} />)

    expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.anything())
  })

  it('should fire Yahoo Ads conversion on page view', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: true,
      yahooAds: { conversionId: 'yahoo123', pageViewLabel: 'yahoo_pv' },
    }

    render(<AdTracker pageId="page-1" config={config} />)

    expect(mockDataLayer).toContainEqual({
      event: 'yahoo_conversion',
      yahoo_conversion_id: 'yahoo123',
      yahoo_conversion_label: 'yahoo_pv',
    })
  })

  it('should fire all platform conversions when all are configured', () => {
    const config: MergedAdConfig = {
      source: 'page',
      isEnabled: true,
      googleAds: { conversionId: 'AW-111', pageViewLabel: 'gads' },
      metaPixel: { pixelId: '222', pageViewEvent: 'Lead' },
      yahooAds: { conversionId: '333', pageViewLabel: 'yads' },
    }

    render(<AdTracker pageId="page-1" config={config} />)

    // Google Ads
    expect(mockDataLayer).toContainEqual({
      event: 'conversion',
      send_to: 'AW-111/gads',
    })

    // Meta Pixel
    expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', expect.anything())

    // Yahoo Ads
    expect(mockDataLayer).toContainEqual({
      event: 'yahoo_conversion',
      yahoo_conversion_id: '333',
      yahoo_conversion_label: 'yads',
    })
  })

  it('should only fire once even if re-rendered', () => {
    const config: MergedAdConfig = {
      source: 'global',
      isEnabled: true,
      googleAds: { conversionId: 'AW-123', pageViewLabel: 'test' },
    }

    const { rerender } = render(
      <AdTracker pageId="page-1" config={config} />
    )

    const initialLength = mockDataLayer.length

    // Re-render with same props
    rerender(<AdTracker pageId="page-1" config={config} />)

    // Should not fire again
    expect(mockDataLayer.length).toBe(initialLength)
  })
})
