# Creator Chart TG Dashboard: update brief for Antigravity (28 Sep 2026)

**From:** Mangesh Zope, Peaceful-Loans · **For:** whoever maintains the Creator Chart TG Dashboard in Antigravity · **Data in this package:** 1 Jan – 27 Sep 2026

This brief tells you exactly what to change on the site we already built. The full, authoritative requirements are in `creator_chart_dashboard_spec.md` (v3). Where this brief and the spec differ, the spec wins.

---

## 1. What's in this package

| File | What it is | What to do with it |
|---|---|---|
| `ANTIGRAVITY_UPDATE_28Sep2026.md` | This brief. | Work through §3–§6 in order. |
| `creator_chart_dashboard_spec.md` | The full build spec, **v3**. Change log at the end. | Replace the old spec in the project. |
| `creator_chart_dashboard_data.json` | New data, 1 Jan – 27 Sep 2026. TG-only, no total impressions. | Upload through `/admin` → Upload data (§5). |
| `reference_dashboard.html` | The matching claude.ai version, for look and behaviour. | Visual reference only. **Do not reuse its embedded data.** |

## 2. Which version is the site on?

Check the header's "Data to … · built …" line, or ask whoever last deployed.

| Site currently shows | Built from | Do these sections |
|---|---|---|
| Data to 25 Sep | Spec v1 (26 Sep) | §3, §4, §5, §6 (everything) |
| Data to 26 Sep, no post-type dropdown | Spec v1 + 26 Sep data | §3, §4, §5, §6 |
| Data to 26 Sep, with post-type dropdown | Spec v2 (27 Sep) | §4, §5, §6 (skip §3) |

## 3. New feature: change a post's type (spec §7.4.1)

Skip this section if the site already has it.

### 3.1 Data model changes

The data file now carries three new fields. Update the TypeScript types (spec §4):

```ts
type Meta = { /* existing fields */ post_types: string[] };   // 6 types, display order
type Post = {
  post_id: string;      // LinkedIn post id (digits); stable key
  /* existing fields */
  type: string;         // the confirmed type (Claude's category or Mangesh's change)
  auto_type: string;    // Claude's original category
};
```

Treat `type !== auto_type` as "edited" everywhere (show the "edited" chip). In the 27 Sep file one post already differs: 17 Sep, "I have been using instahelp services across", `type` Founder journey & milestones, `auto_type` Client story. Mangesh changed it on the claude.ai dashboard.

### 3.2 Storage and API

1. **Firestore collection `post_type_overrides`**, one document per changed post:
   - Document id: `post_id`.
   - Body: `{ type, auto_type, title, changed_by, changed_at }`.
2. **`POST /api/post-type`** with body `{ post_id, type }`:
   - Verify the session and require role `admin`; otherwise return **403**.
   - Reject a `type` that is not in `meta.post_types` (400) and an unknown `post_id` (404).
   - If `type === auto_type` of that post in the current data file, **delete** the override document (this is the "undo").
   - Otherwise upsert the document.
   - Return the full, current override map `{ post_id: type }`.
3. **`GET /api/data`**: after loading the data file, apply the overrides on the server (`posts[i].type = override ?? posts[i].type`) and return the result. Viewers never call Firestore directly.
4. **Admin-only `GET /api/post-type/export`**: returns `{ post_id: type }` for every override, as a JSON download named `post_type_changes.json`. Mangesh gives this file to Claude so the claude.ai dashboard and future data files use the same types.

### 3.3 Posts tab UI

- **Viewers:** the Type cell is plain text plus an "edited" chip when `type !== auto_type`.
- **Admins:** the Type cell is a `<select>` with the 6 `meta.post_types`.
  - When the post is edited, the option equal to `auto_type` is labelled `"{type} (auto)"`. Picking it undoes the change.
  - On change: optimistic update, call `POST /api/post-type`, then show "Saving…", "Saved. What works has been recalculated." or the error. On a 403 show "Only Mangesh (or an admin) can change post types." and turn the cells back to plain text.
- **Info bar above the table (admins only):** "Don't agree with a post's type? Change it in the Type column. It saves for everyone, recalculates What works, and is kept on every data upload. To undo, pick the option marked '(auto)'." plus "{n} changed".
- **Category filter pills:** always the 6 `meta.post_types` in that order, each with its post count, after "All".
- **CSV download:** uses the effective type. Add an `auto_type` column after `type`.

