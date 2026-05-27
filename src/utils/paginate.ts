import { poems, type Poem } from '../data/poems'

/**
 * A single rendered leaf-side: either a TOC slice, a poem slice, blank, or cover.
 * Each Sheet corresponds to one physical page in the book.
 */
export type Sheet =
  | { kind: 'toc'; tocStart: number; tocCount: number; pageNumber: number }
  | {
      kind: 'poem'
      poemId: number
      poemTitle: string
      isFirstPage: boolean
      stanzas: string[][]
      pageNumber: number
    }
  | { kind: 'blank'; pageNumber: number }
  | { kind: 'half-title'; pageNumber: number }
  | { kind: 'foreword'; paragraphs: string[]; isFirstPage: boolean; pageNumber: number }

export interface PoemIndexEntry {
  poemId: number
  title: string
  startPage: number
  sheetIndex: number // index into sheets[] where the poem begins
}

/** Split a flat list of poem lines into stanzas (separated by blank lines). */
function splitStanzas(lines: string[]): string[][] {
  const stanzas: string[][] = []
  let current: string[] = []
  for (const ln of lines) {
    if (ln === '') {
      if (current.length) {
        stanzas.push(current)
        current = []
      }
    } else {
      current.push(ln)
    }
  }
  if (current.length) stanzas.push(current)
  return stanzas
}

/** Chunk an array into groups of at most `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

const MAX_STANZAS_FIRST_PAGE = 2
const MAX_STANZAS_CONT_PAGE = 3
const TOC_FIRST_PAGE_ITEMS = 8
const TOC_CONT_PAGE_ITEMS = 10

const FOREWORD_PAGES: string[][] = [
  [
    'Bu eser, ömrünü ilme, insan yetiştirmeye ve güzel ahlâka adamış kıymetli eğitimci ve şair Avni Bozkaya’ın gönül dünyasından süzülen şiirlerden oluşmaktadır. “Güldalı” mahlasıyla kaleme aldığı bu dizelerde; memleket sevgisi, anne hasreti, gençlere nasihat, insan sevgisi ve Hak aşkı içten bir üslupla hayat bulmaktadır.',
    '12 Haziran 1957’de Erzurum’un Pasinler ilçesinde dünyaya gelen Avni Bozkaya, Atatürk Üniversitesi Kazım Karabekir Eğitim Fakültesi Matematik Öğretmenliği bölümünden mezun olduktan sonra hayatını öğrencilerine adamış; Trabzon, Konya, Mardin ve Erzurum’da yıllarca öğretmenlik ve idarecilik yapmıştır. Mesleğini yalnızca bir görev olarak değil, gençlerin gönlüne dokunma vesilesi olarak görmüş; öğrencilerine daima rehberlik eden, sevgiyle yaklaşan örnek bir eğitimci olmuştur.',
  ],
  [
    '1983 yılında hayatını Selvi Bozkaya ile birleştiren merhum şair, dört çocuk babasıdır. Hayatının her döneminde yanında olan kıymetli eşi Selvi Bozkaya; gerek meslek hayatında gerek sosyal ilişkilerinde kendisine büyük destek olmuş, onun en yakın yol arkadaşı olmuştur. Kaleme aldığı şiirlerin ve manzum hikâyelerin oluşum sürecinde çoğu zaman birlikte fikir yürüttükleri, duygularını birlikte olgunlaştırdıkları aile fertleri tarafından daima hissedilmiştir. Bu yönüyle eserlerinde yalnızca bireysel bir gönül dünyasının değil; sevgi, sadakat ve güçlü bir aile bağının da izleri bulunmaktadır.',
    'Hayatı boyunca doğruluktan ayrılmayan, kimseyi incitmemeye özen gösteren, gönül insanı bir karaktere sahip olan merhum şair; boş vakitlerini kalbindeki samimi duyguları mısralara dökerek değerlendirmiştir. Yazdığı şiirlerde bazen bir annenin duası, bazen memleket toprağının kokusu, bazen de Hak’ka duyulan derin muhabbet hissedilmektedir.',
  ],
  [
    '2016 yılının Ocak ayında, henüz görevini sürdürmekteyken Hakk’ın rahmetine kavuşan Avni Bozkaya’dan geriye; güzel hatıralar, yetiştirdiği öğrenciler ve gönüllere dokunan bu kıymetli eserler kalmıştır.',
    'Elinizde bulunan bu dijital eser, onun şiirlerini daha düzenli, erişilebilir ve huzurlu bir okuma deneyimiyle gelecek nesillere ulaştırabilmek amacıyla hazırlanmıştır. Sayfalar arasında dolaşırken yalnızca şiir değil; samimiyet, edep, merhamet ve insan sevgisiyle yoğrulmuş bir gönül dünyasıyla da karşılaşacağınızı ümit ediyoruz.',
    'Rahmetli Avni Bozkaya’ı rahmet ve dualarla yâd ediyor; bu satırların gönüllerinize dokunmasını temenni ediyoruz.',
  ],
]

export interface Book {
  sheets: Sheet[]
  index: Map<number, PoemIndexEntry>
}

/**
 * Build the pagination of the entire book.
 *
 * Layout convention:
 *  - Page 1 (recto) = half-title (poet name)
 *  - Page 2 (verso) = blank
 *  - Pages 3..M = Fihrist (TOC), continued onto further pages if needed
 *  - Every poem begins on a recto (odd page); a blank verso is inserted if needed.
 */
