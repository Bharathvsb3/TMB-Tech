# TMB Tech — Company Website

A static, fully responsive marketing website for **TMB Tech**, a software and technology company building business applications, mobile applications, ERP systems, web applications and custom software solutions.

Built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no build step, no dependencies. Works by opening `index.html` directly, and is ready to deploy on **GitHub Pages** as-is.

## Structure

```text
tmb-tech/
│
├── index.html          Main page (all sections)
├── sitemap.xml          Lists the homepage and each product page for search engines
├── robots.txt            Allows crawling, points to sitemap.xml
├── css/
│   └── style.css       All styling, CSS variables for theming
├── js/
│   └── script.js       Navigation, scroll reveal, modals, parallax, contact form
│
├── products/            One real page per product (own URL, title, meta, JSON-LD)
│   ├── ledgo-erp/index.html
│   ├── gasone/index.html
│   └── jb-one/index.html
│
├── assets/
│   ├── logo/           Real TMB Tech logo (lockup + favicon, cropped from the source artwork)
│   ├── products/       Real app icons for LedGo ERP, GasOne and JB One
│   ├── projects/       Reserved for real project screenshots
│   └── icons/          Reserved for any additional icon assets
│
└── README.md
```

## Sections

Home · Products (LedGo ERP, GasOne, JB One) · Solutions · Projects (Gro Shipper, Gro Fleet, Timekeeper Console, Stellar) · Technologies · How We Build · About · Contact.

## Theming

Colours are controlled through CSS variables at the top of `css/style.css`:

```css
:root {
  --primary: #2563eb;
  --text: #111827;
  --muted: #6b7280;
  --background: #ffffff;
  --surface: #f8fafc;
  --border: #e5e7eb;
}
```

Change `--primary` to re-theme the whole site.

## Logo assets

`assets/logo/` contains:

- `logo-source.png` — the original full artwork (icon + wordmark + tagline), kept for reference.
- `logo.png` — header/footer lockup (icon + "Tech" wordmark, tagline cropped out since the tagline is already set as real text in the footer). Referenced by the two `<img class="logo-img">` tags in `index.html`.
- `favicon.png` — the "TMB" icon mark only, isolated by colour from the "Tech" text and padded to a square canvas. Referenced by `<link rel="icon">` in `<head>`.

To swap in a revised logo later, replace these files (or update the `src`/`href` in `index.html` if the filenames change).

## Contact links

Phone, Email, GitHub and LinkedIn in the Contact section are all live, and the Contact form builds a pre-filled `mailto:` link on submit (validated client-side) rather than claiming to send anything itself, since a static site has no backend to send from.

## Product logos

`assets/products/` holds the real app icons for each product (`ledgo.png`, `gasone.png`, `jbone.png`), sourced from each app's own launcher-icon artwork and resized for the web. They're used on the product cards and on each product's own detail page.

`assets/projects/` is still empty — no real screenshots were available for the Projects section, so those cards use simple drawn illustrations instead. Real screenshots can be dropped in and referenced from the project cards in `index.html` at any time.

## Product pages & SEO

Each product (LedGo ERP, GasOne, JB One) has its own real page under `products/<slug>/index.html`, with its own `<title>`, meta description, canonical URL, and `SoftwareApplication` JSON-LD — instead of only living in a JS modal. This is what lets Google potentially index or sitelink them individually. The "Learn More" buttons on the homepage link straight to these pages now; the in-page modal is still used for the Projects section, which doesn't have dedicated pages.

`index.html` also carries `Organization` and `ItemList`/`SoftwareApplication` JSON-LD for the homepage itself, plus `sitemap.xml` and `robots.txt` at the repo root. All of it points at the live URL `https://bharathvsb3.github.io/TMB-Tech/` — if the site ever moves to a custom domain, that URL needs updating in: every `<link rel="canonical">`, every `og:url`/`og:image`/`twitter:image`, every JSON-LD block (there's one in `index.html` and one in each product page), and both `sitemap.xml` and `robots.txt`.

Structured data and a sitemap only tell Google what's on the site — they don't guarantee rich results, sitelinks, or any particular search appearance. That's still entirely Google's call. After deploying, submit the site and `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) and use its URL Inspection tool to request indexing of the new product pages.

## Deploying to GitHub Pages

This site is already live at **https://bharathvsb3.github.io/TMB-Tech/** via GitHub Pages on the `main` branch. To redeploy elsewhere:

1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** for the `main` branch (root).
3. The site will be available at `https://<username>.github.io/<repo>/`.

No build tools, Node.js, or server are required.
