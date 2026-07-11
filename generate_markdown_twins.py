import os
import re
from html.parser import HTMLParser

class MarkdownHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.markdown = []
        self.ignore_stack = []
        self.list_depth = 0
        self.in_table = False
        self.table_row = []
        self.table_rows = []
        self.table_header = False
        self.in_cell = False
        self.cell_text = []
        self.current_link = None
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '')
        id_attr = attrs_dict.get('id', '')
        
        # Determine if this tag or any parent should be ignored (navigation, head, script, etc.)
        parent_ignored = self.ignore_stack[-1] if self.ignore_stack else False
        is_ignored = (
            parent_ignored or 
            tag in ['head', 'script', 'style', 'header', 'footer', 'nav'] or
            'nav' in cls or 'footer' in cls or 'header' in cls or
            id_attr in ['navbar', 'mobileMenu', 'footer']
        )
        self.ignore_stack.append(is_ignored)
        
        if is_ignored:
            return
            
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            level = int(tag[1])
            self.markdown.append('\n\n' + '#' * level + ' ')
        elif tag == 'p':
            self.markdown.append('\n\n')
        elif tag == 'br':
            self.markdown.append('\n')
        elif tag == 'blockquote':
            self.markdown.append('\n\n> ')
        elif tag == 'ul':
            self.list_depth += 1
            self.markdown.append('\n')
        elif tag == 'ol':
            self.list_depth += 1
            self.markdown.append('\n')
        elif tag == 'li':
            indent = '  ' * (self.list_depth - 1)
            self.markdown.append(f'\n{indent}- ')
        elif tag in ['strong', 'b']:
            self.markdown.append('**')
        elif tag in ['em', 'i']:
            self.markdown.append('*')
        elif tag == 'a':
            self.current_link = attrs_dict.get('href', '')
            self.markdown.append('[')
        elif tag == 'img':
            alt = attrs_dict.get('alt', '')
            src = attrs_dict.get('src', '')
            self.markdown.append(f'![{alt}]({src})')
        elif tag == 'table':
            self.in_table = True
            self.table_rows = []
            self.markdown.append('\n\n')
        elif tag == 'tr':
            self.table_row = []
            self.table_header = False
        elif tag in ['th', 'td']:
            self.in_cell = True
            self.cell_text = []
            if tag == 'th':
                self.table_header = True
                
    def handle_endtag(self, tag):
        if not self.ignore_stack:
            return
        is_ignored = self.ignore_stack.pop()
        
        if is_ignored:
            return
            
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.markdown.append('\n\n')
        elif tag == 'p':
            self.markdown.append('\n\n')
        elif tag == 'blockquote':
            self.markdown.append('\n\n')
        elif tag in ['ul', 'ol']:
            self.list_depth = max(0, self.list_depth - 1)
            self.markdown.append('\n')
        elif tag in ['strong', 'b']:
            self.markdown.append('**')
        elif tag in ['em', 'i']:
            self.markdown.append('*')
        elif tag == 'a':
            self.markdown.append(f']({self.current_link})')
            self.current_link = None
        elif tag in ['th', 'td']:
            self.in_cell = False
            cell_content = "".join(self.cell_text).strip().replace('\n', ' ')
            self.table_row.append(cell_content)
        elif tag == 'tr':
            if self.in_table:
                self.table_rows.append((self.table_header, self.table_row))
        elif tag == 'table':
            self.in_table = False
            # Render Markdown table
            if self.table_rows:
                # Find the maximum number of columns
                max_cols = max(len(row[1]) for row in self.table_rows)
                
                # Format each row
                for is_header, row_cells in self.table_rows:
                    # Pad cells if necessary
                    row_cells = row_cells + [''] * (max_cols - len(row_cells))
                    row_line = '| ' + ' | '.join(row_cells) + ' |'
                    self.markdown.append(row_line + '\n')
                    if is_header:
                        separator = '| ' + ' | '.join(['---'] * max_cols) + ' |'
                        self.markdown.append(separator + '\n')
                self.markdown.append('\n')
            self.table_rows = []
            
    def handle_data(self, data):
        if self.ignore_stack and self.ignore_stack[-1]:
            return
        if self.in_cell:
            self.cell_text.append(data)
        else:
            self.markdown.append(data)

