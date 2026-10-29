/* Analytics and ad tracking (HQ 652.3, HQ 688). Off until an ID below is filled in. Then a cookie notice asks
   first, and Google Analytics and the Meta pixel load only if the visitor accepts. The site's own events
   (tracking/EVENT-MAP.md) are passed on; none carries a name, email, company, phone or typed text.
   The notice's wording and the Privacy Policy's section 6 were approved by Jamal on 2026-10-10 (tracking/PRIVACY-REVIEW.md). */
(() => {
  const CONFIG = {
    ga4: "G-ZTN62C8F6N",  // Google Analytics 4 measurement ID (property created by Jamal, 2026-10-10)
    metaPixel: "28937196299225819" // Correct Straden dataset read back15Oct; consent still required.
  };
  if (!CONFIG.ga4 && !CONFIG.metaPixel) return;

  // New purpose includes confirmed bookings; earlier page-measurement consent is not reused.
  const KEY = "stradenConsentV2";
  const EVENTS = ["book_call_click", "mini_audit_click", "audit_view", "audit_start", "audit_step", "audit_gate_view", "audit_lead",
                  "audit_result_view", "audit_lead_saved", "audit_book_call_click", "audit_restart", "contact_form_send",
                  // HQ 652.47: early access on the home page and the Mini Audit waitlist opt-in (tracking/EVENT-MAP.md).
                  "early_access_click", "early_access_signup", "audit_waitlist_join", "audit_early_access_click"];
  // Meta's standard events where one fits; the rest go as custom events under their own names.
  const META_STANDARD = { audit_lead: "Lead" };
  let started = false;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (error) { return null; }
  }
  function remember(choice) {
    try { localStorage.setItem(KEY, choice); } catch (error) { /* private window: ask again next visit */ }
  }
  function load(src) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function send(detail) {
    if (stored() !== "granted") return;
    if (!detail || EVENTS.indexOf(detail.event) === -1) return;
    const params = Object.assign({}, detail);
    delete params.event;
    if (CONFIG.ga4 && window.gtag) window.gtag("event", detail.event, params);
    if (CONFIG.metaPixel && window.fbq) {
      if (detail.event === "contact_form_send" && detail.outcome === "saved") window.fbq("track", "Contact");
      else if (META_STANDARD[detail.event]) window.fbq("track", META_STANDARD[detail.event], params);
      else window.fbq("trackCustom", detail.event, params);
    }
  }

  function start() {
    if (started) return;
    started = true;
    if (CONFIG.ga4) {
      window.gtag = function () { window.dataLayer.push(arguments); };  // Google's standard loader stub
      window.gtag("js", new Date());
      window.gtag("config", CONFIG.ga4);
      load(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.ga4)}`);
    }
    if (CONFIG.metaPixel) {
      const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
      load("https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", CONFIG.metaPixel);
      fbq("track", "PageView");
    }
    // Events this page fired before consent, then every later one.
    (window.dataLayer || []).slice().forEach(entry => { if (entry && typeof entry === "object" && !("length" in entry)) send(entry); });
    window.addEventListener("straden:track", event => send(event.detail));
  }

  window.StradenMeasurement = {
    accepted: () => stored() === "granted",
    confirmedBooking(uid) {
      if (stored() !== "granted" || !CONFIG.metaPixel || !window.fbq ||
          typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return false;
      // No callback payload, lead key, attendee details or Google fields enter measurement.
      window.fbq("track", "Schedule", {}, { eventID: `cal:${uid}:confirmed` });
      return true; // queued in browser; this is NOT a Meta receipt
    },
    withdraw() {
      remember("denied");
      if (CONFIG.ga4) window[`ga-disable-${CONFIG.ga4}`] = true;
      if (window.fbq) window.fbq("consent", "revoke");
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
    }
  };
  window.addEventListener("storage", event => {
    if (event.key === KEY && event.newValue !== "granted") window.StradenMeasurement.withdraw();
  });

  function notice() {
    const box = document.createElement("div");
    box.className = "cookie-notice";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Cookie notice");
    // Proposed wording, pending Jamal's approval (tracking/PRIVACY-REVIEW.md).
    box.innerHTML = '<p>We use cookies to measure pages, ads and confirmed call bookings, so we can improve them. ' +
      'They are off unless you accept. <a href="/privacy">Privacy Policy</a></p>' +
      '<div class="cookie-actions"><button type="button" class="button button-primary cookie-accept">Accept</button>' +
      '<button type="button" class="cookie-decline">Decline</button></div>';
    document.body.appendChild(box);
    box.querySelector(".cookie-accept").addEventListener("click", () => { remember("granted"); box.remove(); start(); });
    box.querySelector(".cookie-decline").addEventListener("click", () => { remember("denied"); box.remove(); });
  }

  window.dataLayer = window.dataLayer || [];
  const choice = stored();
  if (choice === "granted") start();
  else if (choice !== "denied") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", notice);
    else notice();
  }
})();
