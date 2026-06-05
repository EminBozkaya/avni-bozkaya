<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" doctype-system="about:legacy-compat" indent="yes" />
  <xsl:template match="/">
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, follow" />
        <title>Güldalı — Avni Bozkaya | XML Sitemap</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&amp;family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet" />
        <style>
          :root {
            --cream: #F7F1E1;
            --cream-dark: #EFE4C9;
            --ink: #3B2A1A;
            --ink-soft: #6B533B;
            --accent: #8B5E2A;
            --line: #E2D5B6;
            --card: #FFFDF6;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%);
            color: var(--ink);
            min-height: 100vh;
            line-height: 1.6;
          }
          .wrap { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
          h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 32px;
            font-weight: 600;
            margin: 0 0 8px;
            color: var(--ink);
            letter-spacing: -0.01em;
          }
          .subtitle {
            color: var(--ink-soft);
            font-size: 14px;
            margin: 0 0 24px;
            font-style: italic;
          }
          .meta {
            display: inline-block;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 13px;
            color: var(--ink-soft);
            margin-bottom: 24px;
          }
          .meta strong { color: var(--accent); }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: var(--card);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(59, 42, 26, 0.06), 0 8px 24px rgba(59, 42, 26, 0.04);
          }
          th {
            background: var(--cream-dark);
            text-align: left;
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            color: var(--ink-soft);
            padding: 14px 16px;
            border-bottom: 1px solid var(--line);
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--ink);
            vertical-align: middle;
          }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: rgba(139, 94, 42, 0.04); }
          td.num { color: var(--ink-soft); font-variant-numeric: tabular-nums; width: 50px; }
          td.url a {
            color: var(--ink);
            text-decoration: none;
            font-weight: 500;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 14px;
          }
          td.url a:hover { color: var(--accent); text-decoration: underline; }
          td.lastmod, td.freq, td.priority {
            color: var(--ink-soft);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .img-thumb {
            width: 40px;
            height: 40px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid var(--line);
            display: block;
          }
          .img-cell { width: 56px; }
          footer {
            margin-top: 32px;
            text-align: center;
            color: var(--ink-soft);
            font-size: 12px;
            font-style: italic;
          }
          footer a { color: var(--accent); text-decoration: none; }
          footer a:hover { text-decoration: underline; }
          @media (max-width: 700px) {
            .wrap { padding: 24px 16px; }
            h1 { font-size: 24px; }
            th, td { padding: 10px 10px; font-size: 12px; }
            .img-cell, td.img-cell { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Güldalı — XML Sitemap</h1>
          <p class="subtitle">Avni Bozkaya'nın şiir kitabı — arama motorları için makine-okur dosya. Bu görünüm sadece insan içindir.</p>
          <div class="meta">
            Toplam <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /></strong> URL listelendi.
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th class="img-cell">Görsel</th>
                <th>URL</th>
                <th>Güncelleme</th>
                <th>Sıklık</th>
                <th>Öncelik</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()" /></td>
                  <td class="img-cell">
                    <xsl:if test="image:image/image:loc">
                      <img class="img-thumb" loading="lazy">
                        <xsl:attribute name="src"><xsl:value-of select="image:image/image:loc" /></xsl:attribute>
                        <xsl:attribute name="alt"><xsl:value-of select="image:image/image:title" /></xsl:attribute>
                      </img>
                    </xsl:if>
                  </td>
                  <td class="url">
                    <a>
                      <xsl:attribute name="href"><xsl:value-of select="sitemap:loc" /></xsl:attribute>
                      <xsl:value-of select="sitemap:loc" />
                    </a>
                  </td>
                  <td class="lastmod"><xsl:value-of select="sitemap:lastmod" /></td>
                  <td class="freq"><xsl:value-of select="sitemap:changefreq" /></td>
                  <td class="priority"><xsl:value-of select="sitemap:priority" /></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <footer>
            <a href="/">avnibozkaya.com</a> — Güldalı şiir kitabı | Pasinler, Erzurum
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
