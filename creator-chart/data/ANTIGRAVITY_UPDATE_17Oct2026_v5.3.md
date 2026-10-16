# Creator Chart TG Dashboard: data update for Antigravity (17 Oct 2026, v5.3)

**From:** Mangesh Zope, Peaceful-Loans · **Data in this file:** profile 1 Jan – 16 Oct 2026, company page to 14 Oct 2026, newsletter subscriber snapshot 17 Oct

A data refresh. The spec is still **v5** (`creator_chart_dashboard_spec.md`, included again), with the optional image-type fields and thumbnails from v5.2. `reference_dashboard.html` is the matching claude.ai version, for visual reference only. Don't reuse its embedded data.

## 1. Steps

1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Replace the site's `thumbs/` folder with the one in this package. It has 47 files and none are new: the 3 new posts have no image.
3. Check that the header shows "Data to 16 Oct · built 16 Oct 2026".
4. Run the spec §8 acceptance checks. In particular:
   - Week 5–11 Oct is now complete. Week 12–16 Oct is new and partial (it should show the "to 16 Oct" chip and no WoW).
   - Monthly: October is partial, 1–16 Oct.
   - Company page: the October month runs 1–14 Oct (partial).

## 2. What changed in the data

- **Days:** 12–16 Oct added. **Weeks:** 5–11 Oct is complete; 12–16 Oct is new. **Month:** October now runs to 16 Oct.
- **Posts:** 3 new, 65 in total. All 3 are text-only ("No image").
  - 12 Oct: Home-loan explainer (loan reset dates)
  - 14 Oct: Home-loan explainer (fixed vs floating rate)
  - 16 Oct: Bank & industry critique (IDBI sale to Fairfax)
- **Lifetime numbers:** every post from the last 60 days was re-exported, so its lifetime numbers changed.
- **Company page:** the October month is now 1–14 Oct. The 12-month windows (visitors, followers) are now 15 Oct 2025 – 14 Oct 2026.
- **Newsletter:** subscriber snapshot added for 17 Oct (1,844). There is no new edition since 10 Oct. The 10 Oct edition still has no TG split from LinkedIn (null), so show it as "–".
- TG-only as always. The file has no total impressions anywhere.
