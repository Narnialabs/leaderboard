/**
 * Navigation Bar Component
 * Dynamically injects the top navigation into any page.
 * Usage: include this script, then call initNav('page-id')
 */

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
        <div class="nav-brand-sub">AI Benchmark Dashboard</div>
      </div>
    </a>
    <div class="nav-links">
      ${NAV_PAGES.map(p => `
        <a href="${p.href}" class="nav-link ${p.id === activePageId ? 'active' : ''}">${p.label}</a>
      `).join('')}
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);
}
