#!/usr/bin/env python3
"""Build the claude.ai artifact version of the dashboard from the website page.

  python3 -I build_artifact.py

Reads linkedin-analytics.html + the data JSON and writes
linkedin-refresh/out/linkedin-tg-reach.html: a page *fragment* (no doctype/html/head/body,
the Artifact tool adds the skeleton) with the data embedded and the website's login/API
replaced by a local stub, so the page works standalone as an artifact.
Standard library only.
"""
import json, re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PAGE = REPO / "linkedin-analytics.html"
DATA = REPO / "creator-chart/data/creator_chart_dashboard_data.json"
OUT = REPO / "linkedin-refresh/out/linkedin-tg-reach.html"

page = PAGE.read_text()
data = json.loads(DATA.read_text())
data["overrides"], data["image_overrides"] = {}, {}  # edits are made in the repo data, not in the artifact

head = page[page.index("<head>") + 6: page.index("</head>")]
body = page[page.index("<body>") + 6: page.rindex("</body>")]

title = re.search(r"<title>(.*?)</title>", head, re.S).group(1).strip()
extras = "\n".join(re.findall(r"<link[^>]*>|<style[^>]*>.*?</style>", head, re.S))

blob = json.dumps(data, ensure_ascii=True, separators=(",", ":")).replace("</", "<\\/")
prelude = (
    "<script>(function(){var D=" + blob + ";"
    "var j=function(b){return new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}})};"
    "var of=window.fetch;window.fetch=function(u,o){u=String(u);"
    "if(u.indexOf('/api/linkedin-analytics/auth')>-1)return Promise.resolve(j({user:{role:'team',name:'Viewer'}}));"
    "if(u.indexOf('/api/linkedin-analytics/data')>-1)return Promise.resolve(j(D));"
    "if(u.indexOf('/api/')>-1)return Promise.resolve(j({}));return of.apply(this,arguments)};})();</script>"
)
hide = "<style>#elevateAdminBtn,#logoutBtn{display:none!important}</style>"

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(f"<title>{title}</title>\n{extras}\n{hide}\n{prelude}\n{body}\n")
print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes), data_to {data['meta']['data_to']}, built {data['meta']['built']}")
