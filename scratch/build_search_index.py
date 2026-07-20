import os
import re
import json

HTML_FILE = '/Users/mangeshpeaceful-loans/Development/Website/from-founders-desk/index.html'
INDEX_JSON = '/Users/mangeshpeaceful-loans/Development/Website/from-founders-desk/search-index.json'

def get_category_and_tags(slug, title):
    slug_lower = slug.lower()
    title_lower = title.lower()
    
    # NRI Home Loans
    if any(k in slug_lower or k in title_lower for k in ['nri', 'abroad', 'foreign', 'citizen', 'non-resident', 'h-1b', 'f-1', 'opt', 'visa']):
        return 'NRI Home Loans', ['NRI', 'Home Loan', 'Global']
        
    # Plot Loans
    elif any(k in slug_lower or k in title_lower for k in ['plot', 'land', 'agricultural', 'commercial', 'hometown', 'construction-loan']):
        return 'Plot Loans', ['Plot', 'Land', 'Real Estate']
        
    # Tax & Strategy
    elif any(k in slug_lower or k in title_lower for k in ['tax', 'benefit', 'ltcg', '54f', 'interest-rate', 'rate', 'emi', 'savings', 'calculate', 'afford', 'cost', 'fee', 'charge', 'budget', 'overdraft', 'maxgain', 'repay', 'foreclose', 'prepay', 'top-up']):
        return 'Tax & Strategy', ['Tax', 'Strategy', 'Finance']
        
    # General Home Loan Guides
    else:
        return 'Home Loan Guides', ['Home Loan', 'Guide', 'General']

def main():
    if not os.path.exists(HTML_FILE):
        print(f"Error: {HTML_FILE} does not exist.")
        return

    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the post-grid content
    grid_match = re.search(r'<div class="post-grid">(.*?)</div>\s*<footer>', html, flags=re.DOTALL)
    if not grid_match:
        print("Error: Could not find post-grid in index.html.")
        return
    
    grid_html = grid_match.group(1)
    
    matches = []
    # Find all individual <a> blocks of class post-item
    post_blocks = re.findall(r'<a\s+href="([^"/]+)/?"\s+class="post-item">(.*?)</a>', grid_html, flags=re.DOTALL)
    print(f"Permissive block splitter found {len(post_blocks)} raw post blocks.")
    
    for slug, block_content in post_blocks:
        # Extract title
        title_m = re.search(r'<h[23]\s+class="post-title">([^<]+)</h[23]>', block_content, flags=re.DOTALL)
        title = title_m.group(1).strip() if title_m else ""
        
        # Extract excerpt
        excerpt_m = re.search(r'<p\s+class="post-excerpt">([^<]+)</p>', block_content, flags=re.DOTALL)
        excerpt = excerpt_m.group(1).strip() if excerpt_m else ""
        
        # Extract image
        img_m = re.search(r'<img\s+src="([^"]+)"', block_content, flags=re.DOTALL)
        img = img_m.group(1).strip() if img_m else ""
        
        # Extract date
        date_m = re.search(r'<span\s+class="post-author">\s*·\s*([^<]+)</span>', block_content, flags=re.DOTALL)
        if not date_m:
            date_m = re.search(r'<span\s+class="date">([^<]+)</span>', block_content, flags=re.DOTALL)
        date = date_m.group(1).strip() if date_m else ""
        
        if title and excerpt:
            matches.append((slug, img, title, title, excerpt, date))

    articles = []
    for slug, img, alt_title, title, excerpt, date in matches:
        # Clean title and excerpt
        title = title.strip().replace('\n', ' ').replace('  ', ' ')
        excerpt = excerpt.strip().replace('\n', ' ').replace('  ', ' ')
        date = date.strip()
        slug = slug.strip()
        
        category, tags = get_category_and_tags(slug, title)
        
        articles.append({
            'slug': slug,
            'title': title,
            'excerpt': excerpt,
            'date': date,
            'image': img,
            'category': category,
            'tags': tags
        })
        
    print(f"Processed {len(articles)} articles.")
    
    with open(INDEX_JSON, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated {INDEX_JSON} with {len(articles)} items.")

if __name__ == '__main__':
    main()
