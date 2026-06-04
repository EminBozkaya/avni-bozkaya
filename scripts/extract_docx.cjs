/* eslint-disable */
/**
 * Word belgesinden düz metin çıkarıcı.
 * Her <w:p> bir satır olarak, page break ve metin dışı şeyler ayıklanır.
 * Satır içindeki <w:t> içerikleri birleştirilir.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCX = path.resolve(__dirname, '..', 'Guldali-Siir-Kitabi.docx');
const OUT  = path.resolve(__dirname, '..', 'scripts', 'docx-extract.txt');

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gxtr-'));
execSync(`unzip -o "${DOCX}" -d "${tmp}"`, { stdio: 'pipe' });
const xml = fs.readFileSync(path.join(tmp, 'word', 'document.xml'), 'utf8');

// Split into paragraphs
const paras = xml.split(/<w:p[ >]/).slice(1);
const lines = [];
for (const block of paras) {
  // Check for explicit page break inside
  const hasPageBreak = /<w:br\s+w:type="page"\s*\/>/.test(block);
  // Extract all <w:t ...>TEXT</w:t> contents
  const texts = [];
  const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g;
  let m;
  while ((m = tRegex.exec(block)) !== null) {
    texts.push(m[1]);
  }
  const line = texts.join('')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  if (hasPageBreak) lines.push('<<PAGEBREAK>>');
  lines.push(line);
}

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Yazıldı: ${OUT}  (${lines.length} paragraf)`);
