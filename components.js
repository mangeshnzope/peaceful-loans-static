// ===== SVG Icons =====
const icons = {
  phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  whatsapp: `<svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`,
  star: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  shield: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alertTriangle: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  shieldCheck: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  chevronDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevronLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  x: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  home: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  arrowLeftRight: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  building: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  mapPin: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  layers: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  landmark: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  globe: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  trendingUp: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  gradCap: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  target: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  alertOctagon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

function starsHTML(count = 5, size = 14) {
  return Array(count).fill(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('');
}

// ===== URLs =====
const URLS = {
  callForm: 'https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M',
  whatsappForm: 'https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4',
};

// ===== Tricolor =====
function tricolorHTML(height = 3) {
  return `<div class="tricolor"><div class="tc-blue" style="height:${height}px"></div><div class="tc-red" style="height:${height}px"></div><div class="tc-amber" style="height:${height}px"></div></div>`;
}
function tricolorVHTML(width = 12) {
  return `<div class="tricolor-v" style="width:${width}px;align-self:stretch"><div class="tc-blue"></div><div class="tc-red"></div><div class="tc-amber"></div></div>`;
}

// ===== Nav =====
function navHTML(currentPath) {
  const isHome = currentPath === '/' || currentPath === '/index.html';
  const links = [
    { label: 'How It Works', href: isHome ? '#how-it-works' : '/index.html#how-it-works' },
    { label: 'What We Check', href: isHome ? '#shield' : '/index.html#shield' },
    { label: 'Reviews', href: '/reviews.html' },
    { label: 'FAQs', href: '/faqs.html' },
  ];
  return `
<nav class="nav" id="navbar">
  <div class="container">
    <div class="nav-inner">
      <a href="/index.html" class="nav-logo"><img src="/assets/logo-horizontal.jpg" alt="Peaceful Loans"></a>
      <div class="nav-links">${links.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}</div>
      <div class="nav-ctas">
        <a href="${URLS.callForm}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm">${icons.phone} Book a Free Call</a>
        <a href="${URLS.whatsappForm}" target="_blank" rel="noreferrer" class="btn btn-outline-gray btn-sm"><span style="color:#16a34a">${icons.whatsapp}</span> WhatsApp Us</a>
      </div>
      <button class="nav-menu-btn" onclick="toggleMobileMenu()" aria-label="Menu">${icons.menu}</button>
    </div>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    ${links.map(l => `<a href="${l.href}" onclick="closeMobileMenu()">${l.label}</a>`).join('')}
    <div class="mobile-ctas">
      <a href="${URLS.callForm}" target="_blank" rel="noreferrer" class="btn btn-primary">${icons.phone} Book a Free Call</a>
      <a href="${URLS.whatsappForm}" target="_blank" rel="noreferrer" class="btn btn-outline-gray"><span style="color:#16a34a">${icons.whatsapp}</span> WhatsApp Us</a>
    </div>
  </div>
  ${tricolorHTML(2)}
</nav>`;
}

// ===== Footer =====
function footerHTML() {
  return `
<footer class="footer">
  ${tricolorHTML(3)}
  <div class="container" style="padding-top:3.5rem;padding-bottom:3.5rem">
    <div class="footer-grid">
      <div>
        <div class="footer-logo"><img src="/assets/logo-horizontal.jpg" alt="Peaceful Loans"></div>
        <p class="footer-desc">Unbiased analysis for the modern home loan borrower. We work for you, not the bank.</p>
      </div>
      <div>
        <h4>Navigation</h4>
        <ul>
          <li><a href="/index.html#how-it-works">How It Works</a></li>
          <li><a href="/index.html#shield">What We Check</a></li>
          <li><a href="/reviews.html">Reviews</a></li>
          <li><a href="/faqs.html">FAQs</a></li>
          <li><a href="/about.html">About</a></li>
        </ul>
      </div>
      <div>
        <h4>Connect</h4>
        <ul>
          <li><a href="${URLS.callForm}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:.5rem">${icons.phone} Book a Free Call</a></li>
          <li><a href="${URLS.whatsappForm}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:.5rem"><span style="color:#22c55e">${icons.whatsapp}</span> WhatsApp Us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 Peaceful-Loans &middot; IIM Calcutta Alumnus Initiative &middot; Mumbai</p>
      <p>Unbiased analysis for the modern borrower.</p>
    </div>
  </div>
</footer>`;
}

// ===== CTA Section =====
function ctaSectionHTML() {
  return `
<section class="section-blue">
  ${tricolorHTML(3)}
  <div class="cta-section">
    <div class="container-xs text-center">
      <p class="section-label section-label-white">Before You Sign Anything</p>
      <h2>Talk to us first. It's free.</h2>
      <p>Free advisory call. 30 minutes. No strings. Just the unvarnished truth about your loan agreement — from someone who works only for you.</p>
      <div class="cta-buttons">
        <a href="${URLS.callForm}" target="_blank" rel="noreferrer" class="btn btn-amber">${icons.phone} Book a Free Call</a>
        <a href="${URLS.whatsappForm}" target="_blank" rel="noreferrer" class="btn btn-outline-white">${icons.whatsapp} WhatsApp Us</a>
      </div>
    </div>
  </div>
</section>`;
}

// ===== Nav JS =====
function initNav() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}
function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.remove('open');
}
