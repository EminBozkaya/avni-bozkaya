import { motion } from 'framer-motion'
import { book, type Sheet as SheetType } from '../utils/paginate'
import { poems } from '../data/poems'

interface SheetProps {
  sheet: SheetType | null
  side: 'left' | 'right'
  onSelectPoem?: (poemId: number) => void
}

/** Renders a single book page. */
export default function Sheet({ sheet, side, onSelectPoem }: SheetProps) {
  if (!sheet) {
    return <div className="h-full" />
  }

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
      <div className="relative h-full flex flex-col items-center justify-center px-12 py-16">
        <div className="text-center">
          <p className="font-body text-ink-light/60 italic text-sm tracking-widest uppercase mb-6">
            Şiirler
          </p>
          <h1 className="font-serif text-5xl text-ink mb-3" style={{ letterSpacing: '0.02em' }}>
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
    // Look up start page from the book index
    return (
      <div className="relative h-full px-10 py-12 flex flex-col">
        {showHeader && (
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl text-ink">Fihrist</h2>
            <div className="w-12 h-px bg-ink/25 mx-auto mt-3" />
          </div>
        )}
        {!showHeader && <div className="h-6" />}
        <ul className="flex-1 space-y-2">
          {slice.map((poem) => {
            const startPage = book.index.get(poem.id)?.startPage ?? poem.page
            return (
              <li key={poem.id}>
                <button
                  onClick={() => onSelectPoem?.(poem.id)}
                  className="w-full flex items-end gap-2 py-1.5 px-1 rounded hover:bg-ink/5 transition-colors duration-200 group cursor-pointer text-left"
                >
                  <span
                    className="font-body text-ink group-hover:text-rose transition-colors duration-200 whitespace-nowrap truncate"
                    style={{ fontSize: '0.95rem' }}
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
  return (
    <div className="relative h-full px-12 py-12 flex flex-col">
      {sheet.isFirstPage ? (
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-serif text-2xl text-ink leading-tight" style={{ letterSpacing: '0.01em' }}>
            {sheet.poemTitle}
          </h2>
          <div className="w-10 h-px bg-ink/20 mx-auto mt-3" />
        </motion.div>
      ) : (
        <div className="text-center mb-6">
          <p className="font-body italic text-ink-light/55 text-sm">
            — {sheet.poemTitle} (devamı) —
          </p>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {sheet.stanzas.map((stanza, si) => (
          <div key={si} className="text-center">
            {stanza.map((line, li) => (
              <p
                key={li}
                className="font-body text-ink leading-relaxed"
                style={{ fontSize: '1rem', letterSpacing: '0.005em' }}
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
