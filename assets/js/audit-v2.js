const AUDIT_V2 = {
  introCallUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ20nN7c6zwl5fSxLQvQccqnG1wAEYMGHbZ5A-SJDbIxnggAbB98NAZtv2Cl2af-pyjVsmds6G7X",
  storageKey: "stradenMiniAuditV2"
};

const FRICTION_QUESTIONS = [
  { key: "statusChasing", label: "Status Chasing", question: "How often does work slow down because someone has to chase a status update?", context: "Think about calls, messages, meetings, or check-ins whose main job is finding out where work stands." },
  { key: "stuckHandoffs", label: "Dropped Handoffs", question: "How often do tasks get stuck between people, tools, or stages?", context: "Think about work that is finished or approved, but the next person or step does not pick it up." },
  { key: "informalCoordination", label: "Informal Coordination", question: "How often does work depend on memory, inboxes, or spreadsheets instead of a clear system?", context: "Think about information that lives with one person or has to be reconstructed when someone is away." },
  { key: "ownerDependence", label: "Owner as the System", question: "How often do you or another key person have to push work forward when it gets stuck?", context: "Think about the person everyone relies on to answer, approve, remind, or reconnect the work." }
];

const FREQUENCY_OPTIONS = [
  ["never", "Never", 0],
  ["sometimes", "Sometimes", 1],
  ["often", "Often", 2],
  ["constantly", "Constantly", 3]
];

const BAND_COPY = {
  Low: "The drag is still limited, but this workflow is worth checking before it becomes harder to manage.",
  Moderate: "This delay is recurring often enough to cost real capacity.",
  Strong: "This workflow is already consuming meaningful capacity and should be addressed.",
  Severe: "This problem is actively limiting the operation and should be addressed first."
};

const CATEGORY_COPY = {
  statusChasing: "People are spending too much time finding the status of work instead of moving it forward. The issue is visibility, not effort.",
  stuckHandoffs: "Work is losing momentum when ownership changes or a task crosses between people, tools, or stages.",
  informalCoordination: "The operation relies on memory and scattered information, so repeatable work has to be coordinated manually.",
  ownerDependence: "A key person is acting as the coordination layer. That keeps work moving today, but it also places a ceiling on capacity."
};

const CATEGORY_CAUSES = {
  statusChasing: "status chasing",
  stuckHandoffs: "dropped handoffs",
  informalCoordination: "informal coordination",
  ownerDependence: "work that depends on the owner"
};

const AREA_LABELS = {
  intake: "Intake and lead handling",
  scheduling: "Scheduling and dispatch",
  tracking: "Project and job tracking",
  approvals: "Approvals and internal coordination",
  followup: "Follow-up and client communication",
  billing: "Billing and invoicing",
  other: "Operations coordination"
};

const HOURS_LABELS = {
  "0-2": "up to 2 hours",
  "3-5": "3-5 hours",
  "6-10": "6-10 hours",
  "11+": "at least 11 hours"
};

const HOURS_RANGES = {
  "0-2": [0, 2],
  "3-5": [3, 5],
  "6-10": [6, 10],
  "11+": [11, null]
};

const AGENT_CATALOG = {
  intake: {
    label: "Lead Intake Agent",
    outcome: "help new opportunities move from first contact to a clear owner and next action",
    capabilities: ["Incoming requests are captured in one consistent flow", "Missing intake details are collected before handoff", "Qualified opportunities reach a clear owner and next action"]
  },
  scheduling: {
    label: "Scheduling and Dispatch Agent",
    outcome: "help service requests become clear, workable assignments without relying on manual coordination",
    capabilities: ["Requests are checked before they reach scheduling", "Assignments follow the rules you approve", "Schedule changes and exceptions stay visible"]
  },
  tracking: {
    label: "Project Operations Agent",
    outcome: "keep jobs and projects moving with a reliable view of ownership, status, and next steps",
    capabilities: ["Active work has a current owner, status, and next step", "Stalled jobs and missing updates stay visible", "Approved handoffs move forward without another chase"]
  },
  approvals: {
    label: "Work Coordination Agent",
    outcome: "move routine approvals and internal handoffs forward while keeping judgment with the right person",
    capabilities: ["Approvers receive the context needed to decide", "Pending decisions stay visible to the right person", "Approved decisions trigger the next step"]
  },
  followup: {
    label: "Client Communications Agent",
    outcome: "help client commitments, updates, and follow-ups happen consistently without adding another inbox to manage",
    capabilities: ["Promised follow-ups and due dates stay visible", "Client updates are prepared from approved operating data", "Sensitive or unusual situations reach the right person"]
  },
  billing: {
    label: "Billing Operations Agent",
    outcome: "protect the handoff between completed work, billing readiness, and invoice follow-through",
    capabilities: ["Completed work is surfaced when it appears ready to bill", "Missing billing details are caught before the invoice handoff", "Finished but unbilled work stays visible"]
  },
  other: {
    label: "Operations Coordination Agent",
    outcome: "help recurring work move through clear ownership, status, and exception handling",
    capabilities: ["Recurring work enters one consistent flow", "Ownership, status, and next steps stay visible", "Exceptions reach the right person without stopping routine work"]
  }
};

