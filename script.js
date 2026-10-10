const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  menu.classList.toggle('is-open', !isOpen);
  // The links sit before the button in the page, so take keyboard focus into the menu when it opens.
  if (!isOpen) menu.querySelector('a').focus();
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

// HQ 688 round 12: hero work demo. Simulated; every scene stops for a person's approval where money or a client action is involved.
(() => {
  const root = document.getElementById('demo');
  if (!root) return;
  const icon = name => `<img src="assets/tools/runner/${name}.svg" alt="">`;
  const scenes = [
    { inApp: 'Gmail', inIcon: 'gmail', outApp: 'Gmail', outIcon: 'gmail',
      inBody: `<div class="mail-from"><b>Sarah Patel</b><small>to estimates@</small></div><div class="mail-subject">Quote for a repaint, 3-bedroom</div><p>Hi, we'd like the walls and trim in three bedrooms repainted before the end of the month. Can you send a quote?</p>`,
      steps: ['Read the request and the job details', 'Pull your rates from the price book', 'Draft the estimate from past jobs like it', { approve: 'Estimate ready for your approval' }, 'Send the estimate to Sarah', 'Schedule a follow-up in 3 days'],
      outBody: `<div class="mail-from"><b>You</b><small>to Sarah Patel</small><span class="out-tag">Sent</span></div><div class="mail-subject">Your estimate: 3-bedroom repaint</div><ul class="out-lines"><li><span>Walls, 3 bedrooms</span><i></i></li><li><span>Trim and doors</span><i></i></li><li><span>Prep and materials</span><i></i></li></ul><p class="out-foot">Follow-up queued for Thursday</p>` },
    { inApp: 'DocuSign', inIcon: 'docusign', outApp: 'Google Drive', outIcon: 'google-drive',
      inBody: `<div class="doc-badge">Completed</div><div class="mail-subject">Contract signed: Phase 1 site assessment</div><p>All parties have signed. The signed agreement and scope are attached.</p><div class="doc-file">Signed agreement.pdf</div>`,
      steps: ['Read the signed scope', 'Create the project and client record', 'Set up the project folders', { approve: 'Project plan ready for your approval' }, 'Add the milestones to the schedule', 'Let the team know it is ready to start'],
      outBody: `<div class="mail-subject">Phase 1 site assessment</div><ul class="out-files"><li>01 Contract and scope</li><li>02 Field notes and photos</li><li>03 Reports</li><li>04 Billing</li></ul><p class="out-foot">3 milestones added to the schedule</p>` },
    { inApp: 'Google Calendar', inIcon: 'google-calendar', outApp: 'QuickBooks', outIcon: 'quickbooks',
      inBody: `<div class="doc-badge doc-badge-cal">Milestone</div><div class="mail-subject">Field work complete</div><p>Milestone 2 of 3 is done. Billing for this stage is set out in the contract.</p>`,
      steps: ['Match the milestone to the contract', 'Prepare the invoice for this stage', 'Attach the field report', { approve: 'Invoice ready for your approval' }, 'Send the invoice through QuickBooks', 'Follow up if it is still unpaid in 14 days'],
      outBody: `<div class="mail-from"><b>Invoice for milestone 2</b><span class="out-tag">Sent</span></div><ul class="out-lines"><li><span>Field work, stage 2</span><i></i></li><li><span>Field report attached</span><i></i></li></ul><p class="out-foot">Payment reminder scheduled</p>` }
  ];
  const $ = id => document.getElementById(id);
  const tabs = [...root.querySelectorAll('.demo-tab')];
  const pauseBtn = $('demo-pause');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scene = 0, step = -1, timer = null, paused = reduce;

  function render() {
    const sc = scenes[scene];
    $('demo-in-app').textContent = sc.inApp; $('demo-in-icon').innerHTML = icon(sc.inIcon);
    $('demo-out-app').textContent = sc.outApp; $('demo-out-icon').innerHTML = icon(sc.outIcon);
    $('demo-in-body').innerHTML = sc.inBody; $('demo-out-body').innerHTML = sc.outBody;
    $('demo-steps').replaceChildren(...sc.steps.map(s => {
      const li = document.createElement('li');
      if (typeof s === 'object') { li.className = 'is-approval'; li.innerHTML = `<i></i><span class="ap-wait">${s.approve}</span><span class="ap-done">Approved by you</span>`; }
      else { li.innerHTML = `<i></i><span>${s}</span>`; }
      return li;
    }));
    tabs.forEach((t, i) => { t.classList.toggle('is-active', i === scene); t.setAttribute('aria-pressed', String(i === scene)); });
    paint();
  }
  function paint() {
    const sc = scenes[scene], n = sc.steps.length;
    root.classList.toggle('has-in', step >= 0);
    root.classList.toggle('has-out', step >= n);
    [...$('demo-steps').children].forEach((li, i) => {
      li.classList.toggle('is-done', i < step);
      li.classList.toggle('is-now', i === step);
    });
  }
  function delay() {
    const sc = scenes[scene], cur = sc.steps[step];
    if (step < 0) return 900;
    if (step >= sc.steps.length) return 3600;
    return typeof cur === 'object' ? 1900 : 850;
  }
  function tick() {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => {
      const n = scenes[scene].steps.length;
      if (step >= n) { scene = (scene + 1) % scenes.length; step = -1; render(); }
      else { step += 1; paint(); }
      tick();
    }, delay());
  }
  function setPaused(p) {
    paused = p; root.classList.toggle('is-paused', p);
    pauseBtn.setAttribute('aria-label', p ? 'Play the demo' : 'Pause the demo');
    if (!p) tick(); else clearTimeout(timer);
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    scene = i; step = reduce || paused ? scenes[i].steps.length : -1; render(); tick();
  }));
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  if (reduce) { step = scenes[0].steps.length; render(); setPaused(true); }
  else { render(); tick(); }
})();

