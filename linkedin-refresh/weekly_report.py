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
    esc = html.escape
    TEAL, INK, MUTED, RULE, BG = "#1F6F66", "#15201C", "#5C6A65", "#DCE2DF", "#F4F6F5"
    GOOD, BAD, AMBER = "#2E7D4F", "#B3412F", "#B96A10"
    FONT = "-apple-system,Segoe UI,Helvetica,Arial,sans-serif"

    def chip(delta, label):
        """Coloured up/down arrow chip. delta None -> neutral dash."""
        if delta is None:
            return f"<span style='color:{MUTED};font-size:12px'>no prior week</span>"
        up = delta >= 0
        c, bg, arr = (GOOD, "#E3F2E9", "&#9650;") if up else (BAD, "#F8E4DF", "&#9660;")
        return (f"<span style='display:inline-block;background:{bg};color:{c};font-weight:700;font-size:12px;"
                f"padding:2px 8px;border-radius:10px'>{arr} {label}</span>")

    pct_chg = (w["tg_impressions"] - prev["tg_impressions"]) / prev["tg_impressions"] * 100 if prev and prev["tg_impressions"] else None
    pts_chg = w["tg_share_pct"] - prev["tg_share_pct"] if prev and w["tg_share_pct"] is not None and prev["tg_share_pct"] is not None else None

    def card(title, big, sub):
        return (f"<td width='33%' valign='top' style='padding:0 5px'>"
                f"<div style='background:#ffffff;border:1px solid {RULE};border-radius:10px;padding:14px 12px'>"
                f"<div style='font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:{MUTED}'>{title}</div>"
                f"<div style='font-size:28px;font-weight:700;line-height:1.2;margin:4px 0 6px;color:{INK}'>{big}</div>"
                f"<div>{sub}</div></div></td>")

    btn_week = sum(p["custom_button_clicks"] for p in btn)
    cards = (card("TG impressions", n(w["tg_impressions"]), chip(pct_chg, f"{abs(pct_chg):.0f}% vs last week") if pct_chg is not None else chip(None, ""))
             + card("TG share", pc(w["tg_share_pct"]), chip(pts_chg, f"{abs(pts_chg):.1f} pts") if pts_chg is not None else chip(None, ""))
             + card("Premium button clicks", str(btn_week),
                    f"<span style='font-size:12px;color:{MUTED}'>{tot_clicks} on {len(allb)} posts so far</span>"))

    # last 8 full weeks, bars
    ws = weeks[-8:]
    mx = max(x["tg_impressions"] for x in ws) or 1
    bars = ""
    for i, x in enumerate(ws):
        h = max(4, round(x["tg_impressions"] / mx * 90))
        last = i == len(ws) - 1
        bars += (f"<td valign='bottom' align='center' style='padding:0 3px'>"
                 f"<div style='font-size:10px;color:{MUTED};margin-bottom:3px'>{n(x['tg_impressions'])}</div>"
                 f"<div style='height:{h}px;background:{TEAL if last else '#BFD9D4'};border-radius:4px 4px 0 0'></div>"
                 f"<div style='font-size:10px;color:{MUTED};margin-top:4px;border-top:1px solid {RULE};padding-top:3px'>{fd(x['week_start'])}</div></td>")

    def line(p, tail, color):
        return (f"<div style='padding:7px 0;border-bottom:1px solid {RULE};font-size:13px'>"
                f"<b style='color:{color}'>{tail}</b> <span style='color:{MUTED}'>· {esc(p['type'])} · {fd(p['published'])}</span></div>")

    w_html = "".join(line(p, f"{p['custom_button_clicks']} click{'s' if p['custom_button_clicks'] != 1 else ''} on {n(p['impressions_total'])} views", GOOD)
                     for p in worked[:2]) or f"<div style='font-size:13px;color:{MUTED}'>None yet</div>"
    f_html = "".join(line(p, f"0 clicks on {n(p['impressions_total'])} views", BAD)
                     for p in failed[:2]) or f"<div style='font-size:13px;color:{MUTED}'>None yet</div>"
    early = (f"<div style='font-size:12px;color:{MUTED};margin-top:10px'>Early read: only {len(allb)} of {len(d['posts'])} posts have button data. "
             "A hint, not a result.</div>")

    page = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<meta name='color-scheme' content='light only'></head>
<body style='margin:0;padding:0;background:{BG};font-family:{FONT};color:{INK}'>
<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:{BG}'><tr><td align='center' style='padding:20px 10px'>
<table role='presentation' width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%'>
<tr><td style='background:{TEAL};border-radius:12px 12px 0 0;padding:22px 24px;color:#ffffff'>
  <div style='font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.85'>Peaceful-Loans &middot; LinkedIn</div>
  <div style='font-size:22px;font-weight:700;margin-top:4px'>Are we reaching our target audience?</div>
  <div style='font-size:13px;opacity:.9;margin-top:4px'>Week of {fd(w['week_start'])} &ndash; {fd(w['week_end'])} {D(w['week_end']).year}</div>
</td></tr>
<tr><td style='background:{BG};padding:16px 0 4px'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>{cards}</tr></table>
</td></tr>
<tr><td style='padding:10px 5px'>
  <div style='background:#ffffff;border:1px solid {RULE};border-radius:10px;padding:14px 12px'>
    <div style='font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:{MUTED};margin-bottom:10px'>TG impressions, last 8 weeks</div>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>{bars}</tr></table>
  </div>
</td></tr>
<tr><td style='padding:0 5px 10px'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>
    <td width='50%' valign='top' style='padding-right:5px'>
      <div style='background:#ffffff;border:1px solid {RULE};border-radius:10px;padding:14px 12px'>
        <div style='font-size:13px;font-weight:700;color:{GOOD}'>&#9650; Worked for button clicks</div>{w_html}</div></td>
    <td width='50%' valign='top' style='padding-left:5px'>
      <div style='background:#ffffff;border:1px solid {RULE};border-radius:10px;padding:14px 12px'>
        <div style='font-size:13px;font-weight:700;color:{BAD}'>&#9660; Did not work</div>{f_html}</div></td>
  </tr></table>
  {early}
</td></tr>
<tr><td align='center' style='padding:12px 0 6px'>
  <a href='{URL}#works' style='display:inline-block;background:{TEAL};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:8px'>See what works &rarr;</a>
</td></tr>
<tr><td align='center' style='padding:6px 10px 18px;font-size:11px;color:{MUTED}'>Password protected dashboard &middot; ask Mangesh for access</td></tr>
</table></td></tr></table></body></html>"""
    print(page)
else:
    print("\n".join(L))
