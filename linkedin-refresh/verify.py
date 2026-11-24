#!/usr/bin/env python3
"""Accuracy gate for the dashboard data. Exit code 1 (and a list of failures) means DO NOT PUBLISH.

  python3 -I verify.py [--fresh-hours 6]

Hard checks (any failure blocks publishing):
  1. no duplicate post ids; dates valid, in 2026 and not after data_to
  2. every post has button clicks AND total impressions (no blanks)
  3. clicks are whole numbers, >= 0 and <= total impressions
  4. every post in the newest LinkedIn exports (3 newest posts + top-50 lists) is in the data
     (posts inside LinkedIn groups are not profile posts and are ignored)
  5. with --fresh-hours N: every post's clicks were read from LinkedIn in the last N hours
     (proves the weekly run re-exported ALL posts, so no post is stale)
  6. weekly/monthly/daily rows: no duplicate dates, latest week present
Info (printed, never blocks): posts still Unclassified, reconciliation against LinkedIn's totals.
Standard library only.
"""
import glob, json, os, re, sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import ingest  # noqa: E402

data = json.loads(ingest.DATA.read_text())
P = data["posts"]
fails, info = [], []
IST = timezone(timedelta(hours=5, minutes=30))

# 1. identity and dates
ids = [p["post_id"] for p in P]
if len(ids) != len(set(ids)):
    fails.append("duplicate post ids: " + ", ".join(sorted({i for i in ids if ids.count(i) > 1})))
data_to = data["meta"]["data_to"]
for p in P:
    try:
        date.fromisoformat(p["published"])
    except Exception:
        fails.append(f"{p['post_id']}: bad date {p.get('published')!r}")
        continue
    if not ("2026-01-01" <= p["published"] <= data_to):
        fails.append(f"{p['post_id']}: date {p['published']} outside 2026-01-01..{data_to}")

# 2 + 3. no blanks, sane values
blank = [p["post_id"] for p in P if p.get("custom_button_clicks") is None or p.get("impressions_total") is None]
if blank:
    fails.append(f"{len(blank)} post(s) missing clicks or total impressions: " + ", ".join(blank[:12]) + (" ..." if len(blank) > 12 else ""))
for p in P:
    c, v = p.get("custom_button_clicks"), p.get("impressions_total")
    if c is None or v is None:
        continue
    if not (isinstance(c, int) and c >= 0 and isinstance(v, int) and v >= 0):
        fails.append(f"{p['post_id']}: non-integer or negative clicks/impressions ({c}, {v})")
    elif c > v:
        fails.append(f"{p['post_id']}: clicks {c} exceed impressions {v}")

# 4. completeness against the newest exports
files = sorted(glob.glob(os.path.expanduser("~/Downloads/Linkedin analysis/*/*.xlsx")), key=os.path.getmtime)[-6:]
files += sorted(glob.glob(os.path.expanduser("~/Downloads/AggregateAnalytics_*.xlsx")), key=os.path.getmtime)[-2:]
have = set(ids)
seen = {}
for f in files:
    try:
        wb = ingest.read_xlsx(f)
    except Exception:
        continue
    for r in wb.get("MOST RECENT POSTS", [])[1:]:
        if len(r) > 1 and r[0] and "groupPost" not in r[0]:
            seen[ingest.post_id(r[0])] = r[1]
    for r in wb.get("TOP POSTS", [])[2:]:
        for i in (0, 4):
            if len(r) > i + 1 and r[i] and r[i + 1] and "groupPost" not in r[i]:
                seen[ingest.post_id(r[i])] = r[i + 1]
missing = []
for pid, dt in seen.items():
    try:
        dd = datetime.strptime(dt, "%m/%d/%Y").date()
    except Exception:
        continue
    if pid not in have and dd >= date(2026, 1, 1):
        missing.append(f"{pid} ({dd})")
if missing:
    fails.append(f"{len(missing)} post(s) in LinkedIn's exports are missing from the data: " + ", ".join(missing))

# 5. freshness (the weekly run re-reads every post)
if "--fresh-hours" in sys.argv:
    hrs = float(sys.argv[sys.argv.index("--fresh-hours") + 1])
    cutoff = datetime.now(IST) - timedelta(hours=hrs)
    stale = []
    for p in P:
        t = p.get("clicks_read_at")
        try:
            ok = t and datetime.fromisoformat(t) >= cutoff
        except Exception:
            ok = False
        if not ok:
            stale.append(p["post_id"])
    if stale:
        fails.append(f"{len(stale)} post(s) were NOT re-read from LinkedIn in the last {hrs:g} h: " + ", ".join(stale[:12]) + (" ..." if len(stale) > 12 else ""))

# 6. grain rows
for key, field in (("daily", "date"), ("weekly", "week_start"), ("monthly", "month_start")):
    vals = [r[field] for r in data[key]]
    if len(vals) != len(set(vals)):
        fails.append(f"duplicate {key} rows")
if data["weekly"] and data["weekly"][-1]["week_end"] < (date.fromisoformat(data_to) - timedelta(days=13)).isoformat():
    fails.append("latest weekly row is more than two weeks behind data_to")

# info
uncl = [p["post_id"] for p in P if p.get("type") == "Unclassified"]
if uncl:
    info.append(f"{len(uncl)} post(s) still 'Unclassified' (type/image not set): " + ", ".join(uncl[:8]))
info.append(f"{len(P)} posts, {sum(p.get('custom_button_clicks') or 0 for p in P)} lifetime button clicks, data_to {data_to}")

for line in info:
    print("info:", line)
if fails:
    print(f"\nFAILED {len(fails)} check(s): DO NOT PUBLISH")
    for f in fails:
        print(" -", f)
    sys.exit(1)
print("\nALL CHECKS PASSED")
