#!/usr/bin/env python3
"""List the next posts that still need a per-post LinkedIn export (newest first).

  python3 -I next_posts.py [N]     # default 5

Prints: post_id, publish date, and the analytics URL to open.
A post is 'done' once it has both impressions_total and custom_button_clicks.
"""
import json, sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "creator-chart/data/creator_chart_dashboard_data.json"
ALL = "--all" in sys.argv
n = 10**6 if ALL else (int(sys.argv[1]) if len(sys.argv) > 1 else 5)
posts = json.loads(DATA.read_text())["posts"]
todo = sorted((p for p in posts if ALL or p.get("impressions_total") is None or p.get("custom_button_clicks") is None),
              key=lambda p: p["published"], reverse=True)
print(f"{len(todo)} posts " + ("to re-export (ALL posts)" if ALL else "still need a per-post export") + f"; listing {min(n, len(todo))}:")
for p in todo[:n]:
    urn = "ugcPost" if "ugcPost" in p["url"] else "share"
    print(p["post_id"], p["published"],
          f"https://www.linkedin.com/analytics/post-summary/urn:li:{urn}:{p['post_id']}/")
