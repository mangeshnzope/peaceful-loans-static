#!/usr/bin/env python3
"""Merge one LinkedIn AggregateAnalytics_*.xlsx export into the TG dashboard JSON.

  python3 -I ingest.py daily   export.xlsx [--write]
  python3 -I ingest.py weekly  export.xlsx [--write]
  python3 -I ingest.py monthly export.xlsx [--write]
  python3 -I ingest.py buttons export.xlsx [--write]   # post custom-button clicks + total impressions
  python3 -I ingest.py post SinglePostAnalytics_*.xlsx [--write]  # one post, any age
  python3 -I ingest.py classify <post_id> "<type>" ["<image type>"]  # label a new post after reading it

Each export is one grain (day / Mon-Sun week / calendar month) and becomes one
row; nothing is summed across grains. Without --write it only prints the row.
TG = Manager + Director + VP + Owner + CXO + Partner share of the CONTENT
DEMOGRAPHICS sheet (viewers). TG impressions = Impressions x TG share.
Standard library only.
"""
import json, re, sys, zipfile
from datetime import timedelta, timezone
from datetime import date, datetime
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "creator-chart/data/creator_chart_dashboard_data.json"
TG = ["Manager", "Director", "VP", "Owner", "CXO", "Partner"]
ALL_SENIORITY = TG + ["Senior", "Entry", "Training", "Unpaid"]


def read_xlsx(path):
    """Return {sheet name: [[cell, ...], ...]} (strings; empty cells kept as '')."""
    z = zipfile.ZipFile(path)
    un = lambda s: (s.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
                    .replace("&quot;", '"').replace("&apos;", "'"))
    ss = [un(re.sub("<[^>]+>", "", s)) for s in
          re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode(), re.S)]
    names = re.findall(r'<sheet [^>]*name="([^"]+)"', z.read("xl/workbook.xml").decode())
    out = {}
    for i, name in enumerate(names, 1):
        x = z.read(f"xl/worksheets/sheet{i}.xml").decode()
        rows = []
        for r in re.findall(r"<row[^>]*>(.*?)</row>", x, re.S):
            row = []
            for attrs, body in re.findall(r"<c ([^>]*?)(?:/>|>(.*?)</c>)", r, re.S):
                col = re.search(r'r="([A-Z]+)', attrs).group(1)
                idx = 0
                for ch in col:
                    idx = idx * 26 + ord(ch) - 64
                v = re.search(r"<v>(.*?)</v>", body or "")
                val = ""
                if v:
                    val = ss[int(v.group(1))] if 't="s"' in attrs else v.group(1)
                row += [""] * (idx - 1 - len(row)) + [val]
            rows.append(row)
        out[name] = rows
    return out


def d(s):  # 11/9/2026 -> date
    return datetime.strptime(s, "%m/%d/%Y").date()


def num(s):
    return int(float(s.replace(",", ""))) if s not in ("", None) else 0


def pct(s):
    s = s.strip()
    return 0.0 if s.startswith("<") else float(s.rstrip("%"))


def parse(path):
    wb = read_xlsx(path)
    rng = wb["DISCOVERY"][0][1].split(" - ")
    start, end = d(rng[0]), d(rng[1])
    imp = num(wb["DISCOVERY"][1][1])
    reached = num(wb["DISCOVERY"][2][1])
    eng = sum(num(r[2]) for r in wb["ENGAGEMENT"][1:] if len(r) > 2 and r[0])
    fol = sum(num(r[1]) for r in wb["FOLLOWERS"][2:] if len(r) > 1 and r[0])
    sen = {r[1]: pct(r[2]) for r in wb["CONTENT DEMOGRAPHICS"][1:]
           if len(r) > 2 and r[0] == "Seniority"}
    posts = [r for r in wb["MOST RECENT POSTS"][1:] if len(r) > 1 and r[1]]
    pub = count_posts(start, end, posts)
    return start, end, imp, reached, eng, fol, sen, pub


def now_ist():
    return datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(timespec="seconds")


def post_id(url):
    m = re.search(r"(\d{15,})", url)
    return m.group(1) if m else url


def count_posts(start, end, export_posts):
    """Posts published in [start, end]: the JSON's post list plus any in the export.
    (The export's list is short, so it alone undercounts a month.)"""
    ids = {}
    for p in json.loads(DATA.read_text())["posts"]:
        ids[p["post_id"]] = p["published"]
    for r in export_posts:
        ids.setdefault(post_id(r[0]), str(d(r[1])))
    return sum(1 for v in ids.values() if str(start) <= v <= str(end))


def tg_fields(imp, sen):
    """tg_impressions / share. None if LinkedIn gave no usable split (quiet day)."""
    share = sum(sen.get(k, 0) for k in TG)
    if imp < 50 or not sen:
        return None, None, False
    # LinkedIn hides small groups; if a TG group is absent, TG is a floor.
    return round(imp * share / 100), round(share, 1), any(k not in sen for k in TG)


