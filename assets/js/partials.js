/* =============================================================
   STRADEN — Shared header/footer injection
   Every page includes: <header id="site-header"></header> and
   <footer id="site-footer"></footer>, plus <body data-page="...">
   for active-nav-link highlighting.
============================================================= */

const SITE_NAV_LINKS = [
  { href: "how-it-works.html", label: "How It Works", page: "how-it-works" },
  { href: "who-we-serve.html", label: "Who We Serve", page: "who-we-serve" },
  { href: "proof.html", label: "Proof & Approach", page: "proof" },
  { href: "about.html", label: "About", page: "about" }
];

function stradenLogo(extraClass) {
  return `<a href="index.html" class="logo ${extraClass || ""}">STRADEN<span class="dot"></span></a>`;
}

function renderFullHeader(activePage) {
  const links = SITE_NAV_LINKS.map(l =>
    `<a href="${l.href}" class="nav-link" ${activePage === l.page ? 'aria-current="page"' : ""}>${l.label}</a>`
  ).join("");

  return `
    <nav class="site-nav">
      <div class="nav-inner">
        ${stradenLogo()}
        <div class="nav-links" id="navLinks">
          ${links}
          <a href="audit.html" class="nav-cta">Take the Audit →</a>
        </div>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;
}

function renderMinimalHeader() {
  return `
    <nav class="site-nav">
      <div class="nav-inner">
        ${stradenLogo()}
        <a href="index.html" class="nav-link">← Back to site</a>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="footer-top">
        <div>
          ${stradenLogo()}
          <p class="footer-tag">An operated system for service businesses that are tired of chasing their own work.</p>
          <a href="audit.html" class="btn btn-primary" style="font-size:13px; padding:10px 20px;">Take the Audit →</a>
        </div>
        <div class="footer-col">
          <h5>Straden</h5>
          <ul class="footer-links">
            <li><a href="how-it-works.html">How It Works</a></li>
            <li><a href="who-we-serve.html">Who We Serve</a></li>
            <li><a href="proof.html">Proof &amp; Approach</a></li>
            <li><a href="about.html">About</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h5>Get Started</h5>
          <ul class="footer-links">
            <li><a href="audit.html">Take the Audit</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="privacy.html">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${year} Straden.</span>
        <span>Built for owner-operated service businesses.</span>
      </div>
    </footer>
  `;
}

(function initPartials() {
  const body = document.body;
  const page = body.getAttribute("data-page") || "";
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");

  if (headerMount) {
    headerMount.outerHTML = page === "audit"
      ? renderMinimalHeader()
      : renderFullHeader(page);
  }
  if (footerMount) {
    footerMount.outerHTML = renderFooter();
  }

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
})();
