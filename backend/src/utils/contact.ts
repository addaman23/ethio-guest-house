import { config } from "../config";
import { escapeHtml } from "../web/escape";

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function getContactInfo() {
  const email = config.contactEmail;
  const phone = config.contactPhone;
  const whatsapp = config.contactWhatsapp;
  const viber = config.contactViber;
  const waDigits = digitsOnly(whatsapp);
  const viberDigits = digitsOnly(viber);

  return {
    label: config.contactLabel,
    email,
    phone,
    whatsapp,
    viber,
    emailHref: `mailto:${email}?subject=${encodeURIComponent("AddisAbaba Guest Houses inquiry")}`,
    phoneHref: `tel:${phone.replace(/\s/g, "")}`,
    whatsappHref: `https://wa.me/${waDigits}?text=${encodeURIComponent(
      "Hello AddisAbaba Guest Houses — I am interested in a guest house in Addis Ababa."
    )}`,
    viberHref: `viber://chat?number=%2B${viberDigits}`,
  };
}

/** Contact block for public pages (tracked via data-contact-track). */
export function renderContactSection(opts?: { compact?: boolean }): string {
  const c = getContactInfo();
  const title = opts?.compact ? "Contact us" : "Contact AddisAbaba Guest Houses";
  const lead = opts?.compact
    ? "Worldwide guests — message us anytime about Addis Ababa stays."
    : "Serving travelers worldwide looking for guest houses in Addis Ababa. Reach us by email, WhatsApp, Viber, or phone.";

  return `<section class="section contact-section" id="contact">
    <div class="shell contact-panel">
      <div>
        <p class="brand-mark contact-brand">${escapeHtml(c.label)}</p>
        <h2 class="section-title">${title}</h2>
        <p class="section-lead">${lead}</p>
      </div>
      <div class="contact-actions">
        <a class="contact-btn contact-wa" data-contact-track="whatsapp" href="${escapeHtml(c.whatsappHref)}" target="_blank" rel="noopener noreferrer">WhatsApp<br><span>${escapeHtml(c.whatsapp)}</span></a>
        <a class="contact-btn contact-vb" data-contact-track="viber" href="${escapeHtml(c.viberHref)}">Viber<br><span>${escapeHtml(c.viber)}</span></a>
        <a class="contact-btn contact-ph" data-contact-track="phone" href="${escapeHtml(c.phoneHref)}">Call<br><span>${escapeHtml(c.phone)}</span></a>
        <a class="contact-btn contact-em" data-contact-track="email" href="${escapeHtml(c.emailHref)}">Email<br><span>${escapeHtml(c.email)}</span></a>
      </div>
    </div>
  </section>`;
}

export function renderFooterContact(): string {
  const c = getContactInfo();
  return `<div>
        <p class="footer-label">Contact</p>
        <a data-contact-track="whatsapp" href="${escapeHtml(c.whatsappHref)}" target="_blank" rel="noopener noreferrer">WhatsApp ${escapeHtml(c.whatsapp)}</a>
        <a data-contact-track="viber" href="${escapeHtml(c.viberHref)}">Viber ${escapeHtml(c.viber)}</a>
        <a data-contact-track="phone" href="${escapeHtml(c.phoneHref)}">Call ${escapeHtml(c.phone)}</a>
        <a data-contact-track="email" href="${escapeHtml(c.emailHref)}">${escapeHtml(c.email)}</a>
      </div>`;
}
