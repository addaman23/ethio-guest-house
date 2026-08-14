import { propertyToJson } from "../db/mappers";
import type { PropertyRow } from "../types";
import { renderContactSection } from "../utils/contact";
import { citySlug, escapeHtml } from "./escape";
import { renderLayout } from "./layout";

type PropertyJson = ReturnType<typeof propertyToJson>;

function formatUsd(n: number): string {
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `$${rounded}`;
}

function mediaGallery(p: PropertyJson): string {
  const photoItems = p.imageUrls.map((url, i) => {
    return `<button type="button" class="gallery-item media-thumb" data-media-type="image" data-media-src="${escapeHtml(url)}" data-media-label="${escapeHtml(`${p.title} photo ${i + 1}`)}" aria-label="View photo ${i + 1}">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(`${p.title} photo ${i + 1}`)}" loading="${i === 0 ? "eager" : "lazy"}" />
    </button>`;
  });

  const videoItems = p.videos.map((v, i) => {
    const label = `${p.title} video ${i + 1}`;
    if (v.kind === "youtube" || v.kind === "vimeo") {
      const thumb =
        v.kind === "youtube" && v.embedUrl
          ? `https://img.youtube.com/vi/${escapeHtml(
              (v.embedUrl.split("/embed/")[1] || "").split("?")[0]
            )}/hqdefault.jpg`
          : "";
      return `<button type="button" class="gallery-item media-thumb is-video" data-media-type="embed" data-media-src="${escapeHtml(v.embedUrl || v.url)}" data-media-label="${escapeHtml(label)}" aria-label="Play video ${i + 1}">
        ${thumb ? `<img src="${thumb}" alt="" loading="lazy" />` : `<span class="media-video-fallback" aria-hidden="true"></span>`}
        <span class="play-badge" aria-hidden="true">▶</span>
        <span class="media-chip">Video</span>
      </button>`;
    }
    return `<button type="button" class="gallery-item media-thumb is-video" data-media-type="video" data-media-src="${escapeHtml(v.url)}" data-media-label="${escapeHtml(label)}" aria-label="Play video ${i + 1}">
      <video src="${escapeHtml(v.url)}" muted playsinline preload="metadata"></video>
      <span class="play-badge" aria-hidden="true">▶</span>
      <span class="media-chip">Video</span>
    </button>`;
  });

  const items = [...photoItems, ...videoItems].join("");
  if (!items) {
    return `<div class="card-photo placeholder"></div>`;
  }

  return `<div class="stay-gallery" data-media-gallery>
    ${items}
  </div>
  <p class="gallery-hint">Tap any photo or video to open full size</p>`;
}

function mediaLightboxMarkup(): string {
  return `<div id="mediaLightbox" class="media-lightbox hidden" role="dialog" aria-modal="true" aria-label="Media viewer">
    <button type="button" class="media-lightbox-close" data-media-close aria-label="Close">&times;</button>
    <button type="button" class="media-lightbox-nav media-lightbox-prev" data-media-prev aria-label="Previous">&#8249;</button>
    <button type="button" class="media-lightbox-nav media-lightbox-next" data-media-next aria-label="Next">&#8250;</button>
    <div class="media-lightbox-stage" data-media-stage></div>
    <p class="media-lightbox-caption" data-media-caption></p>
  </div>`;
}

function propertyCard(p: PropertyJson): string {
  const img = p.imageUrl
    ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" loading="lazy" />`
    : `<div class="card-photo placeholder" aria-hidden="true"></div>`;
  const hasVideo = p.videos.length > 0;
  return `<a class="stay-card" href="/stay/${escapeHtml(p.id)}">
    <div class="card-photo">${img}${hasVideo ? `<span class="video-chip">Video tour</span>` : ""}</div>
    <div class="card-body">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="card-meta">${escapeHtml(p.city)} · up to ${p.maxGuests} guests</p>
      <p class="card-price">${formatUsd(p.nightlyRateUsd)} <span>USD / night</span></p>
    </div>
  </a>`;
}

