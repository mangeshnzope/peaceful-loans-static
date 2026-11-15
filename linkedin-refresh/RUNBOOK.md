# LinkedIn TG refresh: runbook (slow, small runs)

Goal: keep `creator-chart/data/creator_chart_dashboard_data.json` current, then publish with `publish.py`.
TG = seniority Manager, Director, VP, Owner, CXO, Partner. Total impressions are stored as `impressions_total`
(allowed since 16 Nov 2026); reach (`members_reached`) and `sv` stay out.

## Pacing rules (LinkedIn can restrict accounts that look automated)
- Do the minimum: a handful of exports per run, never a burst.
- Wait at least 60 seconds between LinkedIn page loads or exports (use several waits); no extra browsing.
- No retry loops. One retry at most; on any warning, captcha, login, "unusual activity" or error page: STOP, push nothing, report.
- Never click the profile's "Visit my website" button (clicks are counted in analytics).

## Task 1: daily (about 8:32): 1 export, 2 on Mondays or the 1st
1. Export yesterday only (custom range). Save to `~/Downloads/Linkedin analysis/daily/YYYY-MM-DD.xlsx`.
2. `python3 -I linkedin-refresh/ingest.py daily <file> --write`, then `ingest.py buttons <same file> --write`.
3. Mondays: also export last Mon-Sun week -> `ingest.py weekly`. 1st of month: previous month -> `ingest.py monthly`.
4. `publish.py --check`, then `publish.py --push "Daily TG dashboard refresh"`.

## Task 2: post backfill (about 14:17): at most 5 per-post exports
1. `python3 -I linkedin-refresh/next_posts.py 5` lists the posts that still need an export.
2. For each, open its analytics URL, click Export, Confirm; move the file to `~/Downloads/Linkedin analysis/posts/`.
3. `ingest.py post <file> --write` for each, then `publish.py --check` and `--push`.
Stops by itself when the list is empty.

## Not automated
New posts' types and image types, the 90-day windows, company page, newsletter, engagement.
