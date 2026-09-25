#!/usr/bin/env python3
"""
Builds the files that must be plain HTML for search engines and social sites
from settings.json, the single source of truth for the whole site.

  python tools/render.py           write everything that changed
  python tools/render.py --check   only check: exit 1 if settings.json is
                                   invalid or any generated file is out of date
  python tools/render.py --lint    list hard-coded contact details / addresses
                                   still sitting in the pages

What it generates
  * the SEO block in every page's <head> (between <!-- seo:start --> and
    <!-- seo:end -->): title, description, canonical, share-preview tags
  * sitemap.xml, robots.txt, sitemap.xsl, 404.html
  * the small redirect pages for the old product URLs (products/<name>/)

Contact details do NOT need this tool: pages read settings.json in the
browser (js/settings.js). Run the tool only after changing the site address,
the company name, or a page's title / description / share image.

Needs only Python 3, no packages.
"""
import datetime
import hashlib
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS = os.path.join(ROOT, "settings.json")
TEMPLATES = os.path.join(ROOT, "tools", "templates")
STATE = os.path.join(ROOT, "tools", "lastmod.json")

TOKEN = re.compile(r"\{\{\s*([A-Za-z0-9_.\-]+)((?:\|[a-z]+)*)\s*\}\}")
SEO_BLOCK = re.compile(r"<!-- seo:start.*?-->.*?<!-- seo:end -->", re.S)