const FUNCTION_KEYWORDS = {
  intake: /\b(lead|inquiry|inquiries|intake|estimate|proposal|quote|sales)\b/i,
  scheduling: /\b(schedule|scheduling|dispatch|appointment|calendar|assign|technician|crew)\b/i,
  tracking: /\b(job|project|work order|status|completion|closeout|delivery|milestone)\b/i,
  approvals: /\b(approve|approval|signoff|sign-off|authorize|authorization|review)\b/i,
  followup: /\b(client|customer|follow-up|follow up|update|reminder|email|message)\b/i,
  billing: /\b(invoice|invoicing|billing|payment|paid|receivable|quickbooks|cash)\b/i
};

const FRICTION_CAPABILITIES = {
  statusChasing: "Work that is waiting or missing a status stays visible",
  stuckHandoffs: "Completed steps trigger the next approved owner",
  informalCoordination: "The approved process is applied consistently across the workflow",
  ownerDependence: "Routine work moves without waiting for the owner, while exceptions escalate"
};

const state = {
  step: 0,
  firstName: "",
  businessType: "",
  teamSize: null,
  messiestArea: null,
  statusChasing: null,
  stuckHandoffs: null,
  informalCoordination: null,
  ownerDependence: null,
  hoursLost: null,
  hourlyCost: "",
  consequence: null,
  urgency: null,
  workflows: ""
};

const TOTAL_STEPS = 10;
let focusHeading = false;

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function setAnswer(key, value, points) {
  state[key] = { value, points };
  render();
  const target = document.querySelector(`[data-answer-key="${key}"][data-answer-value="${value}"]`);
  if (target) target.focus();
}

function updateText(key, value) {
  state[key] = value;
  const nextButton = document.getElementById("nextButton");
  if (nextButton) nextButton.disabled = !canProceed();
}

function getWorkflows() {
  return state.workflows.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
}

function updateWorkflows(value) {
  state.workflows = value;
  const workflows = getWorkflows();
  const error = document.getElementById("workflowError");
  const field = document.getElementById("workflows");
  const tooMany = workflows.length > 3;
  const tooLong = workflows.some(workflow => workflow.length > 100);
  if (error) {
    error.textContent = tooMany
      ? "Keep this to three workflows so the recommendation stays focused."
      : tooLong
        ? "Keep each workflow under 100 characters. A short label is enough."
        : "";
  }
  if (field) field.setAttribute("aria-invalid", String(tooMany || tooLong));
  const nextButton = document.getElementById("nextButton");
  if (nextButton) nextButton.disabled = !canProceed();
}

function option(key, value, label, points, description = "") {
  const selected = state[key] && state[key].value === value;
  return `<button type="button" class="option ${selected ? "selected" : ""}" aria-pressed="${selected}" data-answer-key="${key}" data-answer-value="${value}" onclick="setAnswer('${key}','${value}',${points})">${label}${description ? `<span class="option-description">${description}</span>` : ""}</button>`;
}

function heading(title, sub) {
  return `<div class="eyebrow">Question ${state.step + 1} of ${TOTAL_STEPS}</div><h2 class="step-title" tabindex="-1" data-step-heading>${title}</h2>${sub ? `<p class="step-sub">${sub}</p>` : ""}`;
}

function canProceed() {
  switch (state.step) {
    case 0: return state.firstName.trim().length >= 2 && state.businessType.trim().length >= 3;
    case 1: return !!state.teamSize;
    case 2: {
      const workflows = getWorkflows();
      return !!state.messiestArea && workflows.length >= 1 && workflows.length <= 3 && workflows.every(workflow => workflow.length <= 100);
    }
    case 3: return !!state.statusChasing;
    case 4: return !!state.stuckHandoffs;
    case 5: return !!state.informalCoordination;
    case 6: return !!state.ownerDependence;
    case 7: return !!state.hoursLost && Number(state.hourlyCost) >= 1 && Number(state.hourlyCost) <= 1000;
    case 8: return !!state.consequence;
    case 9: return !!state.urgency;
    default: return true;
  }
}

