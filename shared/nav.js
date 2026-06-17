/**
 * Navigation Bar Component
 * Dynamically injects the top navigation into any page.
 * Usage: include this script, then call initNav('page-id')
 */

// ── Content Protection ──
// Active on the DEPLOYED (public) site only. Skipped on localhost / 127.0.0.1 so
// DevTools stays usable while developing — a fully-blocked F12 previously made a UI
// bug (drag-scroll swallowing header clicks) very hard to diagnose. NB: these are a
// casual deterrent, trivially bypassed; real internal data must not rely on them.
(function() {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '') return;

  // Right-click prevention
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Drag prevention
  document.addEventListener('dragstart', e => e.preventDefault());

  // Text selection prevention (CSS)
  document.documentElement.style.userSelect = 'none';
  document.documentElement.style.webkitUserSelect = 'none';

  // DevTools keyboard shortcuts prevention
  document.addEventListener('keydown', e => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') { e.preventDefault(); return; }
    // Cmd variants for Mac
    if (e.metaKey && e.altKey && ['I','J','C'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    if (e.metaKey && e.key.toUpperCase() === 'U') { e.preventDefault(); return; }
  });
})();

// ── Web Analytics (Google Analytics 4 — gtag.js) ──
// Loads once per page (nav.js is included on every page). Create a GA4 property
// at analytics.google.com → Admin → Data streams → add a Web stream for
// `leaderboard.narnia.ai`, then paste its Measurement ID (G-XXXXXXXXXX) below.
// Until a real ID is set, GA is skipped so local/dev pages stay clean.
(function() {
  const GA_MEASUREMENT_ID = 'G-ET90S4PYJX';  // GA4 Measurement ID for leaderboard.narnia.ai
  if (!GA_MEASUREMENT_ID) return;
  // Defer GA until after `load`. gtag.js + the /collect beacon were the single
  // heaviest network requests during initial load on a throttled connection, and
  // since GA is referenced only here (no other gtag() callers), deferring the whole
  // block keeps that traffic off the critical first-paint path entirely — the
  // pageview just records a moment later. No render/behaviour change otherwise.
  function loadGA() {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    (document.head || document.documentElement).appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // Cookieless mode: no client_id cookie is written, so no consent banner is
    // required. Trade-off: returning-visitor / unique-user counts are approximate
    // (GA4 falls back to short-lived signals instead of the _ga cookie).
    gtag('config', GA_MEASUREMENT_ID, {
      client_storage: 'none',
      ads_data_redaction: true,
    });
  }
  if (document.readyState === 'complete') loadGA();
  else window.addEventListener('load', loadGA, { once: true });
})();

const NAV_PAGES = [
  { id: 'overview',  label: 'Overview',  href: 'index.html' },
  { id: 'benchmark', label: 'Benchmark', href: 'benchmark.html' },
  { id: 'analysis',  label: 'Analysis',  href: 'analysis.html' },
  { id: 'explorer',  label: 'Explorer',  href: 'explorer.html' },
];

function initNav(activePageId) {
  const nav = document.createElement('nav');
  nav.className = 'nav-bar';
  nav.innerHTML = `
    <a href="index.html" class="nav-brand">
      <div>
        <div class="nav-brand-text">Narnia Labs</div>
      </div>
    </a>
    <button class="nav-hamburger" aria-label="Menu">&#9776;</button>
    <div class="nav-links">
      ${NAV_PAGES.map(p => `
        <a href="${p.href}" class="nav-link ${p.id === activePageId ? 'active' : ''}">${p.label}</a>
      `).join('')}
    </div>
  `;
  const hamburger = nav.querySelector('.nav-hamburger');
  const links = nav.querySelector('.nav-links');
  hamburger.addEventListener('click', () => links.classList.toggle('mobile-open'));
  // Clicking the nav link for the page you're already on should reset to the
  // bare URL — without this, browsers treat a same-path link as a hash update
  // and the user is stuck on whatever state (?dim=...#cat=...) they navigated
  // in with.  preventDefault + location.assign forces a clean reload to the
  // base href.
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      links.classList.remove('mobile-open');
      const href = link.getAttribute('href');
      const pageOnly = window.location.pathname.split('/').pop() || 'index.html';
      if (href === pageOnly && (window.location.search || window.location.hash)) {
        // Same-document navigation: browsers won't reload when only hash/query
        // differ, so the page would stay on its current state and the URL bar
        // would never clear.  Clear the URL via replaceState first, then force
        // a true reload so the page re-inits from defaults.
        e.preventDefault();
        history.replaceState(null, '', href);
        window.location.reload();
      }
    });
  });
  document.body.insertBefore(nav, document.body.firstChild);
}