def html_to_markdown(html_content):
    parser = MarkdownHTMLParser()
    parser.feed(html_content)
    raw_md = "".join(parser.markdown)
    
    # Post-process to clean up excess whitespace
    # Replace three or more newlines with double newlines
    cleaned_md = re.sub(r'\n{3,}', '\n\n', raw_md)
    # Strip leading/trailing whitespaces
    cleaned_md = cleaned_md.strip()
    return cleaned_md

# ----------------- Pre-authored twins for main landing pages -----------------

INDEX_MD = """# Peaceful Loans — Unbiased Home Loan Advisor in India

Unbiased home loan advisory for borrowers seeking ₹2 Crore+ home loans in India. We help you secure the lowest interest rates and best terms. We work for you, not the bank.

## Why Peaceful Loans?
- **Unbiased Advice**: We are a boutique advisory, representing you, the borrower, rather than the banks or builders.
- **Save Money**: We search and compare all major public and private banks to ensure every paisa is saved.
- **Spot Mis-selling**: We read the fine print to uncover hidden fees and rules banks hide.
- **Maximum Sanction Limit**: We help you secure the highest LTV (Loan-To-Value) and optimal terms.

## What We Verify
1. **Hidden Charges**: Processing fees, legal/technical costs, doc handling fees, stamp duties.
2. **Spread Adjustments**: Disclosed vs hidden spread variations over the loan tenure.
3. **Prepayment Friction**: Branch visits, foreclosure penalties, online prepayment facilities.
4. **Forced Insurance**: Illegal cross-selling of loan insurance products.
5. **After-Sale Service**: Ease of statement retrieval, online rate change requests, NOC issuance.

## Lenders We Compare
We cover Canara, Bank of Baroda, SBI, ICICI, HDFC, Bank of India, and other major lenders.

[Book a Free Call](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M) | [WhatsApp Us](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
"""

ABOUT_MD = """# About Peaceful-Loans

A boutique advisory that works exclusively for you — not the bank, not the builder.

> "I started Peaceful-Loans after a decade in high-finance because I saw my own friends getting fleeced by 'relationship managers' they trusted."
> — Mangesh Zope, Founder (IIM Calcutta 2012)

We are not a tech platform that aggregates loans. We are a boutique advisory that represents you. We are the modern advocates of your debt — ensuring every paisa is accounted for and every risk is mitigated.

The financial industry is built on asymmetric information. Banks know the fine print; you don't. Builders know the delay clauses; you don't. Our job is to level the playing field — permanently, at every step of your loan journey.

Unlike traditional brokers, we do not let commissions earned by banks cloud our judgement. At our scale, all major banks give us the same commission — so there is zero financial incentive for us to push you towards any specific lender.

## Key Facts:
- **₹2Cr+** Average loan size we advise on.
- **123+** 5-star Google reviews.
- **2012** Founded by an IIM Calcutta alumnus.

[Book a Free Call](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M) | [WhatsApp Us](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
"""

