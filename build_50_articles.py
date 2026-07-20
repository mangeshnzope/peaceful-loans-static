import os
import re
from datetime import datetime

MD_FILE = '/Users/mangeshpeaceful-loans/Downloads/Peaceful-Loans-Plot-Loans-Complete.md'
BLOG_DIR = '/Users/mangeshpeaceful-loans/Development/Website/from-founders-desk'
INDEX_FILE = os.path.join(BLOG_DIR, 'index.html')
TEMPLATE_FILE = os.path.join(BLOG_DIR, 'home-loan-overdraft-sbi-maxgain', 'index.html')

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

def parse_markdown():
    with open(MD_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by articles
    parts = content.split('\n---\n')
    articles = []

    for part in parts[1:]: # Skip TOC
        lines = part.split('\n')
        
        title = ""
        body_lines = []
        found_title = False
        author_passed = False
        
        for line in lines:
            if line.startswith('# Article ') and not found_title:
                title = re.sub(r'^# Article \d+:\s*', '', line).strip()
                found_title = True
            elif found_title and line.startswith('*From Founder'):
                continue
            elif found_title and line.startswith('*By Mangesh Zope'):
                author_passed = True
                continue
            elif author_passed:
                body_lines.append(line)

        # Cleanup body lines
        while body_lines and body_lines[0].strip() == '':
            body_lines.pop(0)
        
        # remove trailing hr and br
        while body_lines and (body_lines[-1].strip() in ['', '---', '<br><br>']):
            body_lines.pop()

        if not title:
            continue

        # Extract excerpt
        excerpt = ""
        for line in body_lines:
            if line.strip() and not line.startswith('#') and not line.startswith('|'):
                # remove markdown bold/italic
                clean_line = re.sub(r'[*_]{1,2}', '', line)
                clean_line = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean_line)
                excerpt = clean_line[:150] + "..." if len(clean_line) > 150 else clean_line
                break

        # Convert markdown body to HTML manually (simple parsing)
        html_body = []
        in_list = False
        in_table = False
        for line in body_lines:
            line = line.strip()
            if not line:
                if in_list:
                    html_body.append('</ul>')
                    in_list = False
                if in_table:
                    html_body.append('</tbody></table></div>')
                    in_table = False
                continue
                
            # Tables
            if line.startswith('|'):
                if not in_table:
                    html_body.append('<div class="table-container"><table><thead>')
                    in_table = True
                    # This is likely the header
                    cols = [c.strip() for c in line.split('|')[1:-1]]
                    html_body.append('<tr>' + ''.join(f'<th>{c}</th>' for c in cols) + '</tr>')
                    html_body.append('</thead><tbody>')
                else:
                    if line.startswith('|---'):
                        continue # separator
                    cols = [c.strip() for c in line.split('|')[1:-1]]
                    html_body.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cols) + '</tr>')
                continue

            if in_table and not line.startswith('|'):
                html_body.append('</tbody></table></div>')
                in_table = False

            # Headers
            if line.startswith('### '):
                if in_list: html_body.append('</ul>'); in_list = False
                html_body.append(f'<h3>{line[4:]}</h3>')
            elif line.startswith('## '):
                if in_list: html_body.append('</ul>'); in_list = False
                html_body.append(f'<h2>{line[3:]}</h2>')
            elif line.startswith('# '):
                if in_list: html_body.append('</ul>'); in_list = False
                html_body.append(f'<h2>{line[2:]}</h2>')
            elif line.startswith('- '):
                if not in_list:
                    html_body.append('<ul>')
                    in_list = True
                # Format bold inside list
                li_content = line[2:]
                li_content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', li_content)
                li_content = re.sub(r'\*(.+?)\*', r'<em>\1</em>', li_content)
                html_body.append(f'<li>{li_content}</li>')
            elif re.match(r'^\d+\.\s', line):
                # Ordered list format handling as paragraph for simplicity, or we can make it an OL
                if in_list: html_body.append('</ul>'); in_list = False
                line = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
                line = re.sub(r'\*(.+?)\*', r'<em>\1</em>', line)
                html_body.append(f'<p>{line}</p>')
            elif line.startswith('**') and line.endswith('**') and len(line) < 100:
                # bold headers
                if in_list: html_body.append('</ul>'); in_list = False
                html_body.append(f'<p><strong>{line[2:-2]}</strong></p>')
            else:
                if in_list: html_body.append('</ul>'); in_list = False
                # inline bold/italics
                line = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
                line = re.sub(r'\*(.+?)\*', r'<em>\1</em>', line)
                html_body.append(f'<p>{line}</p>')
                
        if in_list: html_body.append('</ul>')
        if in_table: html_body.append('</tbody></table></div>')

        articles.append({
            'title': title,
            'slug': slugify(title),
            'excerpt': excerpt,
            'html_content': '\n'.join(html_body),
            'date': '5 May 2026'
        })

    return articles

