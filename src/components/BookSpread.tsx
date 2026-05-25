import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import HTMLFlipBook from 'react-pageflip'
import Sheet from './Sheet'
import {
  book,
} from '../utils/paginate'
import { playPageTurnSound, playBookOpenSound } from '../utils/sound'

interface BookSpreadProps {
  onClose: () => void
}

export default function BookSpread({ onClose }: BookSpreadProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const bookRef = useRef<any>(null)

  const goNext = useCallback(() => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext()
    }
  }, [])
  
  const goPrev = useCallback(() => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev()
    }
  }, [])

  const goToToc = useCallback(() => {
    if (bookRef.current) {
      const idx = book.sheets.findIndex(s => s.kind === 'toc')
      if (idx >= 0) bookRef.current.pageFlip().flip(idx)
    }
  }, [])

  const goToPoem = useCallback((poemId: number) => {
    if (bookRef.current) {
      const entry = book.index.get(poemId)
      if (entry) bookRef.current.pageFlip().flip(entry.sheetIndex)
    }
  }, [])

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
    setCurrentPage(e.data)
  }, [])

  const onChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      playPageTurnSound()
    }
  }, [])

  const onInit = useCallback(() => {
    playBookOpenSound()
  }, [])

  // ── Dynamically size the book so it ALWAYS fits the viewport ──
  const NAV_HEIGHT = 56
  const PAGE_RATIO = 770 / 620

  const [bookW, setBookW] = useState(400)
  const [bookH, setBookH] = useState(533)

  useEffect(() => {
    function measure() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sideGap = Math.max(36, Math.round(vw * 0.045))
      const availW = vw - sideGap * 2
      const availH = vh - NAV_HEIGHT - 8

      // Spread = 2 pages side by side → aspect = (2*pageW) : pageH = 2 : PAGE_RATIO
      // pageH = pageW * PAGE_RATIO
      // spreadW = 2 * pageW  → pageW = spreadW / 2
      // spreadH = (spreadW / 2) * PAGE_RATIO

      // Fit by width first
      let spreadW = Math.min(availW, 1400)
      let spreadH = (spreadW / 2) * PAGE_RATIO

      // If too tall, fit by height instead
      if (spreadH > availH) {
        spreadH = availH
        spreadW = (spreadH / PAGE_RATIO) * 2
      }

      const pageW = Math.floor(spreadW / 2)
      const pageH = Math.floor(spreadH)

      setBookW(pageW)
      setBookH(pageH)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
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
        {/* @ts-ignore */}
        <HTMLFlipBook
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
          usePortrait={false}
        >
          {book.sheets.map((sheet, index) => {
            const isRight = index % 2 === 0
            return (
              <PageFace key={index} side={isRight ? 'right' : 'left'}>
                <Sheet sheet={sheet} side={isRight ? 'right' : 'left'} onSelectPoem={goToPoem} pageWidth={bookW} />
              </PageFace>
            )
          })}
        </HTMLFlipBook>
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
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={goToToc}
            className="flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer"
            title="Fihrist"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Fihrist</span>
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
          <ChevronRight size={16} />
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
