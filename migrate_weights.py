import re

# 1. Update styles.css
with open('styles.css', 'r') as f:
    styles = f.readlines()

map600 = [
    ".hero h1", ".section-title", ".fear-num span", ".bomb-card h3", 
    ".step-card h3", ".founder-img-text h3", ".cta-section h2", 
    ".page-header h1", ".stat-card .num", ".lp-hero h1", ".story-title",
    ".story-stat-item .value", ".story-benefit .value", ".problem-card-lp h3"
]
map500 = [
    ".hero-phone-label", ".wa-header-time", ".wa-name", ".wa-bubble-in-name",
    ".bomb-tag", ".step-num", ".avatar-circle span", ".community-avatar span"
]

for i, line in enumerate(styles):
    if "font-weight: 700;" in line:
        handled = False
        for s in map600:
            if s in line:
                styles[i] = line.replace("font-weight: 700;", "font-weight: 600;")
                handled = True
                break
        if not handled:
            for s in map500:
                if s in line:
                    styles[i] = line.replace("font-weight: 700;", "font-weight: 500;")
                    handled = True
                    break

with open('styles.css', 'w') as f:
    f.writelines(styles)

# 2. Update save-money-on-home-loan/style.scss
with open('save-money-on-home-loan/style.scss', 'r') as f:
    scss = f.read()

scss = re.sub(r'(\.form-group label\s*\{[^}]*)font-weight:\s*800;', r'\1font-weight: 500;', scss)
scss = re.sub(r'(\.after\s*\{[^}]*)font-weight:\s*800;', r'\1font-weight: 500;', scss)
scss = re.sub(r'(\.hero-main-heading\s*\{[^}]*)font-weight:\s*900;', r'\1font-weight: 600;', scss)
scss = re.sub(r'(#results \.result-value\s*\{[^}]*)font-weight:\s*700;', r'\1font-weight: 600;', scss)
scss = re.sub(r'(\.whatsapp-cta\s*\{[^}]*)font-weight:\s*700;', r'\1font-weight: 500;', scss)
scss = re.sub(r'(\.mobile-menu-inner p\.mb-1 \s*\{[^}]*)font-weight:\s*bold;', r'\1font-weight: 500;', scss)
scss = re.sub(r'(\.faq-accordion \.accordion-button\s*\{[^}]*)font-weight:\s*700;', r'\1font-weight: 500;', scss)
scss = re.sub(r'(p\.review-title\s*\{[^}]*)font-weight:\s*700;', r'\1font-weight: 600;', scss)
scss = re.sub(r'(\.footer-logo\s*\{[^}]*)font-weight:\s*700;', r'\1font-weight: 500;', scss)

scss += """
/* Gate 4 Custom CSS */
.score, .after { font-weight: 500 !important; }
.stat-value { font-weight: 600 !important; }
.result-value, .hero-main-heading, .review-title { font-weight: 600; }
"""

with open('save-money-on-home-loan/style.scss', 'w') as f:
    f.write(scss)

# 3. Update save-money-on-home-loan/style.css
with open('save-money-on-home-loan/style.css', 'r') as f:
    css = f.read()

css = css.replace("font-weight: 800;", "font-weight: 500;")
css = css.replace("font-weight: 900;", "font-weight: 600;")
def replace_700(match):
    context = css[max(0, match.start()-50):match.end()+30]
    if '.result-value' in context or '.review-title' in context:
        return 'font-weight: 600;'
    return 'font-weight: 500;'

css = re.sub(r'font-weight: 700;', replace_700, css)
css = css.replace("font-weight: bold;", "font-weight: 500;")
css += """
/* Gate 4 Custom CSS */
.score, .after { font-weight: 500 !important; }
.stat-value { font-weight: 600 !important; }
.result-value, .hero-main-heading, .review-title { font-weight: 600; }
"""

with open('save-money-on-home-loan/style.css', 'w') as f:
    f.write(css)

# 4. Update save-money-on-home-loan/index.html
with open('save-money-on-home-loan/index.html', 'r') as f:
    html = f.read()

html = html.replace('<span class="fw-bold">', '<span style="font-weight: 600;">')
html = html.replace('<h6 class="text-white fw-bold mb-3">', '<h6 class="text-white mb-3" style="font-weight: 600;">')
html = re.sub(r'\s*fw-bolder\b', '', html)
html = re.sub(r'\s*fw-bold\b', '', html)

with open('save-money-on-home-loan/index.html', 'w') as f:
    f.write(html)
