/* HQ 652.1: native Cal embed telemetry; authoritative recording is server-side only. */
(() => {
  const config = window.StradenBookingConfig || {};
  const namespace = "straden-intro";
  const contextKey = "stradenBookingContextV1";
  let context = null;
  try { context = JSON.parse(sessionStorage.getItem(contextKey) || "null"); } catch (_) { /* unavailable */ }
  const correlated = context && /^bk_[a-z2-7]{32}$/.test(context.bookingKey);
  const handled = new Set();

  function freshAccepted(detail) {
    const data = detail && detail.data;
    return detail && detail.type === "bookingSuccessfulV2" && detail.namespace === namespace && data &&
      typeof data.uid === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(data.uid) &&
      data.status === "ACCEPTED" && data.eventTypeId === config.eventTypeId &&
      data.paymentRequired === false && data.isRecurring === false;
  }

  function completed(event) {
    if (!freshAccepted(event.detail)) return;
    const uid = event.detail.data.uid;
    if (handled.has(uid)) return;
    handled.add(uid);
    let first = false;
    try {
      const key = `stradenCalSeenV1:${uid}`;
      first = !localStorage.getItem(key);
      localStorage.setItem(key, "1");
    } catch (_) { /* Storage unavailable: booking works, measurement suppressed to avoid duplicates. */ }
    if (first && correlated && window.StradenMeasurement) window.StradenMeasurement.confirmedBooking(uid);
    document.getElementById("cal-booking").hidden = true;
    document.getElementById("bookingIntro").hidden = true;
    document.getElementById("bookingThanks").hidden = false;
    document.getElementById("bookingThanksHeading").focus();
  }

  // Pure predicate is exposed for local contract tests; no raw postMessage listener is installed.
  window.StradenCalBooking = { freshAccepted };
  const status = document.getElementById("bookingStatus");
  if (!config.enabled || !Number.isSafeInteger(config.eventTypeId) || config.eventTypeId < 1 ||
      !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(config.calLink || "")) return;
  status.textContent = "Loading available times…";
  document.getElementById("cal-booking").hidden = false;

  // Standard Cal loader; callbacks are registered ONLY on this namespaced provider instance.
  (function (C, A, L) {
    const p = (a, ar) => a.q.push(ar);
    C.Cal = C.Cal || function () {
      const cal = C.Cal, ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; const s = A.createElement("script"); s.src = L; A.head.appendChild(s); cal.loaded = true; }
      if (ar[0] === "init") {
        const api = function () { p(api, arguments); }; api.q = [];
        const ns = ar[1];
        if (typeof ns === "string") { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ["initNamespace", ns]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, document, "https://app.cal.com/embed/embed.js");
  window.Cal("init", namespace, { origin: "https://cal.com" });
  const api = window.Cal.ns[namespace];
  api("on", { action: "bookingSuccessfulV2", callback: completed });
  api("on", { action: "linkReady", callback: () => { status.textContent = "Choose an available time below."; } });
  api("on", { action: "linkFailed", callback: () => { status.textContent = "The calendar could not load. Please try again, or email hello@straden.ca."; } });
  // Cal metadata transport is deliberately an explicit live proof gate (see SCHEDULER-DECISION).
  // Only this opaque key is passed. No first-touch/ad/contact fields are forwarded to Cal.
  const embedConfig = { layout: "month_view" };
  if (correlated) embedConfig["metadata[straden_ref]"] = context.bookingKey;
  api("inline", { elementOrSelector: "#cal-booking", calLink: config.calLink, config: embedConfig });
})();