FAQS_MD = """# Frequently Asked Questions

Answers to all your questions about home loans, DSAs, hidden interest rate clauses, and why you need an unbiased advisor like Peaceful Loans.

### How is Peaceful-Loans different from a loan agent or DSA?
A loan agent (DSA) works for the bank — their job is to get you to sign, and they earn a commission when you do. We work for you. We have studied every bank’s sanction letter, identify hidden clauses, and make you aware. Our advice is not influenced by which bank pays us the highest commission. It is influenced by ensuring you save the maximum money.

### Is this service really free? How do you make money?
The advisory is free for you. Like most mortgage advisors, we receive a standard referral fee from the bank you ultimately choose. The key difference: at our scale, all major banks pay us the same rate — so there is zero financial incentive for us to recommend one bank over another. Your best outcome is also our best outcome.

### Do you work with all banks?
We work with all major public and private sector banks including SBI, BOB, UBI, Bank of Maharashtra, Canara Bank, Bank of India, HDFC, ICICI, Axis, Kotak, and others. We select banks based on your specific profile, goals, and the terms they can offer — not because of partnership agreements.

### What if my loan amount is under ₹2 Crore?
Our advisory is designed for buyers seeking ₹2 Crore and above. The complexity and stakes at this loan size justify our detailed approach. If your loan is smaller, you may still be able to help — reach out and we’ll be honest about whether we’re the right fit.

### How long does the process take?
After our initial 12-question discovery call, we typically identify and process the best bank match within 2-4 weeks for a standard home purchase. Complex cases (NRI, LAP, balance transfer) may take longer. We keep you updated at every step so there are no surprises.

### What is a ‘spread’ and why does it matter?
Your home loan rate = Benchmark Rate (like RLLR or MCLR) + Spread. While banks talk about benchmark changes, they rarely tell you they can also change the spread at their discretion. A silent spread increase of 0.5% on a ₹2 Crore loan over 20 years can cost you ₹12-15 Lakhs extra. We flag this risk in the advisory stages itself.

### What should I look for in a sanction letter?
Key things to check:
1. The actual interest rate and spread components.
2. Prepayment penalty clauses.
3. Reset period and conditions.
4. Force majeure clauses that allow rate changes.
5. Insurance mandates — many are illegal cross-sells.
6. Disbursement conditions tied to construction stages.
We have studied these for many customers, and communicate the risks to you without holding back.

### Can you help with a balance transfer on an existing loan?
Yes. Balance transfer advisory is one of our key services. We calculate the true cost of switching — including processing fees, legal charges, and break-even timelines — so you know whether a transfer actually saves you money or just looks like it does on paper.

[Book a Free Call](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M) | [WhatsApp Us](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
"""

REVIEWS_MD = """# Customer Reviews — Peaceful Loans

What our clients say about Peaceful Loans home loan advisory.

### Siddhant Lath
> "Buying a home is a dream goal for people. A decision that lasts a lifetime. With it people often take bank loans. The bank loan process is difficult, tedious, and very long. Peaceful loans takes away your issues and burdens by taking them on themselves, and providing clarity and guidance at every step. Very happy with the service"
> — Google Review

### Rohit Gupta
> "Highly recommend! Mr. Mangesh knowledge, experience, and understanding about home loan is outstanding. He guided me with patience and clarity. Truly grateful for the support."
> — Google Review

### surender kumar
> "I would like to recommend peaceful loans specifically Mangesh to everyone who are in need of home loan or have any kind of queries regarding home loan. I was contacted by Mangesh who helped me clear all my doubts regarding overdraft home loan as I wanted to transfer my current home loan to some other bank. He also aligned me with few bank senior employees to know their interest rates and process. I can say he gave genuine advice and at the same time never forced me to proceed via his company. Definitely would recommend him to all home loan seekers and my best wishes to him and his team to grow further."
> — Google Review

### Prahadeesh Giridharan
> "I got my homeloan through Peaceful Loans and was explained about multiple terms and conditions well by that team and evaluated different loan options. They also suggested which options were better. One hiccup I had with them was the loan banking partner they suggested (Bank of India) were not in approved list for the builder's project and that delayed my loan disbursement. But peaceful loans team helped me through the whole journey and I still have a live whatsapp channel with them for queries. Really liked they put customer experience first."
> — Google Review

### Rony Roy
> "Information asymmetry is real when you are dealing with loans, particularly home loans. Banks withhold information, builders withhold information, and to make matters worse, the above 2 collude to make the customer's outcome even worse. Peaceful loans has guided me towards the right bank, and the right product, one single 30 minute consultation is all it took, to reveal several points that put me in a much stronger position vis-a-vis both the banker and the builder."
> — Google Review

### Nirmal Dalmia
> "I had the pleasure of interacting with Mangesh while trying to switch my home loan. The best thing about Peaceful loans is that they tell you the dirty details hidden in home loan terms that no other agent will tell you. For eg, Canara Bank has a clause that the interest rate will be reviewed every 3 years. I was talking to Canara even before I spoke to Mangesh but nobody mentioned this to me. Mangesh takes the time to understand your requirements in-depth before suggesting any bank. They care about their customers and be upfront about pros and cons of each bank. 10/10 would definitely recommend these guys."
> — Google Review

[Book a Free Call](https://forms.zohopublic.in/mangeshpeacef1/form/Contactforsupport/formperma/_ps6Hq-7OvODRTnKowl1_FxyIIKmnPIywn1z6WV7i4M) | [WhatsApp Us](https://forms.zohopublic.in/mangeshpeacef1/form/WhatsAppButtonForm/formperma/F2z-Z2bBLbkttGWHBPPvrqSwlSXzd_WnD4sUAWNnjh4)
"""

