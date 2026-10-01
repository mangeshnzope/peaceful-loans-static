# Creator Chart TG Dashboard: update brief for Antigravity (1 Oct 2026)

**From:** Mangesh Zope, Peaceful-Loans · **For:** whoever maintains the Creator Chart TG Dashboard in Antigravity · **Data in this package:** 1 Jan – 30 Sep 2026

This is a **data-only update**. The JSON structure, field names and features are unchanged from spec v3, so no code changes are needed. The full requirements are in `creator_chart_dashboard_spec.md` (now v4). Where this brief and the spec differ, the spec wins.

## 1. What's in this package

| File | What it is | What to do with it |
|---|---|---|
| `ANTIGRAVITY_UPDATE_01Oct2026.md` | This brief. | Follow §2. |
| `creator_chart_dashboard_spec.md` | Build spec **v4** (dates, key-finding numbers and §8 test values updated). | Replace the spec in the project. |
| `creator_chart_dashboard_data.json` | New data, 1 Jan – 30 Sep 2026. TG-only, no total impressions. | Upload through `/admin` → Upload data. |
| `reference_dashboard.html` | The matching claude.ai version, for look and behaviour. | Visual reference only. **Do not reuse its embedded data.** |

If the site is still on spec v1 or v2 (no post-type dropdown), do §3–§4 of the 28 Sep brief first (`ANTIGRAVITY_UPDATE_28Sep2026.md`, kept in `_superseded/`).

## 2. Steps

1. Replace `creator_chart_dashboard_spec.md` in the project with the v4 file.
2. Sign in as an admin, open `/admin` → **Upload data**, and upload `creator_chart_dashboard_data.json`. Validation must pass: `meta.data_to` is `2026-09-30`, which is after the current `2026-09-27`.
3. Check that the header reads "Data to 30 Sep · built 01 Oct 2026".
4. Run the §8 acceptance checks. Watch these in particular:
   - **Weekly:** 28–30 Sep shows the "partial week" chip with no WoW, and the KPI tiles leave it out (still 17 Aug – 27 Sep, 6 weeks).
   - **Monthly:** September is now a **full month**. There's no "to 27 Sept" chip and it gets a MoM figure (+343%, −1.0 pts). The chip logic must come from dates, not be hard-coded.
   - **Posts:** 56 rows, 19 in the Creator Chart Era, and still 1 "edited" chip.
   - **Daily date picker:** max date is 30 Sep.
5. Don't touch the `post_type_overrides` collection. The one existing override (17 Sep post) is already in the file's `type` field.

## 3. What changed in the data

- New days 28, 29 and 30 Sep; new partial week 28–30 Sep; September re-exported as the full month.
- Two new posts:
  - 28 Sep "Feeling embarrassed about taking a home loan" (Opinion & life lessons)
  - 30 Sep "The day you bought your house 6 people made" (Bank & industry critique)
- 18 more posts from the last 60 days were re-exported, with their in/out-of-network split re-read. Lifetime numbers moved slightly; for example, the top post is now 7,811 TG impressions at 47.0%.
