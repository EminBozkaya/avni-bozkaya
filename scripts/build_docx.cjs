/* eslint-disable */
/**
 * Güldalı — Şiir Kitabı Word (.docx) Üretici
 *
 * Web sitesindeki e-kitap düzenini birebir mirror eder:
 *   - Sayfa 1: Yarım başlık (Şiirler / Güldalı / Avni Bozkaya)
 *   - Sayfa 2: Boş (gül motifi watermark)
 *   - Sayfa 3+: Ön Söz (3 sayfa)
 *   - Sonra: Fihrist (TOC) - şiir başlıklarıyla, sayfa numaralarıyla
 *   - Her şiir bir tek sayı (recto) sayfada başlar; gerekirse araya boş sayfa
 *   - Şiirler 1+ sayfa uzar; devam sayfalarında "(devamı)" başlığı
 *   - Tarih, imza, intro/closing notları korunur
 *   - Sayfa numaraları, gül motifleri (ornament / watermark) yerleştirilir
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  Header, Footer, AlignmentType, PageOrientation,
  HeadingLevel, BorderStyle, PageNumber, PageBreak,
  TabStopType, TabStopPosition, LineRuleType,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const POEMS_TS = path.join(ROOT, 'src', 'data', 'poems.ts');
const ROSE_PNG = path.join(ROOT, 'public', 'images', 'rose_motif.png');
const OUTPUT = path.join(ROOT, 'Guldali-Siir-Kitabi.docx');

// ─── Poems yükleme (poems.ts → JS array) ──────────────────────────────
function loadPoems() {
  const ts = fs.readFileSync(POEMS_TS, 'utf8');
  const m = ts.match(/export const poems\s*:\s*Poem\[\]\s*=\s*(\[[\s\S]*?\])\s*\n\s*$/m);
  if (!m) throw new Error('poems.ts içindeki poems array bulunamadı');
  // eslint-disable-next-line no-eval
  const arr = eval(m[1]);
  return arr;
}

// ─── Paginate (paginate.ts'in JS portu) ───────────────────────────────
const FORCED_INTRO_NOTE_IDS = new Set([52, 46]);
const SANS_INTRO_NOTE_IDS = new Set([46]);

const MAX_STANZAS_FIRST_PAGE = 2;
const MAX_STANZAS_CONT_PAGE = 3;
const TOC_FIRST_PAGE_ITEMS = 8;
const TOC_CONT_PAGE_ITEMS = 10;

const FOREWORD_PAGES = [
  [
    'Bu eser, ömrünü ilme, insan yetiştirmeye ve güzel ahlâka adamış kıymetli eğitimci ve şair Avni Bozkaya’nın gönül dünyasından süzülen şiirlerden oluşmaktadır. “Güldalı” mahlasıyla kaleme aldığı bu dizelerde; memleket sevgisi, anne hasreti, gençlere nasihat, insan sevgisi ve Hak aşkı içten bir üslupla hayat bulmaktadır.',
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
];

function isMetaLine(line) {
  return /\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(line) || /bozkaya/i.test(line);
}

function splitClosing(lines) {
  let lastMeta = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isMetaLine(lines[i])) { lastMeta = i; break; }
  }
  if (lastMeta === -1) return { body: lines, closing: [] };
  let lastVerse = -1;
  for (let i = lastMeta - 1; i >= 0; i--) {
    if (lines[i] !== '' && !isMetaLine(lines[i])) { lastVerse = i; break; }
  }
  const start = lastVerse + 1;
  return { body: lines.slice(0, start), closing: lines.slice(start) };
}

function extractIntroNote(lines, title, forced) {
  let i = 0;
  while (i < lines.length && lines[i] === '') i++;
  const first = lines[i] ?? '';
  const looksLikeNote = forced || first.startsWith('(') || first.length > 70;
  if (!looksLikeNote) return { introNote: '', rest: lines };
  let j = i;
  while (j < lines.length && lines[j] !== '') j++;
  let noteLines = lines.slice(i, j);
  if (noteLines.length > 1 && noteLines.every((l) => l.startsWith('(') && l.endsWith(')'))) {
    noteLines = noteLines.map((l) => l.slice(1, -1));
  }
  let k = j;
  while (k < lines.length && lines[k] === '') k++;
  const rest = lines.slice(0, i).concat(lines.slice(k));
  const stripped = first.replace(/[()]/g, '').trim();
  const isTitleDup = stripped.length > 0 && title.includes(stripped);
  return { introNote: isTitleDup ? '' : noteLines.join('\n'), rest };
}

function splitStanzas(lines) {
  const stanzas = [];
  let current = [];
  for (const ln of lines) {
    if (ln === '') {
      if (current.length) { stanzas.push(current); current = []; }
    } else {
      current.push(ln);
    }
  }
  if (current.length) stanzas.push(current);
  return stanzas;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildBook(poems) {
  const sheets = [];
  const index = new Map();
  const push = (s) => sheets.push(s);
  const cur = () => sheets.length + 1;

  push({ kind: 'half-title', pageNumber: cur() });
  push({ kind: 'blank', pageNumber: cur() });

  for (let i = 0; i < FOREWORD_PAGES.length; i++) {
    push({ kind: 'foreword', paragraphs: FOREWORD_PAGES[i], isFirstPage: i === 0, pageNumber: cur() });
  }

  if (cur() % 2 === 0) push({ kind: 'blank', pageNumber: cur() });

  const totalPoems = poems.length;
  let placed = 0;
  while (placed < totalPoems) {
    const isFirst = placed === 0;
    const capacity = isFirst ? TOC_FIRST_PAGE_ITEMS : TOC_CONT_PAGE_ITEMS;
    const items = Math.min(capacity, totalPoems - placed);
    push({ kind: 'toc', tocStart: placed, tocCount: items, pageNumber: cur() });
    placed += items;
  }

  const ensureRecto = () => { if (cur() % 2 === 0) push({ kind: 'blank', pageNumber: cur() }); };

  for (const poem of poems) {
    ensureRecto();
    const startPage = cur();
    const { introNote, rest } = extractIntroNote(poem.lines, poem.title, FORCED_INTRO_NOTE_IDS.has(poem.id));
    const { body, closing } = splitClosing(rest);
    const verseStanzas = splitStanzas(body);
    const closingNote = closing.filter((l) => l !== '' && !isMetaLine(l)).join(' ');
    const closingStanzas = splitStanzas(closing.filter((l) => l === '' || isMetaLine(l)));

    const pages = [];
    if (verseStanzas.length === 0) pages.push([]);
    else {
      pages.push(verseStanzas.slice(0, MAX_STANZAS_FIRST_PAGE));
      for (const group of chunk(verseStanzas.slice(MAX_STANZAS_FIRST_PAGE), MAX_STANZAS_CONT_PAGE)) pages.push(group);
    }
    if (closingStanzas.length) pages[pages.length - 1] = pages[pages.length - 1].concat(closingStanzas);

    pages.forEach((stanzas, idx) => {
      push({
        kind: 'poem',
        poemId: poem.id,
        poemTitle: poem.title,
        isFirstPage: idx === 0,
        stanzas,
        pageNumber: cur(),
        introNote: idx === 0 ? introNote : '',
        introNoteSans: idx === 0 && SANS_INTRO_NOTE_IDS.has(poem.id),
        closingNote: idx === pages.length - 1 ? closingNote : '',
      });
    });
    index.set(poem.id, { poemId: poem.id, title: poem.title, startPage });
  }
  return { sheets, index };
}

// ─── DOCX Rendering ────────────────────────────────────────────────────

// Page geometry — A5 (5.83" × 8.27") = 8419 × 11906 DXA
const PAGE_W = 8419;
const PAGE_H = 11906;
const MARGIN = 1080;       // 0.75"
const CONTENT_W = PAGE_W - MARGIN * 2;

// Fonts
const SERIF = 'Cambria';
const BODY  = 'Cambria';   // serif body — feels closer to the site's serif poem text
const SANS  = 'Calibri';

// Helpers
const roseData = fs.readFileSync(ROSE_PNG);

function blank() {
  return new Paragraph({ children: [new TextRun({ text: '' })] });
}
function spacer(pts) {
  // empty paragraph with explicit size (half-points)
  return new Paragraph({ children: [new TextRun({ text: '', size: pts * 2 })] });
}

function pageBreakPara() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Render a single sheet into an array of paragraphs.
// firstSheet=false → prepend a page break.
function renderSheet(sheet, sheetIndex, bookIndex) {
  const paras = [];
  const breakBefore = sheetIndex > 0;

  // helper to add `pageBreakBefore` to first paragraph
  const withBreak = (p) => {
    if (breakBefore && paras.length === 0) {
      // mutate: docx-js Paragraph accepts pageBreakBefore at construction.
      // We re-emit by wrapping; simpler: prepend a PageBreak para.
    }
    return p;
  };

  if (breakBefore) paras.push(pageBreakPara());

  if (sheet.kind === 'half-title') {
    paras.push(spacer(80));
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ŞİİRLER', font: BODY, italics: true, size: 22, color: '7a6a55', characterSpacing: 60 })],
      spacing: { after: 240 },
    }));
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Güldalı', font: SERIF, size: 96, color: '2c1810' })],
      spacing: { after: 240 },
    }));
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '———', font: SERIF, color: '7a6a55', size: 24 })],
      spacing: { after: 200 },
    }));
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'AVNİ BOZKAYA', font: BODY, size: 22, color: '5a4a35', characterSpacing: 120 })],
    }));
    return paras;
  }

  if (sheet.kind === 'blank') {
    // Center the rose watermark image in the middle of the page.
    paras.push(spacer(120));
    paras.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        type: 'png',
        data: roseData,
        transformation: { width: 240, height: 288 },
        altText: { title: 'Gül motifi', description: 'Gül motifi', name: 'rose' },
      })],
    }));
    return paras;
  }

  if (sheet.kind === 'foreword') {
    if (sheet.isFirstPage) {
      paras.push(spacer(40));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Ön Söz', font: SERIF, size: 60, color: '2c1810' })],
        spacing: { after: 120 },
      }));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '———', font: SERIF, color: '7a6a55', size: 22 })],
        spacing: { after: 400 },
      }));
    } else {
      paras.push(spacer(60));
    }
    for (const para of sheet.paragraphs) {
      paras.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 360 },
        spacing: { after: 200, line: 320, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ text: para, font: BODY, size: 22, color: '2c1810' })],
      }));
    }
    return paras;
  }

  if (sheet.kind === 'toc') {
    if (sheet.tocStart === 0) {
      paras.push(spacer(40));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Fihrist', font: SERIF, size: 60, color: '2c1810' })],
        spacing: { after: 120 },
      }));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '———', font: SERIF, color: '7a6a55', size: 22 })],
        spacing: { after: 400 },
      }));
    } else {
      paras.push(spacer(40));
    }
    const items = sheet.tocItems; // populated by caller
    for (const it of items) {
      paras.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: 'dot' }],
        spacing: { after: 100, line: 300, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({ text: it.title, font: BODY, size: 22, color: '2c1810' }),
          new TextRun({ text: '\t' + String(it.page), font: BODY, size: 20, color: '5a4a35' }),
        ],
      }));
    }
    return paras;
  }

  if (sheet.kind === 'poem') {
    if (sheet.isFirstPage) {
      paras.push(spacer(30));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: sheet.poemTitle, font: SERIF, size: 44, color: '2c1810' })],
        spacing: { after: 80 },
      }));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '———', font: SERIF, color: '7a6a55', size: 18 })],
        spacing: { after: 320 },
      }));
    } else {
      paras.push(spacer(30));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `— ${sheet.poemTitle} (devamı) —`, font: BODY, italics: true, size: 20, color: '7a6a55' })],
        spacing: { after: 320 },
      }));
    }

    if (sheet.introNote) {
      for (const line of sheet.introNote.split('\n')) {
        paras.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80, line: 280, lineRule: LineRuleType.AUTO },
          children: [new TextRun({
            text: line,
            font: sheet.introNoteSans ? SANS : BODY,
            italics: !sheet.introNoteSans,
            size: 19,
            color: '5a4a35',
          })],
        }));
      }
      paras.push(spacer(8));
    }

    // Stanzas — centered, blank line between stanzas
    sheet.stanzas.forEach((stanza, si) => {
      stanza.forEach((line, li) => {
        // Detect date / signature lines and render them slightly italic & smaller
        const meta = isMetaLine(line);
        paras.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40, line: 320, lineRule: LineRuleType.AUTO },
          children: [new TextRun({
            text: line,
            font: BODY,
            size: meta ? 20 : 24,
            italics: meta,
            color: meta ? '5a4a35' : '2c1810',
          })],
        }));
      });
      if (si < sheet.stanzas.length - 1) paras.push(spacer(8));
    });

    if (sheet.closingNote) {
      paras.push(spacer(6));
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 280, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ text: sheet.closingNote, font: BODY, italics: true, size: 19, color: '5a4a35' })],
      }));
    }

    return paras;
  }

  return paras;
}

// ─── Main ──────────────────────────────────────────────────────────────
function main() {
  const poems = loadPoems();
  console.log(`Yüklenen şiir sayısı: ${poems.length}`);
  const book = buildBook(poems);
  console.log(`Toplam sayfa (sheet): ${book.sheets.length}`);

  // Inject TOC items per page (so each TOC sheet has its slice + page numbers)
  for (const sheet of book.sheets) {
    if (sheet.kind === 'toc') {
      sheet.tocItems = poems.slice(sheet.tocStart, sheet.tocStart + sheet.tocCount).map((p) => ({
        title: p.title,
        page: book.index.get(p.id)?.startPage ?? p.page,
      }));
    }
  }

  // Render all paragraphs
  const allParas = [];
  book.sheets.forEach((sheet, idx) => {
    const paras = renderSheet(sheet, idx, book.index);
    allParas.push(...paras);
  });

  const doc = new Document({
    creator: 'Avni Bozkaya',
    title: 'Güldalı — Şiirler',
    description: 'Güldalı (Avni Bozkaya) şiir kitabı — baskıya hazır Word düzeni.',
    styles: {
      default: { document: { run: { font: BODY, size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.PORTRAIT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 540, footer: 540 },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              children: [PageNumber.CURRENT],
              font: BODY, size: 18, color: '7a6a55',
            })],
          })],
        }),
      },
      children: allParas,
    }],
  });

  Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(OUTPUT, buf);
    console.log(`Yazıldı: ${OUTPUT} (${(buf.length / 1024).toFixed(1)} KB)`);
  }).catch((e) => { console.error(e); process.exit(1); });
}

main();
