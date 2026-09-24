<?xml version="1.0" encoding="UTF-8"?>
<!-- Makes sitemap.xml readable when opened in a browser. Search engines ignore this file. -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex"/>
  <title>Sitemap | TMB Tech</title>
  <link rel="icon" type="image/png" href="assets/logo/favicon-48.png"/>
  <style>
    :root { --p:#2563eb; --deep:#0b2559; --text:#111827; --muted:#5b6475; --line:#e5e9f2; --bg:#f4f7fc; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: "Segoe UI", Inter, system-ui, -apple-system, sans-serif; color:var(--text); background:var(--bg); line-height:1.55; }
    header { background: radial-gradient(120% 140% at 10% 0%, #14428f 0%, #0b2559 55%, #061534 100%); color:#fff; padding:40px 20px 48px; }
    .wrap { max-width:1080px; margin:0 auto; }
    header img { height:44px; background:#fff; padding:8px 14px; border-radius:12px; box-sizing:content-box; display:block; margin-bottom:22px; }
    h1 { margin:0 0 8px; font-size:2rem; letter-spacing:-.01em; }
    header p { margin:0; color:#bcd0f2; max-width:640px; }
    .stats { display:flex; flex-wrap:wrap; gap:10px; margin-top:20px; }
    .stat { padding:8px 14px; border-radius:999px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); font-weight:700; font-size:.9rem; }
    main { max-width:1080px; margin:-24px auto 60px; padding:0 20px; }
    .card { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 30px 60px -44px rgba(11,37,89,.5); overflow:hidden; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:14px 18px; font-size:.74rem; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); background:#f8faff; border-bottom:1px solid var(--line); }
    td { padding:16px 18px; border-top:1px solid var(--line); vertical-align:top; }
    tr:first-child td { border-top:0; }
    td a { color:var(--p); font-weight:700; text-decoration:none; word-break:break-all; }
    td a:hover { text-decoration:underline; }
    .thumbs { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .thumbs a { display:block; width:56px; height:40px; border-radius:8px; overflow:hidden; border:1px solid var(--line); background:#f1f4fa; }
    .thumbs img { width:100%; height:100%; object-fit:cover; display:block; }
    .pill { display:inline-block; padding:3px 10px; border-radius:999px; font-size:.78rem; font-weight:700; background:#eaf1ff; color:#1d4fd8; }
    .num { white-space:nowrap; color:var(--muted); font-size:.9rem; }
    footer { text-align:center; color:var(--muted); font-size:.85rem; padding:0 20px 40px; }
    footer a { color:var(--p); text-decoration:none; font-weight:600; }
    @media (max-width:720px) { .hide-sm { display:none; } th, td { padding:12px 12px; } h1 { font-size:1.6rem; } }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <img src="assets/logo/logo.png" alt="TMB Tech"/>
      <h1>Sitemap</h1>
      <p>Every page on the TMB Tech website, with the images search engines can show for it.</p>
      <div class="stats">
        <span class="stat"><xsl:value-of select="count(sm:urlset/sm:url)"/> pages</span>
        <span class="stat"><xsl:value-of select="count(sm:urlset/sm:url/image:image)"/> images</span>
      </div>
    </div>
  </header>
  <main>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th class="hide-sm">Updated</th>
            <th class="hide-sm">Refresh</th>
            <th class="hide-sm">Priority</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sm:urlset/sm:url">
            <tr>
              <td>
                <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                <xsl:if test="image:image">
                  <div class="thumbs">
                    <xsl:for-each select="image:image">
                      <a href="{image:loc}" title="{image:loc}"><img src="{image:loc}" alt="" loading="lazy"/></a>
                    </xsl:for-each>
                  </div>
                </xsl:if>
              </td>
              <td class="num hide-sm"><xsl:value-of select="sm:lastmod"/></td>
              <td class="hide-sm"><span class="pill"><xsl:value-of select="sm:changefreq"/></span></td>
              <td class="num hide-sm"><xsl:value-of select="sm:priority"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </main>
  <footer>
    <a href="https://bharathvsb3.github.io/TMB-Tech/">TMB Tech</a> · bharathvsb3@gmail.com · +91 75503 56255
  </footer>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