### 3.4 Recalculating What works

When any post's effective type differs from `type` in the data file as loaded, recompute `insights.groups.cat` in the browser. Otherwise use the file's precomputed values. Format, era, day groups, correlations and the fit never depend on type, so keep them from the file.

```ts
// median over non-null values, rounded to 1 decimal
const median = (a: (number|null)[]) => {
  const v = a.filter((x): x is number => x != null).sort((x, y) => x - y);
  if (!v.length) return null;
  const m = v.length >> 1;
  const r = v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  return Math.round(r * 10) / 10;
};

// per type: n, tg, tgsum, sh, out, er, com  (tgsum counts null as 0)
// p-values: Kruskal–Wallis H with tie correction, over types with >= 3 non-null values
// (skip when fewer than 2 such types), p = upper tail of chi-square with (groups - 1) df,
// rounded to 3 decimals. Metrics: tg_impressions_lifetime, tg_share_pct,
// out_of_network_pct (-> p.outnet), engagement_rate_pct (-> p.er).
```

The chi-square upper tail is the regularized upper incomplete gamma Q((k−1)/2, H/2). Use a small, tested implementation (series for x < a+1, continued fraction otherwise), or a library such as `jstat`. Unit-test it against the values in §6.

## 4. Changes since spec v2 (all sites)

### 4.1 Partial weeks: detect from the dates

**Before:** the spec named "the last week (21–26 Sep)" as partial.
**Now:** a week is partial when `week_end − week_start < 6 days`. Compute it on every load; never hard-code it.

- In the 27 Sep file only 1–4 Jan is partial. **21–27 Sep is a full week**, so it shows WoW figures (−76%, −4.0 pts) and no "partial week" chip.
- After a mid-week refresh the newest week will be partial again. The same code must handle both.
- Update the footnote under the Weekly table to: "Weeks run Monday–Sunday, from one LinkedIn export per week. The first week (1–4 Jan) is partial, and so is the latest week until its Sunday is in; partial weeks get no WoW figure."

### 4.2 Weekly KPI tiles: no fixed end date

**Before:** "Creator Chart Era weeks (17 Aug – 20 Sep)".
**Now:** the Creator Chart Era window is **every full week starting on or after 17 Aug that has TG data**. The subtext shows the real range, e.g. "Creator Chart Era (17 Aug – 27 Sept) vs 1,547 (13 Apr – 2 Aug)".

```ts
const full = weekly.filter(w => days(w.week_start, w.week_end) === 6);
const era  = full.filter(w => w.week_start >= '2026-08-17' && w.tg_impressions != null);
const eraEnd = era.at(-1)?.week_end;
```

### 4.3 Key findings: generate every name, number and verdict

Findings 3, 4 and 6 used to have type names and verdict words typed in. With editable types they can change, so build them from the data (spec §7.5):

- **Finding 3:** the top two types by median TG impressions (types with ≥3 posts), the bottom two for contrast, the p-value and its verdict, the single biggest TG post (title, type, TG impressions), and the type with the lowest median TG share. Add "job-seekers are junior" only when that type is Hiring & team.
- **Finding 4:** the type with the highest median TG share. Say "highest out-of-network reach" / "highest engagement rate" only when it really is highest; otherwise give the plain value. Add how many Creator Chart Era posts are that type, and its median TG impressions per post.
- **Finding 6:** all four verdicts come from the era p-values.
- **Verdict words:** p < 0.05 → "reliable", 0.05–0.15 → "a lean", otherwise "not proven". Never type them in.
- **Note above the list:** when any type was changed, show "Includes {n} post type(s) changed by Mangesh."

### 4.4 Wording

- "Groups are small (5–12 posts)" is now "5–13 posts" (Founder journey & milestones has 13).
- Under the "By type of post" table add: "Mangesh can change any post's type in the Posts tab and this table recalculates."

## 5. Upload the new data

1. Sign in as admin, open `/admin`, choose **Upload data**, pick `creator_chart_dashboard_data.json`.
2. The upload must pass validation (spec §9):
   - It parses as JSON and has `meta`, `daily`, `weekly`, `monthly`, `posts`, `viewer_mix`, `insights`.
   - `meta.data_to` = `2026-09-27`, on or after the current one.
   - No key named `impressions`, `imp`, `members_reached` or `sv`.
   - **New for v3:** every post has a `post_id`, `type` and `auto_type`, and every `type` / `auto_type` is in `meta.post_types`.