function next() {
  if (!canProceed()) return;
  state.step += 1;
  focusHeading = true;
  render();
}

function back() {
  if (state.step === 0) return;
  state.step -= 1;
  focusHeading = true;
  render();
}

function renderQuestion() {
  if (state.step === 0) {
    return `${heading("Tell us a little about you and your business", "We will use this context to make your result specific to the work you described.")}<label class="audit-v2-label" for="firstName">First name</label><input id="firstName" type="text" maxlength="80" autocomplete="given-name" required value="${escapeHtml(state.firstName)}" placeholder="Your first name" oninput="updateText('firstName', this.value)"><label class="audit-v2-label business-description-label" for="businessType">What kind of business do you run?</label><textarea id="businessType" class="audit-v2-field" maxlength="300" required placeholder="For example: We run a plumbing company serving homes and small businesses." oninput="updateText('businessType', this.value)">${escapeHtml(state.businessType)}</textarea>`;
  }
  if (state.step === 1) {
    return `${heading("How many people are involved in the day-to-day operation?", "Include yourself and anyone who regularly helps move client work forward.")}<div class="grid-2">${[["1", "1"], ["2-5", "2-5"], ["6-10", "6-10"], ["11-25", "11-25"], ["26+", "26+"]].map(v => option("teamSize", v[0], v[1], 0)).join("")}</div>`;
  }
  if (state.step === 2) {
    return `${heading("Where does the operational drag show up?", "Choose the main business function, then name the recurring work that keeps breaking down.")}<div class="audit-v2-label">Messiest business function</div><div class="options">${[["intake", "Intake / lead handling"], ["scheduling", "Scheduling / dispatch"], ["tracking", "Project / job tracking"], ["approvals", "Approvals / internal coordination"], ["followup", "Follow-up / client communication"], ["billing", "Billing / invoicing"], ["other", "Other"]].map(v => option("messiestArea", v[0], v[1], 0)).join("")}</div><label class="audit-v2-label workflow-label" for="workflows">Which recurring workflows create the most problems?</label><p class="field-note workflow-note">Enter one short workflow label per line, up to three. For example: completed job to invoice or new lead to booked estimate.</p><textarea id="workflows" class="audit-v2-field" maxlength="320" required aria-required="true" aria-describedby="workflowHelp workflowError" aria-invalid="false" placeholder="Completed job to invoice\nNew lead to booked estimate" oninput="updateWorkflows(this.value)">${escapeHtml(state.workflows)}</textarea><p class="field-note" id="workflowHelp">Do not include names, client details, or sensitive information. We only need the type of work.</p><p class="field-error" id="workflowError" role="alert"></p>`;
  }
  if (state.step >= 3 && state.step <= 6) {
    const item = FRICTION_QUESTIONS[state.step - 3];
    return `${heading(item.question, item.context)}<div class="grid-2">${FREQUENCY_OPTIONS.map(v => option(item.key, v[0], v[1], v[2])).join("")}</div>`;
  }
  if (state.step === 7) {
    return `${heading("What is this work costing each week?", "Estimate the combined time across everyone involved, then give that time a rough hourly value.")}<div class="audit-v2-label">Hours lost each week</div><div class="grid-2">${[["0-2", "0-2 hours", 0], ["3-5", "3-5 hours", 1], ["6-10", "6-10 hours", 2], ["11+", "11+ hours", 3]].map(v => option("hoursLost", v[0], v[1], v[2])).join("")}</div><label class="audit-v2-label hourly-cost-label" for="hourlyCost">What is one hour of that time worth?</label><div class="currency-field"><span aria-hidden="true">$</span><input id="hourlyCost" type="number" min="1" max="1000" step="1" inputmode="decimal" required value="${escapeHtml(state.hourlyCost)}" placeholder="50" oninput="updateText('hourlyCost', this.value)"></div><p class="field-note">Use an employee wage, contractor rate, or a rough value for your own time. An estimate is enough.</p>`;
  }
  if (state.step === 8) {
    return `${heading("What is the most common result when work breaks down?", "Choose the consequence that best matches what actually happens.")}<div class="options">${[["minor", "Minor delay, quickly fixed", 0], ["small", "Occasional follow-up misses or small rework", 1], ["frequent", "Frequent delays, rework, or client frustration", 2], ["serious", "Lost revenue, serious delivery issues, or owner bottlenecking", 3]].map(v => option("consequence", v[0], v[1], v[2])).join("")}</div>`;
  }
  return `${heading("What is the main reason you want to fix this now?", "Choose the answer that best reflects the effect this problem is having today.")}<div class="options">${[["nice", "It would be nice to improve", 0], ["time", "It is starting to waste time", 1], ["performance", "It is affecting consistency, delivery, or growth", 2], ["constraint", "It is actively constraining the business or the owner's capacity", 3]].map(v => option("urgency", v[0], v[1], v[2])).join("")}</div>`;
}

