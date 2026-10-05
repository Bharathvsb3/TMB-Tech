# TMB Tech — Company Website

A static, fully responsive marketing website for **TMB Tech**, a software and technology company building business applications, mobile applications, ERP systems, web applications and custom software solutions.

Built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no dependencies. One small Python script (`tools/render.py`) fills the page templates from `settings.json`; the published pages are plain HTML. Deployed on **GitHub Pages**, serving the custom domain **https://tmbtech.in/**.

## Structure

```text
tmb-tech/
│
├── settings.json        THE one place for company name, contact details, links, site address
├── _src/               THE PAGE TEMPLATES you edit (keep {{tokens}}); same layout as the site
├── index.html          Published main page, generated from _src/index.html (do not edit by hand)
├── sitemap.xml / .xsl   Generated from settings.json (search engines + a styled browser view)
├── robots.txt / 404.html  Generated from settings.json
├── css/
│   └── style.css       All styling, CSS variables for theming
├── js/
│   ├── script.js       Navigation, scroll reveal, modals, parallax, contact form
│   └── settings.js     Re-applies settings.json in the browser: forms, trial buttons, product schema (used by every site)
├── tools/
│   ├── render.py       Builds the published pages from _src/ + settings.json, plus sitemap, robots, 404
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

In the page templates (`_src/`) they appear as tokens, for example `{{company.contact.email}}`. `tools/render.py` replaces every token with its value and writes the published page (`index.html`, `gasone/index.html`, ...), so the HTML that search engines and visitors without JavaScript receive already holds real text, never `{{braces}}`. `js/settings.js` still runs in the browser for the contact forms, trial buttons and product structured data. The contact forms send to the same email.

**Changing contact details (email, phone, LinkedIn, GitHub, founder):** edit `settings.json`, run `python tools/render.py`, then commit and push **both** `settings.json` and the regenerated pages. (Pushing `settings.json` alone leaves the published pages showing the old values.)

**Editing page content:** change the page in `_src/` (never the published copy at the site root), run `python tools/render.py`, commit both.

**Changing the site address, the company name, or a page's title / description / share image:** edit `settings.json`, then run

```bash
python tools/render.py          # regenerates the <head> tags, sitemap.xml, robots.txt, 404.html
```

and commit. These are plain HTML on purpose: Google, WhatsApp and LinkedIn do not run JavaScript when they read a page.

```bash
python tools/render.py --check  # is settings.json valid, is everything up to date?
python tools/render.py --lint   # any contact detail still typed into a page?
```

Run `--check` before you push: it fails if `settings.json` is invalid (and tells you the exact line) or if any published page is out of date with `settings.json` / `_src/`.

**Google Play badges:** each product has a `playStore` block in `settings.json` (`packageId`, `live`, `comingSoon`). The official "Get it on Google Play" badge appears on the company site and the product sites only when `live` is `true`, and links to `https://play.google.com/store/apps/details?id=<packageId>`. Set `live` to `true` the day a listing goes public. With `"comingSoon": true` and `live` still `false`, a "Coming soon on Google Play" label shows instead. An app can override the label with its own `soonText`. JB One is live. GasOne (`com.jbtech.gasone`) was submitted and is in review (expected about 5 days after 25 Sep 2026); its store page still returned 404, so it shows the label "On Google Play soon: in review" instead of a badge that would not open. **When Google Play publishes it, set `products.gasone.playStore.live` to `true`** and the label turns into the real badge on the company site and on GasOne's own site.

**Hero backgrounds and scrolling:** every site has a star/grid style hero with its own effect and its own parallax. JB One: gold stars and a 3D tilt. GasOne: rising embers and layers that slide apart (`data-parallax="explode"`). LedGo ERP: soft glowing motes, a cursor spotlight and devices that fan out. Company site: a moving network that reaches for the cursor. The canvas effects live in `js/hero-fx.js` (`<canvas class="fx-canvas" data-fx="stars|embers|motes|net">`, colours from `--fx-1..3`). On a computer that scrolls badly, `js/perf.js` switches the page to lite mode by itself (no blur, no glow, no canvas, no tilt) and remembers it; add `?lite=1` to any address to try it, `?lite=0` to switch it off again.

**Free trial:** the wording lives in the top-level `trial` block, and each product turns it on or off with `products.<name>.trial.available`. "Request free trial" buttons scroll to the contact form, fill in that product's `trial.message`, and the email arrives with the subject "Free trial request (Product) from Name". Elements are switched on and off in the HTML with `data-tmb-if="<path in settings.json>"`.

**A product on its own domain:** put the full address in that product's `url` in `settings.json` (for example `"url": "https://gasone.in/"`). Every link to it, on every page, follows. Copy the product folder and `js/settings.js` to the new host and add `data-settings="https://tmbtech.in/settings.json"` to its `<script src=".../settings.js">` tag so it keeps reading the same file (GitHub Pages allows this). Then run `python tools/render.py` so its canonical and share tags point at the new address.

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

The Play Store privacy-policy URLs are `https://tmbtech.in/gasone/privacy-policy/` and `https://tmbtech.in/jb-one/privacy-policy/` (LedGo ERP's own listing, when it is published, should point at `https://tmbtech.in/ledgo-erp/privacy-policy/`).

## SEO

The home page's structured data is one static JSON-LD `@graph` (`Organization`, `WebSite`, `WebPage`, `ItemList` of `SoftwareApplication`s, joined by `@id`) written into its `<head>` by `tools/render.py`. Product pages get `SoftwareApplication` and `BreadcrumbList` from `js/settings.js` at load time. `sitemap.xml` and `robots.txt` at the repo root are generated by `tools/render.py`. The site now lives at its own domain (`https://tmbtech.in/`), so `robots.txt` and its `Sitemap:` line are read by crawlers directly from the top of the host; before, on `bharathvsb3.github.io/TMB-Tech/`, that file was ignored because it sat under a sub-path. The site address is `site.baseUrl` in `settings.json`: if the domain ever changes again, change it there and run `python tools/render.py`, which rewrites every canonical link, share-preview tag, the sitemap and robots.txt. The old GitHub Pages URL still resolves (same host, same content) but is no longer the canonical address.

Structured data and a sitemap only tell Google what's on the site — they don't guarantee rich results, sitelinks, or any particular search appearance. That's still entirely Google's call. After deploying, submit the site and `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) and use its URL Inspection tool to request indexing of the three product sites.

## Deploying to GitHub Pages

This site is already live at **https://tmbtech.in/**, via GitHub Pages on the `main` branch with a custom domain (`CNAME` at the repo root) and DNS already pointed at it. The underlying GitHub Pages URL `https://bharathvsb3.github.io/TMB-Tech/` still serves the same site but is not the canonical address — `settings.json`'s `site.baseUrl` is `https://tmbtech.in/`, so every canonical link, sitemap entry and share-preview tag points at the custom domain. To redeploy elsewhere:

1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** for the `main` branch (root).
3. The site will be available at `https://<username>.github.io/<repo>/`.

No build tools, Node.js, or server are required.
