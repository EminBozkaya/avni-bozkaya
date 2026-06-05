/* eslint-disable */
/**
 * poems.ts'i kaynak alarak SEO icerigini eslestirir:
 *   1) public/sitemap.xml — tum siirler icin <url> bloklari (temiz URL + trailing slash)
 *   2) index.html — JSON-LD hasPart dizisi ve <noscript> <ol> fihristi
 *
 * Her yeni siir ekledikten sonra:
 *   node scripts/sync-seo-content.cjs
 *
 * Anahtar kelime listesi (<meta name="keywords">) elle korunuyor — bilincli karar.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POEMS_TS = path.join(ROOT, 'src', 'data', 'poems.ts');
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const INDEX_HTML = path.join(ROOT, 'index.html');
const SITE = 'https://avnibozkaya.com';
const TODAY = new Date().toISOString().slice(0, 10);

const TR_MAP = {
  'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i',
  'ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u',
  'â':'a','Â':'a','î':'i','Î':'i','û':'u','Û':'u',
};

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] || ch)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Siirleri yukle ---
const tsSrc = fs.readFileSync(POEMS_TS, 'utf8');
const m = tsSrc.match(/export const poems\s*:\s*Poem\[\]\s*=\s*(\[[\s\S]*?\])\s*\n\s*$/m);
if (!m) {
  console.error('poems.ts okunamadi.');
  process.exit(1);
}
const poems = eval(m[1]).map((p) => ({
  ...p,
  slug: toSlug(p.title.trim()),
  cleanTitle: p.title.trim(),
}));

console.log(`Toplam ${poems.length} siir yuklendi.`);

// --- 1) sitemap.xml ---
function rebuildSitemap() {
  const xml = fs.readFileSync(SITEMAP, 'utf8');

  // Ana sayfa <url> blogunu koru (ilk <url>...</url>)
  const homeMatch = xml.match(/(<url>[\s\S]*?<loc>https:\/\/avnibozkaya\.com\/<\/loc>[\s\S]*?<\/url>)/);
  if (!homeMatch) {
    console.error('sitemap.xml ana sayfa blogu bulunamadi.');
    process.exit(1);
  }
  // Ana sayfanin lastmod'unu bugune getir
  const homeBlock = homeMatch[1].replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${TODAY}</lastmod>`);

  // Header (xml decl + stylesheet + urlset opening)
  const headerMatch = xml.match(/^([\s\S]*?<urlset[^>]*>)/);
  const header = headerMatch[1];

  // Her siir icin <url> uret
  const poemBlocks = poems.map((p) => {
    const url = `${SITE}/siir/${p.slug}/`;
    return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const out = `${header}\n  ${homeBlock}\n${poemBlocks}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP, out, 'utf8');
  console.log(`✓ sitemap.xml: 1 ana sayfa + ${poems.length} siir`);
}

// --- 2) index.html: JSON-LD hasPart ve noscript fihrist ---
function rebuildIndexHtml() {
  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  // 2a) JSON-LD hasPart dizisini yeniden uret
  const hasPartArr = poems.map((p, i) => ({
    '@type': 'CreativeWork',
    name: p.cleanTitle,
    url: `${SITE}/siir/${p.slug}/`,
    position: i + 1,
  }));
  const hasPartJson = hasPartArr
    .map((e) => `            {"@type":"CreativeWork","name":${JSON.stringify(e.name)},"url":"${e.url}","position":${e.position}}`)
    .join(',\n');

  // hasPart: [ ... ] blogunu degistir (gevsek regex, dort bosluk girintili)
  const hasPartBefore = html.length;
  html = html.replace(
    /"hasPart":\s*\[[\s\S]*?\n\s{10}\]/,
    `"hasPart": [\n${hasPartJson}\n          ]`
  );
  if (html.length === hasPartBefore) {
    console.error('UYARI: JSON-LD hasPart blogu degistirilemedi (regex eslesmedi).');
  } else {
    console.log(`✓ index.html: JSON-LD hasPart (${poems.length} siir)`);
  }

  // 2b) <noscript> icinde fihrist <ol>...</ol> blogunu degistir
  const olItems = poems.map((p) => {
    return `              <li><a href="/siir/${p.slug}/">${escapeHtml(p.cleanTitle)}</a></li>`;
  }).join('\n');

  const olBefore = html.length;
  html = html.replace(
    /<ol>\s*\n[\s\S]*?<\/ol>/,
    `<ol>\n${olItems}\n            </ol>`
  );
  if (html.length === olBefore) {
    console.error('UYARI: noscript <ol> fihristi degistirilemedi (regex eslesmedi).');
  } else {
    console.log(`✓ index.html: <noscript> fihristi (${poems.length} link)`);
  }

  fs.writeFileSync(INDEX_HTML, html, 'utf8');
}

rebuildSitemap();
rebuildIndexHtml();

console.log('\nTamamlandi. Asagidaki adimlar onerilir:');
console.log('  1) git diff ile degisikligi gozden gecir');
console.log('  2) npm run build');
console.log('  3) Deploy sonrasi Google Search Console > Sitemaps > Yeniden Gonder');
