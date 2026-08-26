/* ============================================================
   CONFIG — edit these before going live
   ============================================================ */
const CONFIG = {
  // Temporary path until a dedicated calendar-booking URL is available.
  bookingUrl: "contact.html",
  // Where lead data should ultimately land. For now this file just
  // stores answers in memory and shows results client-side — wire
  // the function `submitLead()` below to your Supabase table or a
  // webhook once you're ready to capture leads automatically.
  leadEndpoint: "",
};

/* ============================================================
   CONTENT — pulled directly from the Positioning & ICP doc's
   Pain Hierarchy and Beachhead Language table. Edit copy here.
   ============================================================ */
const VERTICALS = {
  trades: {
    label: "Trades / field service",
    questions: {
      visibility: "I don't know which tech is where, or which jobs are done and ready to bill, without calling around.",
      chasing: "It's sticky notes, group texts, and a whiteboard that's never right.",
      handoffs: "The job's done but nobody kicked off the invoice, or the quote never reached the tech.",
      ownerSystem: "Nothing dispatches right unless I'm the one doing it."
    }
  },
  property: {
    label: "Property & facility management",
    questions: {
      visibility: "I can't tell which work orders are open, stalled, or waiting on a vendor.",
      chasing: "Requests come by call, email, and text — and get lost between them.",
      handoffs: "The approved repair never got dispatched to the vendor.",
      ownerSystem: "Every escalation lands on my desk."
    }
  },
  consulting: {
    label: "Technical consulting",
    questions: {
      visibility: "I don't know a report's stuck in review until the client chases me.",
      chasing: "Field notes, data, and drafts are scattered across inboxes and drives.",
      handoffs: "The reviewed draft never went back to the author, or the change never reached delivery.",
      ownerSystem: "Nothing goes out the door without my sign-off — so I'm the bottleneck."
    }
  },
  other: {
    label: "Another service business",
    questions: {
      visibility: "I don't have a live view of where jobs or projects actually stand.",
      chasing: "Work moves by memory, messages, and manual follow-up — not a system.",
      handoffs: "Work gets approved or finished, but the next step doesn't happen on its own.",
      ownerSystem: "Too much has to run through me personally for anything to move."
    }
  }
};

const CATEGORY_ORDER = ["visibility", "chasing", "handoffs", "ownerSystem"];

const CATEGORY_LABELS = {
  visibility: "Weak Visibility",
  chasing: "Coordination by Chasing",
  handoffs: "Dropped Handoffs",
  ownerSystem: "Owner as the System"
};

const CATEGORY_RESULT_COPY = {
  visibility: "You don't have a live view of where things actually stand, so problems surface late — often only once a client asks. That's a gap in visibility, not a sign anyone's dropping the ball.",
  chasing: "Work is moving on memory and manual follow-up instead of a system, so keeping things on track takes constant chasing. The coordination load is growing faster than the output — structurally, not because anyone isn't trying hard enough.",
  handoffs: "The work itself usually isn't the problem — it's what happens at the handoff. Once something crosses a person or a tool, nobody owns making sure the next step actually happens, so things fall through.",
  ownerSystem: "Too much currently has to route through one person for anything to move — which means growth adds more strain instead of less. That's a flow problem, not a hiring problem."
};

const FREQUENCY_OPTIONS = ["Rarely", "Sometimes", "Often", "Constantly"];

/* ============================================================
   STATE
   ============================================================ */
let state = {
  step: 0,
  vertical: null,
  teamSize: null,
  visibility: null,
  chasing: null,
  handoffs: null,
  ownerSystem: null,
  hoursChasing: null,
  recentMoneyLeak: null
};

const TOTAL_STEPS = 7; // vertical+size, 4 categories, and 2 cost/urgency questions
let shouldFocusHeading = false;

function setAnswer(key, value) {
  state[key] = value;
  render();
  const selectedOption = Array.from(document.querySelectorAll("[data-answer-key]"))
    .find(option => option.dataset.answerKey === key && option.dataset.answerValue === value);
  if (selectedOption) selectedOption.focus();
}

function next() {
  if (state.step < TOTAL_STEPS) {
    state.step++;
    shouldFocusHeading = true;
    render();
  } else {
    shouldFocusHeading = true;
    render(); // move to results
  }
}

function back() {
  if (state.step > 0) {
    state.step--;
    shouldFocusHeading = true;
    render();
  }
}

function canProceed() {
  switch (state.step) {
    case 0: return state.vertical && state.teamSize;
    case 1: return !!state.visibility;
    case 2: return !!state.chasing;
    case 3: return !!state.handoffs;
    case 4: return !!state.ownerSystem;
    case 5: return !!state.hoursChasing;
    case 6: return !!state.recentMoneyLeak;
    default: return true;
  }
}

