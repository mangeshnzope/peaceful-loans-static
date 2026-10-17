# Creator Chart TG Dashboard: update for Antigravity (17 Oct 2026, v5.5)

**From:** Mangesh Zope, Peaceful-Loans · **Data:** profile 1 Jan – 16 Oct 2026 (90-day windows to 16 Oct), company page to 14 Oct, newsletter snapshot 17 Oct

This package replaces v5.3 and v5.4. It carries three additions on top of spec v5 (`creator_chart_dashboard_spec.md`, included again); this note is the addendum.
- **§2:** brag post types left out of the statistics.
- **§3:** the engagement mix.
- **§4:** a new **Reach plan** view for the goal of 6+ impressions per TG member, organically.

`reference_dashboard.html` is the matching claude.ai version (v25), for visual reference only. Don't reuse its embedded data. Rules unchanged: show only TG impressions, TG share and TG-derived estimates; never total impressions or total reach. Each grain comes from its own export; nothing is added up.

## 1. Steps
1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Replace `thumbs/` with this package's folder (47 files, unchanged).
3. Check the header: "Data to 16 Oct · built 17 Oct 2026".
4. Build §2–§4, then run the spec §8 checks plus the checks in §5 below.

## 2. Brag post types: shown, but never in the statistics
- `meta.post_types` now has 8 types. It adds **"Media mention / PR"** (press quotes or features used as a humble brag) and **"Awards"** (award wins, e.g. BW 40 Under 40).
- `meta.post_types_excluded_from_stats` = `["Awards", "Media mention / PR"]`. `insights.excl` holds the same list.
- **Posts table:** show these posts as normal. Add both types to the type filter and the type dropdown.
- **What works:** leave them out of every statistic: medians, p-values, correlations, the scatter, key findings and the Reach plan figures. That includes recalculating after an edit. A post changed to one of these types drops out at once.
- **"By type" table:** `insights.groups.cat.rows[]` entries with `"ex": true` are the excluded types. Show them at the bottom, greyed out, with a "not in stats" chip. Don't highlight them as best, and leave them out of the p-value row.
- The tab note says how many posts are left out and why: wins and press mentions can't be produced every week, so they shouldn't steer what to post.

## 3. Engagement mix: who engages, the same people or new ones? (What works tab)
- `engagement.summary`: `posts`, `people`, `engaged_once`, `regulars`, `regulars_6plus`, `median_regular_pct`, `median_new_people`, `median_first_degree_pct`. It covers non-brag Creator Chart Era posts.
- `engagement.posts[]`: one row per Creator Chart Era post, with these fields:
  - `post_id`, `published`, `type`
  - `engagers`, `reactors`, `commenters`, `commenters_is_floor`
  - `first_degree_pct`, `regular_pct`, `new_people`, `senior_title_pct`
- **View:**
  - A KPI row: people · % engaged once · regulars (6+ count) · typical post (% regulars, median new people, % 1st-degree).
  - Then a table, newest first: published, post (title + link via `post_id` → `posts[]`), type, engagers, reactors, commenters ("+" if floor), 1st-degree %, regulars %, new people, senior titles %, out-of-network % (from `posts[]`).
  - Brag rows are greyed out.
- **Definitions** to show under the table: a regular engaged with 3+ non-brag Creator Chart Era posts. New people = first engagement in the era. Senior titles is a rough guide from headlines, not LinkedIn's seniority field. The data has no names; keep it that way.

## 4. NEW: Reach plan view (profile section, after What works)
**Goal:** every TG member sees us 6+ times over a rolling 90 days, organically. Mangesh has ruled out paid promotion; amplification comes from people (comments and quote-reposts).

**Data**
- `tg_frequency.goal` = 6. `tg_frequency.note` explains the method; show it on the page.
- `tg_frequency.windows_90d[]`: `start`, `end`, `tg_impressions`, `tg_share_pct`, `tg_people_reached_est`, `tg_frequency_est`. There are two rows: the rolling 90 days and the 90 days before.
- `weekly[]` and `monthly[]` now also carry `tg_people_reached_est` and `tg_frequency_est`.
- Method: TG frequency (est.) = impressions ÷ members reached in that period's own export. TG people reached (est.) = members reached × TG share. LinkedIn has no reach by seniority, so this assumes TG viewers see posts as often as everyone else. Label both "est.".

