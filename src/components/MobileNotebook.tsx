import React, { useCallback, useRef, useState, useEffect } from 'react'
import HTMLFlipBook from 'react-pageflip'
import Sheet from './Sheet'
import { book } from '../utils/paginate'
import { playPageTurnSound, playBookOpenSound } from '../utils/sound'

interface MobileNotebookProps {
  currentPage: number
  onPageChange: (page: number) => void
  onSelectPoem?: (poemId: number) => void
}

/** 
 * Orijinal stPageFlip (react-pageflip) kütüphanesinin mobildeki (tek sayfa/portrait) görünümü.
 * Sayfalar yatay (sağdan sola) çevrilir.
 */
export default function MobileNotebook({ currentPage, onPageChange, onSelectPoem }: MobileNotebookProps) {
  const bookRef = useRef<any>(null)
  const navTargetRef = useRef<number | null>(null)

  // Mobil ekran için dinamik boyutlandırma (Aspect Ratio: 620/770)
  const NAV_HEIGHT = 56
  const PAGE_RATIO = 770 / 620
  const SIDE_GAP = 16

  function calcSize() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const availW = vw - SIDE_GAP * 2
    const availH = vh - NAV_HEIGHT - 16

    let w = availW
    let h = w * PAGE_RATIO

    if (h > availH) {
      h = availH
      w = h / PAGE_RATIO
    }

    return { w: Math.floor(w), h: Math.floor(h) }
  }

  const initial = calcSize()
  const [bookW, setBookW] = useState(initial.w)
  const [bookH, setBookH] = useState(initial.h)
  const [bookKey, setBookKey] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const { w, h } = calcSize()
        setBookW(w)
        setBookH(h)
        setBookKey(k => k + 1)
      }, 200)
    }

    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Dışarıdan (örn. alt butonlardan) gelen sayfa değişikliklerini HTMLFlipBook'a senkronize et
  useEffect(() => {
    if (bookRef.current) {
      const flipBook = bookRef.current.pageFlip()
      if (flipBook && flipBook.getCurrentPageIndex() !== currentPage) {
        navTargetRef.current = currentPage
        flipBook.flip(currentPage)
      }
    }
  }, [currentPage])

  // Sayfa çevrildiğinde state'i güncelle
  const onFlip = useCallback((e: any) => {
    if (navTargetRef.current !== null) {
      onPageChange(navTargetRef.current)
      navTargetRef.current = null
    } else {
      onPageChange(e.data)
    }
  }, [onPageChange])

  const onChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      playPageTurnSound()
    }
  }, [])

  const onInit = useCallback(() => {
    playBookOpenSound()
  }, [])

  return (
    <div className="mobile-notebook-container w-full h-full flex items-center justify-center overflow-hidden">
      {/* @ts-ignore */}
      <HTMLFlipBook
        key={bookKey}
        width={bookW}
        height={bookH}
        size="fixed"
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        useMouseEvents={true}
        className="mobile-notebook-flip shadow-2xl"
        onFlip={onFlip}
        onChangeState={onChangeState}
        onInit={onInit}
        ref={bookRef}
        flippingTime={800}
        startPage={currentPage}
        usePortrait={true} // EN ÖNEMLİ AYAR: Mobilde ekranda sadece 1 sayfa gösterilmesini sağlar
      >
        {book.sheets.map((sheet, index) => {
          return (
            <PageFace key={index}>
              <Sheet
                sheet={sheet}
                side="right"
                onSelectPoem={onSelectPoem}
                pageWidth={bookW}
                pageHeight={bookH}
                isMobileView={true}
              />
            </PageFace>
          )
        })}
      </HTMLFlipBook>
    </div>
  )
}

/** Mobildeki her bir sayfa için tasarım (stPageFlip ile uyumlu) */
const PageFace = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => {
  return (
    <div
      ref={ref}
      className="page bg-book-page overflow-hidden relative rounded-md"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 45%, rgba(255,251,242,0.55) 0%, rgba(240,228,205,0.18) 100%)',
        boxShadow: 'inset 0 0 60px rgba(44,24,16,0.04), 0 1px 3px rgba(44,24,16,0.08)',
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
      <div className="relative h-full">{children}</div>
    </div>
  )
})