function scoreFor(option) {
  return FREQUENCY_OPTIONS.indexOf(option);
}

function computeTopCategory() {
  let best = CATEGORY_ORDER[0];
  let bestScore = -1;
  CATEGORY_ORDER.forEach(cat => {
    const s = scoreFor(state[cat]);
    if (s > bestScore) { bestScore = s; best = cat; } // first-wins tiebreak = hierarchy order
  });
  return best;
}

function submitLead() {
  // (a) Keep the answer set only for the current browser session until
  // a production lead endpoint is connected.
  try {
    const existing = JSON.parse(sessionStorage.getItem("straden_mini_audit_leads") || "[]");
    existing.push({ timestamp: new Date().toISOString(), ...state });
    sessionStorage.setItem("straden_mini_audit_leads", JSON.stringify(existing));
  } catch (err) {
    console.error("Mini Audit: failed to save lead for this session", err);
  }

  // (b) Best-effort send to the real lead-capture endpoint once it exists.
  // Wrapped so a network failure (or the endpoint still being a
  // placeholder) never blocks the results screen from showing.
  if (CONFIG.leadEndpoint) {
    try {
      fetch(CONFIG.leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      }).catch(err => console.error("Mini Audit: lead endpoint request failed", err));
    } catch (err) {
      console.error("Mini Audit: lead endpoint request threw", err);
    }
  }

}

/* ============================================================
   RENDER
   ============================================================ */
function questionCard(eyebrow, title, sub, key, options, isGrid) {
  const optsHtml = options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    const selected = state[key] === val ? "selected" : "";
    return `<button type="button" class="option ${selected}" aria-pressed="${state[key] === val}" data-answer-key="${key}" data-answer-value="${val}" onclick="setAnswer('${key}','${val}')">${label}</button>`;
  }).join("");

  return `
    <div class="fade-in">
      <div class="eyebrow">${eyebrow}</div>
      <h2 class="step-title" tabindex="-1" data-step-heading>${title}</h2>
      ${sub ? `<div class="step-sub">${sub}</div>` : ""}
      <div class="${isGrid ? "grid-2" : "options"}" role="group" aria-label="${title}">${optsHtml}</div>
    </div>
  `;
}

function render() {
  updateProgress();
  const app = document.getElementById("app");
  let body = "";
  let showNav = true;

  if (state.step === 0) {
    body = `
      <div class="fade-in">
        <div class="eyebrow">Step 1 of ${TOTAL_STEPS} · About your business</div>
        <h2 class="step-title" tabindex="-1" data-step-heading>What's actually slowing your business down?</h2>
        <div class="step-sub">A 3-minute check to find your biggest operational bottleneck — before you fix anything.</div>
        <div style="margin-bottom:22px;">
          <div id="business-type-label" style="font-weight:500; font-size:14px; margin-bottom:10px; color:var(--color-ink);">What kind of business do you run?</div>
          <div class="options" role="group" aria-labelledby="business-type-label">
            ${Object.entries(VERTICALS).map(([key, v]) =>
              `<button type="button" class="option ${state.vertical === key ? "selected" : ""}" aria-pressed="${state.vertical === key}" data-answer-key="vertical" data-answer-value="${key}" onclick="setAnswer('vertical','${key}')">${v.label}</button>`
            ).join("")}
          </div>
        </div>
        <div>
          <div id="team-size-label" style="font-weight:500; font-size:14px; margin-bottom:10px; color:var(--color-ink);">How big is your team, including you?</div>
          <div class="grid-2" role="group" aria-labelledby="team-size-label">
            ${["Just me", "2–5 people", "6–15 people", "16+ people"].map(size =>
              `<button type="button" class="option ${state.teamSize === size ? "selected" : ""}" aria-pressed="${state.teamSize === size}" data-answer-key="teamSize" data-answer-value="${size}" onclick="setAnswer('teamSize','${size}')">${size}</button>`
            ).join("")}
          </div>
        </div>
      </div>
    `;
  } else if (state.step >= 1 && state.step <= 4) {
    const cat = CATEGORY_ORDER[state.step - 1];
    const v = VERTICALS[state.vertical] || VERTICALS.other;
    body = questionCard(
      `Step ${state.step + 1} of ${TOTAL_STEPS} · Operations check`,
      "How often does this sound like you?",
      `"${v.questions[cat]}"`,
      cat,
      FREQUENCY_OPTIONS,
      true
    );
  } else if (state.step === 5) {
    body = questionCard(
      `Step 6 of ${TOTAL_STEPS} · The cost`,
      "About how many hours a week go to chasing status updates?",
      "Yours or your team's time spent checking in, re-asking, or following up.",
      "hoursChasing",
      ["Under 2 hours", "2–5 hours", "5–10 hours", "10+ hours"],
      true
    );
  } else if (state.step === 6) {
    body = questionCard(
      `Step 7 of ${TOTAL_STEPS} · The cost`,
      "In the last 3 months, has a follow-up, invoice, or charge slipped through?",
      "A missed follow-up, a delayed invoice, a write-off — anything that fell through the cracks.",
      "recentMoneyLeak",
      ["Yes", "No", "Not sure"],
      true
    );
  } else {
    showNav = false;
    body = renderResults();
  }

  const backBtn = state.step > 0 && state.step < TOTAL_STEPS
    ? `<button class="btn btn-text" onclick="back()">Back</button>` : `<div></div>`;

  const isLastInput = state.step === TOTAL_STEPS - 1;
  const nextBtn = showNav
    ? `<button id="nextButton" class="btn btn-primary" ${canProceed() ? "" : "disabled"} onclick="${isLastInput ? 'submitLead(); next();' : 'next();'}">${isLastInput ? "See My Results" : "Next"}</button>`
    : "";

  app.innerHTML = body + (showNav ? `<div class="nav-row">${backBtn}${nextBtn}</div>` : "");

  if (!showNav) animateBars();
  if (shouldFocusHeading) {
    const heading = app.querySelector("[data-step-heading]");
    if (heading) heading.focus();
    shouldFocusHeading = false;
  }
}