def create_article_pages(articles):
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template = f.read()

    for art in articles:
        slug = art['slug']
        title = art['title']
        excerpt = art['excerpt']
        html_content = art['html_content']
        date = art['date']
        
        # Read template and replace
        # Replace Title
        page = re.sub(r'<title>.*?</title>', f'<title>{title} · From Founder\'s Desk — Peaceful Loans</title>', template, flags=re.DOTALL)
        
        # Replace meta description
        page = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{excerpt}">', page)
        
        # Replace og:title
        page = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{title}">', page)
        page = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{excerpt}">', page)
        page = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="https://peaceful-loans.com/from-founders-desk/{slug}/">', page)
        
        # Twitter cards
        page = re.sub(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{title}">', page)
        page = re.sub(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{excerpt}">', page)
        page = re.sub(r'<meta name="twitter:image" content="[^"]*">', f'<meta name="twitter:image" content="https://peaceful-loans.com/assets/blogs/{slug}.png">', page)

        # Canonical Link
        page = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://peaceful-loans.com/from-founders-desk/{slug}/">', page)

        # JSON-LD
        json_ld = f'''{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "BlogPosting",
      "headline": "{title}",
      "description": "{excerpt}",
      "author": {{
        "@type": "Person",
        "name": "Mangesh Zope",
        "url": "https://peaceful-loans.com/about.html"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "Peaceful Loans",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://peaceful-loans.com/assets/logo-horizontal.png"
        }}
      }},
      "datePublished": "2026-05-05",
      "dateModified": "2026-05-05",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://peaceful-loans.com/from-founders-desk/{slug}/"
      }},
      "image": "https://peaceful-loans.com/assets/blogs/{slug}.png"
    }},
    {{
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://peaceful-loans.com/"
        }},
        {{
          "@type": "ListItem",
          "position": 2,
          "name": "From Founder's Desk",
          "item": "https://peaceful-loans.com/from-founders-desk/"
        }},
        {{
          "@type": "ListItem",
          "position": 3,
          "name": "{title}",
          "item": "https://peaceful-loans.com/from-founders-desk/{slug}/"
        }}
      ]
    }}
  ]
}}'''
        page = re.sub(r'<script type="application/ld\+json">.*?</script>', f'<script type="application/ld+json">\n{json_ld}\n</script>', page, flags=re.DOTALL)

        # Replace H1
        page = re.sub(r'<h1>.*?</h1>', f'<h1>{title}</h1>', page, flags=re.DOTALL)
        
        # Replace date in brand-meta
        page = re.sub(r'<span class="date">[^<]*</span>', f'<span class="date">{date}</span>', page)

        # Replace content
        page = re.sub(r'<article class="content">.*?</article>', f'<article class="content">\n{html_content}\n  </article>', page, flags=re.DOTALL)

        # Save to file
        art_dir = os.path.join(BLOG_DIR, slug)
        os.makedirs(art_dir, exist_ok=True)
        with open(os.path.join(art_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(page)
        
        print(f"Generated: {slug}")

def update_index_page(articles):
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index_content = f.read()

    # Find the post grid
    match = re.search(r'<div class="post-grid">(.*?)</div>\s*<footer>', index_content, flags=re.DOTALL)
    if not match:
        print("Could not find post-grid in index.html")
        return
        
    grid_content = match.group(1)
    
    # Check if we already added it to avoid duplicates
    if slugify(articles[0]['title']) in grid_content:
        print("Articles already present in index.")
        return

    new_items = []
    for art in articles:
        slug = art['slug']
        title = art['title']
        excerpt = art['excerpt']
        date = art['date']
        
        item = f'''
    <!-- Post -->
    <a href="{slug}/" class="post-item">
      <div class="post-img-wrap">
        <img src="../assets/blogs/{slug}.png" alt="{title}">
      </div>
      <h2 class="post-title">{title}</h2>
      <p class="post-excerpt">{excerpt}</p>
      <div class="post-meta-row">
        <span>By Mangesh Zope</span>
        <span class="post-author">· {date}</span>
      </div>
    </a>'''
        new_items.append(item)

    # Insert new items at the top of the grid
    updated_grid = '\n'.join(new_items) + '\n' + grid_content
    updated_index = index_content[:match.start(1)] + updated_grid + index_content[match.end(1):]

    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        f.write(updated_index)
    print("Updated index.html")

def update_sitemap():
    sitemap_file = os.path.join(os.path.dirname(BLOG_DIR), 'sitemap.xml')
    today = datetime.now().strftime('%Y-%m-%d')
    
    with open(sitemap_file, 'r', encoding='utf-8') as f:
        sitemap_content = f.read()

    # Parse URLs from sitemap to avoid duplicates
    # Since we want to just regenerate it based on directories, let's look at what's in BLOG_DIR
    urls = [
        {'loc': 'https://peaceful-loans.com/', 'priority': '1.0', 'changefreq': 'weekly'},
        {'loc': 'https://peaceful-loans.com/reviews.html', 'priority': '0.9', 'changefreq': 'weekly'},
        {'loc': 'https://peaceful-loans.com/media-coverage.html', 'priority': '0.9', 'changefreq': 'weekly'},
        {'loc': 'https://peaceful-loans.com/about.html', 'priority': '0.8', 'changefreq': 'monthly'},
        {'loc': 'https://peaceful-loans.com/faqs.html', 'priority': '0.8', 'changefreq': 'monthly'},
        {'loc': 'https://peaceful-loans.com/FY26-27IntRates/', 'priority': '0.9', 'changefreq': 'weekly'},
        {'loc': 'https://peaceful-loans.com/from-founders-desk/', 'priority': '0.9', 'changefreq': 'weekly'},
    ]
    
    # Add all blog posts
    blog_slugs = [d for d in os.listdir(BLOG_DIR) if os.path.isdir(os.path.join(BLOG_DIR, d))]
    for slug in sorted(blog_slugs):
        urls.append({
            'loc': f'https://peaceful-loans.com/from-founders-desk/{slug}/',
            'priority': '0.8',
            'changefreq': 'monthly'
        })
        
    sitemap_out = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_out += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls:
        sitemap_out += '  <url>\n'
        sitemap_out += f'    <loc>{url["loc"]}</loc>\n'
        sitemap_out += f'    <lastmod>{today}</lastmod>\n'
        sitemap_out += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        sitemap_out += f'    <priority>{url["priority"]}</priority>\n'
        sitemap_out += '  </url>\n'
        
    sitemap_out += '</urlset>\n'
    
    with open(sitemap_file, 'w', encoding='utf-8') as f:
        f.write(sitemap_out)
    print(f"Sitemap updated with {len(urls)} URLs.")

if __name__ == '__main__':
    articles = parse_markdown()
    print(f"Parsed {len(articles)} articles.")
    create_article_pages(articles)
    update_index_page(articles)
    update_sitemap()
    
    # Auto-trigger Sitemap Booster regeneration for 100% SEO coverage parity
    try:
        import subprocess
        script_dir = os.path.dirname(os.path.abspath(__file__))
        booster_script = os.path.join(script_dir, 'generate_booster.py')
        if os.path.exists(booster_script):
            print("Auto-triggering Sitemap Booster regeneration...")
            subprocess.run(["python3", booster_script], check=True)
    except Exception as e:
        print(f"Warning: Could not auto-trigger Sitemap Booster: {e}")

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