// HQ 688 round 13: problem work board. One state change: "holding it all together" to "having it handled".
(() => {
  const wb = document.getElementById('wb');
  if (!wb) return;
  const opts = [...wb.querySelectorAll('.wb-opt')];
  let touched = false;
  const set = (state) => {
    wb.dataset.state = state;
    wb.querySelectorAll('.wb-before, .wb-after').forEach(s => s.setAttribute('aria-hidden', String(!s.classList.contains('wb-' + state))));
    opts.forEach(o => { const on = o.dataset.state === state; o.classList.toggle('is-active', on); o.setAttribute('aria-pressed', String(on)); });
  };
  opts.forEach(o => o.addEventListener('click', () => { touched = true; set(o.dataset.state); }));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(() => { if (!touched) set('after'); }, 2200); }
  }, { threshold: 0.6 });
  io.observe(wb);
})();

// HQ 688 round 14: two feature-weight state changes, each run once when its panel comes into view.
(() => {
  const once = (id, cls) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { el.classList.add(cls); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(() => el.classList.add(cls), 400); } }, { threshold: 0, rootMargin: '0px 0px -35% 0px' });
    io.observe(el);
  };
  once('perm', 'is-on');
})();

// HQ 688 round 16: the agent system builds up in a loop, like the hero demo (start, expand, run, then again). Pause control; reduced motion shows the finished system.
(() => {
  const map = document.getElementById('sol-map');
  if (!map) return;
  const items = [...map.querySelectorAll('[data-stage]')].filter(el => el !== map);
  const btns = [...document.querySelectorAll('.sol-stage')];
  const pause = document.getElementById('sol-pause');
  let stage = 1, timer = null, paused = false, started = false;
  const set = (n) => {
    stage = n; map.dataset.stage = String(n);
    items.forEach(el => { const s = Number(el.dataset.stage); el.classList.toggle('is-on', s <= n); el.classList.toggle('is-new', s === n); });
    map.querySelectorAll('.sol-status-text').forEach(t => t.hidden = Number(t.dataset.for) !== n);
    btns.forEach(b => { const on = Number(b.dataset.go) === n; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
  };
  const next = () => {
    clearTimeout(timer);
    if (paused) return;
    timer = setTimeout(() => {
      if (stage < 3) { set(stage + 1); next(); }
      else { map.classList.add('is-resetting'); setTimeout(() => { map.classList.remove('is-resetting'); set(1); next(); }, 700); }
    }, stage === 3 ? 4200 : 2600);
  };
  const setPaused = (p) => { paused = p; map.classList.toggle('is-paused', p); if (pause) pause.setAttribute('aria-label', p ? 'Play the animation' : 'Pause the animation'); if (!p && started) next(); else clearTimeout(timer); };
  btns.forEach(b => b.addEventListener('click', () => { set(Number(b.dataset.go)); if (started && !paused) next(); }));
  if (pause) pause.addEventListener('click', () => setPaused(!paused));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { set(3); setPaused(true); return; }
  set(1);
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); started = true; next(); } }, { threshold: 0, rootMargin: '0px 0px -30% 0px' });
  io.observe(map);
})();

// HQ 688 production: conversion events (tracking/EVENT-MAP.md). Each tracked link pushes one event to window.dataLayer.
// No analytics tool is connected yet, so nothing leaves the page.
document.addEventListener('click', e => {
  const link = e.target.closest('[data-track]');
  if (!link) return;
  const payload = { event: link.dataset.track, location: link.dataset.trackLocation };
  (window.dataLayer = window.dataLayer || []).push(payload);
  window.dispatchEvent(new CustomEvent('straden:track', { detail: payload }));  // assets/js/analytics.js forwards it once consent is given
});
