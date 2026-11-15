# LinkedIn TG refresh: runbook (slow, small runs)

Goal: keep `creator-chart/data/creator_chart_dashboard_data.json` current, then publish with `publish.py`.
TG = seniority Manager, Director, VP, Owner, CXO, Partner. Total impressions are stored as `impressions_total`
(allowed since 16 Nov 2026); reach (`members_reached`) and `sv` stay out.

## Pacing rules (LinkedIn can restrict accounts that look automated)
- Do the minimum: a handful of exports per run, never a burst.
- Wait at least 60 seconds between LinkedIn page loads or exports (use several waits); no extra browsing.
- No retry loops. One retry at most; on any warning, captcha, login, "unusual activity" or error page: STOP, push nothing, report.
- Never click the profile's "Visit my website" button (clicks are counted in analytics).

## Weekly task: Tuesday 8 AM (about 9 exports, spaced 60-90 s apart)
1. Export the previous full Mon-Sun week, the month to date, and each of its 7 days (custom ranges). Save under `~/Downloads/Linkedin analysis/{weekly,monthly,daily}/`.
2. `ingest.py daily <file> --write` for each day, `ingest.py weekly`, `ingest.py monthly`, then `ingest.py buttons <weekly file> --write`.
3. `publish.py --check`, then `publish.py --push "Weekly TG dashboard refresh"`.
4. Email (only if the push succeeded): `python3 -I linkedin-refresh/weekly_report.py --html` -> send via Gmail To tanya@creatorchart.in and rishita@creatorchart.in, CC ananya@creatorchart.in and mangesh@peaceful-loans.com (the HTML has a button to the Button clicks tab; subject starts with "Premium button clicks"; the email shows ONLY button clicks, no impressions, TG share or reach: the team should not chase vanity metrics). One email per run, nothing extra in it.

## Task 2: post backfill (about 14:17): at most 5 per-post exports
1. `python3 -I linkedin-refresh/next_posts.py 5` lists the posts that still need an export.
2. For each, open its analytics URL, click Export, Confirm; move the file to `~/Downloads/Linkedin analysis/posts/`.
3. `ingest.py post <file> --write` for each, then `publish.py --check` and `--push`.
Stops by itself when the list is empty.

## Not automated
New posts' types and image types, the 90-day windows, company page, newsletter, engagement.
