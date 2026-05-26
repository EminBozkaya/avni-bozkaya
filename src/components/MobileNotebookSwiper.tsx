import React, { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCreative } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

import 'swiper/css'
import 'swiper/css/effect-creative'

import Sheet from './Sheet'
import { book } from '../utils/paginate'
import { playPageTurnSound } from '../utils/sound'

interface MobileNotebookProps {
  currentPage: number
  onPageChange: (page: number) => void
  onSelectPoem?: (poemId: number) => void
}

/** Swiper.js tabanlı, gerçekçi kaydırma ivmesine sahip mobil not defteri. */
export default function MobileNotebook({ currentPage, onPageChange, onSelectPoem }: MobileNotebookProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  // Dışarıdan gelen değişimleri (örn. navigasyon butonları) Swiper'a aktar
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== currentPage) {
      swiperRef.current.slideTo(currentPage)
    }
  }, [currentPage])

  // Swiper ile manuel kaydırma yapıldığında durumu güncelle
  const handleSlideChange = (swiper: SwiperType) => {
    if (swiper.activeIndex !== currentPage) {
      playPageTurnSound()
      onPageChange(swiper.activeIndex)
    }
  }

  return (
    <div
      className="mobile-notebook-container w-full h-full flex items-center justify-center overflow-hidden"
      style={{ perspective: '1500px' }}
    >
      <div
        className="mobile-notebook relative w-[92vw] max-w-[420px]"
        style={{
          aspectRatio: '620 / 770',
          maxHeight: 'calc(100% - 32px)',
          filter: 'drop-shadow(0 8px 24px rgba(44, 24, 16, 0.18))'
        }}
      >
        {/* Authentic Spiral Binding (Gözenekler ve Teller) */}
        <div className="absolute top-0 left-0 right-0 h-10 flex justify-evenly items-center z-50 pointer-events-none px-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="relative w-4 h-10">
              <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-[#1a0f0a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
              <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[10px] h-[28px] rounded-[4px] bg-gradient-to-b from-[#f5f5f5] via-[#ffffff] to-[#737373] shadow-[0_3px_5px_rgba(0,0,0,0.6)] border border-[#a0a0a0]/50" />
            </div>
          ))}
        </div>

        {/* Notebook Paper Stack Illusion (Background) */}
        <div
          className="absolute inset-0 top-[20px] rounded-b-md bg-[#dcd4c8]"
          style={{ transform: 'translateZ(-12px) translateY(5px) scaleX(0.97)', zIndex: 0 }}
        />
        <div
          className="absolute inset-0 top-[20px] rounded-b-md bg-[#e6ded2]"
          style={{ transform: 'translateZ(-6px) translateY(3px) scaleX(0.985)', zIndex: 1 }}
        />
        
        {/* Swiper Container */}
        <div 
          className="absolute inset-0 top-[20px] rounded-b-md z-10" 
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={handleSlideChange}
            direction="vertical"
            effect="creative"
            speed={750}
            grabCursor={true}
            modules={[EffectCreative]}
            creativeEffect={{
              prev: {
                shadow: true,
                translate: [0, '-100%', -400],
                rotate: [-85, 0, 0],
              },
              next: {
                translate: [0, '100%', 0],
              },
            }}
            className="w-full h-full rounded-b-md"
            style={{ 
              overflow: 'visible', // 3D gölgelerin ve üstten uçan sayfanın kesilmemesi için
              clipPath: 'polygon(-50% -50%, 150% -50%, 150% 100%, -50% 100%)' // Sadece alt kısmı (100% ve sonrası) kırpar!
            }}
          >
            {book.sheets.map((sheet, index) => (
              <SwiperSlide 
                key={index} 
                className="w-full h-full"
                // Dönüş merkezini spirallerin olduğu noktaya hizalıyoruz
                style={{ transformOrigin: 'top center' }}
              >
                <MobilePageFace>
                  <Sheet
                    sheet={sheet}
                    side="right"
                    onSelectPoem={onSelectPoem}
                    pageWidth={Math.min(window.innerWidth * 0.92, 420)}
                  />
                </MobilePageFace>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

/** Single page face for mobile */
const MobilePageFace = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-book-page overflow-hidden relative w-full h-full rounded-b-md"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 45%, rgba(255,251,242,0.55) 0%, rgba(240,228,205,0.18) 100%)',
        boxShadow:
          'inset 0 0 60px rgba(44,24,16,0.04), 0 1px 3px rgba(44,24,16,0.08)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-multiply"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden
      />
      {children}
    </div>
  )
})
