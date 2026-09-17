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
│   ├── logo/           Logo mark (placeholder monogram — swap when the real logo is ready)
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

## Replacing the logo

`index.html` references `assets/logo/logo.svg` in the header and footer. The current file is a temporary monogram placeholder. To use the real TMB Tech logo:

1. Add the new logo file to `assets/logo/` (SVG preferred, PNG also works).
2. Update the `src` on the two `<img class="logo-mark">` tags in `index.html`, and the favicon `<link rel="icon">` in `<head>`.

No other changes are required.

## Contact links

The Email, GitHub and LinkedIn links in the Contact section are placeholders (`data-placeholder="true"`, `href="#"`) until real links are provided. Search `index.html` for `data-placeholder` to update them.

## Product screenshots

`assets/products/` and `assets/projects/` are currently empty — no real screenshots were available at build time, so the product/project cards use simple drawn illustrations instead. Real screenshots can be dropped into these folders and referenced from the corresponding cards in `index.html` at any time.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** for the `main` branch (root).
3. The site will be available at `https://<username>.github.io/<repo>/`.

No build tools, Node.js, or server are required.
