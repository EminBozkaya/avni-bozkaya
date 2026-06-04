/* eslint-disable */
/**
 * Tüm şiirleri tek bir düz metin dosyasına yazar.
 * Sadece şiirler — fihrist / ön söz yok.
 * Her şiir: başlık, ardından içerik (notlar, tarihler, imza dâhil).
 * Şiirler arasında belirgin boşluk.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POEMS_TS = path.join(ROOT, 'src', 'data', 'poems.ts');
const OUT = path.join(ROOT, 'Guldali-Siirler.txt');

const ts = fs.readFileSync(POEMS_TS, 'utf8');
const m = ts.match(/export const poems\s*:\s*Poem\[\]\s*=\s*(\[[\s\S]*?\])\s*\n\s*$/m);
// eslint-disable-next-line no-eval
const poems = eval(m[1]);

const SEP = '\n\n\n\n' + '═'.repeat(60) + '\n\n\n\n';
const out = [];

out.push('GÜLDALI');
out.push('Şiirler — Avni Bozkaya');
out.push('');
out.push('═'.repeat(60));

for (const p of poems) {
  out.push(SEP.replace(/^\n+|\n+$/g, '\n\n\n'));
  out.push(p.title.toLocaleUpperCase('tr-TR'));
  out.push('');
  for (const line of p.lines) out.push(line);
}

fs.writeFileSync(OUT, out.join('\n') + '\n', 'utf8');
console.log(`Yazıldı: ${OUT} (${poems.length} şiir)`);
