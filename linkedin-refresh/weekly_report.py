#!/usr/bin/env python3
"""Build the weekly email report from the dashboard data (standard library only).

  python3 -I weekly_report.py            # prints subject, then plain-text body
  python3 -I weekly_report.py --html     # prints subject, then HTML body

Shows TG numbers first; total impressions only where the data has them.
Never includes passwords. Links to the dashboard page.
"""
import json, sys
from datetime import date, timedelta
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "creator-chart/data/creator_chart_dashboard_data.json"
URL = "https://peaceful-loans.com/linkedin-analytics"
d = json.loads(DATA.read_text())
D = lambda s: date.fromisoformat(s)
fd = lambda s: D(s).strftime("%-d %b")
n = lambda x: "–" if x is None else f"{round(x):,}"
pc = lambda x: "–" if x is None else f"{x:.1f}%"


def chg(a, b):
    return "" if not a or not b else f" ({(a - b) / b * 100:+.0f}% vs prior week)"


weeks = [w for w in d["weekly"] if (D(w["week_end"]) - D(w["week_start"])).days == 6 and w["tg_impressions"] is not None]
w, prev = weeks[-1], (weeks[-2] if len(weeks) > 1 else None)
era = [x for x in weeks if x["week_start"] >= "2026-08-17"]
posts = [p for p in d["posts"] if w["week_start"] <= p["published"] <= w["week_end"]]
top = sorted((p for p in posts if p["tg_impressions_lifetime"] is not None),
             key=lambda p: -p["tg_impressions_lifetime"])[:3]
btn = [p for p in posts if p.get("custom_button_clicks") is not None]
m = d["monthly"][-1]
gaps = sum(1 for p in d["posts"] if p.get("impressions_total") is None)

L = []
L.append(f"Week {fd(w['week_start'])} – {fd(w['week_end'])} {D(w['week_end']).year}")
L.append(f"TG impressions: {n(w['tg_impressions'])}{chg(w['tg_impressions'], prev and prev['tg_impressions'])}")
L.append(f"TG share of views: {pc(w['tg_share_pct'])}" +
         (f" (prior week {pc(prev['tg_share_pct'])})" if prev else ""))
if w.get("impressions_total") is not None:
    L.append(f"Total impressions: {n(w['impressions_total'])}")
L.append(f"Engagements: {n(w['engagements'])} · New followers: {n(w['new_followers'])} · Posts published: {w['posts_published']}")
if w.get("tg_people_reached_est"):
    L.append(f"Estimated TG people reached: {n(w['tg_people_reached_est'])} (TG frequency {w['tg_frequency_est']}x, goal 6x)")
if era:
    L.append(f"Creator Chart era average: {n(sum(x['tg_impressions'] for x in era) / len(era))} TG impressions a week over {len(era)} weeks")
L.append("")
L.append(f"Month to date ({fd(m['month_start'])} – {fd(m['month_end'])}): {n(m['tg_impressions'])} TG impressions at {pc(m['tg_share_pct'])}")
L.append("")
if top:
    L.append("Top posts this week by TG impressions (lifetime so far):")
    for p in top:
        L.append(f"  - {fd(p['published'])} {p['title'][:70]} · {n(p['tg_impressions_lifetime'])} TG ({pc(p['tg_share_pct'])})")
    L.append("")
allb = [p for p in d["posts"] if p.get("custom_button_clicks") is not None and p.get("impressions_total")]
tot_clicks = sum(p["custom_button_clicks"] for p in allb)
L.append("PREMIUM BUTTON ('Visit my website', opens peaceful-loans.com): clicks per post, lifetime so far")
if btn:
    L.append(f"  Posts published this week: {sum(p['custom_button_clicks'] for p in btn)} clicks "
             f"({len(btn)} of {len(posts)} posts have button data).")
else:
    L.append("  Posts published this week: no button data yet.")
L.append(f"  All posts with button data: {tot_clicks} clicks across {len(allb)} of {len(d['posts'])} posts "
         f"(the button exists from 28 Oct 2026; older posts are being filled in).")
L.append("")


def rate(ps):
    imp = sum(p["impressions_total"] for p in ps)
    return sum(p["custom_button_clicks"] for p in ps) / imp * 1000 if imp else 0


def groups(key):
    g = {}
    for p in allb:
        g.setdefault(p.get(key) or "Unknown", []).append(p)
    return g


L.append("WHAT WORKED AND WHAT DID NOT (getting people to click the button)")
if len(allb) < 8:
    L.append(f"  Early read only: {len(allb)} posts have button data, too few for conclusions. Treat as a hint, not a result.")
ranked = sorted(allb, key=lambda p: -p["custom_button_clicks"] / p["impressions_total"])
worked = [p for p in ranked if p["custom_button_clicks"] > 0][:3]
if worked:
    L.append("  Worked (most clicks per 1,000 total impressions):")
    for p in worked:
        L.append(f"    - {fd(p['published'])} [{p['type']}] {p['title'][:55]}: {p['custom_button_clicks']} click{'s' if p['custom_button_clicks'] != 1 else ''} on "
                 f"{n(p['impressions_total'])} impressions ({rate([p]):.1f} per 1,000)")
failed = sorted((p for p in allb if p["custom_button_clicks"] == 0), key=lambda p: -p["impressions_total"])[:3]
if failed:
    L.append("  Did not work (no clicks despite reach):")
    for p in failed:
        L.append(f"    - {fd(p['published'])} [{p['type']}] {p['title'][:55]}: 0 clicks on {n(p['impressions_total'])} impressions")
for key, label in (("type", "post type"), ("image_type", "image")):
    gs = {k: v for k, v in groups(key).items() if len(v) >= 2}
    if len(gs) >= 2:
        order = sorted(gs.items(), key=lambda kv: -rate(kv[1]))
        L.append(f"  By {label} (groups with 2+ posts): " + "; ".join(
            f"{k} {rate(v):.1f} per 1,000 ({len(v)} posts)" for k, v in order))
L.append("")
L.append(f"Dashboard: {URL}")
if gaps:
    L.append(f"Note: {gaps} older posts are still waiting for their total-impressions / button data (slow backfill in progress).")

subject = f"LinkedIn TG reach: week of {fd(w['week_start'])} – {fd(w['week_end'])}"
print("SUBJECT:", subject)
print()
if "--html" in sys.argv:
    import html
    cta = (f"<p style='margin:18px 0 6px'><a href='{URL}#works' style='display:inline-block;background:#1F6F66;color:#ffffff;"
           "text-decoration:none;font-weight:600;padding:10px 18px;border-radius:6px'>Open the full report: What works tab</a></p>"
           "<p style='margin:0 0 6px;font-size:12px;color:#5C6A65'>The page is password protected; ask Mangesh if you need access.</p>")
    print("<div style='font:14px/1.5 -apple-system,Arial,sans-serif;color:#15201C'>" +
          "".join(f"<p style='margin:0 0 6px'>{html.escape(x)}</p>" if x else "<br>" for x in L) + cta + "</div>")
else:
    print("\n".join(L))