function buildResultsEmailBody() {
  const top = computeTopCategory();
  const vertical = (VERTICALS[state.vertical] || VERTICALS.other).label;
  const lines = [
    "My Mini Audit results:",
    "",
    "Business type: " + vertical,
    "Team size: " + (state.teamSize || "—"),
    "Biggest constraint: " + CATEGORY_LABELS[top],
    "Hours/week chasing status updates: " + (state.hoursChasing || "—"),
    "Recent money leak (last 3 months): " + (state.recentMoneyLeak || "—")
  ];
  return lines.join("\n");
}

function renderResults() {
  const top = computeTopCategory();
  const barsHtml = CATEGORY_ORDER.map(cat => {
    const score = scoreFor(state[cat]);
    const pct = Math.round(((score + 0.5) / 4) * 100);
    const isWinner = cat === top;
    return `
      <div class="bar-row">
        <div class="bar-label">
          <span>${CATEGORY_LABELS[cat]}</span>
          ${isWinner ? '<span class="winner-tag">Your biggest constraint</span>' : ""}
        </div>
        <div class="bar-track" role="progressbar" aria-label="${CATEGORY_LABELS[cat]} score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="bar-fill ${isWinner ? "winner" : ""}" data-pct="${pct}"></div></div>
      </div>
    `;
  }).join("");

  let costLine = "";
  if (state.hoursChasing && state.recentMoneyLeak) {
    const leakPhrase = state.recentMoneyLeak === "Yes"
      ? "and something has already slipped through in the last quarter"
      : state.recentMoneyLeak === "Not sure"
        ? "and it's worth a closer look at what might already be slipping through"
        : "";
    costLine = `<div class="cost-note">Right now, roughly <strong>${state.hoursChasing}</strong> a week is going to chasing status updates ${leakPhrase}.</div>`;
  }

  const mailtoHref = `mailto:straden.agency@gmail.com?subject=${encodeURIComponent("My Mini Audit Results")}&body=${encodeURIComponent(buildResultsEmailBody())}`;

  return `
    <div class="fade-in">
      <div class="result-headline">Your Result</div>
      <h2 class="result-category" tabindex="-1" data-step-heading>${CATEGORY_LABELS[top]}</h2>
      <div class="result-copy">${CATEGORY_RESULT_COPY[top]}</div>
      <div class="bars">${barsHtml}</div>
      ${costLine}
      <div class="divider-line"></div>
      <div class="next-step-label">What this doesn't tell you yet</div>
      <div class="next-step-copy">This tells you what's costing you the most right now. The paid Full Audit maps what to build next — the workflow or connected workflows, agents, tools, approval boundaries, implementation plan, timeline, and cost — based on how your business actually runs.</div>
      <div class="cta-block">
        <a href="${CONFIG.bookingUrl}" class="btn btn-cta">Talk to Straden About Your Result</a>
        <div>
          <a href="${mailtoHref}" class="results-secondary-link">Email us your results instead.</a>
        </div>
      </div>
    </div>
  `;
}

function animateBars() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".bar-fill").forEach(el => {
      el.style.width = el.getAttribute("data-pct") + "%";
    });
  });
}

function updateProgress() {
  const pct = Math.min(100, Math.round(((state.step + 1) / TOTAL_STEPS) * 100));
  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = pct + "%";
  const track = document.querySelector(".progress-track");
  if (track) track.setAttribute("aria-valuenow", String(pct));
}

render();
