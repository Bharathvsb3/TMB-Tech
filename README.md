# TMB Tech — Company Website

A static, fully responsive marketing website for **TMB Tech**, a software and technology company building business applications, mobile applications, ERP systems, web applications and custom software solutions.

Built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no build step, no dependencies. Works by opening `index.html` directly, and is ready to deploy on **GitHub Pages** as-is.

## Structure

```text
tmb-tech/
│
├── settings.json        THE one place for company name, contact details, links, site address
├── index.html          Main page (all sections)
├── sitemap.xml / .xsl   Generated from settings.json (search engines + a styled browser view)
├── robots.txt / 404.html  Generated from settings.json
├── css/
│   └── style.css       All styling, CSS variables for theming
├── js/
│   ├── script.js       Navigation, scroll reveal, modals, parallax, contact form
│   └── settings.js     Reads settings.json and fills the pages (used by every site)
├── tools/
│   ├── render.py       Generates the search-engine files from settings.json
│   └── templates/      Templates for 404.html, sitemap.xsl, robots.txt, redirect pages
│
├── ledgo-erp/           LedGo ERP product site (self-contained: own css/js/assets)
├── gasone/              GasOne product site + privacy-policy/ + guide/
├── jb-one/              JB One product site (app + web catalogue) + privacy-policy/
├── products/            Old product URLs, now redirect stubs to the three sites above
│
├── assets/
│   ├── logo/           Real TMB Tech logo (lockup + favicon, cropped from the source artwork)
│   ├── products/       Real app icons for LedGo ERP, GasOne and JB One
│   ├── projects/       Reserved for real project screenshots
│   └── icons/          Reserved for any additional icon assets
│
└── README.md
```

## settings.json: change details in one place

Your name, email, phone, LinkedIn, GitHub, the company name and the site address are **not typed into the pages**. They live in `settings.json`, with notes inside the file (JSON has no comments, so notes are keys starting with `_`, which the site ignores).

Inside the pages they appear as tokens, for example `{{company.contact.email}}`. `js/settings.js` swaps them for the values when a page opens, on all four sites (company, LedGo ERP, GasOne, JB One), in text, links and structured data. The contact forms send to the same email.

**Changing contact details (email, phone, LinkedIn, GitHub, founder):** edit `settings.json`, commit, push. Nothing else.

**Changing the site address, the company name, or a page's title / description / share image:** edit `settings.json`, then run

```bash
python tools/render.py          # regenerates the <head> tags, sitemap.xml, robots.txt, 404.html
```

and commit. These are plain HTML on purpose: Google, WhatsApp and LinkedIn do not run JavaScript when they read a page.

```bash
python tools/render.py --check  # is settings.json valid, is everything up to date?
python tools/render.py --lint   # any contact detail still typed into a page?
```

Run `--check` before you push. A missing comma in `settings.json` breaks every page's contact details (the pages then show blanks instead of the values), and `--check` tells you the exact line.

**Google Play badges:** each product has a `playStore` block in `settings.json` (`packageId`, `live`, `comingSoon`). The official "Get it on Google Play" badge appears on the company site and the product sites only when `live` is `true`, and links to `https://play.google.com/store/apps/details?id=<packageId>`. Set `live` to `true` the day a listing goes public. With `"comingSoon": true` and `live` still `false`, a "Coming soon on Google Play" label shows instead. JB One is live; GasOne (`com.jbtech.gasone`) returned 404 on 25 Sep 2026, so it stays hidden until published.

**Free trial:** the wording lives in the top-level `trial` block, and each product turns it on or off with `products.<name>.trial.available`. "Request free trial" buttons scroll to the contact form, fill in that product's `trial.message`, and the email arrives with the subject "Free trial request (Product) from Name". Elements are switched on and off in the HTML with `data-tmb-if="<path in settings.json>"`.

**A product on its own domain:** put the full address in that product's `url` in `settings.json` (for example `"url": "https://gasone.in/"`). Every link to it, on every page, follows. Copy the product folder and `js/settings.js` to the new host and add `data-settings="https://bharathvsb3.github.io/TMB-Tech/settings.json"` to its `<script src=".../settings.js">` tag so it keeps reading the same file (GitHub Pages allows this). Then run `python tools/render.py` so its canonical and share tags point at the new address.

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

The Contact section shows the phone, email, GitHub and LinkedIn from `settings.json`, and the Contact form builds a pre-filled `mailto:` link on submit (validated client-side) rather than claiming to send anything itself, since a static site has no backend to send from.

## Product logos

`assets/products/` holds the real app icons for each product (`ledgo.png`, `gasone.png`, `jbone.png`), sourced from each app's own launcher-icon artwork and resized for the web. They're used on the product cards and on each product's own detail page.

`assets/projects/` is still empty — no real screenshots were available for the Projects section, so those cards use simple drawn illustrations instead. Real screenshots can be dropped in and referenced from the project cards in `index.html` at any time.

## Product sites

Each product has its own site folder that carries its own brand, screens, contact form, a TMB Tech company block and a "Powered by TMB Tech" footer credit. The three folders are **self-contained**: everything a site needs (CSS, JS, images) lives inside it and every link back to the company site is an absolute URL. That means any folder can be lifted onto its own domain later (for example `ledgoerp.com`, `gasone.in`, `jbone.in`) by copying it and changing only the `canonical`/`og:url` links, the JSON-LD `url` and the "TMB Tech" links if you want them relative.

| Folder | Site | Extra pages |
| --- | --- | --- |
| `ledgo-erp/` | LedGo ERP: features, Online Store walkthrough, devices, themes, FAQ | none |
| `gasone/` | GasOne: features, screens, roles, Tamil/English flip | `privacy-policy/`, `guide/` (the full user guide) |
| `jb-one/` | JB One: mobile app + online catalogue | `privacy-policy/` |

`gasone/` and `jb-one/` share one template (`css/product.css`, `js/product.js`, kept identical in both folders) and differ only in `css/theme.css` (brand tokens) and `index.html` (content). The screenshots in `gasone/assets/screens/` and `jb-one/assets/screens/` are HTML recreations of the real screens, rendered with sample data. They are not captures of a live customer's data.

The Play Store privacy-policy URLs are `https://bharathvsb3.github.io/TMB-Tech/gasone/privacy-policy/` and `https://bharathvsb3.github.io/TMB-Tech/jb-one/privacy-policy/`.

## SEO

Each page's structured data (`Organization`, `WebSite`, `ItemList`, `SoftwareApplication`, `BreadcrumbList`) is built from `settings.json` by `js/settings.js`. `sitemap.xml` and `robots.txt` at the repo root are generated by `tools/render.py`. Note: crawlers only read `robots.txt` from the top of a host, so on `bharathvsb3.github.io/TMB-Tech/` this file (and its `Sitemap:` line) is ignored; the sitemap has to be submitted in Google Search Console. It starts working by itself once the site is on its own domain. The site address is `site.baseUrl` in `settings.json`: if the site ever moves to a custom domain, change it there and run `python tools/render.py`, which rewrites every canonical link, share-preview tag, the sitemap and robots.txt.

Structured data and a sitemap only tell Google what's on the site — they don't guarantee rich results, sitelinks, or any particular search appearance. That's still entirely Google's call. After deploying, submit the site and `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) and use its URL Inspection tool to request indexing of the three product sites.

## Deploying to GitHub Pages

This site is already live at **https://bharathvsb3.github.io/TMB-Tech/** via GitHub Pages on the `main` branch. To redeploy elsewhere:

1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** for the `main` branch (root).
3. The site will be available at `https://<username>.github.io/<repo>/`.

No build tools, Node.js, or server are required.
