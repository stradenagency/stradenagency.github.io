/* Contact page (HQ 688). The form saves a contact_form lead through lead-client.js
   (lead-capture/LEAD-EVENT-CONTRACT.md); if it can't be saved, a prepared email to Straden opens instead,
   which is how the form worked before. A Mini Audit result in this tab is carried into the message. */
const auditSource = new URLSearchParams(window.location.search).get('source');
if (auditSource === 'mini-audit-v2') {
  try {
    const auditResult = JSON.parse(sessionStorage.getItem('stradenMiniAuditV2') || 'null');
    if (auditResult && auditResult.version === 2) {
      const resultTitle = auditResult.categoryPoints === 0
        ? `No dominant friction pattern in ${auditResult.messiestAreaLabel || auditResult.messiestArea}`
        : `${auditResult.category} in ${auditResult.messiestAreaLabel || auditResult.messiestArea}`;
      document.getElementById('auditResultTitle').textContent = resultTitle;
      document.getElementById('auditResultContext').hidden = false;
      if (auditResult.firstName) document.getElementById('contact-name').value = auditResult.firstName;
      const message = document.getElementById('contact-message');
      const contextLines = [
        `Mini Audit result: ${resultTitle}`,
        `Business: ${auditResult.businessType}`,
        `Team size: ${auditResult.teamSize}`,
        `Messiest area: ${auditResult.messiestAreaLabel || auditResult.messiestArea}`
      ];
      if (Array.isArray(auditResult.workflows) && auditResult.workflows.length) {
        contextLines.push(`Workflows: ${auditResult.workflows.join('; ')}`);
      }
      if (auditResult.timeCost && auditResult.timeCost.display) {
        contextLines.push(`Estimated time cost: ${auditResult.timeCost.display}`);
      }
      if (auditResult.recommendations && auditResult.recommendations.primary) {
        contextLines.push(`Recommended starting agent: ${auditResult.recommendations.primary.label}`);
      }
      message.value = `${contextLines.join('\n')}\n\nWhat I would like to discuss:\n`;
    }
  } catch (error) {
    console.warn('Mini Audit result could not be loaded.', error);
  }
}

const leadForm = window.StradenLeads ? window.StradenLeads.startForm() : null;
let contactSaved = false;

function trackContact(outcome) {
  const payload = { event: 'contact_form_send', outcome };
  try { (window.dataLayer = window.dataLayer || []).push(payload); } catch (error) { /* no analytics */ }
  try { window.dispatchEvent(new CustomEvent('straden:track', { detail: payload })); } catch (error) { /* old browser */ }
}

function openPreparedEmail(data, unsaved) {
  const subject = `Straden inquiry: ${data.get('company')}`;
  const body = [
    `Name: ${data.get('name')}`,
    `Work email: ${data.get('email')}`,
    `Company: ${data.get('company')}`,
    '',
    'What is creating the most drag?',
    data.get('message')
  ].join('\n');
  document.getElementById('formStatus').textContent = unsaved
    ? 'We could not send the form, so a prepared email is opening instead. If nothing happens, use the direct email link above.'
    : 'Opening your email application. If nothing happens, use the direct email link above.';
  window.location.href = `mailto:hello@straden.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function firstProblem(data) {
  if (!String(data.get('name') || '').trim()) return ['contact-name', 'Enter your name.'];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.get('email') || '').trim())) return ['contact-email', 'Enter a valid work email.'];
  if (!String(data.get('company') || '').trim()) return ['contact-company', 'Enter your company name.'];
  if (!String(data.get('message') || '').trim()) return ['contact-message', 'Tell us what is creating the most drag.'];
  return null;
}

document.getElementById('contactForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  if (contactSaved) return;
  const form = event.currentTarget;
  const data = new FormData(form);
  const error = document.getElementById('formError');
  form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  const problem = firstProblem(data);
  if (problem) {
    error.textContent = problem[1];
    const field = document.getElementById(problem[0]);
    field.setAttribute('aria-invalid', 'true');
    field.focus();
    return;
  }
  error.textContent = '';
  const button = document.getElementById('contactSubmit');
  const status = document.getElementById('formStatus');
  if (!leadForm) { trackContact('email_fallback'); return openPreparedEmail(data, false); }
  button.disabled = true;
  status.textContent = 'Sending…';
  const outcome = await window.StradenLeads.submit(leadForm, {
    source: 'contact_form',
    contact: { name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(), company: String(data.get('company') || '').trim() },
    message: String(data.get('message') || '').trim(),
    website: String(data.get('website') || '')
  });
  if (outcome.saved) {
    contactSaved = true;
    trackContact('saved');
    status.textContent = 'Thank you. Your message is with Straden, and a person will reply.';
    button.textContent = 'Sent';
    return;
  }
  button.disabled = false;
  trackContact('email_fallback');
  // No lead service configured for this site yet: the prepared email is the normal path, not a failure.
  openPreparedEmail(data, outcome.reason !== 'no_endpoint');
});
