# TMB Tech — Company Website

A static, fully responsive marketing website for **TMB Tech**, a software and technology company building business applications, mobile applications, ERP systems, web applications and custom software solutions.

Built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no build step, no dependencies. Works by opening `index.html` directly, and is ready to deploy on **GitHub Pages** as-is.

## Structure

```text
tmb-tech/
│
├── index.html          Main page (all sections)
├── css/
│   └── style.css       All styling, CSS variables for theming
├── js/
│   └── script.js       Navigation, scroll reveal, modals, parallax
│
├── assets/
│   ├── logo/           Real TMB Tech logo (lockup + favicon, cropped from the source artwork)
│   ├── products/       Reserved for real product screenshots
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

Email and LinkedIn in the Contact section are live. GitHub is still a placeholder (`data-placeholder="true"`, `href="#"`) until a link is provided — search `index.html` for `data-placeholder` to update it.

## Product screenshots

`assets/products/` and `assets/projects/` are currently empty — no real screenshots were available at build time, so the product/project cards use simple drawn illustrations instead. Real screenshots can be dropped into these folders and referenced from the corresponding cards in `index.html` at any time.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** for the `main` branch (root).
3. The site will be available at `https://<username>.github.io/<repo>/`.

No build tools, Node.js, or server are required.
