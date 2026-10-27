# Creator Chart TG Dashboard: data update for Antigravity (27 Oct 2026, v5.7)

**From:** Mangesh Zope, Peaceful-Loans · **Data:** profile 1 Jan – 26 Oct 2026 (90-day windows to 26 Oct), company page to 25 Oct, newsletter snapshot 27 Oct

This is a **data refresh** of v5.6. It adds no new features. The spec (`creator_chart_dashboard_spec.md`, spec v5) and the v5.5 addendum (`ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`, also in this package) still describe everything to build. If v5.5 (brag types, engagement mix, Reach plan) is not built yet, build it first, then load this data.

`reference_dashboard.html` is the matching claude.ai version (v28), for visual reference only. Don't reuse its embedded data. Rules unchanged:
- Show only TG impressions, TG share and TG-derived estimates. Never show total impressions or total reach.
- Each grain comes from its own export; nothing is added up.

## 1. Steps
1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Replace `thumbs/` with this package's folder. It has 52 files; the 3 new ones are:
   - `7519324827313188864.jpg` (23 Oct post)
   - `7519654264315662336.jpg` (24 Oct newsletter edition post)
   - `7520366143191134208.jpg` (26 Oct post)
3. Check the header: "Data to 26 Oct · built 27 Oct 2026".
4. Run the spec §8 checks and the checks in §3 below.

## 2. What changed in the data
- **Profile:**
  - Daily rows 22–26 Oct.
  - Week 19–25 Oct is now complete; 26 Oct (Monday) is a new partial week.
  - October runs to 26 Oct.
  - Both 90-day windows moved: 29 Jul–26 Oct and 30 Apr–28 Jul.
- **Posts:** 71 in total, with lifetime numbers re-exported for every post from the last 60 days. Three posts are new:
  - 23 Oct, `7519324827313188864`: Opinion & life lessons, Real image (a press clipping about an unlisted-stock mistake).
  - 24 Oct, `7519654264315662336`: Opinion & life lessons, AI-generated image (the feed post for the newsletter edition "Vacation homes").
  - 26 Oct, `7520366143191134208`: Bank & industry critique, Real image (a Reddit screenshot about an 810 credit score). It is one day old, so its numbers will grow.
- **Company page:**
  - October visitors run 1–25 Oct.
  - The 12-month visitor and follower data covers 26 Oct 2025 – 25 Oct 2026.
- **Newsletter:**
  - 1,855 subscribers, with at least 32% in the TG.
  - One new edition: 24 Oct, "Vacation homes: the retreat that never lets you retreat".
  - The 10 Oct edition still has no TG split from LinkedIn.

## 3. Acceptance checks (with this data file)
- **Header:** "Data to 26 Oct · built 27 Oct 2026".
- **Weekly:**
  - 19–25 Oct: 2,991 TG impressions at 45% (12–18 Oct: 2,998 at 44%).
  - 26 Oct is marked partial and has no WoW.
- **Monthly:**
  - October (to 26 Oct): 14,393 at 44%, marked partial, with no MoM for TG impressions.
  - September: 12,860 at 40%.
- **Posts:** 71 rows, newest first is 26 Oct.
- **By type:**
  - 6 normal rows plus 2 greyed rows: Media mention / PR (4) and Awards (2).
  - Founder journey & milestones: 9 posts, median 926.
  - What works note: 65 posts, 6 left out.
- **Engagement:**
  - KPIs: 177 people, 132 engaged once (75%), 21 regulars (15 on 6+), 67% regulars, median 2 new, 80% 1st-degree.
  - The 18 Sep and 17 Oct rows are greyed out.
- **Reach plan:**
  - KPIs: 2.2× (previous 90 days 2.7×) · 13,569 TG people reached (est.; previous 6,724) · 29,985 TG impressions (41%).
  - Needed for 6×: 81,414, which is 2.7× today's TG impressions, or about 6,263 a week.
  - Table rows:
    - The 29 Jul–26 Oct and 30 Apr–28 Jul windows.
    - Oct, Sep, Aug, Jul.
    - Weeks 26 Oct back to 21–27 Sep.
  - Strategy row 2: 3.5 posts a week (last 8 full weeks).
  - Strategy row 4: slope −1.11 pts TG share per +10 pts out-of-network, and 80% 1st-degree.
  - Strategy row 7:
    - TG impressions: 282 with 0 comments vs 691 with 2+.
    - Out-of-network: 26% with 0 reposts vs 45% with 1+.
    - TG impressions by reposts: 443 vs 395.
    - TG share by reposts: 47.0% vs 45.0%.
- **Company page:**
  - September: 100 TG page views, 38.8%.
  - October (1–25 Oct): 67, 39.9%.
  - 156 TG followers.
- **Newsletter:**
  - 24 Oct edition shows ≥80 TG impressions (≥22%) with "TG may be higher".
  - The 3 Oct edition shows 774 TG impressions (47%).
  - The 10 Oct edition shows "–" with "TG may be higher".
- **TG-only everywhere:** no total impressions or total reach shown.

## 4. Files in this package
- `creator_chart_dashboard_data.json`: the data to upload. **This is the main file.**
- `thumbs/`: 52 post thumbnails, named `<post_id>.jpg`.
- `reference_dashboard.html`: the claude.ai dashboard v28, for visual reference only.
- `creator_chart_dashboard_spec.md`: spec v5, unchanged.
- `ANTIGRAVITY_UPDATE_17Oct2026_v5.5.md`: the feature addendum (brag types, engagement mix, Reach plan), unchanged.
- `ANTIGRAVITY_UPDATE_27Oct2026_v5.7.md`: this note.
