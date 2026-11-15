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
if "--coverage" in sys.argv:
    # Gate for the team email: send only when 90%+ of posts have button data.
    have = sum(1 for p in d["posts"] if p.get("custom_button_clicks") is not None)
    total_posts = len(d["posts"])
    print("ok" if have / total_posts >= 0.9 else "hold", have, total_posts)
    sys.exit(0)
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

subject = f"Premium button clicks: week of {fd(w['week_start'])} – {fd(w['week_end'])}"
print("SUBJECT:", subject)
print()
if "--html" in sys.argv:
    import html
    esc = html.escape
    # Button-clicks-only email. Mobile-first, email-safe (bgcolor attrs, background-color, table bars).
    BLUE, RED, AMBER = "#1A4CC8", "#E84118", "#FFB800"
    INK, BODY, GROUND, HAIR, MUTED = "#1a1a1a", "#4a4a4a", "#fbfaf7", "#e5e7eb", "#6b7280"
    BAR = "#9DB4EE"
    SERIF = "Georgia,Times New Roman,serif"
    SANS = "Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif"
    LOGO = "https://peaceful-loans.com/assets/logo-horizontal.png"
    LINK = f"{URL}#clicks"
    clk = lambda p: p["custom_button_clicks"]
    s_ = lambda x: "" if x == 1 else "s"

    allc = [p for p in d["posts"] if p.get("custom_button_clicks") is not None]
    ncl = len(allc)
    npost = len(d["posts"])
    tot = sum(clk(p) for p in allc)
    wk = [p for p in posts if p.get("custom_button_clicks") is not None]
    wk_clicks = sum(clk(p) for p in wk)
    avg_post = lambda ps: sum(clk(p) for p in ps) / len(ps) if ps else 0

    # last week's posts, only if every one of them has button data
    pw = [p for p in d["posts"] if prev and prev["week_start"] <= p["published"] <= prev["week_end"]]
    pw_ok = bool(pw) and all(p.get("custom_button_clicks") is not None for p in pw)
    pw_clicks = sum(clk(p) for p in pw) if pw_ok else None

    def chip(txt, color, bg, arrow):
        return (f"<table role='presentation' cellpadding='0' cellspacing='0'><tr><td bgcolor='{bg}' "
                f"style='background-color:{bg};border-radius:999px;padding:4px 11px;font-size:13px;font-weight:bold;color:{color};white-space:nowrap'>"
                f"{arrow}&nbsp;{txt}</td></tr></table>")

    if wk:
        headline = f"{wk_clicks} click{s_(wk_clicks)} on the button from this week's posts."
    else:
        headline = "No button data for this week's posts yet."

    def card(title_, big, sub, pad="16px"):
        return (f"<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>"
                f"<td bgcolor='#ffffff' style='background-color:#ffffff;border:1px solid {HAIR};border-radius:8px;padding:{pad}'>"
                f"<div style='font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:{MUTED}'>{title_}</div>"
                f"<div style='font-family:{SERIF};font-size:34px;font-weight:bold;line-height:40px;padding:6px 0 8px;color:{INK}'>{big}</div>"
                f"{sub}</td></tr></table>")

    if pw_clicks is None:
        vs = f"<div style='font-size:13px;color:{MUTED}'>{len(wk)} of {len(posts)} posts have data</div>"
    elif wk_clicks >= pw_clicks:
        vs = chip(f"{wk_clicks - pw_clicks} vs last week's posts ({pw_clicks})", BLUE, "#EAF0FD", "&#9650;")
    else:
        vs = chip(f"{pw_clicks - wk_clicks} vs last week's posts ({pw_clicks})", RED, "#FDECE8", "&#9660;")
    c1 = card("Button clicks, this week's posts", str(wk_clicks), vs)
    c2 = card("Clicks per post", f"{avg_post(wk):.1f}" if wk else "–", f"<div style='font-size:13px;color:{MUTED}'>this week's posts</div>", pad="14px")
    c3 = card("All posts so far", str(tot), f"<div style='font-size:13px;color:{MUTED}'>on {ncl} posts</div>", pad="14px")

    # bars: clicks on the latest 8 posts with data
    latest = sorted(allc, key=lambda p: p["published"])[-8:]
    mx = max([clk(p) for p in latest] + [1])
    bars = ""
    for i, p in enumerate(latest):
        v = clk(p)
        h = max(3, round(v / mx * 90))
        last = i == len(latest) - 1
        col = BLUE if last else BAR
        bars += (f"<td valign='bottom' align='center' style='padding:0 2px'>"
                 f"<div style='font-size:12px;color:{INK if last else MUTED};font-weight:{'bold' if last else 'normal'};padding-bottom:3px'>{v}</div>"
                 f"<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td bgcolor='{col if v else HAIR}' height='{h}' style='background-color:{col if v else HAIR};height:{h}px;line-height:{h}px;font-size:{h}px'>&nbsp;</td></tr></table>"
                 f"<div style='font-size:10px;color:{MUTED};padding-top:4px'>{fd(p['published']).replace(' ', '&nbsp;')}</div></td>")

    def bucket(p):
        t = (p.get("time") or "").upper()
        try:
            hh = int(t.split(":")[0]) % 12 + (12 if "PM" in t else 0)
        except ValueError:
            return None
        return "mornings" if hh < 12 else "afternoons" if hh < 17 else "evenings"

    FMT = {"Media (ugcPost)": "image/video posts", "Text/share": "text posts"}
    DIMS = [("post type", lambda p: p.get("type")),
            ("image", lambda p: p.get("image_type") or "No image"),
            ("format", lambda p: FMT.get(p.get("format"), p.get("format"))),
            ("posting day", lambda p: p.get("weekday")),
            ("posting time", bucket)]

    def pattern_insights():
        found = []
        for label, fn in DIMS:
            g = {}
            for p in allc:
                g.setdefault(fn(p), []).append(p)
            g = {a: v for a, v in g.items() if a and len(v) >= 3}
            if len(g) < 2:
                continue
            ranked = sorted(g.items(), key=lambda kv: -avg_post(kv[1]))
            (bn, bv), (wn, wv) = ranked[0], ranked[-1]
            if avg_post(bv) <= 0:
                continue
            found.append(dict(label=label, bn=bn, bv=bv, wn=wn, wv=wv,
                              score=(avg_post(bv) / avg_post(wv) if avg_post(wv) else 99)))
        return sorted(found, key=lambda c: -c["score"])[:2]

    pats = pattern_insights()
    left_days = -(-(npost - len([p for p in d["posts"] if p.get("custom_button_clicks") is not None])) // 5)

    def pat_line(txt, sub, color):
        return (f"<div style='padding:9px 0;border-top:1px solid {HAIR};font-size:14px;line-height:20px;color:{BODY}'>"
                f"<b style='color:{color}'>{txt}</b><br>{sub}</div>")

    more_html = "".join(pat_line(esc(str(c["bn"])), f"{avg_post(c['bv']):.1f} clicks per post &middot; {len(c['bv'])} posts &middot; by {c['label']}", BLUE) for c in pats)
    less_html = "".join(pat_line(esc(str(c["wn"])), f"{avg_post(c['wv']):.1f} clicks per post &middot; {len(c['wv'])} posts &middot; by {c['label']}", RED) for c in pats)
    early_html = pat_line("Too early to call a pattern",
                          f"Only {ncl} of {npost} posts have button data. We need 3+ posts of each kind. The backfill finishes in about {left_days} days.", MUTED)

    def ex(p, color):
        return (f"<div style='padding:9px 0;border-top:1px solid {HAIR};font-size:14px;line-height:20px;color:{BODY}'>"
                f"<b style='color:{color}'>{clk(p)} click{s_(clk(p))}</b><br>"
                f"&ldquo;{esc(p['title'][:58])}&hellip;&rdquo;<br>"
                f"<span style='font-size:12px;color:{MUTED}'>{esc(p['type'])} &middot; {fd(p['published'])}</span></div>")

    by_clicks = sorted(allc, key=lambda p: (-clk(p), p["published"]), reverse=False)
    top3 = [p for p in by_clicks if clk(p) > 0][:3]
    rest = [p for p in allc if p not in top3]
    worst3 = sorted(rest, key=lambda p: (clk(p), p["published"]))[:3]
    w_html = "".join(ex(p, BLUE) for p in top3) or f"<div style='font-size:14px;color:{MUTED};border-top:1px solid {HAIR};padding-top:9px'>None yet</div>"
    f_html = "".join(ex(p, RED) for p in worst3) or f"<div style='font-size:14px;color:{MUTED};border-top:1px solid {HAIR};padding-top:9px'>None yet</div>"

    def box(inner):
        return (f"<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>"
                f"<td bgcolor='#ffffff' style='background-color:#ffffff;border:1px solid {HAIR};border-radius:8px;padding:16px'>{inner}</td></tr></table>")

    def title(t, color, arrow):
        return f"<div style='font-family:{SERIF};font-size:18px;font-weight:bold;color:{INK};padding-bottom:6px'><span style='color:{color}'>{arrow}</span> {t}</div>"

    gap = "<tr><td height='12' style='height:12px;line-height:12px;font-size:12px'>&nbsp;</td></tr>"
    if pats:
        pat_boxes = (f"<tr><td>{box(title('Do more of this', BLUE, '&#9650;') + more_html)}</td></tr>{gap}"
                     f"<tr><td>{box(title('Do less of this', RED, '&#9660;') + less_html)}</td></tr>{gap}")
    else:
        pat_boxes = f"<tr><td>{box(title('What the pattern says', BLUE, '&#9679;') + early_html)}</td></tr>{gap}"

    page = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<meta name='color-scheme' content='light dark'><meta name='supported-color-schemes' content='light dark'></head>
<body bgcolor='{GROUND}' style='margin:0;padding:0;background-color:{GROUND};font-family:{SANS};color:{BODY}'>
<table role='presentation' width='100%' cellpadding='0' cellspacing='0' bgcolor='{GROUND}' style='background-color:{GROUND}'><tr><td align='center' style='padding:0 0 28px'>
<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='max-width:600px'>
<tr><td bgcolor='#ffffff' style='background-color:#ffffff;padding:16px'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>
    <td align='left'><a href='https://peaceful-loans.com/'><img src='{LOGO}' alt='Peaceful-Loans' width='140' height='33' style='display:block;border:0;width:140px;height:auto;max-width:100%;color:{BLUE};font-weight:bold;font-size:16px'></a></td>
    <td align='right' style='font-size:11px;font-weight:bold;color:{MUTED};letter-spacing:1px;text-transform:uppercase'>Weekly report</td>
  </tr></table>
</td></tr>
<tr><td style='padding:0'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>
    <td bgcolor='{BLUE}' height='4' width='34%' style='background-color:{BLUE};height:4px;line-height:4px;font-size:4px'>&nbsp;</td><td bgcolor='{RED}' height='4' width='33%' style='background-color:{RED};height:4px;line-height:4px;font-size:4px'>&nbsp;</td><td bgcolor='{AMBER}' height='4' width='33%' style='background-color:{AMBER};height:4px;line-height:4px;font-size:4px'>&nbsp;</td>
  </tr></table>
</td></tr>
<tr><td style='padding:26px 16px 14px'>
  <div style='font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:{BLUE}'>Premium button &middot; {fd(w['week_start'])} &ndash; {fd(w['week_end'])} {D(w['week_end']).year}</div>
  <div style='font-family:{SERIF};font-size:32px;line-height:38px;font-weight:bold;color:{INK};padding-top:8px'>{headline}</div>
  <div style='font-size:15px;line-height:22px;color:{BODY};padding-top:8px'>People who clicked <b>Visit my website</b>, and the posts that earn those clicks.</div>
</td></tr>
<tr><td style='padding:0 16px'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'>
    <tr><td>{c1}</td></tr>{gap}
    <tr><td><table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>
      <td width='50%' valign='top' style='padding-right:6px'>{c2}</td>
      <td width='50%' valign='top' style='padding-left:6px'>{c3}</td></tr></table></td></tr>
    {gap}
    <tr><td>{box(f"<div style='font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:{MUTED};padding-bottom:12px'>Button clicks on our latest {len(latest)} posts</div><table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>{bars}</tr></table>")}</td></tr>
    {gap}
    {pat_boxes}
    <tr><td>{box(title('Top 3 posts for clicks', BLUE, '&#9650;') + w_html)}</td></tr>
    {gap}
    <tr><td>{box(title('Bottom 3', RED, '&#9660;') + f_html)}</td></tr>
    <tr><td style='font-size:12px;color:{MUTED};padding-top:10px;text-align:center'>Based on {ncl} of {npost} posts with button data. Clicks are lifetime, credited to the post being viewed.</td></tr>
  </table>
</td></tr>
<tr><td align='center' style='padding:26px 16px 6px'>
  <table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>
    <td bgcolor='{BLUE}' align='center' style='background-color:{BLUE};border-radius:6px'>
      <a href='{LINK}' style='display:block;padding:16px 20px;font-family:{SANS};font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none'>Read the full report &rarr;</a>
    </td></tr></table>
</td></tr>
<tr><td align='center' style='padding:12px 16px 0;font-size:13px;line-height:20px;color:{MUTED}'>
  <a href='{LINK}' style='color:{BLUE};text-decoration:underline'>peaceful-loans.com/linkedin-analytics</a><br>
  Password protected &middot; ask Mangesh for access
</td></tr>
<tr><td align='center' style='padding:22px 16px 0'>
  <div style='border-top:1px solid {HAIR};padding-top:14px;font-family:{SERIF};font-size:13px;font-style:italic;color:{MUTED}'>Peaceful-Loans &middot; We work for you and not for the bank.</div>
</td></tr>
</table></td></tr></table></body></html>"""
    print(page)
else:
    print("\n".join(L))
