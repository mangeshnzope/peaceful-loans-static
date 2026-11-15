#!/usr/bin/env python3
"""Merge one LinkedIn AggregateAnalytics_*.xlsx export into the TG dashboard JSON.

  python3 -I ingest.py daily   export.xlsx [--write]
  python3 -I ingest.py weekly  export.xlsx [--write]
  python3 -I ingest.py monthly export.xlsx [--write]
  python3 -I ingest.py buttons export.xlsx [--write]   # post custom-button clicks

Each export is one grain (day / Mon-Sun week / calendar month) and becomes one
row; nothing is summed across grains. Without --write it only prints the row.
TG = Manager + Director + VP + Owner + CXO + Partner share of the CONTENT
DEMOGRAPHICS sheet (viewers). TG impressions = Impressions x TG share.
Standard library only.
"""
import json, re, sys, zipfile
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
            print(post_id(r[0]), r[1], "button clicks:", num(r[col]))
            n += 1
    for p in data["posts"]:
        p.setdefault("custom_button_clicks", None)  # None = not exported yet
    if write:
        DATA.write_text(json.dumps(data, indent=1, ensure_ascii=True))
    print(n, "posts updated" if write else "posts matched (dry run)")


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "buttons":
        return buttons(sys.argv[2], "--write" in sys.argv)
    if len(sys.argv) < 3 or sys.argv[1] not in ("daily", "weekly", "monthly"):
        sys.exit(__doc__)
    grain, path = sys.argv[1], sys.argv[2]
    start, end, imp, reached, eng, fol, sen, pub = parse(path)
    tg, share, higher = tg_fields(imp, sen)
    base = dict(tg_impressions=tg, tg_share_pct=share, tg_may_be_higher=higher,
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
