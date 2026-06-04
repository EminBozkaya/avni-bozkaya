/* eslint-disable */
/**
 * Word belgesini KAYNAK kabul eder ve src/data/poems.ts içindeki şiirleri
 * (başlık + lines dizisi) ona göre günceller.
 *
 * Adımlar:
 *  1) scripts/docx-extract.txt'i oku (extract_docx.cjs çıktısı).
 *  2) Her şiirin başlık + içeriğini ayıkla.
 *  3) Mevcut poems.ts ile sıralı eşleştir; farklıları güncelle.
 *  4) poems.ts'i yeniden yaz (interface + dizi).
 *  5) Hangi şiirde ne değişti, raporla.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POEMS_TS = path.join(ROOT, 'src', 'data', 'poems.ts');
const EXTRACT = path.join(ROOT, 'scripts', 'docx-extract.txt');

// ─── 1) Yükle ─────────────────────────────────────────────────────────
const tsText = fs.readFileSync(POEMS_TS, 'utf8');
const arrMatch = tsText.match(/export const poems\s*:\s*Poem\[\]\s*=\s*(\[[\s\S]*?\])\s*\n\s*$/m);
if (!arrMatch) { console.error('poems.ts dizisi bulunamadı'); process.exit(1); }
// eslint-disable-next-line no-eval
const oldPoems = eval(arrMatch[1]);
console.log(`Eski poems.ts: ${oldPoems.length} şiir`);

const extract = fs.readFileSync(EXTRACT, 'utf8').split('\n');

// ─── 2) Şiir başlarını bul (başlık + ardından ——— gelen satırlar) ────
const PAGEBREAK = '<<PAGEBREAK>>';
const SEP = '———';
const isContinuation = (s) => /^— .* \(devamı\) —$/.test(s);

const poemStarts = [];
for (let i = 0; i < extract.length; i++) {
  const line = extract[i];
  if (line === '' || line === PAGEBREAK || line === SEP) continue;
  if (isContinuation(line)) continue;
  // sonraki boş olmayanlar ——— mı?
  let j = i + 1;
  while (j < extract.length && extract[j] === '') j++;
  if (extract[j] === SEP) {
    if (line === 'Ön Söz' || line === 'Fihrist' || line === 'Güldalı') continue;
    poemStarts.push({ titleIdx: i, title: line });
  }
}

if (poemStarts.length !== oldPoems.length) {
  console.error(`Beklenen ${oldPoems.length}, bulunan ${poemStarts.length} şiir başlığı`);
  poemStarts.forEach((p, i) => console.error(`  ${i+1}. ${p.title}`));
  process.exit(1);
}

// ─── 3) Her şiir için içerik satırlarını topla ────────────────────────
function cleanContent(rawLines) {
  // <<PAGEBREAK>>, (devamı) başlıkları, ——— ayraçları at
  let out = rawLines.filter((l) => {
    if (l === PAGEBREAK) return false;
    if (l === SEP) return false;
    if (isContinuation(l)) return false;
    return true;
  });
  // Birden fazla ardışık boşu tek boşa indir; baş/son boşları kırp
  const collapsed = [];
  let prevBlank = false;
  for (const l of out) {
    if (l === '') {
      if (!prevBlank && collapsed.length > 0) collapsed.push('');
      prevBlank = true;
    } else {
      collapsed.push(l);
      prevBlank = false;
    }
  }
  while (collapsed.length && collapsed[collapsed.length - 1] === '') collapsed.pop();
  return collapsed;
}

const newPoems = [];
for (let i = 0; i < poemStarts.length; i++) {
  const titleIdx = poemStarts[i].titleIdx;
  // ——— ayracını bul, içerik ondan sonra başlar
  let sepIdx = titleIdx + 1;
  while (extract[sepIdx] !== SEP) sepIdx++;
  const contentStart = sepIdx + 1;
  const contentEnd = i + 1 < poemStarts.length ? poemStarts[i + 1].titleIdx : extract.length;
  const raw = extract.slice(contentStart, contentEnd);
  const content = cleanContent(raw);

  const oldPoem = oldPoems[i];
  newPoems.push({
    id: oldPoem.id,
    title: poemStarts[i].title,
    page: oldPoem.page,
    lines: content,
  });
}

// ─── 4) Diff raporu ───────────────────────────────────────────────────
let titleChanges = 0, lineChanges = 0;
const diffReport = [];
for (let i = 0; i < newPoems.length; i++) {
  const o = oldPoems[i];
  const n = newPoems[i];
  const titleDiff = o.title !== n.title;
  const linesDiff = JSON.stringify(o.lines) !== JSON.stringify(n.lines);
  if (titleDiff) titleChanges++;
  if (linesDiff) lineChanges++;
  if (titleDiff || linesDiff) {
    diffReport.push({ id: o.id, oldTitle: o.title, newTitle: n.title, titleDiff, linesDiff });
  }
}

// ─── 5) poems.ts'i yeniden yaz ────────────────────────────────────────
function tsString(s) {
  // tek-tırnak içine al, ters eğik ve tek-tırnağı kaçışla
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const out = [];
out.push("export interface Poem {");
out.push("  id: number");
out.push("  title: string");
out.push("  page: number");
out.push("  lines: string[]");
out.push("}");
out.push("");
out.push("export const poems: Poem[] = [");
for (const p of newPoems) {
  out.push("  {");
  out.push(`    id: ${p.id},`);
  out.push(`    title: ${tsString(p.title)},`);
  out.push(`    page: ${p.page},`);
  out.push("    lines: [");
  for (const l of p.lines) {
    out.push(`      ${tsString(l)},`);
  }
  out.push("    ],");
  out.push("  },");
}
out.push("]");
out.push("");

fs.writeFileSync(POEMS_TS, out.join('\n'), 'utf8');

// ─── 6) Rapor ─────────────────────────────────────────────────────────
console.log(`\n=== Güncelleme Raporu ===`);
console.log(`Başlık değişikliği : ${titleChanges} şiir`);
console.log(`İçerik değişikliği : ${lineChanges} şiir`);
console.log(`Toplam değişen     : ${diffReport.length} şiir`);
console.log();
for (const d of diffReport) {
  const tag = [];
  if (d.titleDiff) tag.push('BAŞLIK');
  if (d.linesDiff) tag.push('İÇERİK');
  console.log(`  id=${d.id} [${tag.join('+')}]  "${d.oldTitle}"${d.titleDiff ? ` → "${d.newTitle}"` : ''}`);
}
console.log(`\npoems.ts yazıldı.`);
