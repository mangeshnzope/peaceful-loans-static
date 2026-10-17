# Creator Chart TG Dashboard: update for Antigravity (17 Oct 2026, v5.4)

**From:** Mangesh Zope, Peaceful-Loans · **Data:** profile 1 Jan – 16 Oct 2026, company page to 14 Oct, newsletter snapshot 17 Oct

This package replaces v5.3. It has the same data window plus two new rules from Mangesh: **brag post types** and the **engagement mix**. The spec is still v5 (`creator_chart_dashboard_spec.md`), and this note is its addendum. `reference_dashboard.html` is the matching claude.ai version (v23), for visual reference only. Don't reuse its embedded data.

## 1. Steps
1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Replace `thumbs/` with this package's folder (47 files, unchanged since v5.3).
3. Check the header: "Data to 16 Oct · built 17 Oct 2026".
4. Make the changes in §2 and §3, then run the spec §8 checks plus §4 below.

## 2. Brag post types: shown, but never in the statistics
- `meta.post_types` now has 8 types. It adds **"Media mention / PR"** (press quotes or features used as a humble brag) and **"Awards"** (award wins, e.g. BW 40 Under 40).
- `meta.post_types_excluded_from_stats`: `["Awards", "Media mention / PR"]`. `insights.excl` holds the same list.
- **Posts table:** show these posts as normal. Add both types to the type filter and the type dropdown.
- **What works:** leave posts of these types out of every statistic: medians, p-values, correlations, the scatter and key findings. That includes recalculating after an edit. If a post's type is changed to one of these, it drops out at once.
- **"By type" table:** `insights.groups.cat.rows[]` entries with `"ex": true` are the excluded types. Show them at the bottom, greyed out, with a "not in stats" chip. Don't highlight them as best, and leave them out of the p-value row.
- The note on the tab should say how many posts are left out and why: wins and press mentions can't be produced every week, so they shouldn't steer what to post.
- Current tagging: 1 Awards post (18 Sep) and 4 Media mention / PR posts (11 Jun, 6 Jul, 14 Jul, 28 Aug). The stats cover 60 of 65 posts.

## 3. New block: `engagement` (who engages: the same people, or new ones?)
- `engagement.summary`: `posts`, `people`, `engaged_once`, `regulars`, `regulars_6plus`, `median_regular_pct`, `median_new_people`, `median_first_degree_pct`. It covers non-brag Creator Chart Era posts only.
- `engagement.posts[]`: one row per Creator Chart Era post, with these fields:
  - `post_id`, `published`, `type`
  - `engagers`, `reactors`, `commenters`, `commenters_is_floor`
  - `first_degree_pct`, `regular_pct`, `new_people`, `senior_title_pct`
- **View** (What works tab, under key findings):
  - A KPI row: people who engaged · % engaged only once · regulars (and how many on 6+ posts) · typical post (% regulars, median new people, % 1st-degree).
  - Then a per-post table, newest first: published, post (title + link, joined on `post_id` to `posts[]`), type, engagers, reactors, commenters (add "+" when `commenters_is_floor`), 1st-degree %, regulars %, new people, senior titles %, out-of-network % (from `posts[]`).
  - Show brag-type rows greyed out with the "not in stats" chip.
- **Definitions** to show under the table: a regular engaged with 3+ non-brag Creator Chart Era posts. New people = engaged for the first time in the era. Senior titles is a rough guide from headlines, not LinkedIn's seniority field.
- The data has no names. Keep it that way.

## 4. Acceptance checks (in addition to spec §8)
- The By type table shows 6 normal rows plus 2 greyed rows: Media mention / PR (4 posts) and Awards (1 post). Founder journey & milestones shows 9 posts.
- The What works note says 60 posts, 5 left out.
- Engagement KPIs show 132 people, 72% engaged once, 20 regulars (12 on 6+ posts), 67% regulars on a typical post, median 2 new people, 80% 1st-degree.
- The 18 Sep row in the engagement table is greyed out (438 new people).
- Still TG-only: no total impressions anywhere.