function buildAgentRecommendation(areaKey, frictionKey, workflows) {
  const agent = AGENT_CATALOG[areaKey] || AGENT_CATALOG.other;
  const capabilities = [...agent.capabilities.slice(0, 2), FRICTION_CAPABILITIES[frictionKey], ...agent.capabilities.slice(2)]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);
  return { areaKey, label: agent.label, outcome: agent.outcome, capabilities, workflows };
}

function detectSupportingAreas(primaryArea, workflows) {
  const supporting = [];
  workflows.forEach(workflow => {
    Object.entries(FUNCTION_KEYWORDS).forEach(([areaKey, pattern]) => {
      if (areaKey !== primaryArea && pattern.test(workflow) && !supporting.includes(areaKey)) supporting.push(areaKey);
    });
  });
  return supporting.slice(0, 2);
}

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-CA")}`;
}

function computeTimeCost(hoursValue, hourlyCost) {
  const [minimumHours, maximumHours] = HOURS_RANGES[hoursValue];
  const rate = Number(hourlyCost);
  const minimum = minimumHours * rate;
  const maximum = maximumHours === null ? null : maximumHours * rate;
  let display;
  if (hoursValue === "0-2") display = `Up to ${formatMoney(maximum)} per week`;
  else if (maximum === null) display = `At least ${formatMoney(minimum)} per week`;
  else display = `${formatMoney(minimum)}-${formatMoney(maximum)} per week`;
  const capacityDisplay = hoursValue === "0-2"
    ? `up to ${formatMoney(maximum)} of capacity each week`
    : maximum === null
      ? `at least ${formatMoney(minimum)} of capacity each week`
      : `${formatMoney(minimum)}-${formatMoney(maximum)} of capacity each week`;
  return { hourlyCost: rate, minimum, maximum, display, capacityDisplay };
}

function computeResult() {
  const friction = FRICTION_QUESTIONS.map(item => ({ key: item.key, label: item.label, points: state[item.key].points }));
  const scored = [...friction.map(item => item.points), state.hoursLost.points, state.consequence.points, state.urgency.points];
  const score = scored.reduce((sum, value) => sum + value, 0);
  const band = score <= 6 ? "Low" : score <= 11 ? "Moderate" : score <= 16 ? "Strong" : "Severe";
  const category = friction.reduce((best, item) => item.points > best.points ? item : best, friction[0]);
  const workflows = getWorkflows();
  const primaryArea = state.messiestArea.value;
  const timeCost = computeTimeCost(state.hoursLost.value, state.hourlyCost);
  const recommendations = {
    primary: buildAgentRecommendation(primaryArea, category.key, workflows),
    supporting: detectSupportingAreas(primaryArea, workflows).map(areaKey => buildAgentRecommendation(areaKey, category.key, workflows.filter(workflow => FUNCTION_KEYWORDS[areaKey].test(workflow))))
  };
  return {
    version: 2,
    completedAt: new Date().toISOString(),
    score,
    band,
    category: category.label,
    categoryKey: category.key,
    categoryPoints: category.points,
    workflows,
    firstName: state.firstName.trim(),
    businessType: state.businessType.trim(),
    teamSize: state.teamSize.value,
    messiestArea: primaryArea,
    messiestAreaLabel: AREA_LABELS[primaryArea],
    hoursLostLabel: HOURS_LABELS[state.hoursLost.value],
    timeCost,
    recommendations,
    answers: Object.fromEntries([...FRICTION_QUESTIONS.map(item => [item.key, state[item.key]]), ["hoursLost", state.hoursLost], ["consequence", state.consequence], ["urgency", state.urgency]])
  };
}

function saveResult(result) {
  try {
    sessionStorage.setItem(AUDIT_V2.storageKey, JSON.stringify(result));
  } catch (error) {
    console.warn("Mini Audit result could not be stored for the contact handoff.", error);
  }
}