BREAKFAST_DECIDER_MD = """# Breakfast Decider Tool

This is an interactive breakfast decision-making tool. Please visit the live website at https://peaceful-loans.com/breakfast-decider/ to use the tool.
"""

def generate_static_twins(base_dir):
    static_twins = {
        'index.md': INDEX_MD,
        'about.md': ABOUT_MD,
        'faqs.md': FAQS_MD,
        'reviews.md': REVIEWS_MD,
        'breakfast-decider.md': BREAKFAST_DECIDER_MD
    }
    
    for filename, content in static_twins.items():
        dest = os.path.join(base_dir, filename)
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Written static twin: {filename}")

def parse_and_convert_file(src_path, dest_path):
    with open(src_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Strip unnecessary parts to make parser's job clean
    # Remove head, scripts, style blocks before feeding to HTMLParser
    html_content = re.sub(r'<head>.*?</head>', '', html_content, flags=re.DOTALL)
    html_content = re.sub(r'<script.*?>.*?</script>', '', html_content, flags=re.DOTALL)
    html_content = re.sub(r'<style.*?>.*?</style>', '', html_content, flags=re.DOTALL)
    
    md_content = html_to_markdown(html_content)
    
    # Write to destination
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Generated twin: {os.path.basename(dest_path)} from {os.path.relpath(src_path)}")

def generate_blog_twins(base_dir):
    blog_dir = os.path.join(base_dir, 'from-founders-desk')
    if not os.path.exists(blog_dir):
        print("Blog directory from-founders-desk not found.")
        return
        
    # Walk through all subdirectories in the blog folder
    for root, dirs, files in os.walk(blog_dir):
        for d in dirs:
            dir_path = os.path.join(root, d)
            html_file = os.path.join(dir_path, 'index.html')
            if os.path.exists(html_file):
                # The twin goes to blog_dir/<slug>.md
                dest_file = os.path.join(blog_dir, f"{d}.md")
                parse_and_convert_file(html_file, dest_file)

def main():
    base_dir = '/Users/mangeshpeaceful-loans/Development/Website'
    
    # 1. Generate static twins
    generate_static_twins(base_dir)
    
    # 2. Convert specific static html files
    conversions = [
        ('mr-husband-mrs-wife.html', 'mr-husband-mrs-wife.md'),
        ('FY26-27IntRates/index.html', 'FY26-27IntRates.md'),
        ('from-founders-desk/index.html', 'from-founders-desk.md'),
        ('index-booster/index.html', 'index-booster.md'),
        ('q1-fy26-27-results.html', 'q1-fy26-27-results.md')
    ]
    
    for src, dest in conversions:
        src_path = os.path.join(base_dir, src)
        dest_path = os.path.join(base_dir, dest)
        if os.path.exists(src_path):
            parse_and_convert_file(src_path, dest_path)
            
    # 3. Convert all individual blog posts
    generate_blog_twins(base_dir)

if __name__ == '__main__':
    main()