3. After upload the header shows "Data to 27 Sept 2026 · built 28 Sep 2026".
4. **Overrides:** if you made type changes on the site before this upload, they still apply (they are keyed by `post_id`). Use "Clear overrides that match the file" to remove any that the new file already contains.
5. Keep the previous file as a rollback version.

## 6. Check it: acceptance values for the 27 Sep file

Every value below must match exactly (spec §8 has the full list).

| Where | Expected |
|---|---|
| Header | Data to 27 Sept 2026 · built 28 Sep 2026 |
| Daily · All 2026 | TG impressions **39,675** · TG share **44.3%** · engagements 1,765 · new followers 809 · posts 54 |
| Daily · Creator Chart Era (19 Aug – 27 Sep) | **14,440**, "+49% vs previous 40 days" (10 Jul – 18 Aug = 9,691) · share **42.8%**, "−3.1 pts" (previous 45.9%) |
| Daily · Last 7 days (21–27 Sep) | **2,111 / 38.8%**, −77% and −4.9 pts vs 14–20 Sep |
| Weekly · 21–27 Sep | **2,145, 38.0%**, full week, WoW **−76%**, **−4.0 pts** |
| Weekly · 14–20 Sep | 8,983, 42.0% |
| Weekly · KPI tiles | Avg weekly TG **2,477** (17 Aug – 27 Sept) vs 1,547 · TG share **41.6%** vs 44.5% · best week 14–20 Sep, 8,983 · best share 27 Jul – 2 Aug, 49.0% |
| Monthly · Sep 2026 | **12,230**, **40.0%**, chip "to 27 Sept" · Aug 2026: 2,906, 41.0% |
| Posts | 54 rows · 17 Creator Chart Era rows · **1 "edited" chip** (17 Sep instahelp post, Founder journey & milestones) |
| Posts · biggest TG post | "A 10000 crore listed company and peaceful loans", 18 Sep: **7,848**, 48.0%, 66% out-of-network |
| What works · By type (no site overrides) | Founder journey & milestones: n **13**, median TG **848**, total **19,681**, median share 46.0% · p-values tg **0.001**, sh **0.247**, outnet **0.386**, er **0.664** |
| What works · key findings | #3 names Founder journey & milestones (848) and Hiring & team (820) vs Client story (270.5, shown rounded as 271) and Opinion & life lessons (242), p 0.001, reliable · #4 names Bank & industry critique (47%, 55%, 2.5%) · #6: 29 → 47%, 1.5 → 2.5%, 46 → 45% (not proven), 588 → 297 (p 0.056, a lean) |
| Type-change test | Change 25 Sep "Your bank may just have lost a revenue" (`post_id` 7509209819720032256) to Hiring & team → Hiring & team n 6, median 756, total 4,933; Bank & industry critique n 6, median 418.5, total 2,466; p-values tg 0.001, sh 0.556, outnet 0.34, er 0.794. Undo → back to the row above. |
| Security | Signed-out `GET /api/data` → 401 · viewer `POST /api/post-type` → 403 · no dropdown for viewers |
| Rules | No total impressions or members reached anywhere (page source, API responses, downloads) · clean console · Lighthouse accessibility ≥ 90 · works at 375 px |

## 7. Prompt to paste into Antigravity

> Update the Creator Chart TG Dashboard to spec v3. Read `ANTIGRAVITY_UPDATE_28Sep2026.md` and `creator_chart_dashboard_spec.md` in full first.
> 1. If the post-type editing feature (spec §7.4.1) is missing, build it as described in §3 of the update brief: new `post_id` / `auto_type` / `meta.post_types` fields, Firestore `post_type_overrides`, `POST /api/post-type` (admin only), server-side merge in `/api/data`, the admin dropdown in the Posts tab, client-side recalculation of the type table with Kruskal–Wallis p-values, and the admin export of type changes.
> 2. Apply §4: detect partial weeks from dates, make the Weekly KPI window end at the last full Creator Chart Era week, generate key findings 3, 4 and 6 fully from data with verdict words from p-values, and update the wording.
> 3. Add the new upload validation in §5 and upload `creator_chart_dashboard_data.json`.
> 4. Add unit tests for the median, Kruskal–Wallis and range formulas using the values in §6, and make every check in §6 pass. Never add total impressions or members reached anywhere.
> Show me the diff and the test results before deploying.