**Layout**
1. **Intro note:** the definition, the estimate caveat, and that the goal is measured over 90 days with no paid promotion.
2. **KPI row** (latest 90-day window), with the first KPI highlighted:
   - TG frequency, last 90 days: `2.1×`, with "goal 6× · previous 90 days 3.3×".
   - TG people reached (est.): `16,281` (previous `4,189`).
   - TG impressions: `34,567` (TG share 44%).
   - Needed for 6× on that reach = `tg_people_reached_est × 6` = `97,686`. Show it as "2.8× today's TG impressions, or about 7,514 a week" (needed ÷ current TG impressions; needed ÷ 13 weeks).
3. **"TG frequency by period" table:**
   - Rows: both 90-day windows, then the last 4 months, then the last 6 weeks, newest first.
   - Columns: period, grain (90 days / Month / Week), TG impressions, TG share, TG people reached (est.), TG frequency (est.).
   - Frequency is a progress bar to 6 (bar width = min(freq/6, 1)); green when ≥ 6.
   - Creator Chart Era rows are shaded.
   - Note: compare only rows of the same length, because longer windows always show higher frequency.
4. **"Strategy: what to do, and what the data says" table.** Three columns: Lever · What the data says · Target / next step. Compute every number from the data file (non-brag posts only) so it updates on each upload:

| # | Lever | What the data says (compute) | Target / next step (fixed text) |
|---|---|---|---|
| 1 | Measure frequency on a fixed TG pool over 90 days | Latest vs previous 90-day frequency and TG people reached ("reach grew, frequency fell") | Target 6× over rolling 90 days; track the 90-day row every refresh |
| 2 | Post more often, at a steady rhythm, in series | Average `posts_published` per week over the last 8 full weeks (now 3.3) | 5 posts a week at the same times; themes as 3–4 post series |
| 3 | Lean on the types that bring the most TG impressions | Median TG impressions per post by type (from `insights.groups.cat.rows`, non-ex, n≥3), and the TG share range with the type p-value | 1–2 posts a week of the top type excluding Hiring & team (now Founder journey & milestones); the next two as the base. Hiring & team has the lowest TG share (40%): post it when hiring, not for awareness |
| 4 | Stay TG-dense: grow the network inside the TG | `insights.fit.slope10` (−1.04 pts TG share per +10 pts out-of-network) and `engagement.summary.median_first_degree_pct` (80%) | 20–30 connection requests a week to founders, CXOs, VPs and partners in our cities |
| 5 | Get new TG people engaging, not just the regulars | `engagement.summary` people / % once / regulars / median new people | Comment daily on TG creators' posts; end posts with a question a senior professional would answer; tag 1–2 relevant people |
| 6 | Repeat each message on every surface | Latest newsletter subscribers (≥ TG floor %) and company page TG followers | One idea a week as a post, a newsletter section and a team reshare |
| 7 | Amplify through people, not paid: comments and quote-reposts from TG voices | From `posts[]` (non-brag): median TG impressions with `comments`=0 vs ≥2 (282 vs 637); median out-of-network with `reposts`=0 vs ≥1 (26.5% vs 44%); median TG impressions (443 vs 379) and TG share (47.0% vs 44.5%) with reposts 0 vs ≥1. Add "correlations, not proof; most posts have 0–1 reposts" | No paid promotion. Line up 5–10 senior voices (founders, CXOs, wealth advisers, journalists) to comment in the first hours and to quote-repost with their own take. A plain repost from a non-TG account mostly adds non-TG views; a thoughtful TG comment beats a like |

5. **Footnote:** "Numbers update on every refresh. Awards and Media mention / PR posts are left out of the type and engagement figures. No paid promotion."

## 5. Acceptance checks (in addition to spec §8)
- **By type:**
  - 6 normal rows plus 2 greyed rows: Media mention / PR (4) and Awards (1).
  - Founder journey & milestones: 9 posts, median 926.
  - What works note: 60 posts, 5 left out.
- **Engagement:**
  - KPIs: 132 people, 72% once, 20 regulars (12 on 6+), 67% regulars, median 2 new, 80% 1st-degree.
  - The 18 Sep row is greyed out.
- **Reach plan:**
  - KPIs 2.1× · 16,281 · 34,567 · 97,686.
  - Table rows: the 19 Jul–16 Oct and 20 Apr–18 Jul windows, then Oct, Sep, Aug, Jul, then weeks 12–16 Oct back to 7–13 Sep.
  - Strategy row 7 shows 282 vs 637, 26.5% vs 44%, 443 vs 379.
- TG-only everywhere: no total impressions or total reach shown.
