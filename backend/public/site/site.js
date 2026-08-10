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

// Client page view (pairs with server log; visitorId enables unique counts)
track("page_view", {});

document.addEventListener("click", function (e) {
  const el = e.target && e.target.closest ? e.target.closest("[data-contact-track]") : null;
  if (!el) return;
  const channel = el.getAttribute("data-contact-track");
  if (!channel) return;
  track("contact_click", { channel: channel });
});
