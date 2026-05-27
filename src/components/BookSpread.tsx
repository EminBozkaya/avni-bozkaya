import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import HTMLFlipBook from 'react-pageflip'
import Sheet from './Sheet'
import MobileNotebook from './MobileNotebook'
import {
  book,
} from '../utils/paginate'
import { playPageTurnSound, playBookOpenSound } from '../utils/sound'

const MOBILE_BREAKPOINT = 768

interface BookSpreadProps {
  onClose: () => void
  initialPoemId?: number | null
  onPoemNavigate?: (poemId: number) => void
}

export default function BookSpread({ onClose, initialPoemId, onPoemNavigate }: BookSpreadProps) {
  const [currentPage, setCurrentPage] = useState(() => {
    if (initialPoemId != null) {
      const entry = book.index.get(initialPoemId)
      if (entry) return entry.sheetIndex
    }
    return 0
  })
  const bookRef = useRef<any>(null)
  const navTargetRef = useRef<number | null>(null)
  const muteNextSoundRef = useRef(false)

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  const goNext = useCallback(() => {
    if (isMobile) {
      if (currentPage < book.sheets.length - 1) {
        setCurrentPage(p => p + 1)
      }
    } else if (bookRef.current) {
      muteNextSoundRef.current = true
      bookRef.current.pageFlip().flipNext()
    }
  }, [isMobile, currentPage])

  const goPrev = useCallback(() => {
    if (isMobile) {
      if (currentPage > 0) {
        setCurrentPage(p => p - 1)
      }
    } else if (bookRef.current) {
      muteNextSoundRef.current = true
      bookRef.current.pageFlip().flipPrev()
    }
  }, [isMobile, currentPage])

  const goToToc = useCallback(() => {
    const idx = book.sheets.findIndex(s => s.kind === 'toc')
    if (idx >= 0) {
      if (isMobile) {
        setCurrentPage(idx)
      } else if (bookRef.current) {
        muteNextSoundRef.current = true
        navTargetRef.current = idx
        bookRef.current.pageFlip().turnToPage(idx)
        setCurrentPage(idx)
      }
    }
  }, [isMobile])

  const goToPoem = useCallback((poemId: number) => {
    const entry = book.index.get(poemId)
    if (entry) {
      if (isMobile) {
        setCurrentPage(entry.sheetIndex)
      } else if (bookRef.current) {
        muteNextSoundRef.current = true
        navTargetRef.current = entry.sheetIndex
        bookRef.current.pageFlip().turnToPage(entry.sheetIndex)
        setCurrentPage(entry.sheetIndex)
      }
      onPoemNavigate?.(poemId)
    }
  }, [isMobile, onPoemNavigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  const onFlip = useCallback((e: any) => {
    const pageIdx = navTargetRef.current !== null ? navTargetRef.current : e.data
    navTargetRef.current = null
    setCurrentPage(pageIdx)
    const sheet = book.sheets[pageIdx]
    if (sheet && sheet.kind === 'poem' && sheet.isFirstPage) {
      onPoemNavigate?.(sheet.poemId)
    }
  }, [onPoemNavigate])

  const onChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      if (muteNextSoundRef.current) {
        muteNextSoundRef.current = false
      } else {
        playPageTurnSound()
      }
    }
  }, [])

  const onInit = useCallback(() => {
    playBookOpenSound()
  }, [])

  // ── Dynamically size the book so it ALWAYS fits the viewport ──
  const NAV_HEIGHT = 56
  const PAGE_RATIO = 770 / 620

  function calcSize() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const sideGap = Math.max(36, Math.round(vw * 0.045))
    const availW = vw - sideGap * 2
    const availH = vh - NAV_HEIGHT - 8

    let spreadW = Math.min(availW, 1400)
    let spreadH = (spreadW / 2) * PAGE_RATIO

    if (spreadH > availH) {
      spreadH = availH
      spreadW = (spreadH / PAGE_RATIO) * 2
    }

    return { w: Math.floor(spreadW / 2), h: Math.floor(spreadH) }
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
        const mobile = window.innerWidth < MOBILE_BREAKPOINT
        setIsMobile(mobile)
        if (!mobile) {
          const { w, h } = calcSize()
          setBookW(w)
          setBookH(h)
          setBookKey(k => k + 1)
        }
      }, 200)
    }

    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden bg-gradient-to-br from-cream to-cream-dark"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      {/* Book area */}
      <motion.div
        className="flex-1 min-h-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {isMobile ? (
          <MobileNotebook
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelectPoem={goToPoem}
          />
        ) : (
          /* @ts-ignore */
          <HTMLFlipBook
            key={bookKey}
            width={bookW}
            height={bookH}
            size="fixed"
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={true}
            className="book-container shadow-2xl"
            onFlip={onFlip}
            onChangeState={onChangeState}
            onInit={onInit}
            ref={bookRef}
            flippingTime={800}
            startPage={currentPage}
            usePortrait={false}
          >
            {book.sheets.map((sheet, index) => {
              const isRight = index % 2 === 0
              return (
                <PageFace key={index} side={isRight ? 'right' : 'left'}>
                  <Sheet sheet={sheet} side={isRight ? 'right' : 'left'} onSelectPoem={goToPoem} pageWidth={bookW} pageHeight={bookH} />
                </PageFace>
              )
            })}
          </HTMLFlipBook>
        )}
      </motion.div>

      {/* Bottom Navigation — flex-shrink-0 keeps it pinned */}
      <div
        className="flex-shrink-0 flex items-center justify-between w-full max-w-[1400px] mx-auto font-body text-sm text-ink-light px-4"
        style={{ height: `${NAV_HEIGHT}px` }}
      >
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded transition-all ${
            currentPage > 0 ? 'hover:text-ink hover:bg-ink/5 cursor-pointer' : 'opacity-25 cursor-default'
          }`}
        >
          <ChevronLeft size={22} />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={goToToc}
            className="flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer"
            title="Fihrist"
          >
            <BookOpen size={14} className="hidden sm:inline-block" />
            <span>Fihrist</span>
          </button>
          <span className="text-ink/15">|</span>
          <button
            onClick={onClose}
            className="transition-colors hover:text-ink cursor-pointer"
            title="Kitabı Kapat"
          >
            Kitabı Kapat
          </button>
          <span className="text-ink/15">|</span>
          <span className="tabular-nums text-ink-light/60 text-xs md:text-sm">
            {currentPage + 1} / {book.sheets.length}
          </span>
        </div>

        <button
          onClick={goNext}
          disabled={currentPage >= book.sheets.length - 1}
          className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded transition-all ${
            currentPage < book.sheets.length - 1
              ? 'hover:text-ink hover:bg-ink/5 cursor-pointer'
              : 'opacity-25 cursor-default'
          }`}
        >
          <span className="hidden sm:inline">Sonraki</span>
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  )
}