def add_new_posts(wb, rows, data, by_id):
    """Add posts that are in the export but not yet in the data (new posts since the last refresh).
    MOST RECENT POSTS rows carry clicks and totals; TOP POSTS rows add older unseen posts without clicks
    (next_posts.py then queues them for a per-post export). Type and image are 'Unclassified' until labelled."""
    h = rows[0]
    ix = lambda name: h.index(name) if name in h else None
    new = []

    def base(url, dt, imp, eng):
        pid = post_id(url)
        slug = re.search(r"posts/[^_]+_(.+?)-(?:share|ugcPost|activity)-\d{15,}", url)
        title = (slug.group(1).replace("-", " ") if slug else pid)[:42]
        return {"post_id": pid, "published": str(dt), "weekday": dt.strftime("%a"), "time": "", "title": title.capitalize(),
                "url": url, "type": "Unclassified", "auto_type": "Unclassified", "image_type": "Unclassified",
                "auto_image_type": "Unclassified", "format": "Text/share", "creator_chart_era": str(dt) >= "2026-08-19",
                "tg_impressions_lifetime": None, "tg_share_pct": None, "out_of_network_pct": None, "in_network_pct": None,
                "engagements": eng, "comments": 0, "reposts": 0, "followers_gained": 0,
                "engagement_rate_pct": round(eng / imp * 100, 2) if imp else None,
                "custom_button_clicks": None, "impressions_total": imp}

    for r in rows[1:]:
        if len(r) > 1 and r[0] and "groupPost" not in r[0] and post_id(r[0]) not in by_id and d(r[1]) >= date(2026, 1, 1):
            imp = num(r[ix("Impressions")])
            reac, com, rep = (num(r[ix(c)]) if ix(c) is not None and len(r) > ix(c) else 0 for c in ("Reactions", "Comments", "Reposts"))
            p = base(r[0], d(r[1]), imp, reac + com + rep)
            if r[ix("Post type")] == "Text":
                p["image_type"] = p["auto_image_type"] = "No image"
            p.update(comments=com, reposts=rep, followers_gained=num(r[ix("Followers gained")]) if ix("Followers gained") is not None else 0,
                     custom_button_clicks=num(r[ix("Custom button engagements")]), clicks_read_at=now_ist(),
                     format="Text/share" if r[ix("Post type")] == "Text" else "Media (ugcPost)")
            out = r[ix("Impressions (out-of-network)")] if ix("Impressions (out-of-network)") is not None else ""
            if out.endswith("%"):
                p["out_of_network_pct"], p["in_network_pct"] = int(float(out[:-1])), 100 - int(float(out[:-1]))
            new.append(p)
            by_id[p["post_id"]] = p
    top = wb.get("TOP POSTS", [])
    # TOP POSTS has two side-by-side lists: by engagements (cols 0-2) and by impressions (cols 4-6).
    # A post can be in either list, so read both. Posts found only here have no click count until
    # their own per-post export is read (verify.py blocks publishing until then).
    imp_of = {post_id(x[4]): num(x[6]) for x in top[2:] if len(x) > 6 and x[4] and x[6]}
    eng_of = {post_id(x[0]): num(x[2]) for x in top[2:] if len(x) > 2 and x[0] and x[2]}
    # Posts inside LinkedIn groups (urn:li:groupPost) are skipped: they have no per-post analytics page.
    for r in top[2:]:
        for ucol, dcol in ((0, 1), (4, 5)):
            if len(r) > dcol and r[ucol] and r[dcol]:
                pid = post_id(r[ucol])
                if pid not in by_id and "groupPost" not in r[ucol] and d(r[dcol]) >= date(2026, 1, 1):
                    p = base(r[ucol], d(r[dcol]), imp_of.get(pid), eng_of.get(pid, 0))
                    new.append(p)
                    by_id[pid] = p
    if new:
        data["posts"].extend(new)
        data["posts"].sort(key=lambda p: p["published"], reverse=True)
        for p in new:
            print("NEW POST added:", p["post_id"], p["published"], "clicks", p["custom_button_clicks"], "views", p["impressions_total"])
    return len(new)


