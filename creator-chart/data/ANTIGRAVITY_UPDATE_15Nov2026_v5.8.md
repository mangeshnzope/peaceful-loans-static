# Creator Chart TG Dashboard: update for Antigravity (15 Nov 2026, v5.8)

**From:** Mangesh Zope, Peaceful-Loans · **Data:** profile 1 Jan – 14 Nov 2026 (90-day windows to 14 Nov), company page to 13 Nov, newsletter snapshot 15 Nov

This update is a **data refresh of v5.7 plus one small change to the Weekly tab** (§2). The spec (`creator_chart_dashboard_spec.md`, spec v5) and the v5.5 addendum (`ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`) still describe everything else. If v5.5 (brag types, engagement mix, Reach plan) is not built yet, build it first.

`reference_dashboard.html` is the matching claude.ai version (v30), for visual reference only. Don't reuse its embedded data. Rules unchanged:
- Show only TG impressions, TG share and TG-derived estimates. Never show total impressions or total reach.
- Each grain comes from its own export; nothing is added up.

## 1. Steps
1. Make the Weekly tab change in §2.
2. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
3. Replace `thumbs/` with this package's folder. It still has 52 files. The 5 new posts that have images have no thumbnail yet. Show the usual "no thumbnail" placeholder for them; thumbnails will come in the next package.
4. Check the header: "Data to 14 Nov · built 15 Nov 2026".
5. Run the spec §8 checks and the checks in §4 below. The new numbers in §4 replace the old Weekly KPI tile values in spec §8.

## 2. Weekly tab change (replaces the KPI tile table in spec §7.2)
Mangesh asked for two things: (a) the latest week compared with the week before, shown first; (b) a before/after baseline the same length as the Creator Chart Era, in place of the hand-picked 13 Apr – 2 Aug.

Six tiles, laid out as **2 rows × 3** on desktop (`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`) and stacked on mobile:

| # | Tile | Main value | Subtext |
|---|---|---|---|
| 1 | Latest full week, TG impressions | `tg` of the newest **full** Mon–Sun week with data | "<dates>: <±x%> vs <prev tg> (<prev dates>)". % = (latest − prev) ÷ prev; green if ≥0, red if <0 |
| 2 | Latest full week, TG share | `share` of that week | "<±x.x pts> vs <prev share> the week before"; green/red as above |
| 3 | Avg weekly TG impressions | Mean `tg` over all full weeks starting on or after 17 Aug with data | "Creator Chart Era (N weeks, 17 Aug – <end>) vs <avg> in the M weeks before onboarding (11 May – 2 Aug)" |
| 4 | TG share, Creator Chart Era | Σtg ÷ Σ(tg/share) over the same weeks | "vs <share> in the M weeks before onboarding (11 May – 2 Aug)" |
| 5 | Best week, TG impressions | Unchanged | Unchanged |
| 6 | Best week, TG share | Unchanged | Unchanged |

- **"Before" baseline:** full weeks whose start is between **11 May and 27 Jul 2026** (the 12 full weeks before onboarding on 1 Aug). This replaces 13 Apr – 2 Aug everywhere on the Weekly tab.
- "Previous week" = the full week just before the latest full week. Partial weeks never count for tiles 1–4.
- Add one sentence to the note under the week-on-week table: *The "before" comparison in the cards above uses the 12 full weeks before Creator Chart onboarding (11 May – 2 Aug), so the two periods are about the same length.*

## 3. What changed in the data
- **Profile:**
  - Daily rows 27 Oct – 14 Nov (19 days).
  - Weeks 26 Oct – 1 Nov and 2–8 Nov are complete; 9–14 Nov is a new partial week.
  - October is now complete; November runs 1–14 Nov.
  - Both 90-day windows moved: 17 Aug – 14 Nov and 19 May – 16 Aug.
- **Posts:** 80 in total, with lifetime numbers re-exported for every post from the last 60 days. Nine posts are new:

  | Date | Post id | Type | Image |
  |---|---|---|---|
  | 14 Nov | 7527244337932574720 | Founder journey & milestones | No image |
  | 12 Nov | 7526538909279744000 | Opinion & life lessons | AI-generated image |
  | 10 Nov | 7525811196332269568 | Bank & industry critique | No image |
  | 5 Nov | 7523973515906179072 | Client story | No image |
  | 3 Nov | 7523261464392921088 | Bank & industry critique | Real image |
  | 2 Nov | 7522925128939106304 | Client story | Real image |
  | 31 Oct | 7522184453125902336 | Home-loan explainer (newsletter edition feed post) | AI-generated image |
  | 29 Oct | 7521488028213596160 | **Media mention / PR** (quoted in Mint) | Real image |
  | 28 Oct | 7521077182941605889 | Client story | No image |

  The 29 Oct post is a brag type, so it is greyed out and left out of What works.