export function buildBook(): Book {
  const sheets: Sheet[] = []
  const index = new Map<number, PoemIndexEntry>()

  const pushSheet = (s: Sheet) => sheets.push(s)
  const currentPageNo = () => sheets.length + 1

  // Page 1: half-title
  pushSheet({ kind: 'half-title', pageNumber: currentPageNo() })
  // Page 2: blank
  pushSheet({ kind: 'blank', pageNumber: currentPageNo() })

  // Foreword pages (Ön Söz)
  for (let i = 0; i < FOREWORD_PAGES.length; i++) {
    pushSheet({
      kind: 'foreword',
      paragraphs: FOREWORD_PAGES[i],
      isFirstPage: i === 0,
      pageNumber: currentPageNo(),
    })
  }

  // Ensure the TOC starts on a recto (odd page) after foreword
  if (currentPageNo() % 2 === 0) {
    pushSheet({ kind: 'blank', pageNumber: currentPageNo() })
  }

  // TOC pages — first page has fewer items (header takes space), rest get more
  const totalPoems = poems.length
  let tocItemsPlaced = 0
  while (tocItemsPlaced < totalPoems) {
    const isFirstTocPage = tocItemsPlaced === 0
    const capacity = isFirstTocPage ? TOC_FIRST_PAGE_ITEMS : TOC_CONT_PAGE_ITEMS
    const itemsThisPage = Math.min(capacity, totalPoems - tocItemsPlaced)
    pushSheet({
      kind: 'toc',
      tocStart: tocItemsPlaced,
      tocCount: itemsThisPage,
      pageNumber: currentPageNo(),
    })
    tocItemsPlaced += itemsThisPage
  }

  // Ensure the next poem starts on a recto (odd page)
  const ensureRecto = () => {
    if (currentPageNo() % 2 === 0) {
      pushSheet({ kind: 'blank', pageNumber: currentPageNo() })
    }
  }

  for (const poem of poems) {
    ensureRecto()
    const startPage = currentPageNo()
    const startSheet = sheets.length
    const stanzas = splitStanzas(poem.lines)
    // First page: title + up to MAX_STANZAS_FIRST_PAGE stanzas
    const firstChunk = stanzas.slice(0, MAX_STANZAS_FIRST_PAGE)
    pushSheet({
      kind: 'poem',
      poemId: poem.id,
      poemTitle: poem.title,
      isFirstPage: true,
      stanzas: firstChunk,
      pageNumber: currentPageNo(),
    })
    const rest = stanzas.slice(MAX_STANZAS_FIRST_PAGE)
    for (const group of chunk(rest, MAX_STANZAS_CONT_PAGE)) {
      pushSheet({
        kind: 'poem',
        poemId: poem.id,
        poemTitle: poem.title,
        isFirstPage: false,
        stanzas: group,
        pageNumber: currentPageNo(),
      })
    }
    index.set(poem.id, {
      poemId: poem.id,
      title: poem.title,
      startPage,
      sheetIndex: startSheet,
    })
  }

  return { sheets, index }
}

export const book = buildBook()

/**
 * The book is rendered as spreads (left+right page).
 * Spread 0 = sheets[0] alone on the right (book just opening, cover on left).
 * Spread n (n>=1) = sheets[2n-1] (left, verso) and sheets[2n] (right, recto).
 *
 * Simpler model: pair sheets into spreads.
 *  - Spread 0: { left: null, right: sheet[0] }  → page 1 alone (book opening)
 *  - Spread 1: { left: sheet[1], right: sheet[2] }
 *  - Spread 2: { left: sheet[3], right: sheet[4] }
 *  - ...
 */
export interface Spread {
  index: number
  left: Sheet | null
  right: Sheet | null
}

export function getSpreads(sheets: Sheet[]): Spread[] {
  const spreads: Spread[] = []
  // Spread 0: only the right page (page 1, half-title)
  spreads.push({ index: 0, left: null, right: sheets[0] ?? null })
  let i = 1
  while (i < sheets.length) {
    spreads.push({
      index: spreads.length,
      left: sheets[i] ?? null,
      right: sheets[i + 1] ?? null,
    })
    i += 2
  }
  return spreads
}

export const spreads = getSpreads(book.sheets)

/** Find the spread that contains a given sheet index. */
export function spreadIndexForSheet(sheetIndex: number): number {
  // Sheet 0 → spread 0 (right page)
  // Sheets 1..2 → spread 1
  // Sheets 3..4 → spread 2
  if (sheetIndex === 0) return 0
  return Math.floor((sheetIndex - 1) / 2) + 1
}

/** Find the spread that contains the start of a poem. */
export function spreadIndexForPoem(poemId: number): number | null {
  const entry = book.index.get(poemId)
  if (!entry) return null
  return spreadIndexForSheet(entry.sheetIndex)
}

/** Find the spread that contains the first TOC sheet. */
export function tocSpreadIndex(): number {
  const idx = book.sheets.findIndex((s) => s.kind === 'toc')
  if (idx < 0) return 0
  return spreadIndexForSheet(idx)
}

/** Re-export poems so consumers can use both pagination helpers and raw data. */
export { poems, type Poem }
