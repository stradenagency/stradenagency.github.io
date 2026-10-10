const AUDIT_V2 = {
  introCallUrl: "https://calendar.app.google/kBcDhYi7tCNre9oV9",
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

// Contact details are asked for at the end, before the full result (Jamal, 9 Oct). The visitor sees a teaser,
// then gives work email, company and phone to unlock the rest. The unlock saves a mini_audit lead through
// assets/js/lead-client.js (lead-capture/LEAD-EVENT-CONTRACT.md); the result shows whether or not it saved.
const gate = { unlocked: false, email: "", company: "", phone: "", consent: false, form: null, bookingKey: null, emailQueued: false };
const CONSENT_TEXT = "Also send me occasional emails from Straden about putting AI to work. Unsubscribe anytime.";

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

// Round 21: lead tier and funnel events. See lead-capture/LEAD-SCORING-AND-FUNNEL.md.
// The tier is for Straden only; the visitor never sees it.
const TEAM_POINTS = { "1": 0, "2-5": 1, "6-10": 2, "11-25": 3, "26+": 3 };
function scoreLead(answers, teamSize) {
  const parts = {
    team: TEAM_POINTS[teamSize] ?? 0,
    hours: answers.hoursLost?.points ?? 0,
    consequence: answers.consequence?.points ?? 0,
    urgency: answers.urgency?.points ?? 0
  };
  const points = parts.team + parts.hours + parts.consequence + parts.urgency;
  let tier = "warm";
  if (points >= 8 && parts.urgency >= 2 && parts.team >= 1) tier = "hot";
  else if (points <= 4 || (parts.team === 0 && parts.urgency === 0)) tier = "cool";
  return { tier, points, max: 12, parts, rules: "v1" };
}

// Sends funnel events to whatever analytics is installed (dataLayer) and as a browser event.
// Never put names, emails, company or free text in an event.
let lastScreen = "";
function track(name, props = {}) {
  const payload = { event: name, audit_version: 2, ...props };
  try { (window.dataLayer = window.dataLayer || []).push(payload); } catch (error) { /* analytics not installed */ }
  try { window.dispatchEvent(new CustomEvent("straden:track", { detail: payload })); } catch (error) { /* old browser */ }
}
function trackScreen(complete) {
  const screen = complete ? (gate.unlocked ? "result" : "gate") : `q${state.step + 1}`;
  if (screen === lastScreen) return;
  lastScreen = screen;
  if (screen === "q1") track("audit_view");
  else if (screen === "q2") { track("audit_start"); track("audit_step", { step: 2 }); }
  else if (screen.startsWith("q")) track("audit_step", { step: state.step + 1 });
  else if (screen === "gate") track("audit_gate_view");
  else if (screen === "result") { const lead = computeResult().lead; track("audit_result_view", { tier: lead.tier }); }
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
    lead: scoreLead({ hoursLost: state.hoursLost, consequence: state.consequence, urgency: state.urgency }, state.teamSize.value),
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

// HQ 688 round 20 (design session): the result gives real value, not a mirror of the answers.
// Sections: assessment (written by a Straden agent in production; this template is the fallback),
// yearly cost from the visitor's own numbers, a four-part scorecard, a first-agent plan applied to the
// workflow they typed, three fixes to try this week, and one next step.
const AGENT_PLANS = {
  intake: [["agent", "Answers the new enquiry and asks for the details you need"], ["agent", "Checks it against the kind of work you take on"], ["agent", "Logs it and sets the next step"], ["you", "You approve the quote or booking"], ["agent", "Follows up until there's an answer"], ["agent", "Hands the booked work to your team, with its context"]],
  scheduling: [["agent", "Reads the request and what the job needs"], ["agent", "Finds a slot and the right crew, under your rules"], ["you", "You confirm the assignment"], ["agent", "Sends the booking and passes changes to the crew"], ["agent", "Keeps the client updated"], ["agent", "Flags conflicts before they become problems"]],
  tracking: [["agent", "Sets up the job with its files and contacts"], ["agent", "Tracks each milestone and who owns it"], ["agent", "Chases missing updates before anyone has to ask"], ["you", "You decide on anything stuck or changed"], ["agent", "Prepares the closeout and hands billing what it needs"]],
  approvals: [["agent", "Gathers what's needed to decide"], ["you", "You approve or adjust, in one place"], ["agent", "Starts the next step as soon as it's approved"], ["agent", "Keeps pending decisions visible"], ["agent", "Reminds the right person when something waits too long"]],
  followup: [["agent", "Tracks every promise and due date"], ["agent", "Drafts the update from the job's status"], ["you", "You review anything sensitive or unusual"], ["agent", "Sends routine updates and reminders on time"], ["agent", "Logs the conversation, so nothing is explained twice"]],
  billing: [["agent", "Spots work that's ready to bill"], ["agent", "Checks for missing details before the invoice"], ["agent", "Prepares the invoice"], ["you", "You approve it before it's sent"], ["agent", "Sends it and follows up if it's unpaid"]],
  other: [["agent", "Brings the recurring work into one flow"], ["agent", "Gives each item an owner and a next step"], ["agent", "Keeps status current"], ["you", "You handle the exceptions it surfaces"], ["agent", "Moves routine work forward without a chase"]]
};
const QUICK_WINS = {
  statusChasing: ["Put every open job on one shared list, each with an owner and a status. One place, not five inboxes.", "Set one fixed time each day for status updates instead of check-ins all day.", "Agree what \"done\" means at each stage, so nobody has to ask."],
  stuckHandoffs: ["Write down who picks up the work at each handoff, by role.", "Make finishing a step mean telling the next person, in the same message.", "Once a week, review anything that has waited more than two days."],
  informalCoordination: ["Pick one place for job notes and files, and stop using the others.", "Turn your three most repeated tasks into short checklists.", "Ask whoever knows each process best to write it down in ten lines."],
  ownerDependence: ["List the decisions only you make, and hand off the routine ones under a set dollar amount.", "Give one person the authority to unblock routine work while you're busy.", "Block one hour a week to clear approvals in a single pass."]
};
const CONSEQUENCE_TEXT = { minor: "a short delay that gets fixed quickly", small: "the odd missed follow-up or a bit of rework", frequent: "frequent delays, rework or client frustration", serious: "lost revenue, delivery problems or the owner becoming the bottleneck" };
const LEVEL_WORDS = ["Never", "Sometimes", "Often", "Constantly"];
const WEEKS_PER_YEAR = 50;

function rangeText(min, max, unit) {
  if (max === null) return `${min.toLocaleString("en-CA")}+ ${unit}`;
  if (min === 0) return `up to ${max.toLocaleString("en-CA")} ${unit}`;
  return `${min.toLocaleString("en-CA")}–${max.toLocaleString("en-CA")} ${unit}`;
}
function moneyRange(min, max) {
  if (max === null) return `${formatMoney(min)}+`;
  if (min === 0) return `up to ${formatMoney(max)}`;
  return `${formatMoney(min)}–${formatMoney(max)}`;
}

function writeAssessment(result, esc = escapeHtml) {
  const name = esc(result.firstName);
  const team = result.teamSize === "1" ? "a one-person operation" : `a team of ${esc(result.teamSize)} people`;
  const cause = result.categoryPoints === 0 ? "recurring coordination work" : CATEGORY_CAUSES[result.categoryKey];
  const workflow = result.workflows[0] ? ` especially in “${esc(result.workflows[0])}”` : "";
  const consequence = CONSEQUENCE_TEXT[result.answers.consequence.value] || "delays";
  const agent = result.recommendations.primary;
  return `${name}, for ${team}, your answers point to ${cause} as the pattern costing you most. It shows up in ${esc(result.messiestAreaLabel).toLowerCase()},${workflow}. When it breaks down, the usual result is ${consequence}. That is exactly the kind of work an agent can take on: a ${agent.label.toLowerCase()} would ${agent.outcome}, with your approval wherever money or a client is involved.`;
}

// The result's sections as plain text, computed once from the result. The page renders them and the lead
// service builds the result email from the same object (mini_audit.result.report), so both always match.
function buildReport(result) {
  const cause = result.categoryPoints === 0 ? "recurring operational coordination" : CATEGORY_CAUSES[result.categoryKey];
  const [hMin, hMax] = HOURS_RANGES[result.answers.hoursLost.value];
  const rate = result.timeCost.hourlyCost;
  const yMin = hMin * WEEKS_PER_YEAR, yMax = hMax === null ? null : hMax * WEEKS_PER_YEAR;
  const fteMin = Math.round((hMin / 40) * 100), fteMax = hMax === null ? null : Math.round((hMax / 40) * 100);
  const agent = result.recommendations.primary;
  const plan = AGENT_PLANS[agent.areaKey] || AGENT_PLANS.other;
  return {
    version: 1,
    headline: `${result.firstName}, your biggest source of drag is ${cause}.`,
    assessment: writeAssessment(result, value => String(value || "")),
    cost: {
      week: rangeText(hMin, hMax, "hours"),
      yearHours: rangeText(yMin, yMax, "hours"),
      yearMoney: moneyRange(yMin * rate, yMax === null ? null : yMax * rate),
      rate: formatMoney(rate),
      capacity: fteMax === null ? "more than a quarter of a full-time person" : fteMin === 0 ? `up to ${fteMax}% of a full-time person` : `${fteMin}–${fteMax}% of a full-time person`
    },
    scorecard: FRICTION_QUESTIONS.map(item => {
      const points = result.answers[item.key].points;
      return { label: item.label, level: LEVEL_WORDS[points], points, top: item.key === result.categoryKey && result.categoryPoints > 0 };
    }),
    agent: { label: agent.label, workflow: result.workflows[0] || result.messiestAreaLabel },
    plan: plan.map(([who, text]) => ({ who, text })),
    wins: (QUICK_WINS[result.categoryKey] || QUICK_WINS.statusChasing).slice()
  };
}

function renderResults() {
  const result = computeResult();
  saveResult(Object.assign(result, { contact: { email: gate.email, company: gate.company, phone: gate.phone, followUpConsent: gate.consent } }));
  const report = buildReport(result);
  const e = escapeHtml;
  const bars = report.scorecard.map(row => `<li class="${row.top ? "is-top" : ""}"><span class="sc-label">${e(row.label)}</span><span class="sc-bar"><i style="width:${Math.max(6, Math.round((row.points / 3) * 100))}%"></i></span><span class="sc-level">${e(row.level)}</span></li>`).join("");
  const steps = report.plan.map(step => `<li class="plan-${step.who}"><span class="plan-who">${step.who === "you" ? "You" : "Agent"}</span><span>${e(step.text)}</span></li>`).join("");
  return `<div class="result-view res">
    <div class="eyebrow">Your Mini Audit</div>
    <h2 class="result-category" tabindex="-1" data-step-heading>${e(report.headline)}</h2>
    <p class="result-lead">Here is what it's costing, what an agent would do about it, and what you can fix this week. <span id="resCopy"${gate.emailQueued ? "" : " hidden"}>A copy is on its way to <strong>${e(gate.email)}</strong>.</span></p>

    <section class="res-assess" aria-label="Your assessment">
      <div class="res-assess-head"><span class="res-agent-dot" aria-hidden="true"></span><span>Your assessment</span><small>From your answers</small></div>
      <div class="res-assess-body" id="resAssess" data-ready="false"><span class="res-typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="res-typing-label">Reviewing your answers…</span><p hidden>${e(report.assessment)}</p></div>
    </section>

    <div class="res-grid">
      <section class="res-cost" aria-label="What it's costing">
        <span class="res-k">What it's costing, from your numbers</span>
        <div class="res-big">${e(report.cost.week)}<small> a week</small></div>
        <ul class="res-cost-list">
          <li><b>${e(report.cost.yearHours)}</b><span>a year</span></li>
          <li><b>${e(report.cost.yearMoney)}</b><span>a year, at ${e(report.cost.rate)} an hour</span></li>
          <li><b>${e(report.cost.capacity)}</b><span>of capacity tied up in coordination</span></li>
        </ul>
      </section>
      <section class="res-score" aria-label="Your scorecard">
        <span class="res-k">Where the drag comes from</span>
        <ul class="sc-list">${bars}</ul>
        <p class="res-note">Based on how often each problem happens, from your answers.</p>
      </section>
    </div>

    <section class="res-plan" aria-label="Your first agent">
      <div class="res-plan-head">
        <div><span class="res-k res-k-dark">Your first agent</span><h3>${e(report.agent.label)}</h3><p>Applied to your workflow: <strong>${e(report.agent.workflow)}</strong></p></div>
        <span class="res-plan-tag">A starting sketch</span>
      </div>
      <ol class="plan-steps">${steps}</ol>
      <p class="res-plan-foot">Your real plan comes out of the Operational Leverage Audit, built around your tools and the way your team works.</p>
    </section>

    <section class="res-wins" aria-label="Fixes to try this week">
      <span class="res-k">Three things you can do this week, without us</span>
      <ol class="wins-list">${report.wins.map(w => `<li>${e(w)}</li>`).join("")}</ol>
    </section>

    <section class="res-next">
      <div><h3>Want this agent built and running?</h3><p>Book a call. We'll look at your answers together and tell you plainly whether the Operational Leverage Audit is worth doing.</p></div>
      <div class="res-next-actions"><a class="btn btn-cta result-cta" id="resultBookCall" href="${e(bookingUrl())}" target="_blank" rel="noopener" onclick="track('audit_book_call_click', { tier: computeResult().lead.tier })">Book a call</a><button type="button" class="results-secondary-link" onclick="restartAudit()">Retake the Mini Audit</button></div>
    </section>
  </div>`;
}

// The booking link carries the lead's booking key once the lead is saved, so a booked call lands on this lead.
function bookingUrl() {
  return window.StradenLeads ? window.StradenLeads.withBookingKey(AUDIT_V2.introCallUrl, gate.bookingKey) : AUDIT_V2.introCallUrl;
}

// The assessment "writes in" after a short pause. It is the writeAssessment() template (Jamal, 9 Oct: templates
// at launch, an agent-written assessment later, with this template as its fallback).
function revealAssessment() {
  const box = document.getElementById("resAssess");
  if (!box || box.dataset.ready === "true") return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => {
    box.dataset.ready = "true";
    box.querySelector("p").hidden = false;
  }, reduce ? 0 : 1400);
}

function restartAudit() {
  track("audit_restart");
  lastScreen = "";
  Object.assign(gate, { unlocked: false, form: null, bookingKey: null, emailQueued: false });
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

function updateGate(key, value) {
  gate[key] = key === "consent" ? !!value : value;
}

function renderGate() {
  if (!gate.form && window.StradenLeads) gate.form = window.StradenLeads.startForm();
  const result = computeResult();
  const firstName = escapeHtml(result.firstName);
  const cause = result.categoryPoints === 0 ? "recurring operational coordination" : CATEGORY_CAUSES[result.categoryKey];
  const lock = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  return `<div class="gate-view">
    <div class="eyebrow">Your result is ready</div>
    <h2 class="step-title" tabindex="-1" data-step-heading>${firstName}, your biggest source of drag is ${cause}.</h2>
    <p class="gate-lead">Your team is losing about <strong>${escapeHtml(result.hoursLostLabel)}</strong> each week to it.</p>
    <div class="gate-locked">
      <div class="gate-locked-inner" aria-hidden="true">
        <span class="gl-title">What it's costing your team</span><i></i>
        <span class="gl-title">Your recommended starting agent</span><i></i><i class="gl-short"></i>
        <span class="gl-title">What it could change</span><i></i><i></i><i class="gl-short"></i>
      </div>
      <div class="gate-lock">${lock}<span>Your full result: what it's costing, the agent to start with, and why it fits</span></div>
    </div>
    <form class="gate-form" onsubmit="submitGate(event)" onkeydown="if(event.key==='Enter'&&event.target.tagName==='INPUT'&&event.target.type!=='checkbox'){submitGate(event)}" novalidate>
      <div class="gate-fields">
        <div><label class="audit-v2-label" for="gateEmail">Work email</label><input id="gateEmail" type="email" autocomplete="email" required value="${escapeHtml(gate.email)}" placeholder="you@company.com" oninput="updateGate('email', this.value)"></div>
        <div><label class="audit-v2-label" for="gateCompany">Company</label><input id="gateCompany" type="text" autocomplete="organization" required value="${escapeHtml(gate.company)}" placeholder="Company name" oninput="updateGate('company', this.value)"></div>
        <div><label class="audit-v2-label" for="gatePhone">Phone</label><input id="gatePhone" type="text" inputmode="tel" maxlength="32" autocomplete="tel" required value="${escapeHtml(gate.phone)}" placeholder="Best number to reach you" oninput="updateGate('phone', this.value)"></div>
      </div>
      <label class="gate-consent"><input type="checkbox" ${gate.consent ? "checked" : ""} onchange="updateGate('consent', this.checked)"> <span>${CONSENT_TEXT}</span></label>
      <div class="form-trap" aria-hidden="true"><label for="gateWebsite">Leave this field empty</label><input id="gateWebsite" type="text" tabindex="-1" autocomplete="off"></div>
      <p class="field-error" id="gateError" role="alert"></p>
      <div class="nav-row"><button type="button" class="btn btn-text" onclick="back()">Back</button><button type="button" class="btn btn-primary" onclick="submitGate(event)">Show my full result</button></div>
      <p class="gate-note">We'll show your full result here and email you a copy. Your answers stay private. See our <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  </div>`;
}

function submitGate(event) {
  event.preventDefault();
  const error = document.getElementById("gateError");
  const email = gate.email.trim();
  const company = gate.company.trim();
  let message = "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) message = "Enter a valid work email.";
  else if (company.length < 2) message = "Enter your company name.";
  else if (!/^[0-9+().\-\s]{7,32}$/.test(gate.phone.trim()) || !/\d{7}/.test(gate.phone.replace(/\D/g, ""))) message = "Enter a phone number we can reach you on.";
  if (message) {
    if (error) error.textContent = message;
    const field = document.getElementById(message.includes("email") ? "gateEmail" : message.includes("phone") ? "gatePhone" : "gateCompany");
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
    return;
  }
  gate.email = email; gate.company = company; gate.phone = gate.phone.trim();
  gate.unlocked = true;
  const result = computeResult();
  track("audit_lead", { tier: result.lead.tier, band: result.band, team: result.teamSize, consent: !!gate.consent });
  window.dispatchEvent(new CustomEvent("straden:mini-audit-lead", { detail: { contact: { firstName: result.firstName, email: gate.email, company: gate.company, phone: gate.phone, followUpConsent: gate.consent }, result } }));
  saveLead(result);
  focusHeading = true;
  render();
}

// Saves the lead once per completed audit. The visitor sees the result straight away; the booking key and the
// "copy is on its way" line appear when the service confirms. If the save fails, the result stays on screen
// (LEAD-EVENT-CONTRACT.md §4).
async function saveLead(result) {
  if (!window.StradenLeads || !gate.form) return;
  const trap = document.getElementById("gateWebsite");
  const outcome = await window.StradenLeads.submit(gate.form, {
    source: "mini_audit",
    contact: { name: result.firstName, email: gate.email, company: gate.company, phone: gate.phone, role: "unknown" },
    mini_audit: {
      answers: { answers: result.answers, businessType: result.businessType, teamSize: result.teamSize, messiestArea: result.messiestArea, workflows: result.workflows, hourlyCost: result.timeCost.hourlyCost, followUpConsent: !!gate.consent, consentText: gate.consent ? CONSENT_TEXT : "" },
      result: Object.assign({}, result, { report: buildReport(result) })
    },
    website: trap ? trap.value : ""
  });
  track("audit_lead_saved", { saved: outcome.saved, tier: result.lead.tier });
  if (!outcome.saved) return;
  gate.bookingKey = outcome.bookingKey;
  gate.emailQueued = outcome.resultEmail === "queued";
  const link = document.getElementById("resultBookCall");
  if (link) link.href = bookingUrl();
  const copy = document.getElementById("resCopy");
  if (copy && gate.emailQueued) copy.hidden = false;
}

function render() {
  updateProgress();
  const app = document.getElementById("app");
  const complete = state.step >= TOTAL_STEPS;
  const body = complete ? (gate.unlocked ? renderResults() : renderGate()) : renderQuestion();
  const nav = complete ? "" : `<div class="nav-row">${state.step > 0 ? '<button type="button" class="btn btn-text" onclick="back()">Back</button>' : "<span></span>"}<button type="button" class="btn btn-primary" id="nextButton" ${canProceed() ? "" : "disabled"} onclick="next()">${state.step === TOTAL_STEPS - 1 ? "See my result" : "Next"}</button></div>`;
  app.innerHTML = `<div class="fade-in">${body}${nav}</div>`;
  if (complete && gate.unlocked) revealAssessment();
  trackScreen(complete);
  if (focusHeading) {
    const stepHeading = app.querySelector("[data-step-heading]");
    if (stepHeading) stepHeading.focus({ preventScroll: true });
    focusHeading = false;
  }
}

render();
