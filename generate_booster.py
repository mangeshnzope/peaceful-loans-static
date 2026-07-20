import os
import re

def run():
    website_dir = os.path.dirname(os.path.abspath(__file__))
    blog_dir = os.path.join(website_dir, 'from-founders-desk')
    booster_dir = os.path.join(website_dir, 'index-booster')
    os.makedirs(booster_dir, exist_ok=True)

    # 1. Parse all subdirectories in from-founders-desk that have index.html
    subdirs = [d for d in os.listdir(blog_dir) if os.path.isdir(os.path.join(blog_dir, d)) and os.path.exists(os.path.join(blog_dir, d, 'index.html'))]

    articles = []
    for slug in sorted(subdirs):
        index_path = os.path.join(blog_dir, slug, 'index.html')
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        # Extract Title (from <title> tag)
        title_match = re.search(r'<title>(.*?)<\/title>', html, re.DOTALL)
        title = title_match.group(1).strip() if title_match else slug.replace('-', ' ').title()
        # Strip suffix if present (e.g. " · From Founder's Desk — Peaceful Loans" or " - Peaceful Loans")
        title = re.sub(r'\s*·\s*From Founder\'s Desk.*$', '', title)
        title = re.sub(r'\s*-\s*Peaceful Loans.*$', '', title)
        title = title.strip()
        
        # Extract Date (from brand-meta or date span)
        date_match = re.search(r'<span class="date">([^<]*)<\/span>', html)
        date = date_match.group(1).strip() if date_match else "May 2026"
        
        # Extract Excerpt (from meta description or excerpt class)
        desc_match = re.search(r'<meta name="description" content="([^"]*)"', html)
        excerpt = desc_match.group(1).strip() if desc_match else ""
        if len(excerpt) > 160:
            excerpt = excerpt[:157] + "..."

        # Category classification based on keywords in slug
        category = "General Home Loan Strategy"
        
        plot_keywords = ['plot', 'land', 'agricultural', 'construction', 'acre', 'buy-a-plot', 'building', 'commercial', 'residential']
        nri_keywords = ['nri', 'abroad', 'visa', 'citizen', 'foreign', 'h-1b', 'f-1', 'opt']
        eligibility_keywords = ['income', 'eligibility', 'salary', 'itr', 'employed', 'business', 'credit', 'cibil', 'score', 'documentation', 'rejected', 'down-payment', 'downpayment', 'saving', 'tax', 'ltv', 'emi', 'afford', 'negotiate', 'insurance', 'scam', 'hidden', 'cost', 'foreclose', 'prepay', 'close', 'repay', 'loss', 'security', 'job', 'home-loan-top-up']
        strategy_keywords = ['rate', 'interest', 'bank', 'nbfc', 'rbi', 'fixed', 'floating', 'cut', 'repo', 'rblr', 'mclr', 'overdraft', 'maxgain', 'deal', 'credila', 'hdfc', 'sbi', 'bom', 'canara', 'rural', 'urban', 'it-professionals', 'startup', 'founder', 'woman', 'married', 'joint']

        if any(k in slug for k in plot_keywords):
            category = "Plot Loans & Land Financing"
        elif any(k in slug for k in nri_keywords):
            category = "NRI & International Borrowers"
        elif any(k in slug for k in eligibility_keywords):
            category = "Eligibility, Approval & Document Strategy"
        elif any(k in slug for k in strategy_keywords):
            category = "Home Loan Strategy & Market Truths"
            
        articles.append({
            'title': title,
            'slug': slug,
            'date': date,
            'excerpt': excerpt,
            'category': category
        })

    print(f"Loaded and parsed {len(articles)} blog articles.")

    # Group articles by category
    categories = {
        "Plot Loans & Land Financing": [],
        "NRI & International Borrowers": [],
        "Eligibility, Approval & Document Strategy": [],
        "Home Loan Strategy & Market Truths": [],
        "General Home Loan Strategy": []
    }

    for art in articles:
        categories[art['category']].append(art)

    # Write index-booster/index.html with matching premium styles and E-E-A-T elements
    html_out = """<!doctype html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GT-5MX2VZLT"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GT-5MX2VZLT');
  </script>

  <title>Sitemap Booster & Indexing Directory · Peaceful Loans</title>
  <meta name="description" content="A complete sitemap booster directory of home loan advisory guides, plot loan structures, interest rate strategies, and NRI lending terms from Peaceful Loans.">
  <link rel="canonical" href="https://peaceful-loans.com/index-booster/">
  <meta name="robots" content="index, follow">
  
  <meta property="og:type" content="website">
  <meta property="og:title" content="Sitemap Booster & Indexing Directory · Peaceful Loans">
  <meta property="og:description" content="A complete index booster directory of home loan guides, plot financing options, and unbiased loan insights.">
  <meta property="og:url" content="https://peaceful-loans.com/index-booster/">
  <meta property="og:image" content="https://peaceful-loans.com/assets/og-image.png?v=2">
  
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg: #FBFAF7;
      --ink: #1A1A1A;
      --muted: #666;
      --accent: #1A4CC8;
      --hair: #E5E7EB;
      --serif: "Source Serif 4", Georgia, serif;
      --sans: "Inter", -apple-system, sans-serif;
    }

    * { box-sizing: border-box; }
    body { 
      margin: 0; padding: 0; background: var(--bg); color: var(--ink); 
      font-family: var(--sans); -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    /* ===== HEADER ===== */
    header {
      text-align: center;
      border-bottom: 1px solid var(--ink);
      padding-bottom: 40px;
      margin-bottom: 40px;
    }
    .nav-logo {
      display: inline-block;
      margin-bottom: 24px;
    }
    .nav-logo img {
      height: 40px;
      width: auto;
    }
    h1 {
      font-family: var(--serif);
      font-size: 48px;
      font-weight: 600;
      margin: 0 0 12px;
      letter-spacing: -0.01em;
      line-height: 1.1;
    }
    .subhead {
      font-size: 16px;
      color: var(--muted);
      margin-top: 12px;
      display: block;
      font-family: var(--serif);
      font-style: italic;
    }

    /* ===== BREADCRUMB ===== */
    .breadcrumb {
      display: flex;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 30px;
    }
    .breadcrumb a {
      color: var(--ink);
      text-decoration: none;
    }
    .breadcrumb a:hover {
      color: var(--accent);
    }
    .breadcrumb span {
      color: var(--muted);
    }

    /* ===== INTRO SECTION ===== */
    .intro-section {
      background: #FFFFFF;
      border: 1px solid var(--hair);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 50px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }
    .intro-section h2 {
      font-family: var(--serif);
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .intro-section p {
      font-size: 15px;
      line-height: 1.6;
      color: #444;
      margin: 0;
    }

    /* ===== CATEGORIES ===== */
    .category-section {
      margin-bottom: 50px;
    }
    .category-title {
      font-family: var(--serif);
      font-size: 28px;
      font-weight: 600;
      color: #0A2A6B;
      border-bottom: 2px solid var(--ink);
      padding-bottom: 12px;
      margin-top: 0;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .category-count {
      font-family: var(--sans);
      font-size: 13px;
      background: rgba(26,76,200,0.1);
      color: var(--accent);
      padding: 4px 12px;
      border-radius: 99px;
      font-weight: 700;
    }

    .links-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    @media (min-width: 640px) {
      .links-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .link-card {
      background: #FFFFFF;
      border: 1px solid var(--hair);
      border-radius: 12px;
      padding: 20px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .link-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      box-shadow: 0 8px 20px rgba(0,0,0,0.04);
    }
    .link-card h3 {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.35;
      margin-top: 0;
      margin-bottom: 8px;
      color: var(--ink);
    }
    .link-card:hover h3 {
      color: var(--accent);
    }
    .link-card p {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
      margin-top: 0;
      margin-bottom: 12px;
      flex-grow: 1;
    }
    .link-meta {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .link-bullet {
      width: 4px;
      height: 4px;
      background: var(--muted);
      border-radius: 50%;
      display: inline-block;
    }

    /* ===== TRICOLOR ===== */
    .tricolor { display: flex; width: 100%; height: 3px; }
    .tc-blue { flex: 1; background: #1A4CC8; }
    .tc-red { flex: 1; background: #E84118; }
    .tc-amber { flex: 1; background: #FFB800; }

  </style>

  <!-- LinkedIn Insight Tag -->
  <script type="text/javascript">
    _linkedin_partner_id = "6873185";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  </script>
  <script type="text/javascript">
    (function(l) {
      if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
      window.lintrk.q=[]}
      var s = document.getElementsByTagName("script")[0];
      var b = document.createElement("script");
      b.type = "text/javascript";b.async = true;
      b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      s.parentNode.insertBefore(b, s);})(window.lintrk);
  </script>
  <noscript>
    <img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=6873185&fmt=gif" />
  </noscript>
  <!-- End LinkedIn Insight Tag -->
</head>
<body>

<div id="app"></div>

<script src="/components.js"></script>
<script>
  // Dynamic page injection matching home-loan component architecture
  const contentHTML = `
  <div class="container">
    <div class="breadcrumb">
      <a href="/index.html">Home</a>
      <span>&middot;</span>
      <a href="/from-founders-desk/">Founder's Desk</a>
      <span>&middot;</span>
      <span style="color:var(--accent)">Sitemap Booster</span>
    </div>

    <header>
      <a href="/index.html" class="nav-logo">
        <img src="/assets/logo-horizontal.png" alt="Peaceful Loans">
      </a>
      <h1>Sitemap Booster</h1>
      <span class="subhead">Unbiased insights, land financing schemes, and home loan audit strategies.</span>
    </header>

    <div class="intro-section">
      <h2>Googlebot Indexing & Crawl Fast-Track</h2>
      <p>This directory serves as our flat, direct crawl booster, hardcoding Raw HTML hyperlinks for all expert articles and strategy publications. By linking directly from our homepage footer, we ensure Googlebot discovers every financial guide, calculation strategy, and document auditing map within exactly 2 hops of our entry domain. Explore our indexed categories below.</p>
    </div>

    <!-- Core Pages Category -->
    <div class="category-section">
      <h2 class="category-title">
        <span>Core Pages & Key Entry Tools</span>
        <span class="category-count">5 Pages</span>
      </h2>
      <div class="links-grid" style="grid-template-columns: 1fr 1fr;">
        <a href="/index.html" class="link-card">
          <h3>Peaceful Loans Home Page</h3>
          <p>Unbiased, elite home loan advisory and mortgage auditing for ₹2 Crore+ loan packages in India. Secure your ideal interest rates and terms.</p>
          <div class="link-meta"><span>Core Tool</span><span class="link-bullet"></span><span>Weekly</span></div>
        </a>
        <a href="/reviews.html" class="link-card">
          <h3>Customer Reviews & Appreciations</h3>
          <p>Unfiltered appreciations and case studies from software engineers, startup founders, and senior corporate leaders.</p>
          <div class="link-meta"><span>Trust Signals</span><span class="link-bullet"></span><span>Weekly</span></div>
        </a>
        <a href="/about.html" class="link-card">
          <h3>About Peaceful Loans</h3>
          <p>Founded by an IIM Calcutta alumnus to level the home loan information asymmetry. We work for you, not the bank.</p>
          <div class="link-meta"><span>About</span><span class="link-bullet"></span><span>Monthly</span></div>
        </a>
        <a href="/faqs.html" class="link-card">
          <h3>Frequently Asked Questions</h3>
          <p>Detailed breakdowns regarding processing fees, RBLR vs MCLR spreads, foreclosure terms, and forced insurance.</p>
          <div class="link-meta"><span>FAQs</span><span class="link-bullet"></span><span>Monthly</span></div>
        </a>
        <a href="/FY26-27IntRates/" class="link-card">
          <h3>Home Loan Interest Rates FY26-27</h3>
          <p>Up-to-the-minute analysis comparing all major public sector banks, private institutions, and housing finance companies.</p>
          <div class="link-meta"><span>Rates Directory</span><span class="link-bullet"></span><span>Weekly</span></div>
        </a>
      </div>
    </div>
"""

    # Categorized Articles Output
    category_list = [
        "Plot Loans & Land Financing",
        "Home Loan Strategy & Market Truths",
        "Eligibility, Approval & Document Strategy",
        "NRI & International Borrowers",
        "General Home Loan Strategy"
    ]

    for cat in category_list:
        art_list = categories[cat]
        if not art_list:
            continue
        
        html_out += f"""
    <!-- Category: {cat} -->
    <div class="category-section">
      <h2 class="category-title">
        <span>{cat}</span>
        <span class="category-count">{len(art_list)} Guides</span>
      </h2>
      <div class="links-grid">
    """
        
        for art in art_list:
            title_escaped = art['title'].replace('"', '&quot;')
            excerpt_escaped = art['excerpt'].replace('"', '&quot;')
            html_out += f"""        <a href="/from-founders-desk/{art['slug']}/" class="link-card">
          <h3>{art['title']}</h3>
          <p>{art['excerpt']}</p>
          <div class="link-meta"><span>Published: {art['date']}</span><span class="link-bullet"></span><span>1 Hop Crawl</span></div>
        </a>\n"""
            
        html_out += """      </div>
    </div>\n"""

    # Add bottom container close, E-E-A-T author signature, CTA injection and shared footer injection
    html_out += """
  </div>
`;

// Render using shared layout components to maintain consistent branding and script evaluation
document.getElementById('app').innerHTML = `
  ${navHTML('/index-booster/')}
  ${contentHTML}
  ${ctaSectionHTML()}
  ${footerHTML()}
`;

initNav();
</script>
</body>
</html>
"""

    # Let's replace the placeholder at the top of python string where we open with dynamic layout
    booster_html_full = html_out.replace('<!-- Category: Plot Loans & Land Financing -->', '')

    # Write file
    with open(os.path.join(booster_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(booster_html_full)

    print("Generated index-booster/index.html successfully!")

    # Auto-trigger Markdown twins generation for DualMark AEO coverage parity
    try:
        import subprocess
        script_dir = os.path.dirname(os.path.abspath(__file__))
        twins_script = os.path.join(script_dir, 'generate_markdown_twins.py')
        if os.path.exists(twins_script):
            print("Auto-triggering Markdown twins generation...")
            subprocess.run(["python3", twins_script], check=True)
    except Exception as e:
        print(f"Warning: Could not auto-trigger Markdown twins: {e}")

if __name__ == '__main__':
    run()
