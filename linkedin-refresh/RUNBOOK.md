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
3b. Artifact: `python3 -I linkedin-refresh/build_artifact.py`, then Artifact tool: read, then publish `linkedin-refresh/out/linkedin-tg-reach.html` to https://claude.ai/artifact/UTmFubhq9qBzGGbdHiwZ3b (same data and design as the website page, embedded). Done every week whether or not the team email is held.
4. Email (only if the push succeeded). Gate: `weekly_report.py --coverage` must print `ok` (90%+ of posts have button data). If it prints `hold`, email only mangesh@peaceful-loans.com a short "report held" note and do NOT email the team.
   Then: `python3 -I linkedin-refresh/weekly_report.py --html` -> send via Gmail To tanya@creatorchart.in and rishita@creatorchart.in, CC ananya.rakhecha@peaceful-loans.com and mangesh@peaceful-loans.com (the HTML has a button to the Button clicks tab; subject starts with "Premium button clicks"; the email shows ONLY button clicks, no impressions, TG share or reach: the team should not chase vanity metrics). One email per run, nothing extra in it.

## Task 2: post backfill (about 14:17): at most 5 per-post exports, 60-90 s apart
1. `python3 -I linkedin-refresh/next_posts.py 5` lists the posts that still need an export.
2. For each, open its analytics URL, click Export, Confirm; move the file to `~/Downloads/Linkedin analysis/posts/`.
3. `ingest.py post <file> --write` for each, then `publish.py --check` and `--push`.
Stops by itself when the list is empty.

## Not automated
New posts' types and image types, the 90-day windows, company page, newsletter, engagement.

## Manual refresh (Refresh button on the artifact)
- An editor/owner clicks "Refresh all data" on the artifact. The page saves refresh/request = status "requested" in the artifact's shared db.
- Task `linkedin-refresh-poller` runs at :07 every hour 07:00-22:59. It reads that note; if status is not "requested" it stops at once (no LinkedIn access).
- If requested: refuses when the last refresh finished under 12 hours ago, else sets "running", exports yesterday's missing days + current week + month, runs ingest, publish.py --push, rebuilds and republishes the artifact, then sets "done" (or "failed" with the reason). No team email on manual refreshes.
- The page shows the status to everyone and disables the button while a refresh is running or within 12 hours of the last one.
- The website and artifact both show "Refreshed <time> IST" (meta.refreshed_at, stamped by publish.py --push).

## Accuracy rules (owner requirement: 100% accurate, every week)
- The weekly task re-reads EVERY post from LinkedIn each run (`next_posts.py --all`, about 85 per-post exports, 2.5-3 hours). No sampling.
- New posts are found from LinkedIn's exports (`ingest.py buttons` on the weekly and month-to-date files) and labelled by reading their text (`ingest.py classify`).
- `verify.py` is the gate. `publish.py --push` runs it and refuses to publish on any failure; the weekly task also runs `verify.py --fresh-hours 8` to prove every post was re-read in this run.
  Checks: no duplicate/invalid posts, no blank clicks or views, clicks <= views, every post in LinkedIn's newest exports is in the data, every post re-read recently, no duplicate weekly/monthly/daily rows.
- Group posts (urn:li:groupPost) are not profile posts, have no analytics page, and are excluded.
- A manual refresh (artifact button) adds new posts and the latest days only; it does NOT re-read old posts.
- Each publish saves a dated snapshot of every post's lifetime clicks (`creator-chart/data/click_snapshots.json`). LinkedIn does not date clicks; the difference between two snapshots is the only exact count of clicks made in between.
