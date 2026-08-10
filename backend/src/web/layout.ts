import { config } from "../config";
import { getContactInfo, renderFooterContact } from "../utils/contact";
import { escapeHtml } from "./escape";

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function renderLayout(meta: PageMeta, body: string): string {
  const base = config.publicBaseUrl.replace(/\/$/, "");
  const url = `${base}${meta.path.startsWith("/") ? meta.path : `/${meta.path}`}`;
  const image = meta.image || `${base}/site/og-default.svg`;
  const contact = getContactInfo();
  const jsonLd = meta.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
    : "";

  const orgLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Ethio Guest Houses",
    description:
      "Guest houses in Addis Ababa for travelers worldwide. Contact via WhatsApp, Viber, phone, or email.",
    url: base,
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Addis Ababa",
      addressCountry: "ET",
    },
    areaServed: "Addis Ababa",
  })}</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ethio Guest Houses" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site/site.css" />
  ${orgLd}
  ${jsonLd}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/">Ethio Guest Houses</a>
      <nav class="nav" aria-label="Primary">
        <a href="/guest-houses/city/addis-ababa">Addis Ababa</a>
        <a href="/guest-houses">Browse stays</a>
        <a href="#contact">Contact</a>
        <a class="nav-cta" data-contact-track="whatsapp" href="${escapeHtml(contact.whatsappHref)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </nav>
    </div>
  </header>
  <main id="main">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div>
        <p class="footer-brand">Ethio Guest Houses</p>
        <p class="footer-copy">Guest houses in Addis Ababa for travelers worldwide — from $50 USD / night.</p>
      </div>
      <div>
        <p class="footer-label">Explore</p>
        <a href="/guest-houses/city/addis-ababa">Addis Ababa stays</a>
        <a href="/guest-houses">All guest houses</a>
        <a href="#contact">Contact</a>
      </div>
      ${renderFooterContact()}
    </div>
    <p class="footer-fine shell">&copy; ${new Date().getFullYear()} Ethio Guest Houses · Addis Ababa, Ethiopia</p>
  </footer>
  <script src="/site/site.js" defer></script>
</body>
</html>`;
}