export function homePage(properties: PropertyRow[]): string {
  const live = properties.map(propertyToJson);
  const addis = live.filter((p) => p.city.toLowerCase() === "addis ababa");
  const featured = (addis.length ? addis : live).slice(0, 3);
  const heroImage = featured[0]?.imageUrl;

  const body = `
  <section class="hero" style="${heroImage ? `--hero-image:url('${escapeHtml(heroImage)}')` : ""}">
    <div class="hero-veil"></div>
    <div class="shell hero-content">
      <p class="brand-mark">AddisAbaba Guest Houses</p>
      <h1>Guest houses in Addis Ababa</h1>
      <p class="hero-lead">Welcoming travelers from around the world. Browse verified Addis Ababa stays from $50 USD / night — with photos, video tours, and easy contact on WhatsApp, Viber, phone, or email.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/guest-houses/city/addis-ababa">Browse Addis Ababa</a>
        <a class="btn btn-ghost" href="#contact">Contact us</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="shell">
      <h2 class="section-title">Featured Addis Ababa stays</h2>
      <p class="section-lead">Homes and guest houses for international visitors — host approval booking, pay on arrival.</p>
      <div class="stay-grid">
        ${featured.map(propertyCard).join("") || `<p class="empty">Listings are coming online soon.</p>`}
      </div>
      <p style="margin-top:1.5rem"><a class="text-link" href="/guest-houses">See all guest houses</a></p>
    </div>
  </section>

  <section class="section band">
    <div class="shell how-grid">
      <div>
        <h2 class="section-title">For guests worldwide</h2>
        <p class="section-lead">Book from the USA, Europe, Africa, Asia, United Arab Emirates — we help you find a stay in Addis Ababa.</p>
      </div>
      <ol class="how-list">
        <li><strong>Browse</strong> Addis Ababa guest houses with photos and videos.</li>
        <li><strong>Message us</strong> on WhatsApp, Viber, phone, or email.</li>
        <li><strong>Stay</strong> — pay 10% deposit 1 day before check-in; remainder on arrival in ETB.</li>
      </ol>
    </div>
  </section>

  ${renderContactSection()}`;

  return renderLayout(
    {
      title: "AddisAbaba Guest Houses | Addis Ababa stays for travelers worldwide",
      description:
        "Find guest houses in Addis Ababa from $50 USD / night. Contact AddisAbaba Guest Houses by WhatsApp, Viber, phone, or email — welcoming guests from around the world.",
      path: "/",
      image: heroImage,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AddisAbaba Guest Houses",
        url: "/",
        description:
          "Guest houses in Addis Ababa for international travelers, with WhatsApp and Viber contact.",
        potentialAction: {
          "@type": "SearchAction",
          target: "/guest-houses?city={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    },
    body
  );
}

export function listingsPage(properties: PropertyRow[], cityFilter?: string): string {
  const live = properties.map(propertyToJson);
  const cities = [...new Set(live.map((p) => p.city))].sort((a, b) => {
    if (a === "Addis Ababa") return -1;
    if (b === "Addis Ababa") return 1;
    return a.localeCompare(b);
  });
  const title = cityFilter
    ? `Guest houses in ${cityFilter} | AddisAbaba Guest Houses`
    : "Guest houses in Addis Ababa & Ethiopia | AddisAbaba Guest Houses";
  const description = cityFilter
    ? `Browse AddisAbaba Guest Houses in ${cityFilter} from $50 USD / night. Contact us on WhatsApp or Viber.`
    : "Browse guest houses in Addis Ababa and across Ethiopia from $50 USD / night. For travelers worldwide.";

  const cityLinks = cities
    .map(
      (c) =>
        `<a class="city-pill${cityFilter === c ? " active" : ""}" href="/guest-houses/city/${citySlug(c)}">${escapeHtml(c)}</a>`
    )
    .join("");

  const body = `
  <section class="page-head">
    <div class="shell">
      <p class="brand-mark">AddisAbaba Guest Houses</p>
      <h1>${cityFilter ? `Guest houses in ${escapeHtml(cityFilter)}` : "Guest houses for worldwide travelers"}</h1>
      <p class="section-lead">${
        cityFilter
          ? `Stays in ${escapeHtml(cityFilter)} — contact us anytime to reserve.`
          : "Start with Addis Ababa, or browse other Ethiopian cities. Message us on WhatsApp or Viber."
      }</p>
      <div id="cities" class="city-row">
        <a class="city-pill${!cityFilter ? " active" : ""}" href="/guest-houses">All cities</a>
        ${cityLinks}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="stay-grid">
        ${live.map(propertyCard).join("") || `<p class="empty">No live guest houses in this city yet. Contact us and we will help.</p>`}
      </div>
    </div>
  </section>
  ${renderContactSection({ compact: true })}`;

  return renderLayout(
    {
      title,
      description,
      path: cityFilter ? `/guest-houses/city/${citySlug(cityFilter)}` : "/guest-houses",
      image: live[0]?.imageUrl,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        numberOfItems: live.length,
        itemListElement: live.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `/stay/${p.id}`,
          name: p.title,
        })),
      },
    },
    body
  );
}

