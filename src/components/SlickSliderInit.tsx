'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

// jQuery と Slick の型定義
interface SlickOptions {
  autoplay?: boolean
  arrows?: boolean
  dots?: boolean
  autoplaySpeed?: number
  speed?: number
  cssEase?: string
  pauseOnFocus?: boolean
  pauseOnHover?: boolean
  variableWidth?: boolean
  infinite?: boolean
  appendArrows?: JQueryElement
}

interface JQueryElement {
  length: number
  slick: (options?: SlickOptions | string) => JQueryElement
  hasClass: (className: string) => boolean
}

interface JQueryStatic {
  (selector: string): JQueryElement
}

declare global {
  interface Window {
    jQuery: JQueryStatic
    $: JQueryStatic
  }
}

export function SlickSliderInit() {
  const [jqueryLoaded, setJqueryLoaded] = useState(false)
  const [slickLoaded, setSlickLoaded] = useState(false)

  useEffect(() => {
    if (jqueryLoaded && slickLoaded && typeof window !== 'undefined' && window.$) {
      const $ = window.$

      // Wait for DOM to be ready
      const initSliders = () => {
        // News slider (#slide02)
        const slide02 = $('#slide02')
        if (slide02.length && !slide02.hasClass('slick-initialized')) {
          slide02.slick({
            autoplay: false,
            arrows: true,
            dots: false,
            autoplaySpeed: 4000,
            speed: 400,
            cssEase: 'linear',
            pauseOnFocus: false,
            pauseOnHover: false,
            variableWidth: true,
            infinite: false,
            appendArrows: $('#arrows02'),
          })
        }

        // Knowledge slider (#slide03)
        const slide03 = $('#slide03')
        if (slide03.length && !slide03.hasClass('slick-initialized')) {
          slide03.slick({
            autoplay: false,
            arrows: true,
            dots: false,
            autoplaySpeed: 4000,
            speed: 400,
            cssEase: 'linear',
            pauseOnFocus: false,
            pauseOnHover: false,
            variableWidth: true,
            infinite: false,
            appendArrows: $('#arrows03'),
          })
        }

        // Company logo slider
        const companySlider = $('#companyLogo .slider')
        if (companySlider.length && !companySlider.hasClass('slick-initialized')) {
          companySlider.slick({
            autoplay: true,
            arrows: false,
            dots: false,
            autoplaySpeed: 0,
            speed: 5000,
            cssEase: 'linear',
            pauseOnFocus: false,
            pauseOnHover: false,
            variableWidth: true,
            infinite: true,
          })
        }

        // Case study slider (mobile only)
        const casestudySlide = $('.casestudySlide')
        if (casestudySlide.length && window.innerWidth <= 768) {
          if (!casestudySlide.hasClass('slick-initialized')) {
            casestudySlide.slick({
              autoplay: false,
              arrows: true,
              dots: false,
              speed: 400,
              cssEase: 'linear',
              variableWidth: true,
              infinite: false,
            })
          }
        }
      }

      // Initialize after a short delay to ensure DOM is ready
      setTimeout(initSliders, 100)

      // Re-initialize on resize for responsive sliders
      const handleResize = () => {
        const casestudySlide = $('.casestudySlide')
        if (window.innerWidth <= 768) {
          if (casestudySlide.length && !casestudySlide.hasClass('slick-initialized')) {
            casestudySlide.slick({
              autoplay: false,
              arrows: true,
              dots: false,
              speed: 400,
              cssEase: 'linear',
              variableWidth: true,
              infinite: false,
            })
          }
        } else {
          if (casestudySlide.hasClass('slick-initialized')) {
            casestudySlide.slick('unslick')
          }
        }
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [jqueryLoaded, slickLoaded])

  return (
    <>
      {/* jQuery */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
        strategy="afterInteractive"
        onLoad={() => setJqueryLoaded(true)}
      />
      {/* Slick Carousel */}
      {jqueryLoaded && (
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"
          strategy="afterInteractive"
          onLoad={() => setSlickLoaded(true)}
        />
      )}
    </>
  )
}
