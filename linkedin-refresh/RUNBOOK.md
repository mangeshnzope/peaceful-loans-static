# Daily LinkedIn TG refresh: runbook for the scheduled Claude task

Goal: add yesterday's data to `creator-chart/data/creator_chart_dashboard_data.json`, then publish with `publish.py`.
Spec for the JSON: `creator-chart/data/creator_chart_dashboard_spec.md` §4. TG = seniority Manager, Director, VP, Owner, CXO, Partner.
Never write total impressions or reach into the JSON (keys `impressions`, `imp`, `members_reached`, `sv` are rejected).

## Every day (incremental)
1. Chrome (the signed-in LinkedIn profile): open
   `https://www.linkedin.com/analytics/creator/content?metricType=IMPRESSIONS&timeRange=custom` and set the range to yesterday only, then Export. Save to `~/Downloads/Linkedin analysis/daily/YYYY-MM-DD.xlsx`.
2. Same for the current Monday-to-yesterday week and the current month-to-date (weekly/monthly rows are their own exports, never summed from days).
3. Open the Posts list (Content analytics, Top posts); for any post published since the last `data_to` and every post of the last 14 days, export its post analytics to `~/Downloads/Linkedin analysis/posts/<post_id>.xlsx`.
4. Merge the exports into the JSON (ingest step, see "Not built yet").
5. `python3 -I linkedin-refresh/publish.py --check`, and if it prints OK, `python3 -I linkedin-refresh/publish.py --push`.

## Mondays also
90-day export (two windows), company page visitors and followers, newsletter subscribers and editions.

## Stop and report, don't push, if
LinkedIn shows a login or captcha page, an export fails, or `--check` raises.

## Not built yet
`ingest.py` (xlsx to JSON merge). It needs one real export of each kind to match the sheet layout.