def buttons(path, write):
    """Set posts[].custom_button_clicks from the export's MOST RECENT POSTS sheet
    (column 'Custom button engagements' = clicks on the 'Visit my website' button)."""
    wb = read_xlsx(path)
    rows = wb["MOST RECENT POSTS"]
    col = rows[0].index("Custom button engagements")
    data = json.loads(DATA.read_text())
    by_id = {p["post_id"]: p for p in data["posts"]}
    n = 0
    for r in rows[1:]:
        if len(r) > col and r[0] and post_id(r[0]) in by_id:
            by_id[post_id(r[0])]["custom_button_clicks"] = num(r[col])
            by_id[post_id(r[0])]["clicks_read_at"] = now_ist()
            by_id[post_id(r[0])]["impressions_total"] = num(r[rows[0].index("Impressions")])
            print(post_id(r[0]), r[1], "button clicks:", num(r[col]))
            n += 1
    added = add_new_posts(wb, rows, data, by_id)
    if added:
        print(added, "new post(s); type/image are Unclassified until labelled")
    for p in data["posts"]:
        p.setdefault("custom_button_clicks", None)  # None = not exported yet
    if write:
        DATA.write_text(json.dumps(data, indent=1, ensure_ascii=True))
    print(n, "posts updated" if write else "posts matched (dry run)")


def classify(pid, ptype, image_type=None):
    """Set a post's type (and optionally image type) after reading its text. Types come from meta.post_types."""
    data = json.loads(DATA.read_text())
    allowed = data["meta"]["post_types"]
    assert ptype in allowed, f"type must be one of {allowed}"
    post = next(p for p in data["posts"] if p["post_id"] == pid)
    post["type"] = post["auto_type"] = ptype
    if image_type:
        assert image_type in data["meta"]["image_types"], data["meta"]["image_types"]
        post["image_type"] = post["auto_image_type"] = image_type
    DATA.write_text(json.dumps(data, indent=1, ensure_ascii=True))
    print(pid, "->", ptype, image_type or "")


def single(path, write):
    """Per-post export (SinglePostAnalytics_*_<post_id>.xlsx): total impressions + button clicks."""
    pid = re.search(r"(\d{15,})", Path(path).name).group(1)
    rows = read_xlsx(path)["Post analytics"]
    g = lambda k: next((r[1] for r in rows if r and r[0] == k and len(r) > 1), None)
    imp = num(g("Impressions") or "0")
    btn = g("Premium custom button engagements")
    data = json.loads(DATA.read_text())
    post = next((p for p in data["posts"] if p["post_id"] == pid), None)
    assert post, f"post {pid} not in data"
    post["impressions_total"] = imp
    post["custom_button_clicks"] = None if btn is None else num(btn)
    post["clicks_read_at"] = now_ist()
    print(pid, "impressions_total", imp, "button clicks", post["custom_button_clicks"])
    if write:
        DATA.write_text(json.dumps(data, indent=1, ensure_ascii=True))


def main():
    if len(sys.argv) >= 4 and sys.argv[1] == "classify":
        return classify(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    if len(sys.argv) >= 3 and sys.argv[1] == "post":
        return single(sys.argv[2], "--write" in sys.argv)
    if len(sys.argv) >= 3 and sys.argv[1] == "buttons":
        return buttons(sys.argv[2], "--write" in sys.argv)
    if len(sys.argv) < 3 or sys.argv[1] not in ("daily", "weekly", "monthly"):
        sys.exit(__doc__)
    grain, path = sys.argv[1], sys.argv[2]
    start, end, imp, reached, eng, fol, sen, pub = parse(path)
    tg, share, higher = tg_fields(imp, sen)
    base = dict(impressions_total=imp, tg_impressions=tg, tg_share_pct=share, tg_may_be_higher=higher,
                engagements=eng, new_followers=fol, posts_published=pub)
    if grain == "daily":
        assert start == end, "daily export must cover one day"
        row, key, rows = {"date": str(start), **base}, "date", "daily"
    else:
        row = {f"{grain[:-2] if grain=='weekly' else grain}_start": str(start)}
        row = {("week_start" if grain == "weekly" else "month_start"): str(start),
               ("week_end" if grain == "weekly" else "month_end"): str(end), **base}
        if tg is not None and reached:
            people = round(reached * share / 100)
            row["tg_people_reached_est"] = people
            row["tg_frequency_est"] = round(imp / reached, 2)
        key, rows = ("week_start" if grain == "weekly" else "month_start"), grain
    print(json.dumps(row, indent=1))
    if "--write" not in sys.argv:
        return
    data = json.loads(DATA.read_text())
    lst = data[rows]
    for i, r in enumerate(lst):
        if r[key] == row[key]:
            lst[i] = {**r, **row}  # replace, keep any extra fields
            break
    else:
        lst.append(row)
        lst.sort(key=lambda r: r[key])
    data["meta"]["data_to"] = max(data["meta"]["data_to"], str(end))
    data["meta"]["built"] = date.today().strftime("%-d %b %Y")
    DATA.write_text(json.dumps(data, indent=1, ensure_ascii=True))  # same layout as the original file
    print("written; data_to =", data["meta"]["data_to"])


if __name__ == "__main__":
    main()