function naturalList(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function renderAgentRecommendation(recommendation, result) {
  const capabilities = recommendation.capabilities.map(capability => `<li>${capability}</li>`).join("");
  const evidence = result.categoryPoints === 0
    ? `You placed the main drag in ${escapeHtml(result.messiestAreaLabel).toLowerCase()}, but no single friction pattern dominated your answers.`
    : `You placed the main drag in ${escapeHtml(result.messiestAreaLabel).toLowerCase()}, and your answers showed the strongest friction in ${escapeHtml(result.category).toLowerCase()}.`;
  return `<section class="agent-recommendation primary-agent">
    <h3>Best place to start</h3>
    <p class="starting-outcome">${recommendation.outcome.charAt(0).toUpperCase()}${recommendation.outcome.slice(1)}.</p>
    <p class="agent-label">Recommended starting agent: <strong>${recommendation.label}</strong></p>
    <div class="capability-heading">What it could change</div>
    <ul class="capability-list">${capabilities}</ul>
    <p class="recommendation-evidence"><strong>Why this fits:</strong> ${evidence}</p>
  </section>`;
}

function renderResults() {
  const result = computeResult();
  const urgencyCopy = BAND_COPY[result.band];
  saveResult(result);
  const firstName = escapeHtml(result.firstName);
  const primaryAgent = renderAgentRecommendation(result.recommendations.primary, result);
  const supportingFunctions = result.recommendations.supporting.map(item => escapeHtml(AREA_LABELS[item.areaKey]).toLowerCase());
  const supportingNote = supportingFunctions.length
    ? `<p class="supporting-note">This workflow may eventually need support across ${naturalList(supportingFunctions)}. We would confirm that before recommending anything broader.</p>`
    : "";
  const diagnosisCause = result.categoryPoints === 0 ? "recurring operational coordination" : CATEGORY_CAUSES[result.categoryKey];
  const diagnosisCopy = result.categoryPoints === 0
    ? "Your answers do not point to one dominant friction pattern, so the first step is confirming where that time is actually going."
    : CATEGORY_COPY[result.categoryKey];
  return `<div class="result-view"><h2 class="result-category">${firstName}, your team is losing ${result.hoursLostLabel} each week to ${diagnosisCause}.</h2><p class="result-lead">At the hourly value you provided, <strong>${result.timeCost.capacityDisplay}</strong> is tied up in coordination instead of delivery. ${diagnosisCopy}</p><div class="recommendation-block">${primaryAgent}${supportingNote}</div><div class="divider-line"></div><section class="call-offer"><h3 class="confirmation-heading">Confirm where to start</h3><p>On an Intro Call, we will review this result, locate the breakdown, and decide whether there is a clear first agent worth building.</p><ul class="call-outcomes"><li>Confirm the trigger, owner, and approval point.</li><li>Identify the first handoff worth fixing.</li><li>Decide whether Straden is the right fit.</li></ul><p class="routing-copy">${urgencyCopy}</p><p class="preparation-note">No process map or technical brief is required. We will work from the problem you describe.</p></section><div class="cta-block"><a class="btn btn-cta result-cta" href="${AUDIT_V2.introCallUrl}">Book My Intro Call</a><p class="cta-note">Choose a 30-minute Intro Call time that works for you.</p><button type="button" class="results-secondary-link" onclick="restartAudit()">Retake the Mini Audit</button></div></div>`;
}

function restartAudit() {
  Object.assign(state, { step: 0, firstName: "", businessType: "", teamSize: null, messiestArea: null, statusChasing: null, stuckHandoffs: null, informalCoordination: null, ownerDependence: null, hoursLost: null, hourlyCost: "", consequence: null, urgency: null, workflows: "" });
  render();
}

function updateProgress() {
  const complete = state.step >= TOTAL_STEPS;
  const pct = complete ? 100 : Math.round(((state.step + 1) / TOTAL_STEPS) * 100);
  const fill = document.getElementById("progressFill");
  const track = document.querySelector(".progress-track");
  if (fill) fill.style.width = `${pct}%`;
  if (track) {
    track.setAttribute("aria-valuenow", String(pct));
    track.setAttribute("aria-valuetext", complete ? "Complete" : `Question ${state.step + 1} of ${TOTAL_STEPS}`);
  }
}

function render() {
  updateProgress();
  const app = document.getElementById("app");
  const complete = state.step >= TOTAL_STEPS;
  const body = complete ? renderResults() : renderQuestion();
  const nav = complete ? "" : `<div class="nav-row">${state.step > 0 ? '<button type="button" class="btn btn-text" onclick="back()">Back</button>' : "<span></span>"}<button type="button" class="btn btn-primary" id="nextButton" ${canProceed() ? "" : "disabled"} onclick="next()">${state.step === TOTAL_STEPS - 1 ? "See my result" : "Next"}</button></div>`;
  app.innerHTML = `<div class="fade-in">${body}${nav}</div>`;
  if (focusHeading) {
    const stepHeading = app.querySelector("[data-step-heading]");
    if (stepHeading) stepHeading.focus({ preventScroll: true });
    focusHeading = false;
  }
}

render();
