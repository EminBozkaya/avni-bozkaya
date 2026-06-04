/* eslint-disable */
/**
 * Her şiir için ayrı bir HTML dosyası üretir: dist/siir/<slug>/index.html
 * Her dosya kendi <title>, <meta description>, OG/Twitter etiketleri,
 * canonical link, Poem JSON-LD ve <noscript> içinde şiir metnini barındırır.
 * Google bu sayfaları ayrı sayfalar olarak indeksleyebilir.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');
const POEMS_TS = path.join(ROOT, 'src', 'data', 'poems.ts');
const SITE = 'https://avnibozkaya.com';

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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJson(s) {
  return JSON.stringify(String(s)).slice(1, -1);
}

const tsSrc = fs.readFileSync(POEMS_TS, 'utf8');
const m = tsSrc.match(/export const poems\s*:\s*Poem\[\]\s*=\s*(\[[\s\S]*?\])\s*\n\s*$/m);
if (!m) {
  console.error('poems.ts içinden poems dizisi okunamadı.');
  process.exit(1);
}
// eslint-disable-next-line no-eval
const poems = eval(m[1]);

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('dist/index.html bulunamadı. Önce `vite build` çalıştırın.');
  process.exit(1);
}
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function buildDescription(poem) {
  // İlk anlamlı 2-3 dizeyi açıklamaya alalım.
  const lines = poem.lines
    .map((l) => l.trim())
    .filter((l) => l && !/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(l) && l !== 'Avni Bozkaya');
  const snippet = lines.slice(0, 3).join(' ');
  const base = `${poem.title} — Avni Bozkaya (Güldalı) şiiri.`;
  const tail = snippet ? ` ${snippet}` : '';
  let desc = (base + tail).replace(/\s+/g, ' ').trim();
  if (desc.length > 300) desc = desc.slice(0, 297) + '...';
  return desc;
}

function buildPoemHtml(poem) {
  const cleanTitle = poem.title.trim();
  const slug = toSlug(cleanTitle);
  const url = `${SITE}/siir/${slug}/`;
  const pageTitle = `${cleanTitle} — Avni Bozkaya (Güldalı) Şiiri | Pasinler, Erzurum`;
  const description = buildDescription(poem);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Poem',
    name: cleanTitle,
    headline: cleanTitle,
    inLanguage: 'tr',
    url,
    author: {
      '@type': 'Person',
      name: 'Avni Bozkaya',
      alternateName: 'Güldalı',
    },
    isPartOf: {
      '@type': 'Book',
      name: 'Güldalı',
      author: { '@type': 'Person', name: 'Avni Bozkaya' },
    },
    description,
  };

  const poemTextHtml = poem.lines
    .map((l) => (l.trim() === '' ? '<br/>' : escapeHtml(l)))
    .join('<br/>\n');

  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`);

  // meta description
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // canonical
  html = html.replace(
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${url}" />`
  );

  // OG title/description/url
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(cleanTitle + ' — Avni Bozkaya')}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${url}" />`
  );

  // Twitter title/description
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(cleanTitle + ' — Avni Bozkaya')}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // Şiir için ek JSON-LD — </head>'den önce ekle.
  const extraLd = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`;
  html = html.replace('</head>', extraLd);

  // <noscript> içeriği — botlar için şiir metni
  const noscriptBlock =
`<noscript>
  <article>
    <h1>${escapeHtml(cleanTitle)}</h1>
    <p><strong>Avni Bozkaya</strong> (Güldalı) — Pasinler, Erzurum</p>
    <p>${poemTextHtml}</p>
    <hr/>
    <p><a href="${SITE}/">Tüm şiirler için: Güldalı - Avni Bozkaya</a></p>
  </article>
</noscript>`;

  // Mevcut <noscript>...</noscript> bloğunu şiire özel olanla değiştir.
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptBlock);

  return { slug, html };
}

let count = 0;
for (const poem of poems) {
  const { slug, html } = buildPoemHtml(poem);
  const outDir = path.join(DIST, 'siir', slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  count++;
}

console.log(`Prerender tamamlandı: ${count} şiir sayfası üretildi (dist/siir/<slug>/index.html).`);