export function stayPage(row: PropertyRow): string {
  const p = propertyToJson(row);

  const amenities = p.amenities
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  const photoCount = p.imageUrls.length;
  const videoCount = p.videos.length;
  const mediaSummary =
    photoCount || videoCount
      ? `${photoCount} photo${photoCount === 1 ? "" : "s"}${videoCount ? ` · ${videoCount} video${videoCount === 1 ? "" : "s"}` : ""}`
      : "";

  const body = `
  <section class="stay-hero">
    <div class="shell stay-hero-grid">
      <div>
        ${mediaGallery(p)}
        ${mediaSummary ? `<p class="card-meta" style="margin-top:0.35rem">${escapeHtml(mediaSummary)}</p>` : ""}
      </div>
      <div class="stay-summary">
        <p class="brand-mark">AddisAbaba Guest Houses</p>
        <h1>${escapeHtml(p.title)}</h1>
        <p class="card-meta">${escapeHtml(p.city)} · ${escapeHtml(p.address)}</p>
        <p class="stay-rate">${formatUsd(p.nightlyRateUsd)} <span>USD / night · max ${p.maxGuests} guests</span></p>
        <p class="fine-print">${escapeHtml(p.payOnArrivalNote)}</p>
        <p class="fine-print">10% deposit due 1 day before check-in (WhatsApp); remainder paid on arrival.</p>
        <p class="stay-desc">${escapeHtml(p.description)}</p>
        <ul class="amenity-list">${amenities}</ul>
        <div class="hero-actions" style="margin-top:1rem">
          <a class="btn btn-primary" href="#request-stay">Request this stay</a>
          <a class="btn btn-ghost" style="border-color:rgba(12,46,36,0.25);color:var(--forest)" href="#contact">Contact us</a>
        </div>
        <p class="fine-print">Host approval booking · Prices from $50 USD</p>
      </div>
    </div>
  </section>
  <section class="section" id="request-stay">
    <div class="shell request-panel">
      <h2 class="section-title">Send a booking request</h2>
      <p class="section-lead">Our admin team will see your message, contact you, and approve if the stay is available.</p>
      <form class="request-form" data-booking-request data-property-id="${escapeHtml(p.id)}">
        <label>Full name<input name="guestName" required minlength="2" placeholder="Your name" /></label>
        <label>Phone / WhatsApp<input name="guestPhone" required placeholder="+2519… or 09…" /></label>
        <label>Email<input name="guestEmail" type="email" placeholder="you@email.com" /></label>
        <label>Check-in<input name="checkIn" type="date" /></label>
        <label>Check-out<input name="checkOut" type="date" /></label>
        <label>Guests<input name="guests" type="number" min="1" max="${p.maxGuests}" value="2" /></label>
        <label class="full">Message<textarea name="message" rows="3" placeholder="Tell us about your trip…"></textarea></label>
        <button class="btn btn-primary" type="submit">Send request to admin</button>
        <p class="request-status muted" aria-live="polite"></p>
      </form>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <a class="text-link" href="/guest-houses/city/${citySlug(p.city)}">More guest houses in ${escapeHtml(p.city)}</a>
    </div>
  </section>
  ${renderContactSection({ compact: true })}
  ${mediaLightboxMarkup()}`;

  return renderLayout(
    {
      title: `${p.title} in ${p.city} | AddisAbaba Guest Houses`,
      description: `${p.description} From ${formatUsd(p.nightlyRateUsd)} USD/night. Contact us on WhatsApp or Viber.`,
      path: `/stay/${p.id}`,
      image: p.imageUrl,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        name: p.title,
        description: p.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: p.city,
          streetAddress: p.address,
          addressCountry: "ET",
        },
        image: p.imageUrls,
        priceRange: `${formatUsd(p.nightlyRateUsd)} USD`,
        url: `/stay/${p.id}`,
      },
    },
    body
  );
}

export function notFoundPage(): string {
  return renderLayout(
    {
      title: "Not found | AddisAbaba Guest Houses",
      description: "This page could not be found.",
      path: "/404",
    },
    `<section class="page-head"><div class="shell">
      <h1>Page not found</h1>
      <p class="section-lead">Try browsing Addis Ababa guest houses instead.</p>
      <a class="btn btn-primary" href="/guest-houses/city/addis-ababa">Browse Addis Ababa</a>
    </div></section>
    ${renderContactSection({ compact: true })}`
  );
}
