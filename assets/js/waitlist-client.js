/* Straden early-access waitlist client (HQ 652.47). The home page's "Get early access" form and the Mini Audit's
   opt-in send to the same waitlist as the two lane pages (/service-trades, /specialty-contractors-consultants):
   the Sites endpoint that writes lead_capture.delivery_waitlist. The lane is set by the database from the type of
   business, never here. Nothing is sent without the visitor's ticked consent; the server refuses it too. */
(function () {
  const CONSENT = {
    home: "Email me about this Straden product and early access. I can unsubscribe at any time.",
    mini_audit: "Add me to the Straden early-access waitlist and email me about early access. I can unsubscribe at any time."
  };
  // The same list, in the same order, on the home form and the Mini Audit. "Other" keeps the visitor's own words.
  const BUSINESS_TYPES = [
    ["plumbing", "Plumbing"], ["hvac", "HVAC"], ["electrical", "Electrical"], ["engineering", "Engineering"],
    ["environmental", "Environmental"], ["architecture", "Architecture"], ["specialty_contractor", "Specialty contractor"], ["other", "Other"]
  ];
  const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id"];

  function endpoint() {
    const meta = document.querySelector('meta[name="straden-waitlist-endpoint"]');
    return meta ? meta.content : "";
  }
  function attribution() {
    const out = { landing_path: location.pathname.slice(0, 300) };
    const params = new URLSearchParams(location.search);
    PARAMS.forEach(key => { const value = params.get(key); if (value) out[key] = value.slice(0, 300); });
    return out;
  }
  function options(selected) {
    return '<option value="">Select your type of business</option>' + BUSINESS_TYPES.map(([value, label]) =>
      `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
  }
  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // One sign-up. The same submission ID is reused for an unchanged retry, so a lost answer never makes a duplicate.
  let lastBody = null, lastId = null;
  async function submit(fields) {
    if (fields.consent !== true) return { saved: false, error: "consent_required" };
    const url = endpoint();
    if (!url) return { saved: false, error: "not_configured" };
    const body = Object.assign({}, fields, { consent_text: CONSENT[fields.source], attribution: attribution() });
    const serial = JSON.stringify(body);
    if (serial !== lastBody) { lastBody = serial; lastId = newId(); }
    body.submission_id = lastId;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.saved === true) return { saved: true, conversionId: result.conversion_id, isNew: result.conversion_eligible === true };
        if (response.status !== 503) return { saved: false, error: result.error || "invalid_fields" };
      } catch (error) { /* timeout or network: retry once with the same ID */ }
      finally { clearTimeout(timer); }
    }
    return { saved: false, error: "temporarily_unavailable" };
  }

  window.StradenWaitlist = { CONSENT, BUSINESS_TYPES, options, submit };
})();
