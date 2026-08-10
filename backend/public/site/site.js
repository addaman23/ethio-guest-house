document.documentElement.classList.add("js");

const hero = document.querySelector(".hero");
if (hero) {
  const onScroll = () => {
    const y = Math.min(window.scrollY, 280);
    hero.style.setProperty("--parallax", `${y * 0.18}px`);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function visitorId() {
  const key = "egh_vid";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function track(eventType, extra) {
  const payload = {
    eventType,
    path: location.pathname + location.search,
    visitorId: visitorId(),
    referrer: document.referrer || null,
    ...extra,
  };
  fetch("/v1/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(function () {});
}

function showSuccessPopup(title, detail) {
  let overlay = document.getElementById("successPopup");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "successPopup";
    overlay.className = "success-popup-overlay";
    overlay.innerHTML =
      '<div class="success-popup" role="dialog" aria-modal="true" aria-labelledby="successPopupTitle">' +
      '<div class="success-popup-icon" aria-hidden="true">✓</div>' +
      '<h3 id="successPopupTitle"></h3>' +
      "<p></p>" +
      '<button type="button">OK</button>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) hideSuccessPopup();
    });
    overlay.querySelector("button").addEventListener("click", hideSuccessPopup);
  }

  overlay.querySelector("h3").textContent = title;
  overlay.querySelector("p").textContent = detail;
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function hideSuccessPopup() {
  const overlay = document.getElementById("successPopup");
  if (!overlay) return;
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

// Client page view (pairs with server log; visitorId enables unique counts)
track("page_view", {});

document.addEventListener("click", function (e) {
  const el = e.target && e.target.closest ? e.target.closest("[data-contact-track]") : null;
  if (!el) return;
  const channel = el.getAttribute("data-contact-track");
  if (!channel) return;
  track("contact_click", { channel: channel });
});

document.querySelectorAll("[data-booking-request]").forEach(function (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const status = form.querySelector(".request-status");
    const btn = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);
    const payload = {
      propertyId: form.getAttribute("data-property-id") || undefined,
      guestName: String(fd.get("guestName") || "").trim(),
      guestPhone: String(fd.get("guestPhone") || "").trim(),
      guestEmail: String(fd.get("guestEmail") || "").trim(),
      checkIn: String(fd.get("checkIn") || "").trim(),
      checkOut: String(fd.get("checkOut") || "").trim(),
      guests: Number(fd.get("guests") || 1),
      message: String(fd.get("message") || "").trim(),
    };
    if (status) {
      status.classList.remove("is-error");
      status.textContent = "Sending…";
    }
    if (btn) btn.disabled = true;
    try {
      const res = await fetch("/v1/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) throw new Error(data.error || "Could not send request");
      if (status) {
        status.classList.remove("is-error");
        status.textContent =
          "Request received. Our team will contact you on WhatsApp, Viber, phone, or email.";
      }
      form.reset();
      showSuccessPopup(
        "Guest request sent successfully",
        "Our team will contact you on WhatsApp, Viber, phone, or email."
      );
    } catch (err) {
      if (status) {
        status.classList.add("is-error");
        status.textContent = err.message || "Failed to send";
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
