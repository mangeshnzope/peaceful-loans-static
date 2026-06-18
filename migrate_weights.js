const fs = require('fs');
let styles = fs.readFileSync('styles.css', 'utf8');

const map600 = [
  ".hero h1", ".section-title", ".fear-num span", ".bomb-card h3", 
  ".step-card h3", ".founder-img-text h3", ".cta-section h2", 
  ".page-header h1", ".stat-card .num", ".lp-hero h1", ".story-title",
  ".story-stat-item .value", ".story-benefit .value", ".problem-card-lp h3"
];
const map500 = [
  ".hero-phone-label", ".wa-header-time", ".wa-name", ".wa-bubble-in-name",
  ".bomb-tag", ".step-num", ".avatar-circle span", ".community-avatar span"
];

let newStyles = styles.split('\n').map(line => {
  if (line.includes('font-weight: 700;')) {
    let handled = false;
    for (let s of map600) { if (line.indexOf(s) !== -1) { line = line.replace('font-weight: 700;', 'font-weight: 600;'); handled = true; break; } }
    if (!handled) {
      for (let s of map500) { if (line.indexOf(s) !== -1) { line = line.replace('font-weight: 700;', 'font-weight: 500;'); handled = true; break; } }
    }
    if (!handled) console.log("Unmapped 700 in styles.css:", line);
  }
  return line;
}).join('\n');
fs.writeFileSync('styles.css', newStyles);

// SCSS & CSS & HTML replacements for save-money-on-home-loan
if (fs.existsSync('save-money-on-home-loan')) {
  let scss = fs.readFileSync('save-money-on-home-loan/style.scss', 'utf8');
  scss = scss.replace(/\.form-group label\s*\{\s*font-weight: 800;/g, '.form-group label { font-weight: 500;');
  scss = scss.replace(/\.after\s*\{\s*font-weight: 800;/g, '.after { font-weight: 500;');
  scss = scss.replace(/\.hero-main-heading\s*\{\s*font-weight: 900;/g, '.hero-main-heading { font-weight: 600;');
  scss = scss.replace(/#results \.result-value\s*\{\s*font-weight: 700;/g, '#results .result-value { font-weight: 600;');
  scss = scss.replace(/\.whatsapp-cta\s*\{\s*font-weight: 700;/g, '.whatsapp-cta { font-weight: 500;');
  scss = scss.replace(/\.mobile-menu-inner p\.mb-1 \s*\{\s*font-weight: bold;/g, '.mobile-menu-inner p.mb-1 { font-weight: 500;');
  scss = scss.replace(/\.faq-accordion \.accordion-button\s*\{\s*font-weight: 700;/g, '.faq-accordion .accordion-button { font-weight: 500;');
  scss = scss.replace(/p\.review-title\s*\{\s*font-weight: 700;/g, 'p.review-title { font-weight: 600;');
  scss = scss.replace(/\.footer-logo\s*\{\s*font-weight: 700;/g, '.footer-logo { font-weight: 500;');

  // Also add `.score` and `.stat-value` rules if I removed fw-bold
  // Actually better to just append the utility classes to the end of style.scss since they replace fw-bold:
  scss += `

/* Gate 4 Custom replacements for stripped fw-bold */
.score, .stat-value, .after { font-weight: 500; }
.result-value, .hero-main-heading, .review-title { font-weight: 600; }
`;

  fs.writeFileSync('save-money-on-home-loan/style.scss', scss);

  // CSS counterpart
  let css = fs.readFileSync('save-money-on-home-loan/style.css', 'utf8');
  css = css.replace(/font-weight: 800;/g, 'font-weight: 500;');
  css = css.replace(/font-weight: 900;/g, 'font-weight: 600;');
  css = css.replace(/font-weight: 700;/g, function(match, offset, str) {
    let context = str.substring(Math.max(0, offset - 50), offset + 30);
    if (context.includes('.result-value') || context.includes('.review-title') || context.includes('.stat-value')) return 'font-weight: 600;';
    return 'font-weight: 500;';
  });
  css = css.replace(/font-weight: bold;/g, 'font-weight: 500;');
  css += `
/* Gate 4 Custom */
.score, .stat-value, .after { font-weight: 500; }
.result-value, .hero-main-heading, .review-title { font-weight: 600; }
`;
  fs.writeFileSync('save-money-on-home-loan/style.css', css);

  // HTML fw-bold cleanup
  let html = fs.readFileSync('save-money-on-home-loan/index.html', 'utf8');
  html = html.replace(/<span class="fw-bold">/g, '<span style="font-weight: 600;">');
  html = html.replace(/<h6 class="text-white fw-bold mb-3">/g, '<h6 class="text-white mb-3" style="font-weight: 600;">');
  html = html.replace(/\s*fw-bolder\b/g, '');
  html = html.replace(/\s*fw-bold\b/g, '');
  fs.writeFileSync('save-money-on-home-loan/index.html', html);

  console.log("Done text replacements");
}
