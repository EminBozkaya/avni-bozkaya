import { motion } from 'framer-motion'
import { book, type Sheet as SheetType } from '../utils/paginate'
import { poems } from '../data/poems'
import RoseMotif from './RoseMotif'

interface SheetProps {
  sheet: SheetType | null
  side: 'left' | 'right'
  onSelectPoem?: (poemId: number) => void
  pageWidth?: number
  pageHeight?: number
  isMobileView?: boolean
}

interface PoemFontOpts {
  min: number
  max: number
  /** Average char width as a fraction of font size (proportional Turkish text). */
  charW: number
  /** Line height multiplier used for the vertical fit. */
  lineFactor: number
  /** Reserved vertical space for the title block on first vs. continuation pages. */
  titleFirst: number
  titleCont: number
  /** Vertical gap between stanzas. */
  gapPx: number
}

/**
 * Calculate the largest poem font that fits the longest line horizontally
 * (lines never wrap — they use whitespace-nowrap) and all lines vertically,
 * clamped to [min, max]. Because the result is fit-constrained, raising the
 * font target never reflows lines or stanzas.
 */
function calcPoemFont(
  stanzas: string[][],
  isFirstPage: boolean,
  availW: number,
  availH: number,
  o: PoemFontOpts,
): number {
  const allLines = stanzas.flat()
  if (allLines.length === 0) return o.max

  const longestLine = Math.max(...allLines.map((l) => l.length))
  const totalLines = allLines.length
  const stanzaGaps = Math.max(0, stanzas.length - 1)

  const hMax = longestLine > 0 ? availW / (longestLine * o.charW) : o.max

  const titleH = isFirstPage ? o.titleFirst : o.titleCont
  const remainH = availH - titleH - stanzaGaps * o.gapPx
  const vMax = remainH > 0 ? remainH / (totalLines * o.lineFactor) : o.min

  return Math.max(o.min, Math.min(o.max, hMax, vMax))
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

  // On tablet/desktop the page number always sits on the right; on mobile it
  // follows the page side so the open-book left/right feel is preserved.
  const pageNumberSide = isMobile && side === 'left' ? 'left-4' : 'right-4'
  const pageNumberEl = (
    <div
      className={`absolute bottom-2 ${pageNumberSide} font-body text-[19px] tracking-widest text-ink-light/45`}
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
        <RoseMotif variant="watermark" />
        {pageNumberEl}
      </div>
    )
  }

  if (sheet.kind === 'foreword') {
    const fwPadY = `${Math.max(20, Math.round(48 * s))}px`
    const fwFontSize = `${Math.max(12, Math.round(15 * s))}px`
    return (
      <div
        className="relative h-full flex flex-col"
        style={{ paddingLeft: padX, paddingRight: padX, paddingTop: fwPadY, paddingBottom: fwPadY }}
      >
        {sheet.isFirstPage && (
          <div className="text-center" style={{ marginBottom: `${Math.max(16, Math.round(32 * s))}px` }}>
            <h2
              className="font-serif text-ink"
              style={{ fontSize: `${Math.max(22, Math.round(30 * s))}px` }}
            >
              Ön Söz
            </h2>
            <div className="w-12 h-px bg-ink/25 mx-auto mt-3" />
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center" style={{ gap: `${Math.max(12, Math.round(20 * s))}px` }}>
          {sheet.paragraphs.map((para, i) => (
            <p
              key={i}
              className="font-body text-ink leading-relaxed text-justify"
              style={{ fontSize: fwFontSize, textIndent: '1.5em' }}
            >
              {para}
            </p>
          ))}
        </div>
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="w-full flex items-end gap-2 px-1 rounded hover:bg-ink/5 transition-colors duration-200 group cursor-pointer text-left"
                  style={{ paddingTop: `${Math.max(2, Math.round(6 * s))}px`, paddingBottom: `${Math.max(2, Math.round(6 * s))}px` }}
                >
                  <span
                    className="pointer-events-none font-body text-ink group-hover:text-rose transition-colors duration-200 whitespace-nowrap truncate"
                    style={{ fontSize: `${Math.max(13, Math.round(17 * s))}px` }}
                  >
                    {poem.title}
                  </span>
                  <span className="pointer-events-none flex-1 border-b border-dotted border-ink/20 mb-1 min-w-[16px]" />
                  <span className="pointer-events-none font-body text-ink-light text-xs tabular-nums">
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

  // poem sheet — tighter left/right margins so poems get a bit more width on every screen
  const padXNum = isMobile ? Math.max(12, Math.round(22 * s)) : Math.max(18, Math.round(36 * s))
  const padYNum = isMobile ? Math.max(16, Math.round(28 * s)) : 48
  const poemPadX = `${padXNum}px`
  const poemPadY = `${padYNum}px`

  // Prose notes (intro under the title, dedication after the date) render at a
  // fixed size and may wrap onto several lines — they are not verses.
  const introNote = sheet.introNote ?? ''
  const closingNote = sheet.closingNote ?? ''
  const noteFontSize = isMobile ? 12 : 14
  const noteLineH = 1.45

  // Font size is fit-constrained on every screen so verses grow as large as the
  // space left over by the notes allows, without ever wrapping a line.
  const availW = pw - padXNum * 2
  const availH = ph - padYNum * 2 - 20

  // Reserve the vertical room a wrapped note takes so verses are sized for the rest.
  const estNoteHeight = (note: string, marginPx: number) => {
    if (!note) return 0
    const charsPerLine = Math.max(1, Math.floor(availW / (noteFontSize * 0.5)))
    // Sum wrapped line counts across explicit line breaks.
    const lines = note
      .split('\n')
      .reduce((sum, seg) => sum + Math.max(1, Math.ceil(seg.length / charsPerLine)), 0)
    return lines * noteFontSize * noteLineH + marginPx
  }
  const versesAvailH = Math.max(
    60,
    availH - estNoteHeight(introNote, 18) - estNoteHeight(closingNote, 14),
  )

  let poemFontSize: number
  if (isMobile) {
    poemFontSize = Math.round(
      calcPoemFont(sheet.stanzas, sheet.isFirstPage, availW, versesAvailH, {
        min: 7,
        max: 20,
        charW: 0.52,
        lineFactor: 1.55,
        titleFirst: 44,
        titleCont: 26,
        gapPx: 10,
      }),
    )
  } else {
    // Never shrink below the previous fixed desktop size; only grow where the page has room.
    const desktopBase = Math.max(13, Math.round(19 * s))
    poemFontSize = Math.round(
      calcPoemFont(sheet.stanzas, sheet.isFirstPage, availW, versesAvailH, {
        min: desktopBase,
        max: Math.max(desktopBase, Math.round(23 * s)),
        charW: 0.52,
        lineFactor: 1.7,
        titleFirst: Math.max(20, Math.round(32 * s)) + 40,
        titleCont: 44,
        gapPx: 20,
      }),
    )
  }

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
      {introNote && (
        <p
          className={`text-ink-light/70 text-center whitespace-pre-line ${
            sheet.introNoteSans ? 'font-sans' : 'font-body italic'
          }`}
          style={{
            fontSize: `${sheet.introNoteSans ? noteFontSize - 1 : noteFontSize}px`,
            lineHeight: noteLineH,
            marginBottom: isMobile ? '10px' : '18px',
          }}
        >
          {introNote}
        </p>
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
        {closingNote && (
          <p
            className="font-body italic text-ink-light/70 text-center whitespace-pre-line"
            style={{ fontSize: `${noteFontSize}px`, lineHeight: noteLineH, marginTop: '4px' }}
          >
            {closingNote}
          </p>
        )}
      </div>
      {/* On tablet/desktop the ornament always uses the right-page (un-mirrored)
          orientation; on mobile it follows the page side. */}
      <RoseMotif variant="ornament" side={isMobile ? side : 'right'} />
      {pageNumberEl}
    </div>
  )
}
