import { motion } from 'framer-motion'
import { book, type Sheet as SheetType } from '../utils/paginate'
import { poems } from '../data/poems'

interface SheetProps {
  sheet: SheetType | null
  side: 'left' | 'right'
  onSelectPoem?: (poemId: number) => void
  pageWidth?: number
  pageHeight?: number
  isMobileView?: boolean
}

/**
 * Calculate an optimal font size for a poem page on mobile.
 * Fits the longest line horizontally and all lines vertically,
 * then returns the largest size that satisfies both constraints.
 */
function calcMobilePoemFont(
  stanzas: string[][],
  isFirstPage: boolean,
  availW: number,
  availH: number,
): number {
  const allLines = stanzas.flat()
  if (allLines.length === 0) return 13

  const longestLine = Math.max(...allLines.map((l) => l.length))
  const totalLines = allLines.length
  const stanzaGaps = Math.max(0, stanzas.length - 1)

  // Horizontal: longest line must fit without wrapping
  // Average char width ≈ 0.52 × fontSize for proportional Turkish text
  const hMax = longestLine > 0 ? availW / (longestLine * 0.52) : 20

  // Vertical: title + all lines + stanza gaps must fit
  const titleH = isFirstPage ? 44 : 26
  const gapPx = 10
  const remainH = availH - titleH - stanzaGaps * gapPx
  const vMax = remainH > 0 ? remainH / (totalLines * 1.55) : 13

  return Math.max(7, Math.min(18, hMax, vMax))
}