const PageFace = React.forwardRef<HTMLDivElement, {
  side: 'left' | 'right'
  children: React.ReactNode
}>(({ side, children }, ref) => {
  const isLeft = side === 'left'
  return (
    <div
      ref={ref}
      className="page bg-book-page overflow-hidden relative"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 45%, rgba(255,251,242,0.55) 0%, rgba(240,228,205,0.18) 100%)',
        boxShadow: isLeft
          ? 'inset -24px 0 28px -22px rgba(44,24,16,0.22), inset 0 0 80px rgba(44,24,16,0.04)'
          : 'inset 24px 0 28px -22px rgba(44,24,16,0.22), inset 0 0 80px rgba(44,24,16,0.04)',
        borderTopLeftRadius: isLeft ? '6px' : 0,
        borderBottomLeftRadius: isLeft ? '6px' : 0,
        borderTopRightRadius: !isLeft ? '6px' : 0,
        borderBottomRightRadius: !isLeft ? '6px' : 0,
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
      <div
        className={`absolute top-0 bottom-0 ${isLeft ? 'left-0' : 'right-0'} w-2 pointer-events-none z-10`}
        style={{
          background: isLeft
            ? 'linear-gradient(to right, rgba(120,90,50,0.22), transparent)'
            : 'linear-gradient(to left, rgba(120,90,50,0.22), transparent)',
        }}
        aria-hidden
      />
      
      {/* Deep crease shadow at the spine (inner edge) */}
      <div
        className={`absolute top-0 bottom-0 ${isLeft ? 'right-0' : 'left-0'} pointer-events-none z-10`}
        style={{
          width: '40px',
          background: isLeft
            ? 'linear-gradient(to left, rgba(20,10,5,0.4) 0%, rgba(20,10,5,0.15) 30%, transparent 100%)'
            : 'linear-gradient(to right, rgba(20,10,5,0.4) 0%, rgba(20,10,5,0.15) 30%, transparent 100%)',
          boxShadow: isLeft 
            ? 'inset -5px 0 10px -5px rgba(0,0,0,0.3)' 
            : 'inset 5px 0 10px -5px rgba(0,0,0,0.3)',
        }}
        aria-hidden
      />
      
      {/* Soft spine highlight to give the paper curl depth near the binding */}
      <div
        className={`absolute top-0 bottom-0 ${isLeft ? 'right-0' : 'left-0'} pointer-events-none z-10`}
        style={{
          width: '12px',
          background: isLeft
            ? 'linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
          transform: isLeft ? 'translateX(-30px)' : 'translateX(30px)'
        }}
        aria-hidden
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
})
