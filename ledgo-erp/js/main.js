(function () {
  "use strict";

  // The address the contact form sends to lives in settings.json (loaded by js/settings.js).
  function contactEmail() {
    return window.TMB && window.TMB.settings ? window.TMB.settings.company.contact.email : "";
  }

  var THEME_NAMES = {
    green: "AgriPro Green",
    teal: "Ocean Teal",
    purple: "Royal Purple",
    orange: "Sunset Orange",
    blue: "Baby Blue",
    indigo: "Deep Indigo",
  };
  var THEME_STORAGE_KEY = "ledgo-website-theme";
  var MODE_STORAGE_KEY = "ledgo-website-mode";
  var LANG_STORAGE_KEY = "ledgo-website-lang";
  var DEFAULT_LANG = "en";

  /* ---------------- Theme engine ----------------
     Mirrors the real product's own per-shop theming: pick one seed color,
     every accent on the page follows via CSS custom properties. Persisted
     to localStorage so a returning visitor's pick sticks. */
  function applyTheme(themeKey) {
    if (!THEME_NAMES[themeKey]) {
      themeKey = "green";
    }
    document.documentElement.setAttribute("data-theme", themeKey);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeKey);
    } catch (e) {
      /* private browsing / storage disabled - theme still applies for this view, just won't persist */
    }

    var name = THEME_NAMES[themeKey];
    var badge = document.getElementById("themeBadge");
    if (badge) badge.textContent = name;
    var footerTheme = document.getElementById("footerTheme");
    if (footerTheme) footerTheme.textContent = name;

    document.querySelectorAll("[data-theme-btn]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-theme-btn") === themeKey ? "true" : "false");
    });

    updateProductScreenshots();
    updateFeatureScreenshots();
  }

  function initTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    applyTheme(saved || "green");

    document.querySelectorAll("[data-theme-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(btn.getAttribute("data-theme-btn"));
      });
    });

    /* ---- swatch click ring ----
       Only the small circular .swatch buttons (nav-right and the mobile
       menu's own copy) get the expanding ring on click - the wider
       .theme-option rows in the "Make It Yours" section also carry
       [data-theme-btn] for the color-swap logic above, but were never part
       of this. Toggling `.ping` here is entirely separate from the
       aria-pressed state applyTheme() manages above; it doesn't read or
       change it. */
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll(".swatch").forEach(function (swatch) {
      swatch.addEventListener("click", function () {
        if (prefersReducedMotion.matches) return;
        swatch.classList.remove("ping");
        void swatch.offsetWidth; // force reflow so a rapid re-click restarts the animation
        swatch.classList.add("ping");
      });
      swatch.addEventListener("animationend", function (e) {
        if (e.animationName === "swatch-ping") {
          swatch.classList.remove("ping");
        }
      });
    });
  }

  /* ---------------- Light/dark mode ----------------
     A separate axis from the brand-accent theme above (mirrors the real
     LedGo ERP app's own architecture). Defaults to light - dark is an
     explicit opt-in, persisted independently of the theme color. */
  function applyMode(mode) {
    mode = mode === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", mode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (e) {
      /* ignore */
    }
    document.querySelectorAll(".mode-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    });
  }

  function initMode() {
    var saved = null;
    try {
      saved = localStorage.getItem(MODE_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    applyMode(saved === "dark" ? "dark" : "light");

    document.querySelectorAll(".mode-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light";
        applyMode(current === "dark" ? "light" : "dark");
      });
    });
  }

  /* ---------------- i18n ----------------
     Five languages matching the real LedGo ERP app: English, Tamil, Hindi,
     Kannada, Telugu. Natural, professional copy for a public marketing
     page - not the shorthand tone used in the app's own internal admin UI. */
  var TRANSLATIONS = {
    en: {
      "nav.features": "Features",
      "nav.devices": "Everywhere You Work",
      "nav.themes": "Make It Yours",
      "nav.faq": "FAQ",
      "nav.getStarted": "Get Started",
      "hero.eyebrow": "Built for the shop counter",
      "hero.title": 'Run your <span class="accent">whole shop.</span><br />From one screen.',
      "hero.sub": "Billing, inventory, GST, purchases, and your own customer-facing store — LedGo ERP replaces the notebook, the calculator, and the three different apps your shop has been stitching together.",
      "hero.cta.primary": "See it in action",
      "hero.cta.secondary": "Explore features",
      "hero.trust.modules": "Modules",
      "hero.trust.languages": "Languages",
      "hero.trust.aiVoice": "Voice & Invoice",
      "hero.trust.gst": "GST Built In",
      "stats.modules": "Core Modules",
      "stats.languages": "Indian Languages",
      "stats.themes": "Theme Presets",
      "stats.apps": "Native Apps",
      "stats.always": "Runs On Your Terms",
      "features.eyebrow": "What's inside",
      "features.heading": "Everything a shop counter actually needs",
      "features.sub": "Not a generic accounting tool bent into shape — built around how an Indian agri, hardware, or general-trade shop really runs its day.",
      "f1.title": "Billing that keeps up with the counter",
      "f1.body": "Search, scan, or speak a product in — GST splits itself into CGST+SGST or IGST on every line, automatically, and a UPI QR sits on every bill so the balance clears itself the moment it's paid.",
      "f1.li1": "Thermal receipt & label printing on real shop hardware",
      "f1.li2": "Sales Orders, Returns, and on-account credit — tracked to the rupee",
      "f1.li3": "Batch & expiry aware, oldest stock sells first, automatically",
      "f2.title": "Inventory that never loses track",
      "f2.body": "Every batch carries its own expiry date. Run one shop or ten locations, each with their own warehouses, and move stock between them with a real audit trail.",
      "f2.li1": "Locations, Godowns, and Stock Transfer between them",
      "f2.li2": "FIFO, LIFO, or Weighted Average costing — chosen per company",
      "f2.li3": "Dead stock, fast movers, and reorder suggestions, one report away",
      "f3.title": "Say it, snap it, done",
      "f3.body": "Speak a sale out loud and watch the cart fill itself. Photograph a vendor's paper invoice and get back a fully filled purchase entry — lines, rates, and all.",
      "f3.li1": "Voice Ordering matches spoken words to real products",
      "f3.li2": "AI Invoice Import reads a photographed or scanned bill",
      "f3.li3": "Runs on Anthropic, Gemini, or OpenAI — whichever a shop trusts",
      "f4.title": "A storefront that's actually yours",
      "f4.body": "Every shop gets its own branded ordering website — customers browse the real catalogue and place real orders — plus a dedicated Android app with its own name, icon, and colours, not a shared marketplace listing.",
      "f4.li1": "Custom domains — yourshop.com, not someone else's subdomain",
      "f4.li2": "Push notifications the moment an order status changes",
      "f4.li3": "Orders flow straight into the same billing and stock engine",
      "f5.title": "Reports that answer the real question",
      "f5.body": "Full ledgers, GST-ready summaries, and a Profit & Loss statement built from the same bills already in the system — plus dead stock, fast movers, and what to reorder next, one click away.",
      "f5.li1": "Sales & Purchase Register, GST Summary, and Party Ledger — export-ready in one click",
      "f5.li2": "Dead Stock, Fast/Slow Movers, and Purchase Planning suggest exactly what to reorder",
      "f5.li3": "Outstanding & Aging — who owes what, at a glance, filterable by location",
      "f5.li4": "Financial Year close, and reopen, without losing a figure",
      "f6.title": "One platform, every shop you run",
      "f6.body": "A Super Admin control tower oversees every company on the platform — agri, hardware, and general-trade shops alike — with feature-by-feature switches per shop: turn on exactly what each one needs, nothing forced on anyone.",
      "f6.li1": "Trial windows, licensing, and automated backups, built in",
      "f6.li2": "A platform-wide audit trail — every action, attributed, forever",
      "f6.li3": "Role-based permissions down to the individual action",
      "f7.title": "Purchase, tracked from order to payment",
      "f7.body": "Raise a Purchase Order, receive it as a real stock-in entry with batch and expiry captured line by line, and track Cash or Credit payment against every vendor — the same rigor as billing, pointed the other way.",
      "f7.li1": "Purchase Orders that convert straight into a real stock-in entry",
      "f7.li2": "Vendor payments — Cash or Credit, Paid and Balance tracked to the rupee",
      "f7.li3": "Purchase Returns reverse stock and ledger cleanly, no manual adjustment",
      "f8.title": "Built for the hardware already on your counter",
      "f8.body": "Thermal receipt and label printers, barcode scanners, and UPI QR codes — LedGo ERP talks to the machines a shop already owns, not a proprietary device you have to buy.",
      "f8.li1": "Thermal receipts and product labels print directly, no PDF middle-man",
      "f8.li2": "Barcode scan-to-add during billing and purchase entry alike",
      "f8.li3": "A UPI QR sits on every bill — the balance clears itself the moment it's scanned",
      "f9.title": "Every customer relationship, tracked",
      "f9.body": "Inquiries, crop plantings, and care-schedule reminders — CRM that understands an agri shop's actual sales cycle, not a generic contact list bent into shape.",
      "f9.li1": "Inquiries tracked from first call to closed sale",
      "f9.li2": "Crop Plantings link a customer's field to what they'll need next season",
      "f9.li3": "Care Schedule Templates fire reminders automatically, right on time",
      "f10.title": "Security that holds up to scrutiny",
      "f10.body": "Role-based permissions down to the individual action, and a platform-wide audit trail that attributes every change, forever — nothing silent, nothing untraceable.",
      "f10.li1": "Every action logged — who, what, and when, permanently",
      "f10.li2": "Permissions set per role, per module, per action",
      "f10.li3": "Automated backups run on schedule, with Super Admin oversight",
      "devices.eyebrow": "Works everywhere you do",
      "devices.heading": "Phone at the counter. Tablet on the floor. Desktop in the back office.",
      "devices.sub": "The same screen, genuinely responsive — not a cramped desktop layout squeezed onto a small screen.",
      "devices.tab.mobile": "Mobile",
      "devices.tab.tablet": "Tablet",
      "devices.tab.desktop": "Desktop",
      "devices.viewing": "Now viewing:",
      "devices.page.dashboard": "Dashboard",
      "devices.page.billing": "Billing",
      "devices.page.inventory": "Inventory",
      "devices.page.purchase": "Purchase",
      "devices.page.reports": "Reports",
      "devices.page.storefront": "Storefront",
      "devices.page.platform": "Platform",
      "devices.page.hardware": "Hardware",
      "themes.eyebrow": "Make it yours",
      "themes.heading": "Every shop picks its own look",
      "themes.sub": "Nine theme presets and a real dark mode — the whole app switches with it. This page is running on the same engine. Try it.",
      "theme.sub.green": "The default — confident, agricultural",
      "theme.sub.teal": "Calm and modern",
      "theme.sub.purple": "Premium, distinctive",
      "theme.sub.orange": "Warm and energetic",
      "theme.sub.blue": "Light and approachable",
      "theme.sub.indigo": "Bold and focused",
      "themes.preview.dashboard": "Dashboard",
      "themes.preview.todaySales": "Today's Sales",
      "themes.preview.lowStock": "Low Stock",
      "themes.preview.collections": "Collections",
      "themes.preview.newSale": "New Sale",
      "faq.eyebrow": "Questions",
      "faq.heading": "Good to know",
      "faq.q1": "Does this work for shops that aren't agricultural?",
      "faq.a1": "Yes. The same billing, GST, batch, and inventory engine reconfigures for hardware stores and general trade retailers just as well as it does for agri-input shops — the underlying logic doesn't change, only the vocabulary does.",
      "faq.q2": "Can my staff use it in Tamil, Hindi, or another language?",
      "faq.a2": "Yes — English, Tamil, Hindi, Kannada, and Telugu are all supported natively, not machine-translated on the fly.",
      "faq.q3": "Do I need to be technical to run this?",
      "faq.a3": "No. It's built to be run by shop staff on the counter, not an IT team — the same reason billing, printing, and stock updates are designed to take one click, not five.",
      "faq.q4": "What if I run more than one shop?",
      "faq.a4": "Each company gets its own isolated data and its own theme, with a Super Admin view that oversees all of them from one place — nothing about one shop's data ever crosses into another's.",
      "faq.q5": "Does this work for shops that aren't agricultural — like hardware or general trade?",
      "faq.a5": "Yes. A Super Admin switches on only the modules a shop actually needs, per company — a hardware or general-trade store runs on the same billing, GST, and inventory engine everyone else does, without agri-specific screens like Crop Plantings or Care Schedule Templates ever showing up on its menu.",
      "faq.q6": "What happens if I switch how stock cost is calculated later?",
      "faq.a6": "LedGo ERP supports FIFO, LIFO, or Weighted Average costing, chosen per company. Switching is a Super Admin-gated setting that applies going forward — it doesn't rewrite or disturb any past transaction, so your historical figures stay exactly as they were recorded.",
      "faq.q7": "Is my data backed up automatically?",
      "faq.a7": "Yes — scheduled automatic backups run on their own with Super Admin oversight, and you're alerted if a scheduled backup ever fails, so protection isn't something you have to remember to do yourself.",
      "cta.eyebrow": "Ready when you are",
      "cta.heading": "Bring your shop onto one screen.",
      "cta.sub": "No credit card, no sales call required to see if it fits — just a look at whether it actually matches how your shop runs.",
      "cta.secondary": "Explore features again",
      "cta.form.name": "Name",
      "cta.form.email": "Email",
      "cta.form.phone": "Phone (optional)",
      "cta.form.phonePlaceholder": "10-digit mobile number",
      "cta.form.message": "Message",
      "cta.form.submit": "Send message",
      "cta.form.sending": "Sending…",
      "cta.form.successMsg": "Your email app should open with your message ready — just press Send.",
      "cta.form.errorRequired": "This field is required.",
      "cta.form.errorEmail": "Enter a valid email address.",
      "cta.form.errorGeneric": "Something went wrong — please try again.",
      "cta.form.orEmail": "Prefer email? Write to us at",
      "footer.tagline": "Shop-management software for Indian agri, hardware, and general trade retailers — one screen for billing, inventory, GST, and your own customer app.",
      "footer.col.product": "Product",
      "footer.col.company": "Company",
      "footer.link.contact": "Contact",
      "footer.rights": "All rights reserved.",
      "footer.previewing": "Currently previewing:",
    },
    ta: {
      "nav.features": "அம்சங்கள்",
      "nav.devices": "நீங்கள் பணிபுரியும் இடமெல்லாம்",
      "nav.themes": "உங்கள் பாணியில் மாற்றுங்கள்",
      "nav.faq": "கேள்விகள்",
      "nav.getStarted": "தொடங்குங்கள்",
      "hero.eyebrow": "கடை கவுண்டருக்காக வடிவமைக்கப்பட்டது",
      "hero.title": 'உங்கள் <span class="accent">முழு கடையையும்</span> நடத்துங்கள்.<br />ஒரே திரையில்.',
      "hero.sub": "பில்லிங், இருப்பு நிர்வாகம், ஜிஎஸ்டி, கொள்முதல், மற்றும் உங்கள் சொந்த வாடிக்கையாளர் ஸ்டோர் — நோட்புக், கால்குலேட்டர், உங்கள் கடை இதுவரை பயன்படுத்திய மூன்று வெவ்வேறு ஆப்களுக்குப் பதிலாக LedGo ERP.",
      "hero.cta.primary": "செயலில் பாருங்கள்",
      "hero.cta.secondary": "அம்சங்களை ஆராயுங்கள்",
      "hero.trust.modules": "தொகுதிகள்",
      "hero.trust.languages": "மொழிகள்",
      "hero.trust.aiVoice": "குரல் & விலைப்பட்டியல்",
      "hero.trust.gst": "ஜிஎஸ்டி உள்ளடக்கம்",
      "stats.modules": "முக்கிய தொகுதிகள்",
      "stats.languages": "இந்திய மொழிகள்",
      "stats.themes": "தீம் வடிவமைப்புகள்",
      "stats.apps": "சொந்த ஆப்ஸ்",
      "stats.always": "உங்கள் வசதிக்கேற்ப இயங்குகிறது",
      "features.eyebrow": "உள்ளே என்ன இருக்கிறது",
      "features.heading": "ஒரு கடை கவுண்டருக்கு உண்மையில் தேவையான அனைத்தும்",
      "features.sub": "வடிவம் மாற்றப்பட்ட பொதுவான கணக்கியல் கருவி அல்ல — இந்திய விவசாய உபகரண, ஹார்ட்வேர், அல்லது பொது வர்த்தக கடைகள் தினமும் எப்படி இயங்குகின்றன என்பதன் அடிப்படையில் உருவாக்கப்பட்டது.",
      "f1.title": "கவுண்டரின் வேகத்திற்கு ஈடுகொடுக்கும் பில்லிங்",
      "f1.body": "பொருளைத் தேடுங்கள், ஸ்கேன் செய்யுங்கள், அல்லது சொல்லுங்கள் — ஒவ்வொரு வரியிலும் ஜிஎஸ்டி தானாகவே CGST+SGST அல்லது IGST ஆக பிரிந்துவிடும், மேலும் ஒவ்வொரு பில்லிலும் UPI QR இருப்பதால் பணம் செலுத்தியவுடன் நிலுவை தானாக தீர்ந்துவிடும்.",
      "f1.li1": "உண்மையான கடை வன்பொருளில் தெர்மல் ரசீது & லேபிள் அச்சிடல்",
      "f1.li2": "விற்பனை ஆர்டர்கள், திரும்பப் பெறுதல்கள், கடன் விற்பனை — ரூபாய் வரை துல்லியமாக கண்காணிக்கப்படும்",
      "f1.li3": "பேட்ச் & காலாவதி தேதி அறிந்து, பழைய இருப்பு முதலில் விற்கும் — தானாகவே",
      "f2.title": "ஒருபோதும் கணக்குத் தவறாத இருப்பு நிர்வாகம்",
      "f2.body": "ஒவ்வொரு பேட்சிற்கும் அதற்கே உரிய காலாவதி தேதி உண்டு. ஒரு கடையையோ அல்லது பத்து இடங்களையோ நடத்துங்கள், ஒவ்வொன்றுக்கும் அதன் சொந்த கிடங்குகளுடன், அவற்றுக்கிடையே உண்மையான தணிக்கை பதிவுடன் இருப்பை மாற்றுங்கள்.",
      "f2.li1": "இடங்கள், கிடங்குகள், அவற்றுக்கிடையே இருப்பு மாற்றம்",
      "f2.li2": "FIFO, LIFO, அல்லது சராசரி விலை முறை — ஒவ்வொரு நிறுவனத்திற்கும் தேர்வு செய்யலாம்",
      "f2.li3": "விற்காத இருப்பு, வேகமாக விற்பனையாகும் பொருட்கள், மறு-ஆர்டர் பரிந்துரைகள் — ஒரு அறிக்கை தொலைவில்",
      "f3.title": "சொல்லுங்கள், படம் எடுங்கள், முடிந்தது",
      "f3.body": "விற்பனையை உரக்கச் சொல்லுங்கள், கார்ட் தானாக நிரம்புவதைப் பாருங்கள். விற்பனையாளரின் காகித விலைப்பட்டியலைப் புகைப்படம் எடுத்தால், முழுமையாக நிரப்பப்பட்ட கொள்முதல் பதிவு — வரிகள், விலைகள் அனைத்துடன் — கிடைக்கும்.",
      "f3.li1": "வாய்ஸ் ஆர்டரிங் பேசும் வார்த்தைகளை உண்மையான பொருட்களுடன் பொருத்துகிறது",
      "f3.li2": "AI விலைப்பட்டியல் இறக்குமதி புகைப்படம் அல்லது ஸ்கேன் செய்யப்பட்ட பில்லைப் படிக்கிறது",
      "f3.li3": "Anthropic, Gemini, அல்லது OpenAI — கடை நம்பும் எதிலும் இயங்கும்",
      "f4.title": "உண்மையிலேயே உங்களுக்கே சொந்தமான ஒரு ஸ்டோர்",
      "f4.body": "ஒவ்வொரு கடைக்கும் அதன் சொந்த பிராண்டட் ஆர்டரிங் வலைத்தளம் கிடைக்கும் — வாடிக்கையாளர்கள் உண்மையான பட்டியலைப் பார்த்து உண்மையான ஆர்டர்களை வைப்பார்கள் — மேலும் அதன் சொந்த பெயர், ஐகான், நிறங்களுடன் ஒரு தனி Android ஆப்பும் கிடைக்கும், பகிரப்பட்ட மார்க்கெட்பிளேஸ் பட்டியல் அல்ல.",
      "f4.li1": "தனிப்பயன் டொமைன்கள் — yourshop.com, வேறொருவரின் சப்டொமைன் அல்ல",
      "f4.li2": "ஆர்டர் நிலை மாறும் தருணத்திலேயே புஷ் அறிவிப்புகள்",
      "f4.li3": "ஆர்டர்கள் அதே பில்லிங் மற்றும் இருப்பு அமைப்பிற்குள் நேரடியாக வரும்",
      "f5.title": "உண்மையான கேள்விக்கு பதிலளிக்கும் அறிக்கைகள்",
      "f5.body": "முழுமையான லெட்ஜர்கள், ஜிஎஸ்டிக்கு தயாரான சுருக்கங்கள், மற்றும் ஏற்கனவே கணினியில் உள்ள அதே பில்களிலிருந்து உருவாக்கப்பட்ட லாப நஷ்ட அறிக்கை — மேலும் விற்காத இருப்பு, வேகமாக விற்பனையாகும் பொருட்கள், அடுத்து என்ன ஆர்டர் செய்ய வேண்டும் என்பது ஒரு கிளிக் தொலைவில்.",
      "f5.li1": "விற்பனை & கொள்முதல் பதிவேடு, ஜிஎஸ்டி சுருக்கம், மற்றும் கட்சி லெட்ஜர் — ஒரே கிளிக்கில் ஏற்றுமதிக்குத் தயார்",
      "f5.li2": "விற்காத இருப்பு, வேக/மந்த விற்பனை பொருட்கள், மற்றும் கொள்முதல் திட்டமிடல் — சரியாக என்ன மறு-ஆர்டர் செய்ய வேண்டும் என்பதை பரிந்துரைக்கும்",
      "f5.li3": "நிலுவை & வயதொப்பு — யார் என்ன செலுத்த வேண்டும் என்பது ஒரே பார்வையில், இடத்தின் அடிப்படையில் வடிகட்டலாம்",
      "f5.li4": "நிதியாண்டு முடிவு, மீண்டும் திறத்தல், ஒரு எண்ணைக்கூட இழக்காமல்",
      "f6.title": "ஒரே தளம், நீங்கள் நடத்தும் ஒவ்வொரு கடையும்",
      "f6.body": "ஒரு சூப்பர் அட்மின் கட்டுப்பாட்டு மையம் தளத்தில் உள்ள ஒவ்வொரு நிறுவனத்தையும் மேற்பார்வையிடுகிறது — விவசாயம், ஹார்ட்வேர், பொது வர்த்தக கடைகள் என அனைத்தும் உட்பட — ஒவ்வொரு கடைக்கும் அம்சம்-வாரியான சுவிட்ச்களுடன்: ஒவ்வொன்றுக்கும் தேவையானதை மட்டும் இயக்குங்கள், யாரையும் கட்டாயப்படுத்தாமல்.",
      "f6.li1": "சோதனை காலம், உரிமம், தானியங்கு காப்புப்பிரதிகள் — உள்ளமைக்கப்பட்டவை",
      "f6.li2": "தளம் முழுவதும் தணிக்கை பதிவு — ஒவ்வொரு செயலும், பொறுப்புடன், என்றென்றும்",
      "f6.li3": "ஒவ்வொரு செயலுக்கும் தனித்தனியாக பாத்திர அடிப்படையிலான அனுமதிகள்",
      "f7.title": "ஆர்டரிலிருந்து பணம் செலுத்தும் வரை கண்காணிக்கப்படும் கொள்முதல்",
      "f7.body": "ஒரு கொள்முதல் ஆர்டரை உருவாக்குங்கள், பேட்ச் மற்றும் காலாவதி தேதியுடன் வரி வரியாக பதிவு செய்யப்பட்ட உண்மையான இருப்பு-உள்வரவு பதிவாக பெறுங்கள், மேலும் ஒவ்வொரு விற்பனையாளருக்கும் எதிராக பணம் அல்லது கடன் கட்டணத்தை கண்காணியுங்கள் — பில்லிங்கின் அதே துல்லியம், மறுதிசையில்.",
      "f7.li1": "கொள்முதல் ஆர்டர்கள் நேரடியாக ஒரு உண்மையான இருப்பு-உள்வரவு பதிவாக மாறும்",
      "f7.li2": "விற்பனையாளர் பணம் செலுத்துதல் — பணம் அல்லது கடன், செலுத்தியது மற்றும் நிலுவை ரூபாய் வரை கண்காணிக்கப்படும்",
      "f7.li3": "கொள்முதல் திரும்பப் பெறுதல்கள் இருப்பு மற்றும் லெட்ஜரை சுத்தமாக மாற்றியமைக்கும், கைமுறை சரிசெய்தல் தேவையில்லை",
      "f8.title": "உங்கள் கவுண்டரில் ஏற்கனவே உள்ள வன்பொருளுக்காக வடிவமைக்கப்பட்டது",
      "f8.body": "தெர்மல் ரசீது மற்றும் லேபிள் பிரிண்டர்கள், பார்கோடு ஸ்கேனர்கள், மற்றும் UPI QR குறியீடுகள் — ஒரு கடை ஏற்கனவே சொந்தமாக்கியிருக்கும் இயந்திரங்களுடன் LedGo ERP பேசுகிறது, நீங்கள் வாங்க வேண்டிய தனியுரிம சாதனம் அல்ல.",
      "f8.li1": "தெர்மல் ரசீதுகள் மற்றும் பொருள் லேபிள்கள் நேரடியாக அச்சிடப்படும், PDF இடைத்தரகர் தேவையில்லை",
      "f8.li2": "பில்லிங் மற்றும் கொள்முதல் பதிவு இரண்டிலும் பார்கோடு ஸ்கேன் செய்து சேர்க்கலாம்",
      "f8.li3": "ஒவ்வொரு பில்லிலும் UPI QR இருக்கும் — ஸ்கேன் செய்யும் தருணமே நிலுவை தானாக தீர்ந்துவிடும்",
      "f9.title": "ஒவ்வொரு வாடிக்கையாளர் தொடர்பும், கண்காணிக்கப்படுகிறது",
      "f9.body": "விசாரணைகள், பயிர் நடவுகள், மற்றும் பராமரிப்பு அட்டவணை நினைவூட்டல்கள் — ஒரு விவசாய உபகரண கடையின் உண்மையான விற்பனை சுழற்சியைப் புரிந்துகொள்ளும் CRM, வடிவம் மாற்றிய பொதுவான தொடர்பு பட்டியல் அல்ல.",
      "f9.li1": "முதல் அழைப்பிலிருந்து முடிந்த விற்பனை வரை விசாரணைகள் கண்காணிக்கப்படும்",
      "f9.li2": "பயிர் நடவுகள் ஒரு வாடிக்கையாளரின் வயலை அடுத்த பருவத்தில் அவருக்குத் தேவைப்படுவதுடன் இணைக்கிறது",
      "f9.li3": "பராமரிப்பு அட்டவணை டெம்ப்ளேட்கள் சரியான நேரத்தில் தானாகவே நினைவூட்டல்களை அனுப்பும்",
      "f10.title": "ஆய்வுக்கு ஈடுகொடுக்கும் பாதுகாப்பு",
      "f10.body": "ஒவ்வொரு தனிப்பட்ட செயலுக்கும் பாத்திர அடிப்படையிலான அனுமதிகள், மற்றும் ஒவ்வொரு மாற்றத்தையும் என்றென்றும் பொறுப்புடன் பதிவு செய்யும் தளம் முழுவதும் தணிக்கை பதிவு — எதுவும் மறைவாக இல்லை, எதுவும் கண்டறியமுடியாமல் இல்லை.",
      "f10.li1": "ஒவ்வொரு செயலும் பதிவு செய்யப்படும் — யார், என்ன, எப்போது, நிரந்தரமாக",
      "f10.li2": "பாத்திரம், தொகுதி, செயல் அடிப்படையில் அனுமதிகள் அமைக்கப்படும்",
      "f10.li3": "சூப்பர் அட்மின் மேற்பார்வையுடன் தானியங்கு காப்புப்பிரதிகள் திட்டமிட்டபடி இயங்கும்",
      "devices.eyebrow": "நீங்கள் பணிபுரியும் எல்லா இடங்களிலும் வேலை செய்கிறது",
      "devices.heading": "கவுண்டரில் மொபைல். தளத்தில் டேப்லெட். பின் அலுவலகத்தில் டெஸ்க்டாப்.",
      "devices.sub": "அதே திரை, உண்மையிலேயே பதிலளிக்கக்கூடியது — சிறிய திரையில் திணிக்கப்பட்ட நெருக்கடியான டெஸ்க்டாப் தளவமைப்பு அல்ல.",
      "devices.tab.mobile": "மொபைல்",
      "devices.tab.tablet": "டேப்லெட்",
      "devices.tab.desktop": "டெஸ்க்டாப்",
      "devices.viewing": "தற்போது காட்டப்படுவது:",
      "devices.page.dashboard": "டாஷ்போர்டு",
      "devices.page.billing": "பில்லிங்",
      "devices.page.inventory": "இருப்பு",
      "devices.page.purchase": "கொள்முதல்",
      "devices.page.reports": "அறிக்கைகள்",
      "devices.page.storefront": "ஸ்டோர்",
      "devices.page.platform": "தளம்",
      "devices.page.hardware": "வன்பொருள்",
      "themes.eyebrow": "உங்கள் பாணியில் மாற்றுங்கள்",
      "themes.heading": "ஒவ்வொரு கடையும் அதன் சொந்த தோற்றத்தைத் தேர்ந்தெடுக்கிறது",
      "themes.sub": "ஒன்பது தீம் வடிவமைப்புகள் மற்றும் ஒரு உண்மையான டார்க் மோட் — முழு ஆப்பும் அதனுடன் மாறும். இந்தப் பக்கமும் அதே இயந்திரத்தில் இயங்குகிறது. முயற்சி செய்யுங்கள்.",
      "theme.sub.green": "இயல்புநிலை — நம்பிக்கையான, விவசாயத்தன்மை கொண்டது",
      "theme.sub.teal": "அமைதியான, நவீனமான",
      "theme.sub.purple": "பிரீமியம், தனித்துவமானது",
      "theme.sub.orange": "சூடான, ஆற்றல் மிக்கது",
      "theme.sub.blue": "இலகுவான, அணுகக்கூடியது",
      "theme.sub.indigo": "தைரியமான, கவனம் செலுத்தும்",
      "themes.preview.dashboard": "டாஷ்போர்டு",
      "themes.preview.todaySales": "இன்றைய விற்பனை",
      "themes.preview.lowStock": "குறைந்த இருப்பு",
      "themes.preview.collections": "வசூல்",
      "themes.preview.newSale": "புதிய விற்பனை",
      "faq.eyebrow": "கேள்விகள்",
      "faq.heading": "தெரிந்துகொள்ள வேண்டியவை",
      "faq.q1": "விவசாயம் சாராத கடைகளுக்கும் இது வேலை செய்யுமா?",
      "faq.a1": "ஆம். அதே பில்லிங், ஜிஎஸ்டி, பேட்ச், இருப்பு நிர்வாக இயந்திரம் விவசாய உபகரண கடைகளுக்கு இயங்குவது போலவே ஹார்ட்வேர் கடைகள் மற்றும் பொது வர்த்தக கடைகளுக்கும் மறுசீரமைக்கப்படும் — அடிப்படை தர்க்கம் மாறாது, சொற்கள் மட்டுமே மாறும்.",
      "faq.q2": "எனது ஊழியர்கள் தமிழ், இந்தி, அல்லது வேறு மொழியில் இதைப் பயன்படுத்த முடியுமா?",
      "faq.a2": "ஆம் — ஆங்கிலம், தமிழ், இந்தி, கன்னடம், தெலுங்கு அனைத்தும் இயல்பாகவே ஆதரிக்கப்படுகின்றன, உடனுக்குடன் இயந்திர மொழிபெயர்ப்பு செய்யப்பட்டவை அல்ல.",
      "faq.q3": "இதை இயக்க எனக்கு தொழில்நுட்ப அறிவு தேவையா?",
      "faq.a3": "இல்லை. இது ஒரு ஐடி குழுவால் அல்ல, கவுண்டரில் இருக்கும் கடை ஊழியர்களால் இயக்கப்படும் வகையில் உருவாக்கப்பட்டுள்ளது — பில்லிங், அச்சிடல், இருப்பு புதுப்பிப்பு ஆகியவை ஐந்து கிளிக் அல்ல, ஒரே கிளிக்கில் நடக்கும் வகையில் வடிவமைக்கப்பட்டதற்கான அதே காரணம்.",
      "faq.q4": "நான் ஒன்றுக்கு மேற்பட்ட கடைகளை நடத்தினால்?",
      "faq.a4": "ஒவ்வொரு நிறுவனத்திற்கும் அதன் சொந்த தனித்த தரவும், சொந்த தீமும் கிடைக்கும், அனைத்தையும் ஒரே இடத்திலிருந்து மேற்பார்வையிடும் சூப்பர் அட்மின் பார்வையுடன் — ஒரு கடையின் தரவு மற்றொரு கடையின் தரவுடன் ஒருபோதும் கலக்காது.",
      "faq.q5": "விவசாயம் சாராத கடைகளுக்கும் — ஹார்ட்வேர் அல்லது பொது வர்த்தகம் போன்றவை — இது வேலை செய்யுமா?",
      "faq.a5": "ஆம். ஒரு சூப்பர் அட்மின் ஒவ்வொரு நிறுவனத்திற்கும் தேவையான தொகுதிகளை மட்டுமே இயக்குகிறார் — ஒரு ஹார்ட்வேர் அல்லது பொது வர்த்தக கடை மற்ற அனைவரையும் போலவே அதே பில்லிங், ஜிஎஸ்டி, இருப்பு நிர்வாக இயந்திரத்தில் இயங்குகிறது, பயிர் நடவுகள் அல்லது பராமரிப்பு அட்டவணை போன்ற விவசாயம் சார்ந்த திரைகள் அதன் மெனுவில் ஒருபோதும் தோன்றாது.",
      "faq.q6": "பின்னர் இருப்பு செலவு கணக்கிடும் முறையை மாற்றினால் என்ன ஆகும்?",
      "faq.a6": "LedGo ERP ஒவ்வொரு நிறுவனத்திற்கும் தேர்ந்தெடுக்கக்கூடிய FIFO, LIFO, அல்லது சராசரி விலை முறையை ஆதரிக்கிறது. மாற்றுவது ஒரு சூப்பர் அட்மின் கட்டுப்பாட்டு அமைப்பு, இது இனிமேல் நடக்கும் பரிவர்த்தனைகளுக்கு மட்டுமே பொருந்தும் — கடந்தகால எந்த பதிவையும் மீண்டும் எழுதாது அல்லது தொந்தரவு செய்யாது, எனவே உங்கள் வரலாற்று புள்ளிவிவரங்கள் பதிவு செய்யப்பட்டபடியே இருக்கும்.",
      "faq.q7": "எனது தரவு தானாகவே காப்புப் பிரதி எடுக்கப்படுகிறதா?",
      "faq.a7": "ஆம் — திட்டமிடப்பட்ட தானியங்கு காப்புப்பிரதிகள் சூப்பர் அட்மின் மேற்பார்வையுடன் தானாகவே இயங்கும், மேலும் திட்டமிட்ட காப்புப்பிரதி ஒருபோதும் தோல்வியடைந்தால் உங்களுக்கு எச்சரிக்கை வரும் — எனவே பாதுகாப்பு நீங்கள் நினைவில் வைத்திருக்க வேண்டிய ஒன்றல்ல.",
      "cta.eyebrow": "நீங்கள் தயாரானவுடன்",
      "cta.heading": "உங்கள் கடையை ஒரே திரையில் கொண்டு வாருங்கள்.",
      "cta.sub": "இது பொருத்தமானதா என்று பார்க்க கிரெடிட் கார்டோ, விற்பனை அழைப்போ தேவையில்லை — இது உங்கள் கடை இயங்கும் விதத்திற்கு உண்மையில் பொருந்துகிறதா என்று ஒரு பார்வை போதும்.",
      "cta.secondary": "மீண்டும் அம்சங்களை ஆராயுங்கள்",
      "cta.form.name": "பெயர்",
      "cta.form.email": "மின்னஞ்சல்",
      "cta.form.phone": "தொலைபேசி (விருப்பத்தேர்வு)",
      "cta.form.phonePlaceholder": "10-இலக்க மொபைல் எண்",
      "cta.form.message": "செய்தி",
      "cta.form.submit": "செய்தியை அனுப்புங்கள்",
      "cta.form.sending": "அனுப்பப்படுகிறது…",
      "cta.form.successMsg": "உங்கள் மின்னஞ்சல் ஆப் உங்கள் செய்தியுடன் திறக்கும் — Send அழுத்தினால் போதும்.",
      "cta.form.errorRequired": "இந்தத் தகவல் அவசியம்.",
      "cta.form.errorEmail": "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
      "cta.form.errorGeneric": "ஏதோ தவறு நடந்தது — மீண்டும் முயற்சிக்கவும்.",
      "cta.form.orEmail": "மின்னஞ்சல் விரும்புகிறீர்களா? எங்களுக்கு எழுதுங்கள்",
      "footer.tagline": "இந்திய விவசாய உபகரண, ஹார்ட்வேர், மற்றும் பொது வர்த்தக கடைகளுக்கான கடை நிர்வாக மென்பொருள் — பில்லிங், இருப்பு, ஜிஎஸ்டி, மற்றும் உங்கள் சொந்த வாடிக்கையாளர் ஆப் அனைத்தும் ஒரே திரையில்.",
      "footer.col.product": "தயாரிப்பு",
      "footer.col.company": "நிறுவனம்",
      "footer.link.contact": "தொடர்பு கொள்ள",
      "footer.rights": "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      "footer.previewing": "தற்போது காட்டப்படுவது:",
    },
    hi: {
      "nav.features": "विशेषताएं",
      "nav.devices": "जहां भी आप काम करें",
      "nav.themes": "अपनी पसंद के अनुसार बनाएं",
      "nav.faq": "सामान्य प्रश्न",
      "nav.getStarted": "शुरू करें",
      "hero.eyebrow": "दुकान के काउंटर के लिए बनाया गया",
      "hero.title": 'अपनी <span class="accent">पूरी दुकान</span> चलाएं.<br />एक ही स्क्रीन से.',
      "hero.sub": "बिलिंग, इन्वेंटरी, जीएसटी, खरीद, और आपकी अपनी ग्राहक-केंद्रित दुकान — LedGo ERP नोटबुक, कैलकुलेटर, और आपकी दुकान द्वारा अब तक इस्तेमाल किए जा रहे तीन अलग-अलग ऐप्स की जगह लेता है।",
      "hero.cta.primary": "इसे काम करते देखें",
      "hero.cta.secondary": "विशेषताएं देखें",
      "hero.trust.modules": "मॉड्यूल",
      "hero.trust.languages": "भाषाएं",
      "hero.trust.aiVoice": "वॉइस और इनवॉइस",
      "hero.trust.gst": "जीएसटी अंतर्निहित",
      "stats.modules": "मुख्य मॉड्यूल",
      "stats.languages": "भारतीय भाषाएं",
      "stats.themes": "थीम विकल्प",
      "stats.apps": "नेटिव ऐप्स",
      "stats.always": "आपकी सुविधा से चलता है",
      "features.eyebrow": "इसमें क्या है",
      "features.heading": "एक दुकान के काउंटर को वास्तव में जो चाहिए, वह सब कुछ",
      "features.sub": "यह कोई सामान्य अकाउंटिंग टूल नहीं है जिसे ढाल दिया गया हो — यह इस आधार पर बनाया गया है कि एक भारतीय कृषि, हार्डवेयर, या सामान्य व्यापार की दुकान वास्तव में अपना दिन कैसे चलाती है।",
      "f1.title": "काउंटर की रफ्तार से चलने वाली बिलिंग",
      "f1.body": "उत्पाद खोजें, स्कैन करें, या बोलकर जोड़ें — हर लाइन पर जीएसटी अपने आप CGST+SGST या IGST में बंट जाता है, और हर बिल पर एक UPI QR होता है ताकि भुगतान होते ही बकाया अपने आप निपट जाए।",
      "f1.li1": "असली दुकान हार्डवेयर पर थर्मल रसीद और लेबल प्रिंटिंग",
      "f1.li2": "सेल्स ऑर्डर, रिटर्न, और उधार क्रेडिट — रुपये तक सटीक ट्रैकिंग",
      "f1.li3": "बैच और एक्सपायरी की जानकारी के साथ, पुराना स्टॉक अपने आप पहले बिकता है",
      "f2.title": "इन्वेंटरी जो कभी हिसाब नहीं खोती",
      "f2.body": "हर बैच की अपनी एक्सपायरी तारीख होती है। एक दुकान चलाएं या दस स्थान, हर एक का अपना गोदाम, और उनके बीच स्टॉक को एक असली ऑडिट ट्रेल के साथ ट्रांसफर करें।",
      "f2.li1": "लोकेशन, गोदाम, और उनके बीच स्टॉक ट्रांसफर",
      "f2.li2": "FIFO, LIFO, या भारित औसत लागत — हर कंपनी अपनी पसंद चुन सकती है",
      "f2.li3": "डेड स्टॉक, तेज़ बिकने वाले उत्पाद, और रीऑर्डर सुझाव, एक रिपोर्ट की दूरी पर",
      "f3.title": "बोलिए, फोटो खींचिए, हो गया",
      "f3.body": "बिक्री को ज़ोर से बोलें और कार्ट को अपने आप भरते देखें। किसी विक्रेता के कागज़ी इनवॉइस की फोटो खींचें और लाइनें, दरें — सब कुछ भरा हुआ पूरा खरीद प्रविष्टि पाएं।",
      "f3.li1": "वॉइस ऑर्डरिंग बोले गए शब्दों को असली उत्पादों से मिलाती है",
      "f3.li2": "AI इनवॉइस इम्पोर्ट फोटो खींचे या स्कैन किए गए बिल को पढ़ता है",
      "f3.li3": "Anthropic, Gemini, या OpenAI पर चलता है — दुकान जिस पर भी भरोसा करे",
      "f4.title": "एक स्टोर जो वाकई आपका अपना है",
      "f4.body": "हर दुकान को उसकी अपनी ब्रांडेड ऑर्डरिंग वेबसाइट मिलती है — ग्राहक असली कैटलॉग देखते हैं और असली ऑर्डर देते हैं — साथ ही अपने नाम, आइकन, और रंगों के साथ एक अलग Android ऐप भी, न कि किसी साझा मार्केटप्लेस लिस्टिंग में।",
      "f4.li1": "कस्टम डोमेन — yourshop.com, किसी और का सबडोमेन नहीं",
      "f4.li2": "ऑर्डर की स्थिति बदलते ही पुश नोटिफिकेशन",
      "f4.li3": "ऑर्डर सीधे उसी बिलिंग और स्टॉक सिस्टम में आते हैं",
      "f5.title": "रिपोर्ट जो असली सवाल का जवाब देती हैं",
      "f5.body": "पूरी लेजर, जीएसटी-रेडी सारांश, और सिस्टम में पहले से मौजूद उन्हीं बिलों से बना लाभ-हानि विवरण — साथ ही डेड स्टॉक, तेज़ बिकने वाले उत्पाद, और आगे क्या ऑर्डर करना है, एक क्लिक की दूरी पर।",
      "f5.li1": "सेल्स और परचेज़ रजिस्टर, जीएसटी सारांश, और पार्टी लेजर — एक क्लिक में एक्सपोर्ट के लिए तैयार",
      "f5.li2": "डेड स्टॉक, तेज़/धीमी गति से बिकने वाले उत्पाद, और खरीद योजना बताती है कि आगे बिल्कुल क्या रीऑर्डर करना है",
      "f5.li3": "बकाया और एजिंग — कौन कितना देता है, एक नज़र में, स्थान के हिसाब से फ़िल्टर करने योग्य",
      "f5.li4": "वित्तीय वर्ष बंद करना, और फिर से खोलना, बिना कोई आंकड़ा खोए",
      "f6.title": "एक प्लेटफॉर्म, आपकी हर दुकान",
      "f6.body": "एक सुपर एडमिन कंट्रोल टॉवर प्लेटफॉर्म की हर कंपनी की निगरानी करता है — कृषि, हार्डवेयर, और सामान्य व्यापार की दुकानें, सभी शामिल — हर दुकान के लिए फीचर-दर-फीचर स्विच के साथ: हर एक को बिल्कुल वही चालू करें जो उसे चाहिए, किसी पर कुछ थोपे बिना।",
      "f6.li1": "ट्रायल अवधि, लाइसेंसिंग, और स्वचालित बैकअप, अंतर्निहित",
      "f6.li2": "पूरे प्लेटफॉर्म का ऑडिट ट्रेल — हर कार्रवाई, जवाबदेह, हमेशा के लिए",
      "f6.li3": "हर व्यक्तिगत कार्रवाई तक भूमिका-आधारित अनुमतियां",
      "f7.title": "खरीद, ऑर्डर से भुगतान तक ट्रैक की गई",
      "f7.body": "एक खरीद ऑर्डर बनाएं, इसे बैच और एक्सपायरी के साथ लाइन दर लाइन दर्ज की गई एक वास्तविक स्टॉक-इन प्रविष्टि के रूप में प्राप्त करें, और हर विक्रेता के खिलाफ नकद या उधार भुगतान को ट्रैक करें — बिलिंग जितनी ही सटीकता, बस दूसरी दिशा में।",
      "f7.li1": "खरीद ऑर्डर सीधे एक वास्तविक स्टॉक-इन प्रविष्टि में बदल जाते हैं",
      "f7.li2": "विक्रेता भुगतान — नकद या उधार, भुगतान और शेष राशि रुपये तक ट्रैक की जाती है",
      "f7.li3": "खरीद रिटर्न स्टॉक और लेजर को साफ़-सुथरे तरीके से उलट देता है, किसी मैन्युअल समायोजन की ज़रूरत नहीं",
      "f8.title": "आपके काउंटर पर पहले से मौजूद हार्डवेयर के लिए बनाया गया",
      "f8.body": "थर्मल रसीद और लेबल प्रिंटर, बारकोड स्कैनर, और UPI QR कोड — LedGo ERP उन्हीं मशीनों से बात करता है जो एक दुकान पहले से रखती है, किसी खरीदे जाने वाले प्रोप्राइटरी डिवाइस से नहीं।",
      "f8.li1": "थर्मल रसीदें और उत्पाद लेबल सीधे प्रिंट होते हैं, कोई PDF बिचौलिया नहीं",
      "f8.li2": "बिलिंग और खरीद प्रविष्टि दोनों में बारकोड स्कैन करके जोड़ना",
      "f8.li3": "हर बिल पर एक UPI QR होता है — स्कैन होते ही बकाया अपने आप निपट जाता है",
      "f9.title": "हर ग्राहक संबंध, ट्रैक किया गया",
      "f9.body": "पूछताछ, फ़सल रोपण, और देखभाल-शेड्यूल रिमाइंडर — एक ऐसा CRM जो कृषि दुकान के असली बिक्री चक्र को समझता है, न कि किसी सामान्य कॉन्टैक्ट लिस्ट को मोड़-तोड़कर बनाया गया।",
      "f9.li1": "पहली कॉल से लेकर बिक्री पूरी होने तक पूछताछ ट्रैक की जाती है",
      "f9.li2": "फ़सल रोपण एक ग्राहक के खेत को अगले सीज़न में उसे क्या चाहिए होगा, उससे जोड़ता है",
      "f9.li3": "देखभाल शेड्यूल टेम्पलेट सही समय पर अपने आप रिमाइंडर भेजते हैं",
      "f10.title": "जांच पर खरी उतरने वाली सुरक्षा",
      "f10.body": "हर व्यक्तिगत कार्रवाई तक भूमिका-आधारित अनुमतियां, और हर बदलाव को हमेशा के लिए जवाबदेह ठहराने वाला पूरे प्लेटफॉर्म का ऑडिट ट्रेल — कुछ भी चुपचाप नहीं, कुछ भी अनट्रेसेबल नहीं।",
      "f10.li1": "हर कार्रवाई दर्ज होती है — कौन, क्या, और कब, स्थायी रूप से",
      "f10.li2": "अनुमतियां भूमिका, मॉड्यूल, और कार्रवाई के हिसाब से तय की जाती हैं",
      "f10.li3": "स्वचालित बैकअप शेड्यूल पर चलते हैं, सुपर एडमिन की निगरानी के साथ",
      "devices.eyebrow": "जहां भी आप काम करें, वहां चलता है",
      "devices.heading": "काउंटर पर मोबाइल। दुकान के फ़्लोर पर टैबलेट। बैक ऑफिस में डेस्कटॉप।",
      "devices.sub": "वही स्क्रीन, वाकई रिस्पॉन्सिव — छोटी स्क्रीन पर ठूंसा हुआ डेस्कटॉप लेआउट नहीं।",
      "devices.tab.mobile": "मोबाइल",
      "devices.tab.tablet": "टैबलेट",
      "devices.tab.desktop": "डेस्कटॉप",
      "devices.viewing": "वर्तमान में देखा जा रहा है:",
      "devices.page.dashboard": "डैशबोर्ड",
      "devices.page.billing": "बिलिंग",
      "devices.page.inventory": "इन्वेंटरी",
      "devices.page.purchase": "खरीद",
      "devices.page.reports": "रिपोर्ट",
      "devices.page.storefront": "स्टोर",
      "devices.page.platform": "प्लेटफॉर्म",
      "devices.page.hardware": "हार्डवेयर",
      "themes.eyebrow": "अपनी पसंद के अनुसार बनाएं",
      "themes.heading": "हर दुकान अपना खुद का रूप चुनती है",
      "themes.sub": "नौ थीम विकल्प और एक असली डार्क मोड — पूरा ऐप इसके साथ बदल जाता है। यह पेज भी उसी इंजन पर चलता है। आज़माकर देखें।",
      "theme.sub.green": "डिफ़ॉल्ट — आत्मविश्वासी, कृषि-प्रधान",
      "theme.sub.teal": "शांत और आधुनिक",
      "theme.sub.purple": "प्रीमियम, विशिष्ट",
      "theme.sub.orange": "गर्मजोशी भरा और ऊर्जावान",
      "theme.sub.blue": "हल्का और सहज",
      "theme.sub.indigo": "साहसी और केंद्रित",
      "themes.preview.dashboard": "डैशबोर्ड",
      "themes.preview.todaySales": "आज की बिक्री",
      "themes.preview.lowStock": "कम स्टॉक",
      "themes.preview.collections": "वसूली",
      "themes.preview.newSale": "नई बिक्री",
      "faq.eyebrow": "प्रश्न",
      "faq.heading": "जानने योग्य बातें",
      "faq.q1": "क्या यह गैर-कृषि दुकानों के लिए भी काम करता है?",
      "faq.a1": "हां। वही बिलिंग, जीएसटी, बैच, और इन्वेंटरी इंजन हार्डवेयर स्टोर और सामान्य व्यापार खुदरा विक्रेताओं के लिए उतनी ही अच्छी तरह ढल जाता है जितना यह कृषि-इनपुट दुकानों के लिए करता है — मूल तर्क नहीं बदलता, केवल शब्दावली बदलती है।",
      "faq.q2": "क्या मेरे कर्मचारी इसे तमिल, हिंदी, या किसी अन्य भाषा में इस्तेमाल कर सकते हैं?",
      "faq.a2": "हां — अंग्रेज़ी, तमिल, हिंदी, कन्नड़, और तेलुगु सभी को मूल रूप से समर्थन मिलता है, तुरंत मशीन-अनुवाद नहीं किया जाता।",
      "faq.q3": "क्या इसे चलाने के लिए मुझे तकनीकी होना ज़रूरी है?",
      "faq.a3": "नहीं। यह काउंटर पर मौजूद दुकान के कर्मचारियों द्वारा चलाए जाने के लिए बनाया गया है, किसी आईटी टीम के लिए नहीं — यही कारण है कि बिलिंग, प्रिंटिंग, और स्टॉक अपडेट को पांच नहीं, बल्कि एक क्लिक में करने के लिए डिज़ाइन किया गया है।",
      "faq.q4": "अगर मैं एक से ज़्यादा दुकानें चलाता हूं तो?",
      "faq.a4": "हर कंपनी को अपना अलग डेटा और अपनी अलग थीम मिलती है, साथ ही एक सुपर एडमिन व्यू जो सभी को एक ही जगह से देखता है — एक दुकान का डेटा कभी दूसरी दुकान के डेटा से नहीं मिलता।",
      "faq.q5": "क्या यह गैर-कृषि दुकानों के लिए भी काम करता है — जैसे हार्डवेयर या सामान्य व्यापार?",
      "faq.a5": "हां। एक सुपर एडमिन हर कंपनी के लिए सिर्फ वही मॉड्यूल चालू करता है जिसकी उसे ज़रूरत है — एक हार्डवेयर या सामान्य व्यापार की दुकान बाकी सभी की तरह ही उसी बिलिंग, जीएसटी, और इन्वेंटरी इंजन पर चलती है, बिना फ़सल रोपण या देखभाल शेड्यूल टेम्पलेट जैसी कृषि-विशिष्ट स्क्रीन के उसके मेनू में कभी दिखे।",
      "faq.q6": "अगर मैं बाद में स्टॉक लागत की गणना का तरीका बदल दूं तो क्या होगा?",
      "faq.a6": "LedGo ERP हर कंपनी के लिए चुनी जा सकने वाली FIFO, LIFO, या भारित औसत लागत पद्धति का समर्थन करता है। बदलाव एक सुपर एडमिन-नियंत्रित सेटिंग है जो आगे से लागू होती है — यह किसी भी पिछले लेन-देन को न तो फिर से लिखती है और न ही उसमें बदलाव करती है, इसलिए आपके पुराने आंकड़े जस के तस बने रहते हैं।",
      "faq.q7": "क्या मेरा डेटा अपने आप बैकअप होता है?",
      "faq.a7": "हां — शेड्यूल किए गए स्वचालित बैकअप सुपर एडमिन की निगरानी के साथ अपने आप चलते हैं, और अगर कोई शेड्यूल किया गया बैकअप कभी विफल हो जाए तो आपको सूचित किया जाता है — इसलिए सुरक्षा कुछ ऐसा नहीं है जिसे आपको खुद याद रखना पड़े।",
      "cta.eyebrow": "जब आप तैयार हों",
      "cta.heading": "अपनी दुकान को एक स्क्रीन पर लाएं।",
      "cta.sub": "यह देखने के लिए कि क्या यह आपके अनुकूल है, किसी क्रेडिट कार्ड या सेल्स कॉल की ज़रूरत नहीं — बस एक नज़र डालें कि यह वाकई आपकी दुकान चलाने के तरीके से मेल खाता है या नहीं।",
      "cta.secondary": "फिर से विशेषताएं देखें",
      "cta.form.name": "नाम",
      "cta.form.email": "ईमेल",
      "cta.form.phone": "फ़ोन (वैकल्पिक)",
      "cta.form.phonePlaceholder": "10 अंकों का मोबाइल नंबर",
      "cta.form.message": "संदेश",
      "cta.form.submit": "संदेश भेजें",
      "cta.form.sending": "भेजा जा रहा है…",
      "cta.form.successMsg": "आपका ईमेल ऐप आपके संदेश के साथ खुल जाएगा — बस Send दबाएँ।",
      "cta.form.errorRequired": "यह फ़ील्ड आवश्यक है।",
      "cta.form.errorEmail": "एक मान्य ईमेल पता दर्ज करें।",
      "cta.form.errorGeneric": "कुछ गड़बड़ हो गई — कृपया फिर से प्रयास करें।",
      "cta.form.orEmail": "ईमेल पसंद करते हैं? हमें यहां लिखें",
      "footer.tagline": "भारतीय कृषि, हार्डवेयर, और सामान्य व्यापार खुदरा विक्रेताओं के लिए दुकान-प्रबंधन सॉफ़्टवेयर — बिलिंग, इन्वेंटरी, जीएसटी, और आपकी अपनी ग्राहक ऐप के लिए एक ही स्क्रीन।",
      "footer.col.product": "उत्पाद",
      "footer.col.company": "कंपनी",
      "footer.link.contact": "संपर्क करें",
      "footer.rights": "सर्वाधिकार सुरक्षित।",
      "footer.previewing": "वर्तमान में देखा जा रहा है:",
    },
    kn: {
      "nav.features": "ವೈಶಿಷ್ಟ್ಯಗಳು",
      "nav.devices": "ನೀವು ಕೆಲಸ ಮಾಡುವ ಎಲ್ಲೆಡೆ",
      "nav.themes": "ನಿಮ್ಮದೇ ಶೈಲಿಯಲ್ಲಿ ಮಾಡಿಕೊಳ್ಳಿ",
      "nav.faq": "ಪ್ರಶ್ನೆಗಳು",
      "nav.getStarted": "ಪ್ರಾರಂಭಿಸಿ",
      "hero.eyebrow": "ಅಂಗಡಿ ಕೌಂಟರ್‌ಗಾಗಿ ರೂಪಿಸಲಾಗಿದೆ",
      "hero.title": 'ನಿಮ್ಮ <span class="accent">ಇಡೀ ಅಂಗಡಿಯನ್ನು</span> ನಡೆಸಿ.<br />ಒಂದೇ ಪರದೆಯಿಂದ.',
      "hero.sub": "ಬಿಲ್ಲಿಂಗ್, ದಾಸ್ತಾನು, ಜಿಎಸ್‌ಟಿ, ಖರೀದಿ, ಮತ್ತು ನಿಮ್ಮದೇ ಗ್ರಾಹಕ-ಆಧಾರಿತ ಅಂಗಡಿ — LedGo ERP ನೋಟ್‌ಬುಕ್, ಕ್ಯಾಲ್ಕುಲೇಟರ್, ಮತ್ತು ನಿಮ್ಮ ಅಂಗಡಿ ಇಷ್ಟು ದಿನ ಬಳಸುತ್ತಿದ್ದ ಮೂರು ಬೇರೆ ಬೇರೆ ಆ್ಯಪ್‌ಗಳ ಜಾಗವನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.",
      "hero.cta.primary": "ಕಾರ್ಯಾಚರಣೆಯಲ್ಲಿ ನೋಡಿ",
      "hero.cta.secondary": "ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
      "hero.trust.modules": "ಮಾಡ್ಯೂಲ್‌ಗಳು",
      "hero.trust.languages": "ಭಾಷೆಗಳು",
      "hero.trust.aiVoice": "ಧ್ವನಿ ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್",
      "hero.trust.gst": "ಜಿಎಸ್‌ಟಿ ಅಂತರ್ಗತ",
      "stats.modules": "ಪ್ರಮುಖ ಮಾಡ್ಯೂಲ್‌ಗಳು",
      "stats.languages": "ಭಾರತೀಯ ಭಾಷೆಗಳು",
      "stats.themes": "ಥೀಮ್ ಆಯ್ಕೆಗಳು",
      "stats.apps": "ಸ್ವಂತ ಆ್ಯಪ್‌ಗಳು",
      "stats.always": "ನಿಮ್ಮ ಅನುಕೂಲಕ್ಕೆ ತಕ್ಕಂತೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
      "features.eyebrow": "ಒಳಗೆ ಏನಿದೆ",
      "features.heading": "ಅಂಗಡಿ ಕೌಂಟರ್‌ಗೆ ನಿಜವಾಗಿಯೂ ಬೇಕಾಗಿರುವ ಎಲ್ಲವೂ",
      "features.sub": "ಆಕಾರ ಬದಲಿಸಿದ ಸಾಮಾನ್ಯ ಅಕೌಂಟಿಂಗ್ ಟೂಲ್ ಅಲ್ಲ — ಭಾರತೀಯ ಕೃಷಿ, ಹಾರ್ಡ್‌ವೇರ್, ಅಥವಾ ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರದ ಅಂಗಡಿ ನಿಜವಾಗಿಯೂ ತನ್ನ ದಿನವನ್ನು ಹೇಗೆ ನಡೆಸುತ್ತದೆ ಎಂಬುದರ ಸುತ್ತ ರೂಪಿಸಲಾಗಿದೆ.",
      "f1.title": "ಕೌಂಟರ್‌ನ ವೇಗಕ್ಕೆ ತಕ್ಕಂತೆ ಇರುವ ಬಿಲ್ಲಿಂಗ್",
      "f1.body": "ಉತ್ಪನ್ನವನ್ನು ಹುಡುಕಿ, ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಅಥವಾ ಹೇಳಿ ಸೇರಿಸಿ — ಪ್ರತಿ ಸಾಲಿನಲ್ಲೂ ಜಿಎಸ್‌ಟಿ ತಾನಾಗಿಯೇ CGST+SGST ಅಥವಾ IGST ಆಗಿ ವಿಭಜನೆಯಾಗುತ್ತದೆ, ಮತ್ತು ಪ್ರತಿ ಬಿಲ್‌ನಲ್ಲೂ UPI QR ಇರುವುದರಿಂದ ಪಾವತಿಯಾದ ಕೂಡಲೇ ಬಾಕಿ ತಾನಾಗಿಯೇ ತೀರುತ್ತದೆ.",
      "f1.li1": "ನಿಜವಾದ ಅಂಗಡಿ ಹಾರ್ಡ್‌ವೇರ್‌ನಲ್ಲಿ ಥರ್ಮಲ್ ರಸೀದಿ ಮತ್ತು ಲೇಬಲ್ ಮುದ್ರಣ",
      "f1.li2": "ಮಾರಾಟ ಆದೇಶಗಳು, ಹಿಂತಿರುಗಿಸುವಿಕೆ, ಮತ್ತು ಸಾಲ ಖಾತೆ — ರೂಪಾಯಿಯವರೆಗೆ ನಿಖರವಾಗಿ ಟ್ರ್ಯಾಕ್ ಆಗುತ್ತದೆ",
      "f1.li3": "ಬ್ಯಾಚ್ ಮತ್ತು ಅವಧಿ ಮುಗಿಯುವಿಕೆ ಅರಿತು, ಹಳೆಯ ದಾಸ್ತಾನು ಮೊದಲು ಮಾರಾಟವಾಗುತ್ತದೆ — ತಾನಾಗಿಯೇ",
      "f2.title": "ಎಂದಿಗೂ ಲೆಕ್ಕ ತಪ್ಪದ ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ",
      "f2.body": "ಪ್ರತಿ ಬ್ಯಾಚ್‌ಗೂ ಅದರದೇ ಆದ ಅವಧಿ ಮುಗಿಯುವ ದಿನಾಂಕವಿದೆ. ಒಂದು ಅಂಗಡಿ ಅಥವಾ ಹತ್ತು ಸ್ಥಳಗಳನ್ನು ನಡೆಸಿ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ಅದರದೇ ಗೋದಾಮುಗಳೊಂದಿಗೆ, ಅವುಗಳ ನಡುವೆ ನಿಜವಾದ ಆಡಿಟ್ ಟ್ರೇಲ್‌ನೊಂದಿಗೆ ದಾಸ್ತಾನನ್ನು ವರ್ಗಾಯಿಸಿ.",
      "f2.li1": "ಸ್ಥಳಗಳು, ಗೋದಾಮುಗಳು, ಮತ್ತು ಅವುಗಳ ನಡುವೆ ದಾಸ್ತಾನು ವರ್ಗಾವಣೆ",
      "f2.li2": "FIFO, LIFO, ಅಥವಾ ಸರಾಸರಿ ವೆಚ್ಚ ವಿಧಾನ — ಪ್ರತಿ ಕಂಪನಿಗೆ ಆಯ್ಕೆ ಮಾಡಬಹುದು",
      "f2.li3": "ಮಾರಾಟವಾಗದ ದಾಸ್ತಾನು, ವೇಗವಾಗಿ ಮಾರಾಟವಾಗುವ ಉತ್ಪನ್ನಗಳು, ಮತ್ತು ಮರು-ಆದೇಶ ಸಲಹೆಗಳು — ಒಂದು ವರದಿಯಷ್ಟೇ ದೂರದಲ್ಲಿ",
      "f3.title": "ಹೇಳಿ, ಫೋಟೋ ತೆಗೆಯಿರಿ, ಮುಗಿಯಿತು",
      "f3.body": "ಮಾರಾಟವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಹೇಳಿ ಮತ್ತು ಕಾರ್ಟ್ ತಾನಾಗಿಯೇ ತುಂಬುವುದನ್ನು ನೋಡಿ. ಮಾರಾಟಗಾರರ ಕಾಗದದ ಇನ್‌ವಾಯ್ಸ್‌ನ ಫೋಟೋ ತೆಗೆದು, ಸಾಲುಗಳು, ದರಗಳು ಸೇರಿದಂತೆ ಸಂಪೂರ್ಣವಾಗಿ ಭರ್ತಿಯಾದ ಖರೀದಿ ನಮೂದನ್ನು ಪಡೆಯಿರಿ.",
      "f3.li1": "ವಾಯ್ಸ್ ಆರ್ಡರಿಂಗ್ ಮಾತನಾಡಿದ ಪದಗಳನ್ನು ನಿಜವಾದ ಉತ್ಪನ್ನಗಳೊಂದಿಗೆ ಹೊಂದಿಸುತ್ತದೆ",
      "f3.li2": "AI ಇನ್‌ವಾಯ್ಸ್ ಇಂಪೋರ್ಟ್ ಫೋಟೋ ತೆಗೆದ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಬಿಲ್ ಅನ್ನು ಓದುತ್ತದೆ",
      "f3.li3": "Anthropic, Gemini, ಅಥವಾ OpenAI ಮೇಲೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ — ಅಂಗಡಿ ಯಾವುದನ್ನು ನಂಬುತ್ತದೋ ಅದರ ಮೇಲೆ",
      "f4.title": "ನಿಜವಾಗಿಯೂ ನಿಮ್ಮದೇ ಆದ ಮಳಿಗೆ",
      "f4.body": "ಪ್ರತಿ ಅಂಗಡಿಗೂ ಅದರದೇ ಬ್ರಾಂಡೆಡ್ ಆರ್ಡರಿಂಗ್ ವೆಬ್‌ಸೈಟ್ ಸಿಗುತ್ತದೆ — ಗ್ರಾಹಕರು ನಿಜವಾದ ಕ್ಯಾಟಲಾಗ್ ಅನ್ನು ವೀಕ್ಷಿಸಿ ನಿಜವಾದ ಆದೇಶಗಳನ್ನು ನೀಡುತ್ತಾರೆ — ಜೊತೆಗೆ ಅದರದೇ ಹೆಸರು, ಐಕಾನ್, ಬಣ್ಣಗಳೊಂದಿಗೆ ಪ್ರತ್ಯೇಕ Android ಆ್ಯಪ್ ಕೂಡ, ಹಂಚಿಕೆಯ ಮಾರುಕಟ್ಟೆ ಪಟ್ಟಿ ಅಲ್ಲ.",
      "f4.li1": "ಕಸ್ಟಮ್ ಡೊಮೇನ್‌ಗಳು — yourshop.com, ಬೇರೊಬ್ಬರ ಸಬ್‌ಡೊಮೇನ್ ಅಲ್ಲ",
      "f4.li2": "ಆದೇಶದ ಸ್ಥಿತಿ ಬದಲಾದ ಕ್ಷಣವೇ ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು",
      "f4.li3": "ಆದೇಶಗಳು ನೇರವಾಗಿ ಅದೇ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ದಾಸ್ತಾನು ವ್ಯವಸ್ಥೆಗೆ ಹರಿಯುತ್ತವೆ",
      "f5.title": "ನಿಜವಾದ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುವ ವರದಿಗಳು",
      "f5.body": "ಸಂಪೂರ್ಣ ಲೆಡ್ಜರ್‌ಗಳು, ಜಿಎಸ್‌ಟಿ-ಸಿದ್ಧ ಸಾರಾಂಶಗಳು, ಮತ್ತು ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಈಗಾಗಲೇ ಇರುವ ಅದೇ ಬಿಲ್‌ಗಳಿಂದ ರಚಿಸಲಾದ ಲಾಭ-ನಷ್ಟ ಹೇಳಿಕೆ — ಜೊತೆಗೆ ಮಾರಾಟವಾಗದ ದಾಸ್ತಾನು, ವೇಗವಾಗಿ ಮಾರಾಟವಾಗುವ ಉತ್ಪನ್ನಗಳು, ಮತ್ತು ಮುಂದೆ ಏನು ಆರ್ಡರ್ ಮಾಡಬೇಕು ಎಂಬುದು ಒಂದು ಕ್ಲಿಕ್ ದೂರದಲ್ಲಿ.",
      "f5.li1": "ಸೇಲ್ಸ್ ಮತ್ತು ಪರ್ಚೇಸ್ ರಿಜಿಸ್ಟರ್, ಜಿಎಸ್‌ಟಿ ಸಾರಾಂಶ, ಮತ್ತು ಪಾರ್ಟಿ ಲೆಡ್ಜರ್ — ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಎಕ್ಸ್‌ಪೋರ್ಟ್‌ಗೆ ಸಿದ್ಧ",
      "f5.li2": "ಡೆಡ್ ಸ್ಟಾಕ್, ವೇಗ/ನಿಧಾನ ಮಾರಾಟ ಉತ್ಪನ್ನಗಳು, ಮತ್ತು ಖರೀದಿ ಯೋಜನೆ ನಿಖರವಾಗಿ ಏನನ್ನು ಮರು-ಆರ್ಡರ್ ಮಾಡಬೇಕು ಎಂದು ಸೂಚಿಸುತ್ತವೆ",
      "f5.li3": "ಬಾಕಿ ಮತ್ತು ಏಜಿಂಗ್ — ಯಾರು ಎಷ್ಟು ಪಾವತಿಸಬೇಕು ಎಂಬುದು ಒಂದೇ ನೋಟದಲ್ಲಿ, ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ಫಿಲ್ಟರ್ ಮಾಡಬಹುದು",
      "f5.li4": "ಆರ್ಥಿಕ ವರ್ಷ ಮುಕ್ತಾಯ, ಮತ್ತು ಮರು-ತೆರೆಯುವಿಕೆ, ಒಂದು ಅಂಕಿಯನ್ನೂ ಕಳೆದುಕೊಳ್ಳದೆ",
      "f6.title": "ಒಂದು ವೇದಿಕೆ, ನೀವು ನಡೆಸುವ ಪ್ರತಿ ಅಂಗಡಿ",
      "f6.body": "ಒಂದು ಸೂಪರ್ ಅಡ್ಮಿನ್ ನಿಯಂತ್ರಣ ಗೋಪುರವು ವೇದಿಕೆಯ ಪ್ರತಿ ಕಂಪನಿಯನ್ನೂ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತದೆ — ಕೃಷಿ, ಹಾರ್ಡ್‌ವೇರ್, ಮತ್ತು ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರದ ಅಂಗಡಿಗಳು ಸೇರಿದಂತೆ — ಪ್ರತಿ ಅಂಗಡಿಗೂ ವೈಶಿಷ್ಟ್ಯ-ವಾರು ಸ್ವಿಚ್‌ಗಳೊಂದಿಗೆ: ಪ್ರತಿಯೊಂದಕ್ಕೂ ಬೇಕಾಗಿರುವುದನ್ನು ಮಾತ್ರ ಆನ್ ಮಾಡಿ, ಯಾರ ಮೇಲೂ ಬಲವಂತವಿಲ್ಲ.",
      "f6.li1": "ಟ್ರಯಲ್ ಅವಧಿ, ಪರವಾನಗಿ, ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್‌ಗಳು, ಅಂತರ್ಗತವಾಗಿ",
      "f6.li2": "ವೇದಿಕೆಯಾದ್ಯಂತ ಆಡಿಟ್ ಟ್ರೇಲ್ — ಪ್ರತಿ ಕ್ರಿಯೆಯೂ, ಜವಾಬ್ದಾರಿಯುತವಾಗಿ, ಶಾಶ್ವತವಾಗಿ ದಾಖಲು",
      "f6.li3": "ಪ್ರತಿ ಪ್ರತ್ಯೇಕ ಕ್ರಿಯೆಗೂ ಪಾತ್ರ-ಆಧಾರಿತ ಅನುಮತಿಗಳು",
      "f7.title": "ಆರ್ಡರ್‌ನಿಂದ ಪಾವತಿಯವರೆಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾದ ಖರೀದಿ",
      "f7.body": "ಒಂದು ಖರೀದಿ ಆದೇಶವನ್ನು ಸೃಷ್ಟಿಸಿ, ಬ್ಯಾಚ್ ಮತ್ತು ಅವಧಿ ಮುಗಿಯುವಿಕೆಯೊಂದಿಗೆ ಸಾಲು ಸಾಲಾಗಿ ದಾಖಲಿಸಲಾದ ನಿಜವಾದ ದಾಸ್ತಾನು-ಪ್ರವೇಶವಾಗಿ ಸ್ವೀಕರಿಸಿ, ಮತ್ತು ಪ್ರತಿ ಮಾರಾಟಗಾರರ ವಿರುದ್ಧ ನಗದು ಅಥವಾ ಸಾಲ ಪಾವತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ — ಬಿಲ್ಲಿಂಗ್‌ನಷ್ಟೇ ನಿಖರತೆ, ಬೇರೆ ದಿಕ್ಕಿನಲ್ಲಿ.",
      "f7.li1": "ಖರೀದಿ ಆದೇಶಗಳು ನೇರವಾಗಿ ನಿಜವಾದ ದಾಸ್ತಾನು-ಪ್ರವೇಶವಾಗಿ ಪರಿವರ್ತನೆಗೊಳ್ಳುತ್ತವೆ",
      "f7.li2": "ಮಾರಾಟಗಾರರ ಪಾವತಿಗಳು — ನಗದು ಅಥವಾ ಸಾಲ, ಪಾವತಿಸಿದ ಮತ್ತು ಬಾಕಿ ರೂಪಾಯಿಯವರೆಗೆ ಟ್ರ್ಯಾಕ್ ಆಗುತ್ತದೆ",
      "f7.li3": "ಖರೀದಿ ರಿಟರ್ನ್‌ಗಳು ದಾಸ್ತಾನು ಮತ್ತು ಲೆಡ್ಜರ್ ಅನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಹಿಂತಿರುಗಿಸುತ್ತವೆ, ಯಾವುದೇ ಹಸ್ತಚಾಲಿತ ಹೊಂದಾಣಿಕೆ ಅಗತ್ಯವಿಲ್ಲ",
      "f8.title": "ನಿಮ್ಮ ಕೌಂಟರ್‌ನಲ್ಲಿ ಈಗಾಗಲೇ ಇರುವ ಹಾರ್ಡ್‌ವೇರ್‌ಗಾಗಿ ರೂಪಿಸಲಾಗಿದೆ",
      "f8.body": "ಥರ್ಮಲ್ ರಸೀದಿ ಮತ್ತು ಲೇಬಲ್ ಪ್ರಿಂಟರ್‌ಗಳು, ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನರ್‌ಗಳು, ಮತ್ತು UPI QR ಕೋಡ್‌ಗಳು — ಒಂದು ಅಂಗಡಿ ಈಗಾಗಲೇ ಹೊಂದಿರುವ ಯಂತ್ರಗಳೊಂದಿಗೆ LedGo ERP ಮಾತನಾಡುತ್ತದೆ, ನೀವು ಖರೀದಿಸಬೇಕಾದ ಸ್ವಾಮ್ಯದ ಸಾಧನವಲ್ಲ.",
      "f8.li1": "ಥರ್ಮಲ್ ರಸೀದಿಗಳು ಮತ್ತು ಉತ್ಪನ್ನ ಲೇಬಲ್‌ಗಳು ನೇರವಾಗಿ ಮುದ್ರಣಗೊಳ್ಳುತ್ತವೆ, PDF ಮಧ್ಯವರ್ತಿ ಇಲ್ಲ",
      "f8.li2": "ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ಖರೀದಿ ಪ್ರವೇಶ ಎರಡರಲ್ಲೂ ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಸೇರಿಸಬಹುದು",
      "f8.li3": "ಪ್ರತಿ ಬಿಲ್‌ನಲ್ಲೂ UPI QR ಇರುತ್ತದೆ — ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಕ್ಷಣವೇ ಬಾಕಿ ತಾನಾಗಿಯೇ ತೀರುತ್ತದೆ",
      "f9.title": "ಪ್ರತಿ ಗ್ರಾಹಕ ಸಂಬಂಧವೂ, ಟ್ರ್ಯಾಕ್ ಆಗುತ್ತದೆ",
      "f9.body": "ವಿಚಾರಣೆಗಳು, ಬೆಳೆ ನಾಟಿಗಳು, ಮತ್ತು ಆರೈಕೆ-ವೇಳಾಪಟ್ಟಿ ಜ್ಞಾಪನೆಗಳು — ಕೃಷಿ ಅಂಗಡಿಯ ನಿಜವಾದ ಮಾರಾಟ ಚಕ್ರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವ CRM, ಆಕಾರ ಬದಲಿಸಿದ ಸಾಮಾನ್ಯ ಸಂಪರ್ಕ ಪಟ್ಟಿಯಲ್ಲ.",
      "f9.li1": "ಮೊದಲ ಕರೆಯಿಂದ ಮುಗಿದ ಮಾರಾಟದವರೆಗೆ ವಿಚಾರಣೆಗಳು ಟ್ರ್ಯಾಕ್ ಆಗುತ್ತವೆ",
      "f9.li2": "ಬೆಳೆ ನಾಟಿಗಳು ಗ್ರಾಹಕರ ಹೊಲವನ್ನು ಮುಂದಿನ ಋತುವಿನಲ್ಲಿ ಅವರಿಗೆ ಬೇಕಾಗುವುದರೊಂದಿಗೆ ಜೋಡಿಸುತ್ತವೆ",
      "f9.li3": "ಆರೈಕೆ ವೇಳಾಪಟ್ಟಿ ಟೆಂಪ್ಲೇಟ್‌ಗಳು ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ತಾನಾಗಿಯೇ ಜ್ಞಾಪನೆಗಳನ್ನು ಕಳುಹಿಸುತ್ತವೆ",
      "f10.title": "ಪರಿಶೀಲನೆಗೆ ಸರಿಹೊಂದುವ ಭದ್ರತೆ",
      "f10.body": "ಪ್ರತಿ ಪ್ರತ್ಯೇಕ ಕ್ರಿಯೆಗೂ ಪಾತ್ರ-ಆಧಾರಿತ ಅನುಮತಿಗಳು, ಮತ್ತು ಪ್ರತಿ ಬದಲಾವಣೆಯನ್ನೂ ಶಾಶ್ವತವಾಗಿ ಜವಾಬ್ದಾರಿಯುತಗೊಳಿಸುವ ವೇದಿಕೆಯಾದ್ಯಂತ ಆಡಿಟ್ ಟ್ರೇಲ್ — ಏನೂ ಮೌನವಾಗಿಲ್ಲ, ಏನೂ ಪತ್ತೆಹಚ್ಚಲಾಗದಂತಿಲ್ಲ.",
      "f10.li1": "ಪ್ರತಿ ಕ್ರಿಯೆಯೂ ದಾಖಲಾಗುತ್ತದೆ — ಯಾರು, ಏನು, ಮತ್ತು ಯಾವಾಗ, ಶಾಶ್ವತವಾಗಿ",
      "f10.li2": "ಪಾತ್ರ, ಮಾಡ್ಯೂಲ್, ಕ್ರಿಯೆಯ ಆಧಾರದ ಮೇಲೆ ಅನುಮತಿಗಳನ್ನು ಹೊಂದಿಸಲಾಗುತ್ತದೆ",
      "f10.li3": "ಸೂಪರ್ ಅಡ್ಮಿನ್ ಮೇಲ್ವಿಚಾರಣೆಯೊಂದಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್‌ಗಳು ವೇಳಾಪಟ್ಟಿಯಂತೆ ಚಲಿಸುತ್ತವೆ",
      "devices.eyebrow": "ನೀವು ಕೆಲಸ ಮಾಡುವ ಎಲ್ಲೆಡೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
      "devices.heading": "ಕೌಂಟರ್‌ನಲ್ಲಿ ಮೊಬೈಲ್. ಮಳಿಗೆಯ ನೆಲದ ಮೇಲೆ ಟ್ಯಾಬ್ಲೆಟ್. ಹಿಂಬಾಗಿಲ ಕಚೇರಿಯಲ್ಲಿ ಡೆಸ್ಕ್‌ಟಾಪ್.",
      "devices.sub": "ಅದೇ ಪರದೆ, ನಿಜವಾಗಿಯೂ ಸ್ಪಂದನಶೀಲ — ಚಿಕ್ಕ ಪರದೆಗೆ ತುರುಕಿದ ಇಕ್ಕಟ್ಟಾದ ಡೆಸ್ಕ್‌ಟಾಪ್ ವಿನ್ಯಾಸವಲ್ಲ.",
      "devices.tab.mobile": "ಮೊಬೈಲ್",
      "devices.tab.tablet": "ಟ್ಯಾಬ್ಲೆಟ್",
      "devices.tab.desktop": "ಡೆಸ್ಕ್‌ಟಾಪ್",
      "devices.viewing": "ಪ್ರಸ್ತುತ ವೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ:",
      "devices.page.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "devices.page.billing": "ಬಿಲ್ಲಿಂಗ್",
      "devices.page.inventory": "ದಾಸ್ತಾನು",
      "devices.page.purchase": "ಖರೀದಿ",
      "devices.page.reports": "ವರದಿಗಳು",
      "devices.page.storefront": "ಮಳಿಗೆ",
      "devices.page.platform": "ವೇದಿಕೆ",
      "devices.page.hardware": "ಹಾರ್ಡ್‌ವೇರ್",
      "themes.eyebrow": "ನಿಮ್ಮದೇ ಶೈಲಿಯಲ್ಲಿ ಮಾಡಿಕೊಳ್ಳಿ",
      "themes.heading": "ಪ್ರತಿ ಅಂಗಡಿಯೂ ತನ್ನದೇ ಆದ ನೋಟವನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ",
      "themes.sub": "ಒಂಬತ್ತು ಥೀಮ್ ಆಯ್ಕೆಗಳು ಮತ್ತು ನಿಜವಾದ ಡಾರ್ಕ್ ಮೋಡ್ — ಇಡೀ ಆ್ಯಪ್ ಅದರೊಂದಿಗೆ ಬದಲಾಗುತ್ತದೆ. ಈ ಪುಟವೂ ಅದೇ ಎಂಜಿನ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ. ಪ್ರಯತ್ನಿಸಿ ನೋಡಿ.",
      "theme.sub.green": "ಡೀಫಾಲ್ಟ್ — ಆತ್ಮವಿಶ್ವಾಸಭರಿತ, ಕೃಷಿ-ಆಧಾರಿತ",
      "theme.sub.teal": "ಶಾಂತ ಮತ್ತು ಆಧುನಿಕ",
      "theme.sub.purple": "ಪ್ರೀಮಿಯಂ, ವಿಶಿಷ್ಟ",
      "theme.sub.orange": "ಬೆಚ್ಚಗಿನ ಮತ್ತು ಚೈತನ್ಯಶೀಲ",
      "theme.sub.blue": "ಹಗುರ ಮತ್ತು ಸುಲಭಗ್ರಾಹ್ಯ",
      "theme.sub.indigo": "ದಿಟ್ಟ ಮತ್ತು ಕೇಂದ್ರೀಕೃತ",
      "themes.preview.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "themes.preview.todaySales": "ಇಂದಿನ ಮಾರಾಟ",
      "themes.preview.lowStock": "ಕಡಿಮೆ ದಾಸ್ತಾನು",
      "themes.preview.collections": "ವಸೂಲಾತಿ",
      "themes.preview.newSale": "ಹೊಸ ಮಾರಾಟ",
      "faq.eyebrow": "ಪ್ರಶ್ನೆಗಳು",
      "faq.heading": "ತಿಳಿದುಕೊಳ್ಳಬೇಕಾದ ವಿಷಯಗಳು",
      "faq.q1": "ಇದು ಕೃಷಿಯೇತರ ಅಂಗಡಿಗಳಿಗೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆಯೇ?",
      "faq.a1": "ಹೌದು. ಅದೇ ಬಿಲ್ಲಿಂಗ್, ಜಿಎಸ್‌ಟಿ, ಬ್ಯಾಚ್, ಮತ್ತು ದಾಸ್ತಾನು ಎಂಜಿನ್ ಕೃಷಿ-ಸಾಮಗ್ರಿ ಅಂಗಡಿಗಳಿಗೆ ಎಷ್ಟು ಚೆನ್ನಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೋ ಅಷ್ಟೇ ಚೆನ್ನಾಗಿ ಹಾರ್ಡ್‌ವೇರ್ ಅಂಗಡಿಗಳು ಮತ್ತು ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರಿಗಳಿಗಾಗಿ ಮರುಸಂರಚನೆಗೊಳ್ಳುತ್ತದೆ — ಮೂಲ ತರ್ಕ ಬದಲಾಗುವುದಿಲ್ಲ, ಪದಗಳು ಮಾತ್ರ ಬದಲಾಗುತ್ತವೆ.",
      "faq.q2": "ನನ್ನ ಸಿಬ್ಬಂದಿ ಇದನ್ನು ತಮಿಳು, ಹಿಂದಿ, ಅಥವಾ ಇನ್ನೊಂದು ಭಾಷೆಯಲ್ಲಿ ಬಳಸಬಹುದೇ?",
      "faq.a2": "ಹೌದು — ಇಂಗ್ಲಿಷ್, ತಮಿಳು, ಹಿಂದಿ, ಕನ್ನಡ, ಮತ್ತು ತೆಲುಗು ಎಲ್ಲವೂ ಸಹಜವಾಗಿ ಬೆಂಬಲಿತವಾಗಿವೆ, ತಕ್ಷಣಕ್ಕೆ ಯಂತ್ರ-ಅನುವಾದ ಮಾಡಿದ್ದಲ್ಲ.",
      "faq.q3": "ಇದನ್ನು ನಡೆಸಲು ನಾನು ತಾಂತ್ರಿಕವಾಗಿ ಪರಿಣತನಾಗಿರಬೇಕೇ?",
      "faq.a3": "ಇಲ್ಲ. ಇದನ್ನು ಐಟಿ ತಂಡವಲ್ಲ, ಕೌಂಟರ್‌ನಲ್ಲಿರುವ ಅಂಗಡಿ ಸಿಬ್ಬಂದಿಯೇ ನಡೆಸುವಂತೆ ರೂಪಿಸಲಾಗಿದೆ — ಬಿಲ್ಲಿಂಗ್, ಮುದ್ರಣ, ಮತ್ತು ದಾಸ್ತಾನು ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಐದಲ್ಲ, ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಮಾಡುವಂತೆ ವಿನ್ಯಾಸಗೊಳಿಸಿರುವುದಕ್ಕೂ ಇದೇ ಕಾರಣ.",
      "faq.q4": "ನಾನು ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಂಗಡಿಗಳನ್ನು ನಡೆಸಿದರೆ?",
      "faq.a4": "ಪ್ರತಿ ಕಂಪನಿಗೂ ತನ್ನದೇ ಪ್ರತ್ಯೇಕ ಡೇಟಾ ಮತ್ತು ತನ್ನದೇ ಥೀಮ್ ಸಿಗುತ್ತದೆ, ಜೊತೆಗೆ ಎಲ್ಲವನ್ನೂ ಒಂದೇ ಸ್ಥಳದಿಂದ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುವ ಸೂಪರ್ ಅಡ್ಮಿನ್ ವೀಕ್ಷಣೆಯೊಂದಿಗೆ — ಒಂದು ಅಂಗಡಿಯ ಡೇಟಾ ಇನ್ನೊಂದರ ಡೇಟಾದೊಂದಿಗೆ ಎಂದಿಗೂ ಬೆರೆಯುವುದಿಲ್ಲ.",
      "faq.q5": "ಇದು ಕೃಷಿಯೇತರ ಅಂಗಡಿಗಳಿಗೂ — ಹಾರ್ಡ್‌ವೇರ್ ಅಥವಾ ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರದಂತಹವು — ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆಯೇ?",
      "faq.a5": "ಹೌದು. ಒಂದು ಸೂಪರ್ ಅಡ್ಮಿನ್ ಪ್ರತಿ ಕಂಪನಿಗೂ ಅಗತ್ಯವಿರುವ ಮಾಡ್ಯೂಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಆನ್ ಮಾಡುತ್ತಾರೆ — ಒಂದು ಹಾರ್ಡ್‌ವೇರ್ ಅಥವಾ ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರದ ಅಂಗಡಿ ಉಳಿದೆಲ್ಲರಂತೆಯೇ ಅದೇ ಬಿಲ್ಲಿಂಗ್, ಜಿಎಸ್‌ಟಿ, ದಾಸ್ತಾನು ಎಂಜಿನ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ, ಬೆಳೆ ನಾಟಿಗಳು ಅಥವಾ ಆರೈಕೆ ವೇಳಾಪಟ್ಟಿ ಟೆಂಪ್ಲೇಟ್‌ಗಳಂತಹ ಕೃಷಿ-ನಿರ್ದಿಷ್ಟ ಪರದೆಗಳು ಅದರ ಮೆನುವಿನಲ್ಲಿ ಎಂದಿಗೂ ಕಾಣಿಸಿಕೊಳ್ಳುವುದಿಲ್ಲ.",
      "faq.q6": "ನಂತರ ದಾಸ್ತಾನು ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರದ ವಿಧಾನವನ್ನು ಬದಲಾಯಿಸಿದರೆ ಏನಾಗುತ್ತದೆ?",
      "faq.a6": "LedGo ERP ಪ್ರತಿ ಕಂಪನಿಗೂ ಆಯ್ಕೆ ಮಾಡಬಹುದಾದ FIFO, LIFO, ಅಥವಾ ಸರಾಸರಿ ವೆಚ್ಚ ವಿಧಾನವನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ. ಬದಲಾವಣೆ ಒಂದು ಸೂಪರ್ ಅಡ್ಮಿನ್-ನಿಯಂತ್ರಿತ ಸೆಟ್ಟಿಂಗ್ ಆಗಿದ್ದು, ಇದು ಮುಂದಿನಿಂದ ಅನ್ವಯವಾಗುತ್ತದೆ — ಇದು ಹಿಂದಿನ ಯಾವುದೇ ವಹಿವಾಟನ್ನು ಮರುಬರೆಯುವುದಿಲ್ಲ ಅಥವಾ ತೊಂದರೆಗೊಳಿಸುವುದಿಲ್ಲ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಹಿಂದಿನ ಅಂಕಿಅಂಶಗಳು ದಾಖಲಾದಂತೆಯೇ ಉಳಿಯುತ್ತವೆ.",
      "faq.q7": "ನನ್ನ ಡೇಟಾ ತಾನಾಗಿಯೇ ಬ್ಯಾಕಪ್ ಆಗುತ್ತದೆಯೇ?",
      "faq.a7": "ಹೌದು — ವೇಳಾಪಟ್ಟಿ ಮಾಡಲಾದ ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್‌ಗಳು ಸೂಪರ್ ಅಡ್ಮಿನ್ ಮೇಲ್ವಿಚಾರಣೆಯೊಂದಿಗೆ ತಾವಾಗಿಯೇ ಚಲಿಸುತ್ತವೆ, ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಮಾಡಲಾದ ಬ್ಯಾಕಪ್ ಎಂದಾದರೂ ವಿಫಲವಾದರೆ ನಿಮಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗುತ್ತದೆ — ಆದ್ದರಿಂದ ರಕ್ಷಣೆ ಎನ್ನುವುದು ನೀವು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಬೇಕಾದ ಸಂಗತಿಯಲ್ಲ.",
      "cta.eyebrow": "ನೀವು ಸಿದ್ಧರಾದಾಗ",
      "cta.heading": "ನಿಮ್ಮ ಅಂಗಡಿಯನ್ನು ಒಂದೇ ಪರದೆಗೆ ತನ್ನಿ.",
      "cta.sub": "ಇದು ಸೂಕ್ತವೇ ಎಂದು ನೋಡಲು ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಥವಾ ಮಾರಾಟ ಕರೆಯ ಅಗತ್ಯವಿಲ್ಲ — ಇದು ನಿಮ್ಮ ಅಂಗಡಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ರೀತಿಗೆ ನಿಜವಾಗಿಯೂ ಹೊಂದುತ್ತದೆಯೇ ಎಂದು ಒಮ್ಮೆ ನೋಡಿ.",
      "cta.secondary": "ಮತ್ತೆ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
      "cta.form.name": "ಹೆಸರು",
      "cta.form.email": "ಇಮೇಲ್",
      "cta.form.phone": "ಫೋನ್ (ಐಚ್ಛಿಕ)",
      "cta.form.phonePlaceholder": "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
      "cta.form.message": "ಸಂದೇಶ",
      "cta.form.submit": "ಸಂದೇಶ ಕಳುಹಿಸಿ",
      "cta.form.sending": "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
      "cta.form.successMsg": "ನಿಮ್ಮ ಇಮೇಲ್ ಆ್ಯಪ್ ನಿಮ್ಮ ಸಂದೇಶದೊಂದಿಗೆ ತೆರೆಯುತ್ತದೆ — Send ಒತ್ತಿದರೆ ಸಾಕು.",
      "cta.form.errorRequired": "ಈ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ.",
      "cta.form.errorEmail": "ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
      "cta.form.errorGeneric": "ಏನೋ ತಪ್ಪಾಗಿದೆ — ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      "cta.form.orEmail": "ಇಮೇಲ್ ಬಯಸುವಿರಾ? ನಮಗೆ ಬರೆಯಿರಿ",
      "footer.tagline": "ಭಾರತೀಯ ಕೃಷಿ, ಹಾರ್ಡ್‌ವೇರ್, ಮತ್ತು ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರ ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳಿಗಾಗಿ ಅಂಗಡಿ-ನಿರ್ವಹಣಾ ಸಾಫ್ಟ್‌ವೇರ್ — ಬಿಲ್ಲಿಂಗ್, ದಾಸ್ತಾನು, ಜಿಎಸ್‌ಟಿ, ಮತ್ತು ನಿಮ್ಮದೇ ಗ್ರಾಹಕ ಆ್ಯಪ್‌ಗಾಗಿ ಒಂದೇ ಪರದೆ.",
      "footer.col.product": "ಉತ್ಪನ್ನ",
      "footer.col.company": "ಕಂಪನಿ",
      "footer.link.contact": "ಸಂಪರ್ಕಿಸಿ",
      "footer.rights": "ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.",
      "footer.previewing": "ಪ್ರಸ್ತುತ ವೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ:",
    },
    te: {
      "nav.features": "ఫీచర్లు",
      "nav.devices": "మీరు పనిచేసే ప్రతిచోటా",
      "nav.themes": "మీ శైలిలో మార్చుకోండి",
      "nav.faq": "తరచుగా అడిగే ప్రశ్నలు",
      "nav.getStarted": "ప్రారంభించండి",
      "hero.eyebrow": "షాప్ కౌంటర్ కోసం రూపొందించబడింది",
      "hero.title": 'మీ <span class="accent">మొత్తం దుకాణాన్ని</span> నడపండి.<br />ఒకే స్క్రీన్ నుండి.',
      "hero.sub": "బిల్లింగ్, ఇన్వెంటరీ, జీఎస్టీ, కొనుగోళ్లు, మరియు మీ సొంత కస్టమర్-ఫేసింగ్ స్టోర్ — నోట్‌బుక్, కాలిక్యులేటర్, మరియు మీ దుకాణం ఇప్పటివరకు వాడుతున్న మూడు వేర్వేరు యాప్‌ల స్థానంలో LedGo ERP వస్తుంది.",
      "hero.cta.primary": "పని చేస్తుండగా చూడండి",
      "hero.cta.secondary": "ఫీచర్లను అన్వేషించండి",
      "hero.trust.modules": "మాడ్యూల్స్",
      "hero.trust.languages": "భాషలు",
      "hero.trust.aiVoice": "వాయిస్ & ఇన్వాయిస్",
      "hero.trust.gst": "జీఎస్టీ అంతర్భాగం",
      "stats.modules": "ప్రధాన మాడ్యూల్స్",
      "stats.languages": "భారతీయ భాషలు",
      "stats.themes": "థీమ్ ఎంపికలు",
      "stats.apps": "సొంత యాప్‌లు",
      "stats.always": "మీ అనుకూలతకు తగినట్లు పనిచేస్తుంది",
      "features.eyebrow": "లోపల ఏముంది",
      "features.heading": "షాప్ కౌంటర్‌కు నిజంగా అవసరమైనవన్నీ",
      "features.sub": "ఆకారం మార్చిన సాధారణ అకౌంటింగ్ టూల్ కాదు — భారతీయ వ్యవసాయ, హార్డ్‌వేర్, లేదా సాధారణ వ్యాపార దుకాణం తన రోజువారీ పనిని నిజంగా ఎలా నడుపుతుందో దాని చుట్టూ రూపొందించబడింది.",
      "f1.title": "కౌంటర్ వేగానికి తగ్గట్టుగా ఉండే బిల్లింగ్",
      "f1.body": "ఉత్పత్తిని వెతకండి, స్కాన్ చేయండి, లేదా చెప్పి చేర్చండి — ప్రతి లైన్‌లో జీఎస్టీ దానంతట అదే CGST+SGST లేదా IGST గా విడిపోతుంది, ప్రతి బిల్లుపై UPI QR ఉండటం వల్ల చెల్లింపు జరిగిన వెంటనే బాకీ దానంతట అదే తీరిపోతుంది.",
      "f1.li1": "నిజమైన షాప్ హార్డ్‌వేర్‌పై థర్మల్ రసీదు & లేబుల్ ప్రింటింగ్",
      "f1.li2": "సేల్స్ ఆర్డర్లు, రిటర్న్‌లు, మరియు ఖాతా క్రెడిట్ — రూపాయి వరకు కచ్చితంగా ట్రాక్ చేయబడుతుంది",
      "f1.li3": "బ్యాచ్ & గడువు తేదీ తెలిసి, పాత స్టాక్ ముందుగా అమ్ముడవుతుంది — దానంతట అదే",
      "f2.title": "ఎప్పుడూ లెక్క తప్పని ఇన్వెంటరీ నిర్వహణ",
      "f2.body": "ప్రతి బ్యాచ్‌కు దాని స్వంత గడువు తేదీ ఉంటుంది. ఒక దుకాణాన్ని లేదా పది ప్రదేశాలను నడపండి, ఒక్కొక్కదానికి దాని స్వంత గోడౌన్‌లతో, వాటి మధ్య నిజమైన ఆడిట్ ట్రయిల్‌తో స్టాక్‌ను బదిలీ చేయండి.",
      "f2.li1": "లొకేషన్లు, గోడౌన్లు, మరియు వాటి మధ్య స్టాక్ బదిలీ",
      "f2.li2": "FIFO, LIFO, లేదా వెయిటెడ్ యావరేజ్ కాస్టింగ్ — ప్రతి కంపెనీకి ఎంపిక చేసుకోవచ్చు",
      "f2.li3": "అమ్ముడుకాని స్టాక్, వేగంగా అమ్ముడయ్యే ఉత్పత్తులు, మరియు రీఆర్డర్ సూచనలు — ఒక రిపోర్ట్ దూరంలో",
      "f3.title": "చెప్పండి, ఫోటో తీయండి, పూర్తయింది",
      "f3.body": "అమ్మకాన్ని బిగ్గరగా చెప్పండి, కార్ట్ దానంతట అదే నిండటం చూడండి. వ్యాపారి యొక్క కాగితం ఇన్వాయిస్‌ను ఫోటో తీసి, లైన్లు, రేట్లు అన్నింటితో పూర్తిగా నింపిన కొనుగోలు ఎంట్రీని పొందండి.",
      "f3.li1": "వాయిస్ ఆర్డరింగ్ మాట్లాడిన పదాలను నిజమైన ఉత్పత్తులతో సరిపోలుస్తుంది",
      "f3.li2": "AI ఇన్వాయిస్ ఇంపోర్ట్ ఫోటో తీసిన లేదా స్కాన్ చేసిన బిల్లును చదువుతుంది",
      "f3.li3": "Anthropic, Gemini, లేదా OpenAI పై పనిచేస్తుంది — దుకాణం దేనిని నమ్ముతుందో దానిపై",
      "f4.title": "నిజంగా మీ సొంతమైన స్టోర్‌ఫ్రంట్",
      "f4.body": "ప్రతి దుకాణానికి దాని స్వంత బ్రాండెడ్ ఆర్డరింగ్ వెబ్‌సైట్ లభిస్తుంది — కస్టమర్లు నిజమైన కేటలాగ్‌ను చూసి నిజమైన ఆర్డర్లు పెడతారు — దానితో పాటు దాని స్వంత పేరు, ఐకాన్, రంగులతో ప్రత్యేకమైన Android యాప్ కూడా, పంచుకున్న మార్కెట్‌ప్లేస్ లిస్టింగ్ కాదు.",
      "f4.li1": "కస్టమ్ డొమైన్లు — yourshop.com, వేరొకరి సబ్‌డొమైన్ కాదు",
      "f4.li2": "ఆర్డర్ స్థితి మారిన వెంటనే పుష్ నోటిఫికేషన్లు",
      "f4.li3": "ఆర్డర్లు నేరుగా అదే బిల్లింగ్ మరియు స్టాక్ వ్యవస్థలోకి వస్తాయి",
      "f5.title": "నిజమైన ప్రశ్నకు సమాధానం ఇచ్చే రిపోర్టులు",
      "f5.body": "పూర్తి లెడ్జర్లు, జీఎస్టీ-సిద్ధమైన సారాంశాలు, మరియు వ్యవస్థలో ఇప్పటికే ఉన్న అదే బిల్లుల నుండి రూపొందించబడిన లాభ-నష్టాల నివేదిక — దానితో పాటు అమ్ముడుకాని స్టాక్, వేగంగా అమ్ముడయ్యే ఉత్పత్తులు, మరియు తర్వాత ఏమి ఆర్డర్ చేయాలో ఒక క్లిక్ దూరంలో.",
      "f5.li1": "సేల్స్ & పర్చేజ్ రిజిస్టర్, జీఎస్టీ సారాంశం, మరియు పార్టీ లెడ్జర్ — ఒకే క్లిక్‌లో ఎగుమతికి సిద్ధం",
      "f5.li2": "డెడ్ స్టాక్, వేగంగా/నెమ్మదిగా అమ్ముడయ్యే ఉత్పత్తులు, మరియు కొనుగోలు ప్రణాళిక ఖచ్చితంగా ఏమి రీఆర్డర్ చేయాలో సూచిస్తాయి",
      "f5.li3": "బాకీలు & ఏజింగ్ — ఎవరు ఎంత చెల్లించాలో ఒకే చూపులో, ప్రాంతం ఆధారంగా ఫిల్టర్ చేయవచ్చు",
      "f5.li4": "ఆర్థిక సంవత్సరం ముగింపు, మరియు తిరిగి తెరవడం, ఒక్క అంకె కూడా కోల్పోకుండా",
      "f6.title": "ఒకే ప్లాట్‌ఫారమ్, మీరు నడిపే ప్రతి దుకాణం",
      "f6.body": "ఒక సూపర్ అడ్మిన్ కంట్రోల్ టవర్ ప్లాట్‌ఫారమ్‌లోని ప్రతి కంపెనీని పర్యవేక్షిస్తుంది — వ్యవసాయ, హార్డ్‌వేర్, మరియు సాధారణ వ్యాపార దుకాణాలు అన్నీ కలిపి — ప్రతి దుకాణానికి ఫీచర్-వారీగా స్విచ్‌లతో: ప్రతి దానికి అవసరమైనది మాత్రమే ఆన్ చేయండి, ఎవరిపైనా బలవంతం లేకుండా.",
      "f6.li1": "ట్రయల్ వ్యవధులు, లైసెన్సింగ్, మరియు ఆటోమేటిక్ బ్యాకప్‌లు, అంతర్భాగంగా",
      "f6.li2": "ప్లాట్‌ఫారమ్ మొత్తానికి ఆడిట్ ట్రయిల్ — ప్రతి చర్య, జవాబుదారీగా, శాశ్వతంగా నమోదు",
      "f6.li3": "ప్రతి వ్యక్తిగత చర్యకు పాత్ర-ఆధారిత అనుమతులు",
      "f7.title": "ఆర్డర్ నుండి చెల్లింపు వరకు ట్రాక్ చేయబడిన కొనుగోలు",
      "f7.body": "ఒక కొనుగోలు ఆర్డర్‌ను సృష్టించండి, బ్యాచ్ మరియు గడువు తేదీతో లైన్ బై లైన్ నమోదు చేయబడిన నిజమైన స్టాక్-ఇన్ ఎంట్రీగా దాన్ని స్వీకరించండి, మరియు ప్రతి విక్రేతపై నగదు లేదా క్రెడిట్ చెల్లింపును ట్రాక్ చేయండి — బిల్లింగ్ అంతే ఖచ్చితత్వం, వ్యతిరేక దిశలో.",
      "f7.li1": "కొనుగోలు ఆర్డర్లు నేరుగా నిజమైన స్టాక్-ఇన్ ఎంట్రీగా మారతాయి",
      "f7.li2": "విక్రేత చెల్లింపులు — నగదు లేదా క్రెడిట్, చెల్లించినది మరియు బాకీ రూపాయి వరకు ట్రాక్ చేయబడతాయి",
      "f7.li3": "కొనుగోలు రిటర్న్‌లు స్టాక్ మరియు లెడ్జర్‌ను శుభ్రంగా తిప్పికొడతాయి, మాన్యువల్ సర్దుబాటు అవసరం లేదు",
      "f8.title": "మీ కౌంటర్‌పై ఇప్పటికే ఉన్న హార్డ్‌వేర్ కోసం రూపొందించబడింది",
      "f8.body": "థర్మల్ రసీదు మరియు లేబుల్ ప్రింటర్లు, బార్‌కోడ్ స్కానర్లు, మరియు UPI QR కోడ్‌లు — ఒక దుకాణం ఇప్పటికే కలిగి ఉన్న యంత్రాలతో LedGo ERP మాట్లాడుతుంది, మీరు కొనవలసిన ప్రొప్రయిటరీ పరికరం కాదు.",
      "f8.li1": "థర్మల్ రసీదులు మరియు ఉత్పత్తి లేబుల్‌లు నేరుగా ప్రింట్ అవుతాయి, PDF మధ్యవర్తి అవసరం లేదు",
      "f8.li2": "బిల్లింగ్ మరియు కొనుగోలు ఎంట్రీ రెండింటిలోనూ బార్‌కోడ్ స్కాన్ చేసి జోడించవచ్చు",
      "f8.li3": "ప్రతి బిల్లుపై UPI QR ఉంటుంది — స్కాన్ చేసిన వెంటనే బాకీ దానంతట అదే తీరిపోతుంది",
      "f9.title": "ప్రతి కస్టమర్ సంబంధం, ట్రాక్ చేయబడుతుంది",
      "f9.body": "విచారణలు, పంట నాటడాలు, మరియు సంరక్షణ-షెడ్యూల్ రిమైండర్‌లు — వ్యవసాయ దుకాణం యొక్క నిజమైన అమ్మకాల చక్రాన్ని అర్థం చేసుకునే CRM, ఆకారం మార్చిన సాధారణ కాంటాక్ట్ లిస్ట్ కాదు.",
      "f9.li1": "మొదటి కాల్ నుండి పూర్తయిన అమ్మకం వరకు విచారణలు ట్రాక్ చేయబడతాయి",
      "f9.li2": "పంట నాటడాలు కస్టమర్ పొలాన్ని వచ్చే సీజన్‌లో వారికి అవసరమయ్యే దానితో అనుసంధానిస్తాయి",
      "f9.li3": "సంరక్షణ షెడ్యూల్ టెంప్లేట్‌లు సరైన సమయానికి దానంతట అదే రిమైండర్‌లను పంపుతాయి",
      "f10.title": "పరిశీలనకు నిలబడే భద్రత",
      "f10.body": "ప్రతి వ్యక్తిగత చర్యకు పాత్ర-ఆధారిత అనుమతులు, మరియు ప్రతి మార్పును శాశ్వతంగా జవాబుదారీగా చేసే ప్లాట్‌ఫారమ్ మొత్తానికి ఆడిట్ ట్రయిల్ — ఏదీ నిశ్శబ్దంగా లేదు, ఏదీ గుర్తించలేనిది కాదు.",
      "f10.li1": "ప్రతి చర్య నమోదు చేయబడుతుంది — ఎవరు, ఏమి, మరియు ఎప్పుడు, శాశ్వతంగా",
      "f10.li2": "పాత్ర, మాడ్యూల్, చర్య ఆధారంగా అనుమతులు సెట్ చేయబడతాయి",
      "f10.li3": "సూపర్ అడ్మిన్ పర్యవేక్షణతో ఆటోమేటిక్ బ్యాకప్‌లు షెడ్యూల్ ప్రకారం నడుస్తాయి",
      "devices.eyebrow": "మీరు పనిచేసే ప్రతిచోటా పనిచేస్తుంది",
      "devices.heading": "కౌంటర్‌పై మొబైల్. షాప్ ఫ్లోర్‌పై టాబ్లెట్. బ్యాక్ ఆఫీస్‌లో డెస్క్‌టాప్.",
      "devices.sub": "అదే స్క్రీన్, నిజంగా రెస్పాన్సివ్‌గా ఉంటుంది — చిన్న స్క్రీన్‌పై ఇరుకుగా ఇమిడ్చిన డెస్క్‌టాప్ లేఅవుట్ కాదు.",
      "devices.tab.mobile": "మొబైల్",
      "devices.tab.tablet": "టాబ్లెట్",
      "devices.tab.desktop": "డెస్క్‌టాప్",
      "devices.viewing": "ప్రస్తుతం చూస్తున్నది:",
      "devices.page.dashboard": "డాష్‌బోర్డ్",
      "devices.page.billing": "బిల్లింగ్",
      "devices.page.inventory": "ఇన్వెంటరీ",
      "devices.page.purchase": "కొనుగోలు",
      "devices.page.reports": "రిపోర్ట్‌లు",
      "devices.page.storefront": "స్టోర్‌ఫ్రంట్",
      "devices.page.platform": "ప్లాట్‌ఫారమ్",
      "devices.page.hardware": "హార్డ్‌వేర్",
      "themes.eyebrow": "మీ శైలిలో మార్చుకోండి",
      "themes.heading": "ప్రతి దుకాణం తన సొంత రూపాన్ని ఎంచుకుంటుంది",
      "themes.sub": "తొమ్మిది థీమ్ ఎంపికలు మరియు నిజమైన డార్క్ మోడ్ — మొత్తం యాప్ దానితో పాటే మారుతుంది. ఈ పేజీ కూడా అదే ఇంజిన్‌పై నడుస్తోంది. ప్రయత్నించి చూడండి.",
      "theme.sub.green": "డిఫాల్ట్ — ఆత్మవిశ్వాసంతో కూడిన, వ్యవసాయ శైలి",
      "theme.sub.teal": "ప్రశాంతమైన మరియు ఆధునికమైన",
      "theme.sub.purple": "ప్రీమియం, ప్రత్యేకమైన",
      "theme.sub.orange": "వెచ్చని మరియు శక్తివంతమైన",
      "theme.sub.blue": "తేలికైన మరియు సులభంగా అర్థమయ్యే",
      "theme.sub.indigo": "ధైర్యమైన మరియు కేంద్రీకృతమైన",
      "themes.preview.dashboard": "డాష్‌బోర్డ్",
      "themes.preview.todaySales": "ఈరోజు అమ్మకాలు",
      "themes.preview.lowStock": "తక్కువ స్టాక్",
      "themes.preview.collections": "వసూళ్లు",
      "themes.preview.newSale": "కొత్త అమ్మకం",
      "faq.eyebrow": "ప్రశ్నలు",
      "faq.heading": "తెలుసుకోవలసినవి",
      "faq.q1": "ఇది వ్యవసాయేతర దుకాణాలకు కూడా పనిచేస్తుందా?",
      "faq.a1": "అవును. అదే బిల్లింగ్, జీఎస్టీ, బ్యాచ్, మరియు ఇన్వెంటరీ ఇంజిన్ వ్యవసాయ-ఇన్‌పుట్ దుకాణాలకు ఎంత బాగా పనిచేస్తుందో అంతే బాగా హార్డ్‌వేర్ దుకాణాలు మరియు సాధారణ వ్యాపార వ్యాపారులకు కూడా మారుతుంది — మౌలిక లాజిక్ మారదు, పదజాలం మాత్రమే మారుతుంది.",
      "faq.q2": "నా సిబ్బంది దీన్ని తమిళం, హిందీ, లేదా మరొక భాషలో వాడవచ్చా?",
      "faq.a2": "అవును — ఇంగ్లీష్, తమిళం, హిందీ, కన్నడ, మరియు తెలుగు అన్నీ సహజంగా మద్దతు ఇవ్వబడతాయి, తక్షణమే యంత్ర-అనువాదం చేయబడినవి కావు.",
      "faq.q3": "దీన్ని నడపడానికి నేను సాంకేతిక పరిజ్ఞానం కలిగి ఉండాలా?",
      "faq.a3": "లేదు. దీన్ని ఐటీ బృందం కాదు, కౌంటర్‌లో ఉన్న దుకాణ సిబ్బందే నడిపేలా రూపొందించారు — బిల్లింగ్, ప్రింటింగ్, మరియు స్టాక్ అప్‌డేట్‌లు ఐదు కాకుండా ఒకే క్లిక్‌లో జరిగేలా రూపొందించడానికి ఇదే కారణం.",
      "faq.q4": "నేను ఒకటి కంటే ఎక్కువ దుకాణాలు నడిపితే?",
      "faq.a4": "ప్రతి కంపెనీకి దాని స్వంత వేరుచేయబడిన డేటా మరియు దాని స్వంత థీమ్ లభిస్తుంది, దానితో పాటు అన్నింటినీ ఒకే చోటు నుండి పర్యవేక్షించే సూపర్ అడ్మిన్ వ్యూ — ఒక దుకాణం డేటా మరొక దుకాణం డేటాతో ఎప్పుడూ కలవదు.",
      "faq.q5": "ఇది వ్యవసాయేతర దుకాణాలకు కూడా — హార్డ్‌వేర్ లేదా సాధారణ వ్యాపారం వంటివి — పనిచేస్తుందా?",
      "faq.a5": "అవును. ఒక సూపర్ అడ్మిన్ ప్రతి కంపెనీకి అవసరమైన మాడ్యూల్స్‌ను మాత్రమే ఆన్ చేస్తారు — ఒక హార్డ్‌వేర్ లేదా సాధారణ వ్యాపార దుకాణం మిగతా అందరిలాగే అదే బిల్లింగ్, జీఎస్టీ, ఇన్వెంటరీ ఇంజిన్‌పై పనిచేస్తుంది, పంట నాటడాలు లేదా సంరక్షణ షెడ్యూల్ టెంప్లేట్‌ల వంటి వ్యవసాయ-నిర్దిష్ట స్క్రీన్‌లు దాని మెనూలో ఎప్పుడూ కనిపించవు.",
      "faq.q6": "తర్వాత స్టాక్ కాస్ట్ లెక్కించే విధానాన్ని మార్చితే ఏమవుతుంది?",
      "faq.a6": "LedGo ERP ప్రతి కంపెనీకి ఎంపిక చేసుకోగల FIFO, LIFO, లేదా వెయిటెడ్ యావరేజ్ కాస్టింగ్‌ను సపోర్ట్ చేస్తుంది. మార్పు అనేది ఒక సూపర్ అడ్మిన్-నియంత్రిత సెట్టింగ్, ఇది ఇక ముందు నుండి వర్తిస్తుంది — ఇది గత ఏ లావాదేవీని కూడా తిరిగి రాయదు లేదా భంగపరచదు, కాబట్టి మీ గత గణాంకాలు నమోదైనట్లుగానే ఉంటాయి.",
      "faq.q7": "నా డేటా ఆటోమేటిక్‌గా బ్యాకప్ అవుతుందా?",
      "faq.a7": "అవును — షెడ్యూల్ చేయబడిన ఆటోమేటిక్ బ్యాకప్‌లు సూపర్ అడ్మిన్ పర్యవేక్షణతో వాటంతట అవే నడుస్తాయి, మరియు షెడ్యూల్ చేసిన బ్యాకప్ ఎప్పుడైనా విఫలమైతే మీకు అలర్ట్ వస్తుంది — కాబట్టి రక్షణ అనేది మీరు గుర్తుంచుకోవాల్సిన విషయం కాదు.",
      "cta.eyebrow": "మీరు సిద్ధంగా ఉన్నప్పుడు",
      "cta.heading": "మీ దుకాణాన్ని ఒకే స్క్రీన్‌పైకి తీసుకురండి.",
      "cta.sub": "ఇది సరిపోతుందో లేదో చూడటానికి క్రెడిట్ కార్డ్ లేదా సేల్స్ కాల్ అవసరం లేదు — ఇది మీ దుకాణం పనిచేసే విధానానికి నిజంగా సరిపోతుందో లేదో ఒకసారి చూడండి.",
      "cta.secondary": "మళ్ళీ ఫీచర్లను అన్వేషించండి",
      "cta.form.name": "పేరు",
      "cta.form.email": "ఇమెయిల్",
      "cta.form.phone": "ఫోన్ (ఐచ్ఛికం)",
      "cta.form.phonePlaceholder": "10-అంకెల మొబైల్ నంబర్",
      "cta.form.message": "సందేశం",
      "cta.form.submit": "సందేశం పంపండి",
      "cta.form.sending": "పంపబడుతోంది…",
      "cta.form.successMsg": "మీ ఇమెయిల్ యాప్ మీ సందేశంతో తెరుచుకుంటుంది — Send నొక్కితే చాలు.",
      "cta.form.errorRequired": "ఈ వివరం అవసరం.",
      "cta.form.errorEmail": "చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
      "cta.form.errorGeneric": "ఏదో తప్పు జరిగింది — దయచేసి మళ్ళీ ప్రయత్నించండి.",
      "cta.form.orEmail": "ఇమెయిల్ కావాలా? మాకు రాయండి",
      "footer.tagline": "భారతీయ వ్యవసాయ, హార్డ్‌వేర్, మరియు సాధారణ వ్యాపార రిటైలర్ల కోసం దుకాణ-నిర్వహణ సాఫ్ట్‌వేర్ — బిల్లింగ్, ఇన్వెంటరీ, జీఎస్టీ, మరియు మీ సొంత కస్టమర్ యాప్ కోసం ఒకే స్క్రీన్.",
      "footer.col.product": "ఉత్పత్తి",
      "footer.col.company": "కంపెనీ",
      "footer.link.contact": "సంప్రదించండి",
      "footer.rights": "అన్ని హక్కులు రక్షించబడ్డాయి.",
      "footer.previewing": "ప్రస్తుతం చూస్తున్నది:",
    },
  };

  function t(key) {
    var lang = document.documentElement.getAttribute("lang") || DEFAULT_LANG;
    var dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    var fallback = TRANSLATIONS[DEFAULT_LANG];
    return (dict && dict[key]) || (fallback && fallback[key]) || key;
  }

  function applyLang(lang) {
    if (!TRANSLATIONS[lang]) {
      lang = DEFAULT_LANG;
    }
    document.documentElement.setAttribute("lang", lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {
      /* ignore */
    }

    var dict = TRANSLATIONS[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll(".lang-select").forEach(function (sel) {
      sel.value = lang;
    });

    updateProductScreenshots();
    updateFeatureScreenshots();
    /* The "Now viewing: X" label (Device Showcase page pager, further down
       this file) is set dynamically from whichever page is currently
       selected, NOT via a static data-i18n attribute - the generic
       [data-i18n] loop above has no idea which page that is, so it can't
       re-translate that label itself. refreshDemoViewingLabel() re-reads
       the live selection (initDemoPager()'s currentDemoPage) and applies
       the matching translation for the language that was just switched to. */
    refreshDemoViewingLabel();
  }

  /* ---------------- Product screenshot swapping ----------------
     The hero device cluster and the Device Showcase both show real captures
     of the actual LedGo ERP app running at localhost:5062 - this keeps them
     honest with whatever theme/language a visitor has picked on this page,
     backing up the "every shop picks its own look" pitch with a screenshot
     that actually changes instead of one frozen in green+English.

     Two INDEPENDENT axes, not a full theme x language cross product (that
     would be 6x5=30 captures - each language was only captured once, in the
     Green theme). Priority when both could apply:
       1. A non-English language wins - shown in the Green theme, since
          that's the only theme each language was captured in.
       2. Otherwise, the selected accent theme wins (in English).
       3. Otherwise (green + English), the plain baseline file with no
          suffix - the one that already existed before this feature.
     This means picking a non-English language always shows the Green-theme
     capture of that language, regardless of which color swatch is
     separately selected - there is no captured file for e.g. purple+Tamil,
     so the priority rule deliberately avoids ever requesting one. */
  var PRODUCT_SHOT_DEVICES = ["desktop", "tablet", "mobile"];
  var PRODUCT_SHOT_THEMES = ["teal", "purple", "orange", "blue", "indigo"]; // "green" is the baseline file, no suffix
  var PRODUCT_SHOT_LANGS = ["ta", "hi", "kn", "te"]; // "en" is the baseline file, no suffix

  function updateProductScreenshots() {
    var lang = document.documentElement.getAttribute("lang") || DEFAULT_LANG;
    var theme = document.documentElement.getAttribute("data-theme") || "green";

    var suffix = "";
    if (PRODUCT_SHOT_LANGS.indexOf(lang) !== -1) {
      suffix = "-lang-" + lang;
    } else if (PRODUCT_SHOT_THEMES.indexOf(theme) !== -1) {
      suffix = "-theme-" + theme;
    }

    PRODUCT_SHOT_DEVICES.forEach(function (device) {
      var src = "assets/app-screenshot-" + device + suffix + ".png";
      document.querySelectorAll('[data-product-shot="' + device + '"]').forEach(function (img) {
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      });
    });
  }

  /* ---------------- Feature-row screenshot swapping ----------------
     Same real-app-capture approach as the product shots above, applied to the
     six .feature-row illustrations further down the page (billing, inventory,
     ai, storefront, reports, platform) - each one a single specific real app
     screen tied to that row's copy, rather than the 3-device dashboard set.

     Same two-axis priority rule as updateProductScreenshots(): a non-English
     language wins (Green theme only), else the selected accent theme wins (in
     English), else the plain baseline. The difference here is per-slot
     language coverage isn't uniform - the Super Admin "platform" screen and
     the customer-facing "storefront" app either aren't localized at all or
     weren't captured in every language, so FEATURE_SHOT_LANG_SLOTS lists only
     the slots that actually have a -lang- file for a given language; anything
     else falls through to the theme/baseline branch instead of 404-ing. */
  var FEATURE_SHOT_NAMES = ["billing", "inventory", "ai", "storefront", "reports", "platform", "purchase", "hardware", "crm", "security"];
  var FEATURE_SHOT_THEMES = ["teal", "purple", "orange", "blue", "indigo"]; // "green" is the baseline file, no suffix
  var FEATURE_SHOT_LANGS = ["ta", "hi", "kn", "te"]; // "en" is the baseline file, no suffix
  /* "storefront" has no working language switcher in the real app (confirmed
     during capture) - every other slot IS fully localized and was captured in
     all 4 languages, including "purchase" (Purchase Entry) and "hardware" (the
     Sales Bill thermal print page) added for the 07/08 feature rows - both
     confirmed to actually re-render their visible text under each culture
     before being captured, same verification bar as every other slot here.
     "crm" (Customer Inquiries) and "security" (Audit Log) added for the 08/09
     rows were verified the same way - the visitor-facing column headers,
     status labels, and date formatting on both screens genuinely re-render
     under each culture, not just the shared sidebar nav. */
  var FEATURE_SHOT_LANG_SLOTS = ["billing", "inventory", "ai", "reports", "platform", "purchase", "hardware", "crm", "security"];
  /* "storefront" is excluded here too, for a different reason: the captured shop
     (company 1) has its Super Admin "Public Store Custom Theme" toggle on, which
     pins the customer-facing storefront to one fixed brand palette that's
     completely independent of the shop's ThemeName - confirmed live, a
     -theme-{x} capture of it is byte-identical to the baseline no matter which
     accent was selected when it was captured. Rather than ship 5 dead-weight
     duplicate files, this slot always shows the baseline and simply doesn't
     react to the accent swatches - still a real, honest reflection of what
     that app actually renders. "purchase", "hardware", "crm", and "security"
     all DO react (same ChangeThemeAsync + fresh-login mechanism as every
     other reactive slot) and were captured in all 5 accent themes plus the
     green baseline. */
  var FEATURE_SHOT_THEME_SLOTS = ["billing", "inventory", "ai", "reports", "platform", "purchase", "hardware", "crm", "security"];

  function updateFeatureScreenshots() {
    var lang = document.documentElement.getAttribute("lang") || DEFAULT_LANG;
    var theme = document.documentElement.getAttribute("data-theme") || "green";
    var langHasShots = FEATURE_SHOT_LANGS.indexOf(lang) !== -1;
    var themeHasShots = FEATURE_SHOT_THEMES.indexOf(theme) !== -1;

    FEATURE_SHOT_NAMES.forEach(function (name) {
      var suffix = "";
      if (langHasShots && FEATURE_SHOT_LANG_SLOTS.indexOf(name) !== -1) {
        suffix = "-lang-" + lang;
      } else if (themeHasShots && FEATURE_SHOT_THEME_SLOTS.indexOf(name) !== -1) {
        suffix = "-theme-" + theme;
      }

      var src = "assets/feature-" + name + suffix + ".png";
      document.querySelectorAll('[data-feature-shot="' + name + '"]').forEach(function (img) {
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      });
    });
  }

  function initLang() {
    var saved = null;
    try {
      saved = localStorage.getItem(LANG_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    applyLang(saved || DEFAULT_LANG);

    document.querySelectorAll(".lang-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        applyLang(sel.value);
      });
    });
  }

  /* ---------------- Scroll-reveal ----------------
     Fades sections up into place the first time they enter the viewport.
     Respects prefers-reduced-motion by doing nothing (elements already
     start visible via the .in class added below when motion is reduced).

     Also drives two staggered child reveals sharing this same observer rather
     than standing up a second one:
       - any .reveal container that contains .feature-list <li>s (i.e. a
         .feature-row) gets each bullet flipped to .in with a slightly later
         transition-delay than the one before it, cascading in one after
         another rather than all at once;
       - the FAQ section's .reveal wrapper (see index.html's #faq) contains
         seven .faq-item <details> elements and gets the identical cascade
         treatment, just a touch slower per-item since each is a much bigger
         block than a one-line bullet. */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function staggerChildren(list, delayStep) {
      list.forEach(function (el, idx) {
        // transition-delay isn't touched by the reduced-motion block's
        // transition-duration override - skip assigning one ourselves so a
        // reduced-motion visitor doesn't see a visible pause before an
        // otherwise-instant flip.
        if (!prefersReduced) {
          el.style.transitionDelay = idx * delayStep + "ms";
        }
        el.classList.add("in");
      });
    }

    function staggerReveal(container) {
      staggerChildren(container.querySelectorAll(".feature-list li"), 70);
      staggerChildren(container.querySelectorAll(".faq-item"), 90);
    }

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in");
        staggerReveal(el);
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            staggerReveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------- Shared count-up / count-fade engine ----------------
     Powers every "number ticks up from 0" moment on the page - the hero-trust
     row, the separate stats band further down, and the "Today's Sales" KPI in
     the Make It Yours theme-preview-card (see initThemePreviewReveal() below) -
     plus the plain fade+scale treatment for non-numeric values ("AI", "₹",
     "24/7"). Pulled out to shared functions so every caller tweens/formats
     identically instead of each hand-rolling its own copy.

     parseCountTarget() accepts an optional non-digit prefix (e.g. "₹ ") and
     comma-grouped thousands (e.g. "18,240") in addition to the plain "10+"/"5"
     shape the hero-trust row already used - stashed on the element's own
     dataset so priming (zero it out) and running (tween it up) can happen at
     different times without re-parsing. */
  function parseCountTarget(el) {
    var raw = el.textContent.trim();
    var match = /^([^\d]*)([\d,]+)(.*)$/.exec(raw);
    if (!match) return false;
    el.dataset.countPrefix = match[1] || "";
    el.dataset.countTarget = match[2].replace(/,/g, "");
    el.dataset.countSuffix = match[3] || "";
    el.dataset.countGrouped = match[2].indexOf(",") !== -1 ? "1" : "0";
    return true;
  }

  function formatCountValue(n, grouped) {
    return grouped ? n.toLocaleString("en-IN") : String(n);
  }

  /* Zeroes an already-parsed element out for the pre-animation state. Safe to
     call even under prefers-reduced-motion (it just skips the visible zeroing
     so there's nothing to jump from). */
  function primeCountEl(el, prefersReduced) {
    if (!parseCountTarget(el)) return;
    if (!prefersReduced) {
      el.textContent = (el.dataset.countPrefix || "") + "0" + (el.dataset.countSuffix || "");
    }
  }

  function runCount(el, prefersReduced) {
    var target = parseInt(el.dataset.countTarget, 10);
    var prefix = el.dataset.countPrefix || "";
    var suffix = el.dataset.countSuffix || "";
    var grouped = el.dataset.countGrouped === "1";
    if (prefersReduced || isNaN(target) || !("requestAnimationFrame" in window)) {
      el.textContent = prefix + (isNaN(target) ? el.textContent : formatCountValue(target, grouped)) + suffix;
      return;
    }
    var duration = 1100;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = prefix + formatCountValue(Math.round(eased * target), grouped) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function runFade(el) {
    el.classList.add("in");
  }

  /* ---------------- Hero-trust + stats-band stat animation ----------------
     ".count-up" spans ("10+", "5", "9", "2") count from 0 up to their real value
     the first time their row scrolls into view (or immediately, since the
     hero-trust row normally sits above the fold on first paint); ".count-fade"
     spans ("AI", "₹", "24/7" - not meaningfully "countable") just fade+scale in
     instead via the matching CSS rule in styles.css. Modeled on initReveal()'s
     own IntersectionObserver pattern just above - a separate observer because
     these two animation styles (numeric tween vs. a CSS class toggle) don't fit
     the single .reveal/.in shape that function already commits to. */
  function initHeroStats() {
    var countEls = document.querySelectorAll(".count-up");
    var fadeEls = document.querySelectorAll(".count-fade");
    if (!countEls.length && !fadeEls.length) return;

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    countEls.forEach(function (el) {
      primeCountEl(el, prefersReduced);
    });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      countEls.forEach(function (el) {
        runCount(el, prefersReduced);
      });
      fadeEls.forEach(runFade);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (entry.target.classList.contains("count-up")) {
            runCount(entry.target, prefersReduced);
          } else {
            runFade(entry.target);
          }
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach(function (el) {
      io.observe(el);
    });
    fadeEls.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------- "Make It Yours" theme-preview-card KPI count-up ----------------
     The "₹ 18,240" Today's Sales figure counts up the same way as the stats
     above, but triggered off the SAME .reveal element (`.theme-showcase.reveal`)
     initReveal() already animates - not the generic .count-up selector above,
     so this doesn't also get picked up by initHeroStats()'s own observer and
     double-run. Kept as its own tiny observer (same threshold initReveal()
     uses) rather than reaching into that function's internals, so the two
     stay decoupled and either can change independently. The chart mockup's
     own scale-in (.reveal-scale on .mock-card, see index.html/styles.css) is
     already covered for free by initReveal()'s existing observer. */
  function initThemePreviewReveal() {
    var kpi = document.querySelector(".theme-preview-card .tp-kpi-brand .tp-val");
    var showcase = document.querySelector(".theme-showcase.reveal");
    if (!kpi || !showcase) return;

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    primeCountEl(kpi, prefersReduced);

    if (prefersReduced || !("IntersectionObserver" in window)) {
      runCount(kpi, prefersReduced);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(kpi, prefersReduced);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 } // same threshold initReveal() uses
    );
    io.observe(showcase);
  }

  /* ---------------- FAQ accordion (smooth open/close) ----------------
     Native <details>/<summary> snap open/closed instantly with no built-in
     transition hook. None of the four FAQ <details> elements in index.html
     share a `name` attribute, so today each one already opens/closes fully
     independently - that existing multi-open behavior is left exactly as it
     was; this only replaces the instant snap with a real animated height
     change, via the same intercept-the-click / measure / Web Animations API
     approach commonly used for this since <details> offers no CSS-only hook.
     Falls back to the native instant toggle when prefers-reduced-motion is
     set, or when Element.animate isn't available. */
  function initFaqAccordion() {
    var detailsList = document.querySelectorAll("#faq details");
    if (!detailsList.length) return;

    detailsList.forEach(function (details) {
      var summary = details.querySelector("summary");
      if (!summary) return;
      var runningAnimation = null;

      function runAnimation(startHeight, endHeight, onFinish) {
        if (runningAnimation) runningAnimation.cancel();
        details.style.overflow = "hidden";
        runningAnimation = details.animate({ height: [startHeight + "px", endHeight + "px"] }, { duration: 300, easing: "ease-in-out" });
        runningAnimation.onfinish = function () {
          runningAnimation = null;
          onFinish();
        };
        runningAnimation.oncancel = function () {
          runningAnimation = null;
        };
      }

      function close() {
        var startHeight = details.offsetHeight;
        var endHeight = summary.offsetHeight;
        runAnimation(startHeight, endHeight, function () {
          details.open = false;
          details.style.height = "";
          details.style.overflow = "";
        });
      }

      function open() {
        var startHeight = details.offsetHeight;
        details.open = true;
        var endHeight = details.scrollHeight;
        details.style.overflow = "hidden";
        details.style.height = startHeight + "px";
        runAnimation(startHeight, endHeight, function () {
          details.style.height = "";
          details.style.overflow = "";
        });
      }

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced || !details.animate) {
          details.open = !details.open;
          return;
        }
        if (details.open) {
          close();
        } else {
          open();
        }
      });
    });
  }

  /* ---------------- Hero device-cluster scroll parallax ----------------
     Subtle drift, desktop/tablet only (>=768px, checked in JS - not just
     CSS - so it's a hard cutoff on narrow phones both for performance and
     because the hero stacks to a single column there anyway, where
     parallax would feel wrong rather than subtle). Skips entirely under
     prefers-reduced-motion, matching initReveal()/initHeroStats() above.
     Throttled to one update per animation frame via requestAnimationFrame,
     same pattern as any scroll-linked effect. */
  function initHeroParallax() {
    var cluster = document.querySelector(".device-cluster");
    if (!cluster) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var MIN_WIDTH = 768;
    var RATE = 0.08;
    var ticking = false;

    function update() {
      ticking = false;
      if (window.innerWidth < MIN_WIDTH) {
        cluster.style.transform = "";
        return;
      }
      cluster.style.transform = "translateY(" + window.scrollY * RATE + "px)";
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    update();
  }

  /* ---------------- Mobile nav toggle ---------------- */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      menu.style.display = "flex";
      // Lock background scroll while the drawer is open - without this the
      // page behind it stays scrollable, which both looks confusing (content
      // shifting under a "closed" panel) and leaves the body's own scrollbar
      // track visibly competing with the drawer's own edge for attention.
      document.body.classList.add("menu-open");
    }

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      menu.style.display = "none";
      document.body.classList.remove("menu-open");
    }

    toggle.addEventListener("click", function (e) {
      // Stops this same click from also reaching the document-level "outside
      // click closes it" listener below - without this, opening the menu and
      // closing it would fire on the exact same click (open here, then
      // immediately re-close there, since the toggle button is outside
      // `menu`'s own DOM subtree).
      e.stopPropagation();
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Click anywhere outside the open drawer closes it - previously only the
    // toggle button and an in-menu link could close it, so tapping elsewhere
    // on the page (the expected, standard dismiss gesture for any dropdown/
    // drawer) silently did nothing.
    document.addEventListener("click", function (e) {
      if (isOpen() && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    // Escape is the same "dismiss this overlay" gesture, keyboard-side.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        closeMenu();
      }
    });
  }

  /* ---------------- Device showcase tabs ---------------- */
  function setActiveStageFrame(frameKey) {
    document.querySelectorAll(".stage-frame").forEach(function (frame) {
      frame.classList.toggle("active", frame.getAttribute("data-frame") === frameKey);
    });
  }

  function initDeviceTabs() {
    var tabs = document.querySelectorAll(".device-tab");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-device");
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        setActiveStageFrame(target);
      });
    });
  }

  /* ---------------- Device showcase - page pager ----------------
     A second, independent control from the device-SIZE tabs above: which
     real app screen the stage shows (Dashboard/Billing/Inventory/Purchase/
     Reports/Storefront/Platform/Hardware), reusing the exact screenshot
     files the feature rows further up the page already display via
     [data-feature-shot] - updateFeatureScreenshots() (above) already
     re-points every element carrying that attribute whenever the theme or
     language changes, so the extra <img data-feature-shot="..."> copies
     living inside the "page" stage frame (index.html) stay in sync for
     free, with zero changes needed to that function - this pager sits on
     top of the existing screenshot-swap system rather than forking it.

     Dashboard is the only page that also respects the device-size tabs
     (it's the only screen actually captured at all three sizes) - selecting
     any other page hides the device-size tabs entirely (nothing left to
     choose between) and shows the single "page" stage frame instead,
     crossfading in the specific <img data-page-shot="..."> that matches.

     The selected page is reflected in the URL as `#demo=<page>` - a
     namespace that can't collide with the site's own plain-anchor nav
     (#features, #devices, #themes, #faq, #cta, #top all lack an "="), so
     the `hashchange` listener below safely ignores any hash that doesn't
     match the `#demo=` shape, leaving those anchors' native browser
     scroll-to-target behavior completely untouched. Plain `location.hash`
     assignment (not history.pushState) means every pill click becomes a
     real, separate browser-history entry, so the back button steps back
     through previously-viewed pages like real page navigation - verified by
     hand: click Billing, then Inventory, then Reports, then Back x3 lands
     back on Inventory, then Billing, then Dashboard.

     localStorage (key "ledgo-website-demo-page") is a silent fallback only:
     read on load ONLY when there's no #demo= hash present, and never
     written back into the URL itself - so landing on a genuine plain anchor
     (e.g. a bookmarked #features link, with no demo hash at all) is never
     clobbered into a #demo= URL by a stale saved page from a previous
     visit. */
  var DEMO_PAGE_STORAGE_KEY = "ledgo-website-demo-page";
  var DEMO_PAGES = ["dashboard", "billing", "inventory", "purchase", "reports", "storefront", "platform", "hardware"];
  var DEMO_PAGE_I18N_KEYS = {
    dashboard: "devices.page.dashboard",
    billing: "devices.page.billing",
    inventory: "devices.page.inventory",
    purchase: "devices.page.purchase",
    reports: "devices.page.reports",
    storefront: "devices.page.storefront",
    platform: "devices.page.platform",
    hardware: "devices.page.hardware",
  };
  var currentDemoPage = null;

  function demoPageFromHash() {
    var m = /^#demo=([a-z]+)$/.exec(window.location.hash);
    if (m && DEMO_PAGES.indexOf(m[1]) !== -1) return m[1];
    return null;
  }

  function refreshDemoViewingLabel() {
    var nameEl = document.getElementById("demoViewingName");
    if (nameEl && currentDemoPage) {
      nameEl.textContent = t(DEMO_PAGE_I18N_KEYS[currentDemoPage] || DEMO_PAGE_I18N_KEYS.dashboard);
    }
  }

  function selectDemoPage(page, opts) {
    opts = opts || {};
    if (DEMO_PAGES.indexOf(page) === -1) page = "dashboard";
    if (page === currentDemoPage) return;
    var isFirstRun = currentDemoPage === null;
    currentDemoPage = page;

    document.querySelectorAll(".page-tab").forEach(function (tab) {
      tab.setAttribute("aria-selected", tab.getAttribute("data-page") === page ? "true" : "false");
    });

    var deviceTabs = document.getElementById("deviceTabs");
    if (deviceTabs) deviceTabs.classList.toggle("demo-hidden", page !== "dashboard");

    if (page === "dashboard") {
      var activeDeviceTab = document.querySelector(".device-tab[aria-selected='true']");
      setActiveStageFrame(activeDeviceTab ? activeDeviceTab.getAttribute("data-device") : "desktop");
    } else {
      setActiveStageFrame("page");
      document.querySelectorAll(".page-shot").forEach(function (shot) {
        shot.classList.toggle("active-shot", shot.getAttribute("data-page-shot") === page);
      });
    }

    refreshDemoViewingLabel();

    // Skip the little "pop" replay on the very first (page-load) selection -
    // it should only ever announce an actual CHANGE the visitor triggered.
    if (!isFirstRun) {
      var labelEl = document.getElementById("demoViewingLabel");
      if (labelEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        labelEl.classList.remove("pop");
        void labelEl.offsetWidth; // force reflow so back-to-back page changes restart the animation
        labelEl.classList.add("pop");
      }
    }

    try {
      localStorage.setItem(DEMO_PAGE_STORAGE_KEY, page);
    } catch (e) {
      /* private browsing / storage disabled - selection still applies for this view, just won't persist */
    }

    if (opts.updateHash !== false && demoPageFromHash() !== page) {
      window.location.hash = "demo=" + page;
    }
  }

  function initDemoPager() {
    var pageTabs = document.querySelectorAll(".page-tab");
    if (!pageTabs.length) return;

    pageTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        selectDemoPage(tab.getAttribute("data-page"));
      });
    });

    // Fires for pill clicks (via the location.hash assignment above), the
    // back/forward buttons, and manual URL edits alike - a single source of
    // truth for applying #demo= state, whatever triggered the change.
    // updateHash:false below because the hash this is reacting to is
    // already exactly what triggered this listener - re-assigning it would
    // be a no-op at best and a redundant history entry at worst.
    window.addEventListener("hashchange", function () {
      var page = demoPageFromHash();
      if (page) {
        selectDemoPage(page, { updateHash: false });
      } else if (window.location.hash === "") {
        // The hash emptied out entirely - only reachable by pressing Back past
        // the very first #demo= history entry (a plain anchor like #faq never
        // produces an empty hash, it produces "#faq") - so this is genuinely
        // "back to the pre-demo state," not a click on unrelated nav. Falls
        // back to Dashboard rather than leaving the last-selected page's UI
        // visibly stuck while the URL itself has already moved on.
        selectDemoPage("dashboard", { updateHash: false });
      }
    });

    var initial = demoPageFromHash();
    if (!initial) {
      try {
        var saved = localStorage.getItem(DEMO_PAGE_STORAGE_KEY);
        if (saved && DEMO_PAGES.indexOf(saved) !== -1) initial = saved;
      } catch (e) {
        /* ignore */
      }
    }
    // updateHash:false - never write to the URL on a silent initial
    // restore (see the big comment above this section for why).
    selectDemoPage(initial || "dashboard", { updateHash: false });
  }

  /* ---------------- Hero CTA cursor spotlight ----------------
     Cursor-following spotlight on the hero's primary CTA - see the matching
     ::before rule + comment in styles.css. Gated the same way at both
     layers: the CSS reveal only applies under `(hover:hover) and
     (pointer:fine)`, and this listener is never even attached outside that
     same media query, so a touch device never pays for a mousemove handler
     that would do nothing useful there anyway (touch doesn't fire
     mousemove). */
  function initCtaSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll(".hero-ctas .btn-solid").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty("--x", x + "%");
        btn.style.setProperty("--y", y + "%");
      });
    });
  }

  /* ---------------- Swatch hover tooltip ----------------
     A small "AgriPro Green" / "Ocean Teal" / etc. label pops up just above
     whichever theme swatch is hovered - reads its name from the same
     THEME_NAMES map the theme engine itself uses (top of this file), not a
     second hardcoded copy. Writes it into a `data-tip` attribute; the actual
     bubble is a CSS ::before reading `attr(data-tip)` (see styles.css) so no
     extra per-swatch DOM elements are needed. Gated the same way as
     initCtaSpotlight() just above and the nav-link underline sweep in
     styles.css: `(hover: hover) and (pointer: fine)` only, so touch devices
     never even get the attribute written, on top of the CSS itself already
     scoping the visual reveal to the same media query. */
  function initSwatchTooltips() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll(".swatch").forEach(function (swatch) {
      var name = THEME_NAMES[swatch.getAttribute("data-theme-btn")];
      if (name) swatch.setAttribute("data-tip", name);
    });
  }

  /* ---------------- Scroll-progress bar ----------------
     Fills the thin strip fixed above the header left-to-right as the page
     scrolls, 0% at the very top to 100% at the very bottom. Throttled to one
     update per animation frame via requestAnimationFrame - the exact same
     ticking-flag pattern initHeroParallax() above already uses for its own
     scroll listener - rather than recomputing on every raw scroll event. */
  function initScrollProgress() {
    var bar = document.getElementById("scrollProgressBar");
    if (!bar) return;

    var ticking = false;
    var scrollable = 1;

    // measured on load and resize only, so scrolling does not force a layout
    function measure() {
      var doc = document.documentElement;
      scrollable = Math.max(1, doc.scrollHeight - doc.clientHeight);
    }

    function update() {
      ticking = false;
      var ratio = Math.min(1, Math.max(0, (window.scrollY || 0) / scrollable));
      bar.style.transform = "scaleX(" + ratio + ")";
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function onResize() { measure(); onScroll(); }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);
    measure();
    update();
  }

  /* ---------------- Footer year ---------------- */
  function initFooterYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------- Header background + compact-on-scroll ----------------
     One scroll listener drives both effects: the existing box-shadow toggle,
     and now also an `.is-compact` class once the visitor has scrolled past
     ~120px, which styles.css uses to shrink the header's height and logo by
     a subtle ~12% (see `.site-header.is-compact` there). Reuses this exact
     handler rather than adding a second, competing scroll listener for the
     same element. */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var COMPACT_THRESHOLD = 120;
    var shadowOn = false, compactOn = false;
    var onScroll = function () {
      var y = window.scrollY;
      // only touch the DOM when something actually changes
      if ((y > 8) !== shadowOn) {
        shadowOn = y > 8;
        header.style.boxShadow = shadowOn ? "0 8px 24px -16px rgba(0,0,0,0.5)" : "none";
      }
      if ((y > COMPACT_THRESHOLD) !== compactOn) {
        compactOn = y > COMPACT_THRESHOLD;
        header.classList.toggle("is-compact", compactOn);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Hero scroll-cue ----------------
     A small bouncing chevron at the bottom of the hero, inviting the visitor
     to keep scrolling - fades out (via the .is-hidden class, see the matching
     opacity transition in styles.css) once they've actually scrolled past it,
     so it never lingers once the visitor is clearly already underway. The
     bounce itself is a plain CSS animation, already covered by the global
     prefers-reduced-motion block up top (animation-duration forced to
     0.001ms), same as every other keyframe animation on this page - freezing
     it in place rather than removing it, consistent with how e.g. the hero
     device float and CTA glow pulse behave under reduced motion. Same
     ticking-flag scroll throttle as initHeaderScroll()/initScrollProgress()
     above. */
  function initScrollCue() {
    var cue = document.getElementById("scrollCue");
    if (!cue) return;

    var FADE_THRESHOLD = 180;
    var ticking = false;

    function update() {
      ticking = false;
      cue.classList.toggle("is-hidden", window.scrollY > FADE_THRESHOLD);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* ---------------- Contact form ----------------
     Client-side validation first, then a JSON POST to the LedGo ERP
     backend. Errors (validation, rate-limit, network) all surface inline
     without clearing what the visitor typed. */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var successBox = document.getElementById("contactSuccess");
    var statusEl = document.getElementById("cf-status");
    var submitBtn = document.getElementById("cf-submit");
    var nameInput = document.getElementById("cf-name");
    var emailInput = document.getElementById("cf-email");
    var phoneInput = document.getElementById("cf-phone");
    var messageInput = document.getElementById("cf-message");

    function setError(fieldId, message) {
      var errorEl = document.getElementById(fieldId + "-error");
      if (errorEl) errorEl.textContent = message || "";
      var input = document.getElementById(fieldId);
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate() {
      var ok = true;
      setError("cf-name", "");
      setError("cf-email", "");
      setError("cf-message", "");

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var message = messageInput.value.trim();

      if (!name) {
        setError("cf-name", t("cta.form.errorRequired"));
        ok = false;
      }
      if (!email) {
        setError("cf-email", t("cta.form.errorRequired"));
        ok = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("cf-email", t("cta.form.errorEmail"));
        ok = false;
      }
      if (!message) {
        setError("cf-message", t("cta.form.errorRequired"));
        ok = false;
      }
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");

      if (!validate()) return;

      var payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        message: messageInput.value.trim(),
      };

      // Static site: hand the enquiry to the visitor's own mail app, addressed
      // to the company email from settings.json, with every field filled in.
      var to = contactEmail();
      if (!to) {
        statusEl.textContent = "Contact details are still loading. Please try again in a moment.";
        statusEl.classList.add("is-error");
        return;
      }
      // "Request free trial" buttons set data-intent on the form (see js/settings.js)
      var productName = window.TMB.settings.products["ledgo-erp"].name;
      var intent = form.getAttribute("data-intent");
      var subject = (intent ? intent + " (" + productName + ")" : productName + " enquiry") + " from " + payload.name;
      var body =
        "Name: " + payload.name + "\n" +
        "Email: " + payload.email + "\n" +
        (payload.phone ? "Phone: " + payload.phone + "\n" : "") +
        "\n" + payload.message + "\n";
      window.location.href =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      form.hidden = true;
      successBox.hidden = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initMode();
    initLang();
    initReveal();
    initHeroStats();
    initThemePreviewReveal();
    initFaqAccordion();
    initHeroParallax();
    initMobileNav();
    initDeviceTabs();
    initDemoPager();
    initCtaSpotlight();
    initSwatchTooltips();
    initScrollProgress();
    initScrollCue();
    initFooterYear();
    initHeaderScroll();
    initContactForm();
    /* initTheme() and initLang() above already each call updateProductScreenshots()
       and updateFeatureScreenshots() once (via applyTheme/applyLang), but initTheme()
       runs first - so on a reload with a saved non-English language, its call briefly
       computes against the not-yet-applied language before initLang() corrects it a
       moment later. One more explicit call here, after both have settled, guarantees
       the very first paint is already correct rather than relying on that ordering. */
    updateProductScreenshots();
    updateFeatureScreenshots();
  });
})();