# ------------------------------------------------------------------ settings
def load_settings():
    try:
        with open(SETTINGS, encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        sys.exit(f"settings.json is not valid JSON: {e}")
    return normalize(data)


def normalize(s):
    """Worked-out values. Keep in step with normalize() in js/settings.js."""
    year = datetime.datetime.now(datetime.timezone.utc).year
    s["year"] = str(year)
    base = s["site"]["baseUrl"]
    if not base.endswith("/"):
        base += "/"
    s["site"]["baseUrl"] = base
    start = s["company"].get("copyrightStartYear")
    s["company"]["copyrightYears"] = f"{start}–{year}" if start and start < year else str(start or year)
    for key, p in s["products"].items():
        if key.startswith("_"):
            continue
        url = p.get("url") or base + p["path"]
        p["url"] = url if url.endswith("/") else url + "/"
        listing = lookup(s, "stores.googlePlay.listingUrl") or ""
        ps = p.setdefault("playStore", {})
        ps["url"] = listing + ps["packageId"] if ps.get("live") and ps.get("packageId") else ""
        ps["showSoon"] = bool(ps.get("comingSoon")) and not ps.get("live")
        p.setdefault("trial", {})
    resolve_deep(s, s)
    return s


def resolve_deep(node, root):
    """Text inside settings.json may itself use tokens, e.g. "{{company.name}} builds ..."."""
    for key, value in list(node.items()):
        if key.startswith("_") or key == "pages":
            continue
        if isinstance(value, str) and "{{" in value:
            node[key] = fill(value, root, escape=False)
        elif isinstance(value, dict):
            resolve_deep(value, root)


def lookup(obj, path):
    for part in path.split("."):
        if not isinstance(obj, dict) or part not in obj:
            return None
        obj = obj[part]
    return obj


def fill(text, ctx, escape=True):
    def repl(m):
        value = lookup(ctx, m.group(1))
        if value is None or isinstance(value, (dict, list)):
            sys.exit(f"settings.json has no value for {{{{{m.group(1)}}}}}")
        value = str(value)
        for name in filter(None, m.group(2).split("|")):
            if name == "digits":
                value = re.sub(r"[^\d+]", "", value)
        return html.escape(value, quote=True) if escape else value

    return TOKEN.sub(repl, text)


# --------------------------------------------------------------------- urls
def products_of(s):
    return {k: v for k, v in s["products"].items() if not k.startswith("_")}


def pages_of(s):
    return {k: v for k, v in s["pages"].items() if not k.startswith("_")}


def asset_url(s, page, rel):
    """Address of a file that belongs to a page. A product with its own domain
    serves its folder from that domain's root."""
    if rel.startswith("http"):
        return rel
    prod = products_of(s).get(page.get("product", ""))
    if prod and rel.startswith(prod["path"]):
        return prod["url"] + rel[len(prod["path"]):]
    return s["site"]["baseUrl"] + rel


def page_url(s, page):
    return asset_url(s, page, page["path"]) if page["path"] else s["site"]["baseUrl"]


def text_of(s, value):
    return fill(value, s, escape=False)


# --------------------------------------------------------------- generators
def head_block(s, page):
    e = lambda v: html.escape(v, quote=True)
    title = e(text_of(s, page["title"]))
    desc = e(text_of(s, page["description"]))
    og_title = e(text_of(s, page.get("ogTitle", page["title"])))
    og_alt = e(text_of(s, page["ogAlt"]))
    site_name = e(text_of(s, page["siteName"]))
    url = e(page_url(s, page))
    img = e(asset_url(s, page, page["ogImage"]))
    author = e(s["company"]["name"])
    locale = e(s["site"]["locale"])
    return f"""<!-- seo:start | generated from settings.json by tools/render.py, do not edit by hand -->
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="{author}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{locale}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="{site_name}">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{og_alt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<meta name="twitter:image:alt" content="{og_alt}">
<!-- seo:end -->"""


def read(path):
    with open(path, encoding="utf-8", newline="") as f:
        return f.read().replace("\r\n", "\n")


def digest(*texts):
    h = hashlib.sha1()
    for t in texts:
        h.update(t.replace("\r\n", "\n").encode("utf-8"))
    return h.hexdigest()[:12]


def sitemap_xml(s, dates):
    base = s["site"]["baseUrl"]
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    for key, page in pages_of(s).items():
        loc = page_url(s, page)
        if not loc.startswith(base):
            continue  # lives on its own domain, so it belongs in that site's own sitemap
        sm = page.get("sitemap")
        if not sm:
            continue
        out += ["  <url>", f"    <loc>{html.escape(loc)}</loc>",
                f"    <lastmod>{dates[key]}</lastmod>",
                f"    <changefreq>{sm['changefreq']}</changefreq>",
                f"    <priority>{sm['priority']}</priority>"]
        for img in sm.get("images", []):
            if not os.path.exists(os.path.join(ROOT, img)):
                sys.exit(f"sitemap image not found: {img} (page {key})")
            out.append(f"    <image:image><image:loc>{html.escape(asset_url(s, page, img))}</image:loc></image:image>")
        out.append("  </url>")
    out.append("</urlset>")
    return "\n".join(out) + "\n"


def template(name, s, extra=None):
    ctx = dict(s)
    if extra:
        ctx.update(extra)
    return fill(read(os.path.join(TEMPLATES, name)), ctx)


def compute_dates(s, page_texts):
    """lastmod moves only when a page or settings.json really changed. The
    fingerprints live in tools/lastmod.json so re-running changes nothing."""
    try:
        state = json.load(open(STATE, encoding="utf-8"))
    except (OSError, ValueError):
        state = {}
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    settings_text = read(SETTINGS)
    new_state, dates = {}, {}
    for key, text in page_texts.items():
        fp = digest(text, settings_text)
        old = state.get(key, {})
        new_state[key] = {"hash": fp, "date": old["date"] if old.get("hash") == fp else today}
        dates[key] = new_state[key]["date"]
    return dates, new_state


# --------------------------------------------------------------------- main
def build(s):
    """Return {absolute path: new text} for every generated file."""
    out = {}

    # 1. <head> SEO blocks
    page_texts = {}
    for key, page in pages_of(s).items():
        path = os.path.join(ROOT, page["file"])
        if not os.path.exists(path):
            sys.exit(f"page file not found: {page['file']} (pages.{key})")
        text = read(path)
        if not SEO_BLOCK.search(text):
            sys.exit(f"{page['file']} has no <!-- seo:start --> ... <!-- seo:end --> block")
        text = SEO_BLOCK.sub(lambda m: head_block(s, page), text, count=1)
        out[path] = text
        page_texts[key] = text

    # 2. sitemap + robots + sitemap page + 404
    dates, state = compute_dates(s, page_texts)
    out[os.path.join(ROOT, "sitemap.xml")] = sitemap_xml(s, dates)
    out[os.path.join(ROOT, "robots.txt")] = template("robots.txt", s)
    out[os.path.join(ROOT, "sitemap.xsl")] = template("sitemap.xsl", s)
    out[os.path.join(ROOT, "404.html")] = template("404.html", s)
    out[STATE] = json.dumps(state, indent=2) + "\n"

    # 3. redirect pages for the old product URLs
    for key, p in products_of(s).items():
        if p.get("legacyPath"):
            out[os.path.join(ROOT, p["legacyPath"], "index.html")] = template("redirect.html", s, {"p": p})
    return out


def write_all(out, check):
    changed = []
    for path, text in out.items():
        old = read(path) if os.path.exists(path) else None
        if old != text:
            changed.append(os.path.relpath(path, ROOT).replace("\\", "/"))
            if not check:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(text)
    return changed


def lint(s):
    """Find contact details / addresses typed directly into pages."""
    needles = {
        "email": s["company"]["contact"]["email"],
        "phone": s["company"]["contact"]["phone"],
        "phone digits": re.sub(r"[^\d+]", "", s["company"]["contact"]["phone"]),
        "founder": s["company"]["founder"]["name"],
        "linkedin": s["company"]["social"]["linkedin"]["url"],
        "linkedin handle": s["company"]["social"]["linkedin"]["handle"],
        "github": s["company"]["social"]["github"]["url"],
        "github handle": s["company"]["social"]["github"]["handle"],
        "site address": s["site"]["baseUrl"].rstrip("/"),
    }
    skip_dirs = {".git", "node_modules", "tools"}
    skip_files = {"settings.json", "README.md", "lastmod.json"}
    exts = (".html", ".js", ".css", ".xml", ".xsl", ".txt")
    hits = 0
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for name in files:
            if name in skip_files or not name.endswith(exts) or name.startswith("google"):
                continue
            path = os.path.join(dirpath, name)
            text = SEO_BLOCK.sub("", read(path))  # generated blocks are allowed to hold the address
            if name in ("sitemap.xml", "robots.txt", "404.html", "sitemap.xsl") or "/products/" in path.replace("\\", "/"):
                continue  # generated files
            for i, line in enumerate(text.split("\n"), 1):
                for label, needle in needles.items():
                    if needle and needle.lower() in line.lower():
                        hits += 1
                        print(f"{os.path.relpath(path, ROOT)}:{i}: {label}: {line.strip()[:110]}")
    print(f"\n{hits} hard-coded value(s) found." if hits else "No hard-coded contact details or addresses found.")
    return hits


def main():
    args = set(sys.argv[1:])
    s = load_settings()
    if "--lint" in args:
        sys.exit(1 if lint(s) else 0)
    out = build(s)
    check = "--check" in args
    changed = write_all(out, check)
    if check:
        if changed:
            print("Out of date (run: python tools/render.py):\n  " + "\n  ".join(changed))
            sys.exit(1)
        print("settings.json is valid and every generated file is up to date.")
    else:
        print("Updated:\n  " + "\n  ".join(changed) if changed else "Nothing to update, everything already matches settings.json.")


if __name__ == "__main__":
    main()