// ── Data-table edge fade ──
// Hides the visible horizontal scrollbar on .data-table-wrapper and applies
// a subtle right-edge fade only when the table actually overflows AND the
// user hasn't scrolled to the end. This makes wide BenchRank tables feel
// natural like mobile, while still hinting that more columns exist.
(function() {
  function updateOverflow(el) {
    const overflows = el.scrollWidth - el.clientWidth > 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    if (overflows && !atEnd) el.setAttribute('data-overflow', 'end-cut');
    else el.removeAttribute('data-overflow');
    // Separate flag (independent of scroll position) for cursor:grab affordance —
    // we want the grab cursor even after the user has scrolled to the end.
    if (overflows) el.setAttribute('data-scrollable', '');
    else el.removeAttribute('data-scrollable');
  }
  function bind(el) {
    if (el.__edgeFadeBound) return;
    el.__edgeFadeBound = true;
    el.addEventListener('scroll', () => updateOverflow(el), { passive: true });
    updateOverflow(el);
    bindDrag(el);
  }
  // Mouse drag-to-scroll. Touch + trackpad already scroll natively; this only
  // kicks in for the mouse case where there's no horizontal wheel. The click
  // capture below suppresses the synthetic click after a real drag so sortable
  // <th> handlers don't fire when the user is just panning the table.
  function bindDrag(el) {
    if (el.__dragBound) return;
    el.__dragBound = true;
    // Movement past this many px counts as a real drag — used both to lazily
    // engage pointer capture and to suppress the synthetic click afterwards.
    // The two checks MUST stay in lockstep, so share the one constant.
    const DRAG_THRESHOLD = 4;
    let isDown = false, captured = false, startX = 0, startScroll = 0, moved = 0, pid = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (el.scrollWidth - el.clientWidth <= 1) return;
      if (e.altKey) return; // hold Alt to text-select instead of drag
      isDown = true;
      captured = false;
      moved = 0;
      pid = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      // NOTE: do NOT setPointerCapture here. Capturing on pointerdown retargets the
      // following pointerup/click to THIS wrapper, so a plain click on a child <th>
      // never reaches that <th>'s sort handler — it silently dies on the wrapper.
      // (Symptom: header sort worked only on tables narrow enough NOT to be
      // [data-scrollable]; wide ones like 3D-generation never sorted.) Capture
      // lazily below, only once a real drag actually begins.
    });
    el.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      if (!captured && Math.abs(dx) > DRAG_THRESHOLD) {
        // Real drag now — capture so panning continues even if the pointer leaves
        // the element, and switch to the grabbing affordance.
        captured = true;
        try { el.setPointerCapture(pid); } catch {}
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      }
      el.scrollLeft = startScroll - dx;
    });
    const end = (e) => {
      if (!isDown) return;
      isDown = false;
      // cursor/userSelect are only set once a drag actually engages (captured),
      // so only reset them then — a plain click never touched them.
      if (captured) {
        el.style.cursor = '';
        el.style.userSelect = '';
        try { el.releasePointerCapture(e.pointerId); } catch {}
        captured = false;
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => {
      if (moved > DRAG_THRESHOLD) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);
  }
  // Coalesce bursty mutations (table renders insert many rows at once) into
  // a single rAF tick so we don't force layout on every appended <tr>.
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      document.querySelectorAll('.data-table-wrapper').forEach(el => { bind(el); updateOverflow(el); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  // Tables are rendered async after data loads; observe new wrappers/rows on
  // body only (head mutations are irrelevant) and let the rAF debounce keep
  // it cheap even on chart-heavy pages.
  const mo = new MutationObserver(schedule);
  mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', schedule, { passive: true });
})();
