# Creator Chart TG Dashboard: update brief for Antigravity (4 Oct 2026)

**From:** Mangesh Zope, Peaceful-Loans · **For:** whoever maintains the Creator Chart TG Dashboard in Antigravity · **Data in this package:** profile 1 Jan – 3 Oct 2026, company page 1 Jan – 2 Oct 2026

This update adds two new parts of the site: the **Peaceful-Loans page** and **Newsletter** tabs, which replace the "PENDING" placeholders. It also refreshes the data. The full requirements are in `creator_chart_dashboard_spec.md` (now **v5**). Where this brief and the spec differ, the spec wins.

## 1. What's in this package

| File | What it is | What to do with it |
|---|---|---|
| `ANTIGRAVITY_UPDATE_04Oct2026.md` | This brief. | Work through §2 in order. |
| `creator_chart_dashboard_spec.md` | Build spec **v5**. New: §4.8, §4.9, §7.7, §7.8; updated §6, §7.5, §7.6, §8, §9, §10. | Replace the spec in the project. |
| `creator_chart_dashboard_data.json` | New data with two new top-level sections, `company_page` and `newsletter`. TG-only, no total impressions. | Upload through `/admin` → Upload data, after step 2.3. |
| `reference_dashboard.html` | The matching claude.ai version, for look and behaviour (open it and click "Peaceful-Loans page" and "Newsletter"). | Visual reference only. **Do not reuse its embedded data.** |

If the site is still on spec v1 or v2 (no post-type dropdown), first do §3–§4 of the 28 Sep brief.

## 2. Steps

1. **Replace the spec** with v5.
2. **Types (spec §4.8, §4.9):** add optional `company_page` and `newsletter` to the data type:
   ```ts
   type CompanyPage = {
     note: string;
     visitors_monthly: { month_start: string; month_end: string; tg_page_views: number; tg_share_pct: number | null }[];
     visitors_12m: { start: string; end: string; tg_page_views: number; tg_share_pct: number };
     followers: { as_of: string; tg_followers: number; tg_share_pct: number };
   };
   type Newsletter = {
     name: string; note: string;
     editions: { activity_id: string; post_id: string | null; published: string; title: string; url: string;
                 tg_impressions_lifetime: number | null; tg_share_pct: number | null; tg_is_floor: boolean;
                 out_of_network_pct: number | null; engagements: number; comments: number; reposts: number }[];
     subscribers: { date: string; subscribers: number; tg_share_floor_pct: number }[];
   };
   ```
3. **Upload validation (spec §9):** accept the two new sections, and still accept files without them. Keep rejecting any key named `impressions`, `imp`, `members_reached` or `sv`. The new file passes this check.
4. **Source switcher (spec §6):** remove "PENDING". Make "Peaceful-Loans page" and "Newsletter" real views, kept in the URL hash (`#page`, `#newsletter`).
5. **Build the Peaceful-Loans page view (spec §7.7):** KPI tiles, monthly chart, month-on-month table, CSV download.
   - **Never show Page post impressions.** LinkedIn gives no viewer seniority for Page posts, so they're not in the data.
6. **Build the Newsletter view (spec §7.8):** KPI tiles, edition table, subscribers table, CSV download.
   - Every edition TG value in this file is a floor (`tg_is_floor: true`). Show "≥ " and the "TG may be higher" chip.
7. **Data tab (spec §7.6):** add the "Company page" and "Newsletter" download cards. Include both sections in the "Everything" JSON.
8. **Upload the new JSON** and check the header shows "Data to 3 Oct · built 04 Oct 2026".
9. **Run the §8 acceptance checks**, including the new Page and Newsletter rows. Watch these in particular:
   - Weekly 28 Sep – 3 Oct is a partial week.
   - Monthly October shows the "to 3 Oct" chip.
   - Key finding 4 now names **Opinion & life lessons** (spec §7.5). It must come from the data, not be hard-coded.

## 3. What changed in the profile data

- New days 1–3 Oct, the partial week 28 Sep – 3 Oct and the partial month 1–3 Oct.
- One new post: the 3 Oct newsletter edition's feed post, "I was recently talking to a client, a former…" (Client story).
- 20 more posts from the last 60 days were re-exported, so lifetime numbers moved slightly. For example, the top post is now 7,866 TG impressions.
