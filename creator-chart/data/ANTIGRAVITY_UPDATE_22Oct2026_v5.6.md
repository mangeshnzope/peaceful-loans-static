# Creator Chart TG Dashboard: data update for Antigravity (22 Oct 2026, v5.6)

**From:** Mangesh Zope, Peaceful-Loans · **Data:** profile 1 Jan – 21 Oct 2026 (90-day windows to 21 Oct), company page to 20 Oct, newsletter snapshot 22 Oct

This is a **data refresh** of v5.5. It adds no new features. The spec (`creator_chart_dashboard_spec.md`, spec v5) and the v5.5 addendum (`ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`, also in this package) still describe everything to build. If v5.5 (brag types, engagement mix, Reach plan) is not built yet, build it first, then load this data.

`reference_dashboard.html` is the matching claude.ai version (v27), for visual reference only. Don't reuse its embedded data. Rules unchanged:
- Show only TG impressions, TG share and TG-derived estimates. Never show total impressions or total reach.
- Each grain comes from its own export; nothing is added up.

## 1. Steps
1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Replace `thumbs/` with this package's folder. It has 49 files; the new one is `7517836081090764800.jpg` (19 Oct post).
3. Check the header: "Data to 21 Oct · built 22 Oct 2026".
4. Run the spec §8 checks and the checks in §3 below.

## 2. What changed in the data
- **Profile:**
  - Daily rows 18–21 Oct.
  - Week 12–18 Oct is now complete; 19–21 Oct is a new partial week.
  - October runs to 21 Oct.
  - Both 90-day windows moved: 24 Jul–21 Oct and 25 Apr–23 Jul.
- **Posts:** 68 in total, with lifetime numbers re-exported for every post from the last 60 days. Two posts are new:
  - 19 Oct, `7517836081090764800`: Bank & industry critique, Real image (a Reddit screenshot about mis-selling).
  - 21 Oct, `7518545678244073473`: Client story, No image (TDS when buying from an NRI seller). It is one day old, so its numbers will grow.
- **Second Awards post:** the 17 Oct Creator Chart Top 200 post is type **Awards**, so Awards now has 2 posts. It stays out of all statistics, like before.
- **Company page:**
  - October visitors run 1–20 Oct.
  - The 12-month visitor and follower data covers 21 Oct 2025 – 20 Oct 2026.
- **Newsletter:**
  - 1,849 subscribers, with at least 32% in the TG.
  - No new edition.
  - The 10 Oct edition still has no TG split from LinkedIn.

## 3. Acceptance checks (with this data file)
- **Header:** "Data to 21 Oct · built 22 Oct 2026".
- **Weekly:**
  - 12–18 Oct: 2,998 TG impressions at 44% (5–11 Oct: 7,211 at 45%).
  - 19–21 Oct is marked partial and has no WoW.
- **Monthly:**
  - October (to 21 Oct): 12,586 at 45%, marked partial, with no MoM for TG impressions.
  - September: 12,860 at 40%.
- **Posts:** 68 rows, newest first is 21 Oct.
- **By type:**
  - 6 normal rows plus 2 greyed rows: Media mention / PR (4) and Awards (2).
  - Founder journey & milestones: 9 posts, median 926.
  - What works note: 62 posts, 6 left out.
- **Engagement:**
  - KPIs: 136 people, 99 engaged once (73%), 20 regulars (13 on 6+), 67% regulars, median 2 new, 80% 1st-degree.
  - The 18 Sep and 17 Oct rows are greyed out.
- **Reach plan:**
  - KPIs: 2.1× (previous 90 days 3.3×) · 16,140 TG people reached (est.; previous 4,601) · 34,375 TG impressions (44%).
  - Needed for 6×: 96,840, which is 2.8× today's TG impressions, or about 7,449 a week.
  - Table rows:
    - The 24 Jul–21 Oct and 25 Apr–23 Jul windows.
    - Oct, Sep, Aug, Jul.
    - Weeks 19–21 Oct back to 14–20 Sep.
  - Strategy row 2: 3.4 posts a week (last 8 full weeks).
  - Strategy row 4: slope −1.08 pts TG share per +10 pts out-of-network, and 80% 1st-degree.
  - Strategy row 7:
    - TG impressions: 282 with 0 comments vs 619 with 2+.
    - Out-of-network: 26.5% with 0 reposts vs 44% with 1+.
    - TG impressions by reposts: 443 vs 394.
    - TG share by reposts: 47.0% vs 45.0%.
- **Company page:**
  - September: 100 TG page views, 38.8%.
  - October (1–20 Oct): 46, 36.5%.
  - 154 TG followers.
- **Newsletter:**
  - The 3 Oct edition shows ≥703 TG impressions (≥46%).
  - The 10 Oct edition shows "–" with "TG may be higher".
- **TG-only everywhere:** no total impressions or total reach shown.

## 4. Files in this package
- `creator_chart_dashboard_data.json`: the data to upload. **This is the main file.**
- `thumbs/`: 49 post thumbnails, named `<post_id>.jpg`.
- `reference_dashboard.html`: the claude.ai dashboard v27, for visual reference only.
- `creator_chart_dashboard_spec.md`: spec v5, unchanged.
- `ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`: the feature addendum (brag types, engagement mix, Reach plan), unchanged.
- `ANTIGRAVITY_UPDATE_22Oct2026_v5.6.md`: this note.
