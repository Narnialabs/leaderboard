/**
 * Navigation Bar Component
 * Dynamically injects the top navigation into any page.
 * Usage: include this script, then call initNav('page-id')
 */

// ── Content Protection ──
(function() {
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
    let isDown = false, startX = 0, startScroll = 0, moved = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (el.scrollWidth - el.clientWidth <= 1) return;
      if (e.altKey) return; // hold Alt to text-select instead of drag
      isDown = true;
      moved = 0;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      try { el.setPointerCapture(e.pointerId); } catch {}
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    });
    el.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      el.scrollLeft = startScroll - dx;
    });
    const end = (e) => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
      el.style.userSelect = '';
      try { el.releasePointerCapture(e.pointerId); } catch {}
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => {
      if (moved > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; }
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