/** Renders a single book page. */
export default function Sheet({ sheet, side, onSelectPoem, pageWidth, pageHeight, isMobileView }: SheetProps) {
  if (!sheet) {
    return <div className="h-full" />
  }

  const pw = pageWidth || 500
  const ph = pageHeight || Math.round(pw * 1.242)
  const s = Math.min(1, pw / 520)
  const isMobile = isMobileView ?? false
  const padX = `${Math.max(isMobile ? 16 : 24, Math.round(48 * s))}px`

  const pageNumberEl = (
    <div
      className={`absolute bottom-6 ${
        side === 'left' ? 'left-10' : 'right-10'
      } font-body text-[11px] tracking-widest text-ink-light/45`}
    >
      {sheet.pageNumber}
    </div>
  )

  if (sheet.kind === 'half-title') {
    return (
      <div className="relative h-full flex flex-col items-center justify-center py-16" style={{ paddingLeft: padX, paddingRight: padX }}>
        <div className="text-center">
          <p className="font-body text-ink-light/60 italic text-sm tracking-widest uppercase mb-6">
            Şiirler
          </p>
          <h1 className="font-serif text-ink mb-3" style={{ fontSize: `${Math.max(28, Math.round(44 * s))}px`, letterSpacing: '0.02em' }}>
            Güldalı
          </h1>
          <div className="w-12 h-px bg-ink/25 mx-auto my-5" />
          <p className="font-body text-ink-light tracking-widest uppercase text-xs" style={{ letterSpacing: '0.2em' }}>
            Avni Bozkaya
          </p>
        </div>
        <div className="absolute bottom-16 left-0 right-0 text-center">
          <span className="font-serif text-ink/15 text-2xl">❧</span>
        </div>
      </div>
    )
  }

  if (sheet.kind === 'blank') {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-ink/8 text-3xl select-none">❦</span>
        </div>
        {pageNumberEl}
      </div>
    )
  }

  if (sheet.kind === 'toc') {
    const slice = poems.slice(sheet.tocStart, sheet.tocStart + sheet.tocCount)
    const showHeader = sheet.tocStart === 0
    const tocPadY = `${Math.max(20, Math.round(48 * s))}px`
    // Look up start page from the book index
    return (
      <div className="relative h-full flex flex-col" style={{ paddingLeft: padX, paddingRight: padX, paddingTop: tocPadY, paddingBottom: tocPadY }}>
        {showHeader && (
          <div className="text-center" style={{ marginBottom: `${Math.max(12, Math.round(32 * s))}px` }}>
            <h2 className="font-serif text-ink" style={{ fontSize: `${Math.max(22, Math.round(30 * s))}px` }}>Fihrist</h2>
            <div className="w-12 h-px bg-ink/25 mx-auto mt-3" />
          </div>
        )}
        {!showHeader && <div style={{ height: `${Math.max(8, Math.round(24 * s))}px` }} />}
        <ul className="flex-1 flex flex-col justify-between">
          {slice.map((poem) => {
            const startPage = book.index.get(poem.id)?.startPage ?? poem.page
            return (
              <li key={poem.id}>
                <button
                  onClick={() => onSelectPoem?.(poem.id)}
                  className="w-full flex items-end gap-2 px-1 rounded hover:bg-ink/5 transition-colors duration-200 group cursor-pointer text-left"
                  style={{ paddingTop: `${Math.max(2, Math.round(6 * s))}px`, paddingBottom: `${Math.max(2, Math.round(6 * s))}px` }}
                >
                  <span
                    className="font-body text-ink group-hover:text-rose transition-colors duration-200 whitespace-nowrap truncate"
                    style={{ fontSize: `${Math.max(13, Math.round(17 * s))}px` }}
                  >
                    {poem.title}
                  </span>
                  <span className="flex-1 border-b border-dotted border-ink/20 mb-1 min-w-[16px]" />
                  <span className="font-body text-ink-light text-xs tabular-nums">
                    {startPage}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {pageNumberEl}
      </div>
    )
  }

  // poem sheet
  const padXNum = isMobile ? Math.max(16, Math.round(28 * s)) : Math.max(24, Math.round(48 * s))
  const padYNum = isMobile ? Math.max(16, Math.round(28 * s)) : 48
  const poemPadX = `${padXNum}px`
  const poemPadY = `${padYNum}px`

  // Font size: on mobile, dynamically calculate per page; on tablet/desktop, use standard scaling
  const desktopFontSize = Math.max(13, Math.round(19 * s))
  const mobileFontSize = isMobile
    ? Math.round(calcMobilePoemFont(sheet.stanzas, sheet.isFirstPage, pw - padXNum * 2, ph - padYNum * 2 - 20))
    : desktopFontSize
  const poemFontSize = isMobile ? mobileFontSize : desktopFontSize

  const titleSize = isMobile
    ? Math.max(12, Math.round(poemFontSize * 1.5))
    : Math.max(20, Math.round(32 * s))
  const stanzaGap = isMobile ? `${Math.max(4, Math.round(8 * (poemFontSize / 13)))}px` : '20px'
  const titleMb = isMobile ? `${Math.max(4, Math.round(8 * (poemFontSize / 13)))}px` : '24px'

  return (
    <div className="relative h-full flex flex-col" style={{ paddingLeft: poemPadX, paddingRight: poemPadX, paddingTop: poemPadY, paddingBottom: poemPadY }}>
      {sheet.isFirstPage ? (
        <motion.div
          className="text-center"
          style={{ marginBottom: titleMb }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2
            className="font-serif text-ink leading-tight"
            style={{ fontSize: `${titleSize}px`, letterSpacing: '0.01em' }}
          >
            {sheet.poemTitle}
          </h2>
          <div className="w-10 h-px bg-ink/20 mx-auto mt-2" />
        </motion.div>
      ) : (
        <div className="text-center" style={{ marginBottom: titleMb }}>
          <p className="font-body italic text-ink-light/55" style={{ fontSize: `${isMobile ? Math.max(8, poemFontSize - 1) : 14}px` }}>
            — {sheet.poemTitle} (devamı) —
          </p>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: stanzaGap }}>
        {sheet.stanzas.map((stanza, si) => (
          <div key={si} className="text-center">
            {stanza.map((line, li) => (
              <p
                key={li}
                className="font-body text-ink whitespace-nowrap"
                style={{
                  fontSize: `${poemFontSize}px`,
                  lineHeight: isMobile ? '1.45' : '1.6',
                  letterSpacing: '0.005em',
                }}
              >
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
      {pageNumberEl}
    </div>
  )
}
