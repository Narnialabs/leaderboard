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
  { id: 'overview', label: 'Overview', href: 'index.html' },
  { id: 'leaderboard', label: 'Leaderboard', href: 'leaderboard.html' },
  { id: 'inference', label: 'Inference Explorer', href: 'inference-explorer.html' },
];

function initNav(activePageId) {
  const nav = document.createElement('nav');
  nav.className = 'nav-bar';
  nav.innerHTML = `
    <a href="index.html" class="nav-brand">
      <div>
        <div class="nav-brand-text">Narnia Labs</div>
        <div class="nav-brand-sub">Engineering AI Leaderboard</div>
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
  nav.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => links.classList.remove('mobile-open')));
  document.body.insertBefore(nav, document.body.firstChild);
}