- **Company page:**
  - October visitors are complete; November runs 1–13 Nov.
  - The 12-month visitor and follower data covers 14 Nov 2025 – 13 Nov 2026.
- **Newsletter:**
  - 1,874 subscribers, at least 32% of them TG.
  - One new edition: 31 Oct, "Home Loan Prepayment vs. Investing: I Paid Off My Home Loan 8 Years Early. Who Is Actually Right?"
  - The 10 Oct edition still has no TG split from LinkedIn. In this file its TG value is 0, not missing, so display it as "–" with "TG may be higher", not "≥ 0".
- **Engagement:** unchanged from v5.7. It was not re-scraped in this refresh.

## 4. Acceptance checks (with this data file)
- **Header:** "Data to 14 Nov · built 15 Nov 2026".
- **Weekly tiles:**
  - Latest full week: **1,876** (2–8 Nov), **−79%** vs 8,877 (26 Oct – 1 Nov).
  - TG share: **42.0%**, **−2.0 pts** vs 44.0%.
  - Avg weekly TG impressions: **3,388** (12 weeks, 17 Aug – 8 Nov) vs **1,299** (12 weeks, 11 May – 2 Aug).
  - TG share, Creator Chart Era: **43.4%** vs **45.7%**.
  - Best week: 14–20 Sep, 8,983. Best share: 27 Jul – 2 Aug, 49.0%.
- **Weekly table:**
  - 9–14 Nov: 2,274 at 48.0%, partial, no WoW.
  - 2–8 Nov: 1,876 at 42.0%, WoW −79%, −2.0 pts.
  - 26 Oct – 1 Nov: 8,877 at 44.0%, WoW +197%.
- **Monthly:**
  - October: 23,250 at 45%.
  - November (to 14 Nov): 4,189 at 44%, marked partial, with no MoM for TG impressions.
  - September: 12,860 at 40%.
- **Posts:** 80 rows, and the newest (first) row is 14 Nov.
- **By type:**
  - 6 normal rows plus 2 greyed rows: Media mention / PR (5) and Awards (2).
  - Founder journey & milestones: 10 posts, median 985.
  - Client story: 16 posts, median 443.
  - What works note: 73 posts, 7 left out.
  - Type p-values: TG impressions p 0.010, TG share p 0.094.
- **Engagement:** same as v5.7 (177 people, 132 engaged once (75%), 21 regulars (15 on 6+), 67% regulars, median 2 new, 80% 1st-degree).
- **Reach plan:**
  - KPIs:
    - TG frequency 2.3× over 17 Aug – 14 Nov (the previous 90 days were also 2.3×).
    - 18,615 TG people reached (est.; previous 6,263).
    - 42,358 TG impressions (43.0%).
  - Needed for 6×: 111,690, which is 2.6× today's TG impressions, or about 8,592 a week.
  - Strategy row 2: about 3.6 posts a week (last 8 full weeks).
  - Strategy row 4: about −0.99 pts TG share per +10 pts out-of-network, and 80% 1st-degree.
  - Strategy row 7:
    - TG impressions: 315 with no comments vs 691 with 2+.
    - Out-of-network: 27% with no reposts vs 45% with 1+.
    - TG impressions by reposts: 443 vs 426.
    - TG share by reposts: 47.0% vs 45.0%.
- **Company page:**
  - October: 76 TG page views, 41.8% (−24% and +3.0 pts vs September).
  - September: 100, 38.8%.
  - November (to 13 Nov): 26, 68.4%.
  - 160 TG followers (38.9%).
  - Last 12 months: 780 TG page views, 43.1%.
- **Newsletter:**
  - KPIs: 1,874 subscribers; ≥ 32% TG.
  - Latest edition: ≥ 308 TG impressions (31 Oct, ≥ 48.0%).
  - 2026 editions: median 269 TG impressions over 10 editions.
  - The 3 Oct edition shows 745 TG impressions (43.0%).
  - The 10 Oct edition shows "–" (see §3).
- **TG-only everywhere:** no total impressions or total reach shown.

## 5. Files in this package
- `creator_chart_dashboard_data.json`: the data to upload. **This is the main file.**
- `thumbs/`: 52 post thumbnails, named `<post_id>.jpg` (no new ones this time).
- `reference_dashboard.html`: the claude.ai dashboard v30, for visual reference only (it shows the new Weekly tiles).
- `creator_chart_dashboard_spec.md`: spec v5, unchanged apart from §2 of this note.
- `ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`: the feature addendum (brag types, engagement mix, Reach plan), unchanged.
- `ANTIGRAVITY_UPDATE_15Nov2026_v5.8.md`: this note.
