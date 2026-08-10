import { propertyToJson } from "../db/mappers";
import type { PropertyRow } from "../types";
import type { PropertyVideo } from "../utils/propertyVideos";
import { renderContactSection } from "../utils/contact";
import { citySlug, escapeHtml } from "./escape";
import { renderLayout } from "./layout";

type PropertyJson = ReturnType<typeof propertyToJson>;

function formatUsd(n: number): string {
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `$${rounded}`;
}

function videoBlock(videos: PropertyVideo[], title: string): string {
  if (!videos.length) return "";
  const items = videos
    .map((v, i) => {
      if (v.kind === "youtube" || v.kind === "vimeo") {
        return `<div class="video-frame">
          <iframe
            src="${escapeHtml(v.embedUrl!)}"
            title="${escapeHtml(`${title} tour video ${i + 1}`)}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>`;
      }
      return `<div class="video-frame">
        <video controls playsinline preload="metadata" src="${escapeHtml(v.url)}">
          Your browser does not support video playback.
        </video>
      </div>`;
    })
    .join("");

  return `<section class="section video-section">
    <div class="shell">
      <h2 class="section-title">House tour videos</h2>
      <p class="section-lead">Walk through the rooms before you request a stay.</p>
      <div class="video-stack">${items}</div>
    </div>
  </section>`;
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
      <p class="brand-mark">Ethio Guest Houses</p>
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
        <p class="section-lead">Book from the USA, Europe, Africa, Asia — we help you find a stay in Addis Ababa.</p>
      </div>
      <ol class="how-list">
        <li><strong>Browse</strong> Addis Ababa guest houses with photos and videos.</li>
        <li><strong>Message us</strong> on WhatsApp, Viber, phone, or email.</li>
        <li><strong>Stay</strong> — pay on arrival in ETB (prices listed from $50 USD).</li>
      </ol>
    </div>
  </section>

  ${renderContactSection()}`;

  return renderLayout(
    {
      title: "Ethio Guest Houses | Addis Ababa stays for travelers worldwide",
      description:
        "Find guest houses in Addis Ababa from $50 USD / night. Contact Ethio Guest Houses by WhatsApp, Viber, phone, or email — welcoming guests from around the world.",
      path: "/",
      image: heroImage,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Ethio Guest Houses",
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
    ? `Guest houses in ${cityFilter} | Ethio Guest Houses`
    : "Guest houses in Addis Ababa & Ethiopia | Ethio Guest Houses";
  const description = cityFilter
    ? `Browse Ethio guest houses in ${cityFilter} from $50 USD / night. Contact us on WhatsApp or Viber.`
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
      <p class="brand-mark">Ethio Guest Houses</p>
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
  const gallery = p.imageUrls
    .map(
      (url, i) =>
        `<figure class="gallery-item">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(`${p.title} photo ${i + 1}`)}" loading="${i === 0 ? "eager" : "lazy"}" />
        </figure>`
    )
    .join("");

  const amenities = p.amenities
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  const body = `
  <section class="stay-hero">
    <div class="shell stay-hero-grid">
      <div class="stay-gallery">${gallery || `<div class="card-photo placeholder"></div>`}</div>
      <div class="stay-summary">
        <p class="brand-mark">Ethio Guest Houses</p>
        <h1>${escapeHtml(p.title)}</h1>
        <p class="card-meta">${escapeHtml(p.city)} · ${escapeHtml(p.address)}</p>
        <p class="stay-rate">${formatUsd(p.nightlyRateUsd)} <span>USD / night · max ${p.maxGuests} guests</span></p>
        <p class="fine-print">${escapeHtml(p.payOnArrivalNote)}</p>
        <p class="stay-desc">${escapeHtml(p.description)}</p>
        <ul class="amenity-list">${amenities}</ul>
        <div class="hero-actions" style="margin-top:1rem">
          <a class="btn btn-primary" href="#contact">Ask about this stay</a>
          <a class="btn btn-ghost" style="border-color:rgba(12,46,36,0.25);color:var(--forest)" href="/demo">Request booking</a>
        </div>
        <p class="fine-print">Host approval booking · Prices from $50 USD</p>
      </div>
    </div>
  </section>
  ${videoBlock(p.videos, p.title)}
  <section class="section">
    <div class="shell">
      <a class="text-link" href="/guest-houses/city/${citySlug(p.city)}">More guest houses in ${escapeHtml(p.city)}</a>
    </div>
  </section>
  ${renderContactSection({ compact: true })}`;

  return renderLayout(
    {
      title: `${p.title} in ${p.city} | Ethio Guest Houses`,
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
      title: "Not found | Ethio Guest Houses",
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
