/* The home page's "Get early access" form (HQ 652.47): the lane pages' waitlist form, inline, plus a type of business.
   Jamal, 2026-10-28: no pop-up and no chooser; the type of business sets the lane (service or projects), and
   "Other" is kept with its free text as lane unknown. Saves through assets/js/waitlist-client.js. */
(function () {
  const form = document.getElementById("earlyAccessForm");
  if (!form || !window.StradenWaitlist) return;
  const $ = id => document.getElementById(id);
  const type = $("ea-business_type");
  const otherWrap = $("ea-other-wrap");
  const status = $("ea-status");
  const submit = form.querySelector('[type="submit"]');
  const label = submit.innerHTML;
  type.innerHTML = window.StradenWaitlist.options("");
  const FIELDS = ["name", "email", "phone", "business_type", "business_type_other", "revenue", "revenue_currency", "consent"];
  let pending = false;

  function track(name, props) {
    const payload = Object.assign({ event: name }, props || {});
    try { (window.dataLayer = window.dataLayer || []).push(payload); } catch (error) { /* analytics not installed */ }
    try { window.dispatchEvent(new CustomEvent("straden:track", { detail: payload })); } catch (error) { /* old browser */ }
  }
  function showOther() {
    const isOther = type.value === "other";
    otherWrap.hidden = !isOther;
    $("ea-business_type_other").required = isOther;
  }
  function clear(field) {
    const input = form.elements.namedItem(field);
    if (input) input.removeAttribute("aria-invalid");
    const error = $(`ea-${field}-error`);
    if (error) error.textContent = "";
  }
  function fail(field, message) {
    const input = form.elements.namedItem(field);
    input.setAttribute("aria-invalid", "true");
    $(`ea-${field}-error`).textContent = message;
    return input;
  }
  type.addEventListener("change", showOther);
  function say(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone || "";
  }
  FIELDS.forEach(field => {
    const input = form.elements.namedItem(field);
    if (input) ["input", "change"].forEach(type => input.addEventListener(type, () => { clear(field); if (status.dataset.tone === "error") say(""); }));
  });
  showOther();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (pending) return;
    FIELDS.forEach(clear);
    say("");
    const data = new FormData(form);
    const value = key => String(data.get(key) || "").trim();
    const name = value("name"), email = value("email"), phone = value("phone"), businessType = value("business_type");
    const other = value("business_type_other"), revenue = value("revenue"), currency = value("revenue_currency");
    let first = null;
    const flag = (field, message) => { const input = fail(field, message); first = first || input; };
    if (!name) flag("name", "Enter your name.");
    if (!email || !form.elements.namedItem("email").validity.valid) flag("email", "Enter a valid business email.");
    if (phone && (!/^[+()\d\s.#xext-]+$/i.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 18)) flag("phone", "Enter a valid phone number or leave this optional field blank.");
    if (!businessType) flag("business_type", "Select your type of business.");
    if (businessType === "other" && !other) flag("business_type_other", "Tell us your type of business.");
    if (!revenue) flag("revenue", "Select your annual revenue range.");
    if (!["CAD", "USD"].includes(currency)) flag("revenue_currency", "Select CAD or USD.");
    if (!data.has("consent")) flag("consent", "Tick the box to join the waitlist. We only email you if you do.");
    if (first) { say("Please check the highlighted fields.", "error"); first.focus(); return; }

    pending = true;
    form.setAttribute("aria-busy", "true");
    submit.disabled = true;
    submit.textContent = "Joining…";
    say("Saving your place…");
    const fields = { name, email, phone, source: "home", business_type: businessType, revenue, revenue_currency: currency, consent: true, website: value("website") };
    if (businessType === "other") fields.business_type_other = other;
    const outcome = await window.StradenWaitlist.submit(fields);
    pending = false;
    form.removeAttribute("aria-busy");
    submit.disabled = false;
    submit.innerHTML = label;
    if (!outcome.saved) {
      say(outcome.error === "temporarily_unavailable"
        ? "We couldn't save your details just now. Please try again; we'll avoid creating a duplicate."
        : "We couldn't save your details. Please check them and try again, or email hello@straden.ca.", "error");
      return;
    }
    // No name, email, phone or typed text goes to analytics (tracking/EVENT-MAP.md).
    track("early_access_signup", { business_type: businessType });
    say("");
    form.hidden = true;
    $("ea-success").hidden = false;
    $("ea-success").focus();
  });
})();
