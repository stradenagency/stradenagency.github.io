/* Straden lead client: LEAD-EVENT-CONTRACT.md v1.1, schema version 1 (HQ 672, HQ 688).
   Captures first-touch attribution, sends one submission per form fill, retries
   once with the same submission_id, and reports failure so the page can fall back. */
(function () {
  const SCHEMA_VERSION = "1";
  const ATTRIBUTION_STORAGE_KEY = "stradenAttributionV1";
  const PARAM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid"];
  const TIMEOUT_MS = 8000;

  function endpoint() {
    const meta = document.querySelector('meta[name="straden-lead-endpoint"]');
    return meta ? meta.content.replace(/\/$/, "") : "";
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Keeps the markers of the latest page in this tab that arrived carrying any; a page
  // reached by an internal link (no markers) keeps the ones already stored.
  function captureAttribution() {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasMarkers = PARAM_KEYS.some(key => params.get(key));
      if (sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) && !hasMarkers) return;
      const attribution = { landing_url: window.location.href.slice(0, 500), first_seen_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") };
      if (document.referrer) attribution.referrer = document.referrer.slice(0, 500);
      PARAM_KEYS.forEach(key => {
        const value = params.get(key);
        if (value) attribution[key] = value.slice(0, 500);
      });
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    } catch (error) {
      console.warn("Attribution could not be stored for this visit.", error);
    }
  }

  function attribution() {
    try {
      return JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  // One form fill: a stable submission_id and a fill timer, created when the form is shown.
  function startForm() {
    const shownAt = Date.now();
    return {
      submissionId: newId(),
      fillMs: () => Math.max(0, Date.now() - shownAt)
    };
  }

  async function postOnce(url, body) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined,
        credentials: "omit",
        mode: "cors"
      });
      let data = {};
      try { data = await response.json(); } catch (error) { data = {}; }
      return { ok: response.ok, status: response.status, data };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Resolves { saved: true, bookingKey, resultEmail } on success, { saved: false } otherwise. Never throws.
  // payload.website is the form's hidden spam-trap field; people leave it empty.
  async function submit(form, payload) {
    const url = endpoint();
    if (!url) return { saved: false, reason: "no_endpoint" };
    const body = Object.assign({ schema_version: SCHEMA_VERSION, submission_id: form.submissionId, attribution: attribution(), website: "" }, payload);
    body.client = Object.assign({ fill_ms: form.fillMs(), page: window.location.pathname.slice(0, 300) }, payload.client || {});
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await postOnce(`${url}/v1/submissions`, body);
        if (result.ok) return { saved: true, status: result.data.status, bookingKey: result.data.booking_key || null, resultEmail: result.data.result_email || "off" };
        if (result.status >= 400 && result.status < 500 && result.status !== 429) return { saved: false, reason: result.data.status || `http_${result.status}` };
      } catch (error) {
        // network failure or timeout: retry once with the same submission_id
      }
    }
    return { saved: false, reason: "unreachable" };
  }

  function withBookingKey(url, bookingKey) {
    if (!bookingKey) return url;
    const target = new URL(url);
    target.searchParams.set("straden_ref", bookingKey);
    return target.toString();
  }

  captureAttribution();
  window.StradenLeads = { startForm, submit, withBookingKey, attribution };
})();
