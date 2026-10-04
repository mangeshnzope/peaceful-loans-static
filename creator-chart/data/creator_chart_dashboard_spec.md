# Creator Chart TG Dashboard: build spec for Antigravity

**Owner:** Mangesh Zope, Peaceful-Loans · **Spec date:** 4 Oct 2026 (v5) · **Data covers:** profile 1 Jan – 3 Oct 2026; company page 1 Jan – 2 Oct 2026

Build a password-protected web app where the Creator Chart team logs in and sees how well Mangesh Zope's LinkedIn content reaches Peaceful-Loans' target audience (TG). This file is the complete brief. Three files come with it:

| File | What it is |
|---|---|
| `creator_chart_dashboard_spec.md` | This spec. |
| `creator_chart_dashboard_data.json` | The only data source. It holds TG-only numbers and **contains no total impressions by design**. |
| `reference_dashboard.html` | The working single-file version, built on claude.ai. Use it as the visual and behavioural reference. Its data format is internal, so **do not** reuse its embedded data; load the JSON above instead. |

---

## 1. Goal and audience

- **Who uses it:** the Creator Chart team (Peaceful-Loans' content creator partner, onboarded 1 Aug 2026) plus Mangesh.
- **Question it answers:** *"Is our content reaching our TG, and which kinds of posts do it best?"*
- **TG (target group):** LinkedIn viewers whose **seniority** is **Manager, Director, VP, Owner, CXO or Partner**. This is the closest LinkedIn proxy for ₹50L+ income households taking ₹2 Cr+ home loans.
- **Creator Chart Era:** starts **19 Aug 2026**, the first creator-made post. The creator was onboarded on 1 Aug 2026.

## 2. Non-negotiable rules

1. **Never show total impressions or members reached, anywhere.** That covers UI, tooltips, CSV downloads, API responses and page source. The team is judged only on TG. The data file has no such fields; do not try to derive or back-calculate them.
2. **Two headline metrics everywhere:**
   - **TG impressions:** views from TG viewers.
   - **TG share:** the % of all views that came from TG. This is the "dog-whistle" signal: content made for the TG, which the algorithm then pushes to the TG.
3. **All growth figures are on TG impressions or TG share.** That means WoW, MoM, period-vs-previous and Creator Chart Era vs Before.
4. **Each grain comes from its own LinkedIn export, and nothing is added up to make another grain.**
   - The Weekly tab uses `weekly` rows only.
   - The Monthly tab uses `monthly` rows only.
   - The Posts tab uses `posts` rows only.
   - The only aggregation allowed is the **Daily tab's custom date range**, which sums `daily` rows inside the chosen range.
5. **Label:** always write "Creator Chart Era", never "creator era".
6. **Missing splits are never zero.** When LinkedIn gave no usable seniority split, `tg_impressions` / `tg_share_pct` are `null`. Show them as "–" or "below LinkedIn threshold", never as 0.

## 3. Access and security (password protection)

**Requirement:** nobody sees any data without logging in. The data must **never** be in the public JS bundle or any static public URL.

### Recommended stack (Google-native, fits Antigravity)

- **Framework and hosting:** Next.js (App Router, TypeScript) on Firebase App Hosting (or Cloud Run).
- **Auth:** Firebase Authentication, email + password.
  - Self sign-up is **off**; an admin creates the accounts.
  - Allowlist check on the server: the email must be in an `ALLOWED_EMAILS` env var or a Firestore `users` collection with `role: viewer|admin`.
- **Data storage:** `creator_chart_dashboard_data.json` lives in Cloud Storage (private bucket) or in the server's `/data` folder, outside `public/`.
- **Data access:** served only through `GET /api/data`. That route verifies the Firebase ID token (or session cookie) on the server and returns the JSON only to allowlisted users.
- **Session:** a Firebase session cookie, httpOnly, Secure, SameSite=Lax, 7-day expiry, plus a logout button.
- **Login page (`/login`):**
  - Content: Peaceful-Loans wordmark as text only (no logo file needed), email, password, "Sign in" button, and a generic error message ("Email or password is incorrect").
  - Rate limiting: 5 failed attempts per 15 min per IP/email.
- **Routes:** everything except `/login` redirects to `/login` when there is no valid session (middleware).
- **Admin extras (role `admin`, i.e. Mangesh):** an `/admin` page to upload a new data JSON (see §9) and to add or remove team emails.

### Simpler fallback, if Firebase isn't wanted

Use one shared team password.

- **Password storage:** store it only as a bcrypt hash in env var `TEAM_PASSWORD_HASH`.
- **Session:** on success, issue a signed httpOnly cookie (e.g. `iron-session`) with a 7-day expiry.
- **Data access:** `/api/data` still checks the cookie server-side.
- **Never do this:** check the password in client-side JavaScript, or ship the data in a static file.

### Other security requirements

- **HTTPS only.**
- **Search engines:** add `robots: noindex, nofollow`.
- **Headers:** a strict Content-Security-Policy, with no third-party scripts except Google Fonts.
- **Logging:** never log the data payload.

## 4. Data file: `creator_chart_dashboard_data.json`

Load it once after login from `/api/data` and keep it in memory. All values are numbers, strings, booleans or `null`. Dates are `YYYY-MM-DD` (IST calendar dates).

### 4.1 `meta`

| Field | Type | Meaning |
|---|---|---|
| `built` | string | When the data was built, e.g. "28 Sep 2026". |
| `data_from`, `data_to` | date | First and last day covered. |
| `tg_definition` | string[] | `["Manager","Director","VP","Owner","CXO","Partner"]` |
| `creator_chart_era_start` | date | `2026-08-19` |
| `creator_onboarded` | date | `2026-08-01` |
| `post_types` | string[] | The 6 post types, in display order (§7.5). The type picker in §7.4 offers exactly these. |
| `notes` | string | Plain-English definition. |

### 4.2 `daily[]`: one row per day, from one LinkedIn export per day

| Field | Type | Notes |
|---|---|---|
| `date` | date | |
| `tg_impressions` | int \| null | `null` = LinkedIn gave no usable split (quiet day, under ~50 views). |
| `tg_share_pct` | number \| null | % of that day's views from TG. |
| `tg_may_be_higher` | bool | LinkedIn hid some small seniority groups, so TG is a floor. Show the chip "TG may be higher". |
| `engagements` | int | Reactions + comments + reposts that day. |
| `new_followers` | int | |
| `posts_published` | int | Posts published that day. |

### 4.3 `weekly[]`: Monday–Sunday, one export per week

Fields: `week_start`, `week_end`, `tg_impressions`, `tg_share_pct`, `tg_may_be_higher`, `engagements`, `new_followers`, `posts_published`.

- **Partial weeks:** a partial week is one where `week_end - week_start < 6 days`. Detect it from the dates on every load; never hard-code which weeks are partial. In the 3 Oct file two weeks are partial: the first (1–4 Jan) and the latest (28 Sep – 3 Oct), which gets a "partial week" chip and no WoW figure. Once its Sunday is in, it becomes a full week.

### 4.4 `monthly[]`: calendar month, one export per month

Fields: `month_start`, `month_end`, `tg_impressions`, `tg_share_pct`, `tg_may_be_higher`, `engagements`, `new_followers`, `posts_published`.

- **Partial month:** the latest month is partial, with `month_end` before the month's last day.

### 4.5 `posts[]`: every post published in 2026, one export per post (lifetime numbers)

| Field | Type | Notes |
|---|---|---|
| `post_id` | string | LinkedIn post id (digits). Stable key for a post; use it to store type changes (§7.4.1). |
| `published` | date | |
| `weekday` | "Mon"…"Sun" | |
| `time` | string | e.g. "4:48 PM" |
| `title` | string | Opening words of the post. |
| `url` | string | LinkedIn post URL. Open it in a new tab. |
| `type` | string | One of the 6 `meta.post_types`: the type Mangesh has confirmed (Claude's category, or his change made on the claude.ai dashboard). |
| `auto_type` | string | Claude's original category. Equals `type` unless Mangesh changed it. |
| `format` | "Media (ugcPost)" \| "Text/share" | Media = image, video or document post. |
| `creator_chart_era` | bool | Published on or after 19 Aug 2026. |
| `tg_impressions_lifetime` | int \| null | `null` = post too small for LinkedIn to give a split. |
| `tg_share_pct` | number \| null | |
| `out_of_network_pct` | int \| null | % of views from people who are not followers or connections. `null` = LinkedIn shows no split for this post. |
| `in_network_pct` | int \| null | 100 − out-of-network. |
| `engagements`, `comments`, `reposts`, `followers_gained` | int | |
| `engagement_rate_pct` | number \| null | Engagements ÷ views × 100, given as a ratio only. |

### 4.6 `viewer_mix`: for the Daily tab's "Who saw the content" panel

- **`pct_of_views[dimension][value][date]`:** the % of that day's views from people with that value.
  - Dimensions: `Seniority`, `Job title`, `Industry`, `Location`, `Company size`, `Company`.
  - LinkedIn lists only the biggest groups each day, so the values don't add up to 100.
- **`day_weight[date]`:** a relative day weight from 0 to 1, used **only** to weight the average across a date range. **Never display it.**

### 4.7 `insights`: precomputed post statistics (What works tab)

- **`groups`:** `{cat|fmt|era|dow: {rows:[{g, n, tg, tgsum, sh, out, er, com}], p:{tg, sh, outnet, er}}}`.
  - Row fields: `g` = group name, `n` = number of posts, `tg` = median TG impressions, `tgsum` = total TG impressions, `sh` = median TG share, `out` = median out-of-network %, `er` = median engagement rate, `com` = median comments.
  - `p` = Kruskal–Wallis p-value per metric.
- **`corr`:** Spearman `{rho, p, n}` for each of `out_vs_share`, `out_vs_tg`, `comments_vs_out`, `reposts_vs_out`, `er_vs_share` and `hour_vs_share`.
- **`fit`:** linear fit of TG share on out-of-network %: `{slope10, r2, p, a, b}`, where `y = a + b·x` and `slope10` = change in TG share per +10 pts.

### 4.8 `company_page`: Peaceful-Loans company page (new in v5)

LinkedIn gives **no viewer seniority for Page posts**, so Page post impressions are not in the file and must never be shown. The page's TG signal comes from page visitors and followers.

- `note`: string.
- `visitors_monthly[]`: one LinkedIn visitor export per calendar month. Fields `month_start`, `month_end`, `tg_page_views` (int: page views from TG seniorities), `tg_share_pct` (TG page views ÷ page views with a known seniority × 100). The latest month is partial (`month_end` before the month's last day); company data lags LinkedIn by about 2 days, so it can end a day before the profile data.
- `visitors_12m`: `{start, end, tg_page_views, tg_share_pct}` from one 12-month visitor export.
- `followers`: `{as_of, tg_followers, tg_share_pct}`: TG followers and their % of followers with a known seniority.

### 4.9 `newsletter`: "Demystifying Home Loan India" (new in v5)

- `name`, `note`: strings.
- `editions[]`: every 2026 edition, newest first, one LinkedIn export per edition (lifetime). Fields `activity_id`, `post_id` (the edition's feed post, which also appears in `posts[]`), `published`, `title`, `url`, `tg_impressions_lifetime`, `tg_share_pct`, `tg_is_floor`, `out_of_network_pct`, `engagements`, `comments`, `reposts`.
  - **`tg_is_floor = true`:** LinkedIn listed only the top 3–4 seniority groups for that edition, so the real TG is at least this value. Show "≥ " before the number and the "TG may be higher" chip. All 7 editions in the 3 Oct file are floors.
- `subscribers[]`: `{date, subscribers, tg_share_floor_pct}`, one row per refresh. LinkedIn has no subscriber export and shows only the top 5 seniority groups, so the TG share is a floor ("≥ 32%").

## 5. Metric formulas

- **Range TG impressions (Daily tab only):** Σ `tg_impressions` over the days in range that aren't null.
- **Range TG share:** Σ tg ÷ Σ (tg ÷ (tg_share_pct/100)), over the days in range where both values exist. **Do not** average the percentages.
- **Previous period:** the same number of days immediately before the range. Show the comparison only if the whole previous period is on or after `data_from`.
- **Change in TG impressions:** (current − previous) ÷ previous, shown as a rounded %, e.g. "+43%".
- **Change in TG share:** current − previous in **percentage points**, one decimal, e.g. "−2.3 pts".
- **WoW / MoM:** compare with the previous row of the same grain. If either value is null, or the current row is partial, show "–".
- **Viewer mix % for a range:** Σ(pct × day_weight) ÷ Σ(day_weight), over the days in range that have that dimension. Show the top 8 values (top 10 for Seniority), sorted by %. Show values under 1% as "<1%".
- **Colours:**
  - Good change: green.
  - Bad change: red.
  - TG seniority rows (Manager…Partner) in the viewer mix: highlighted in the target colour.

## 6. Layout and design

- **Tokens (light mode; also define dark mode via `prefers-color-scheme`):**
  - `--bg #F4F6F5`
  - `--surface #FFFFFF`
  - `--ink #15201C`
  - `--muted #5C6A65`
  - `--rule #DCE2DF`
  - `--grid #E7ECEA`
  - `--accent #1F6F66` (teal, used for TG share)
  - `--accent-soft #D6EAE6`
  - `--target #B96A10` (amber, used for TG impressions)
  - `--target-soft #F6E6D1`
  - `--good #2E7D4F`
  - `--bad #B3412F`
- **Dark mode tokens:**
  - `--bg #0F1513`
  - `--surface #161F1C`
  - `--ink #E4EBE8`
  - `--muted #98A6A1`
  - `--rule #28332F`
  - `--accent #5CC1B3`
  - `--target #E3A24B`
- **Fonts (Google Fonts):**
  - Headings: Bricolage Grotesque 600/700.
  - Body: Public Sans 400/500/600.
  - Numbers, table headers and axis labels: IBM Plex Mono with tabular figures.
- **Colour meaning, used consistently:** amber = TG impressions (bars); teal = TG share (dots, lines, share bars); shaded teal-tinted rows = Creator Chart Era.
- **Page width:** max 1120 px, 16 px side gutter. Must work at 375 px phone width; tables scroll sideways inside their card and the page never scrolls sideways.
- **Header:**
  - Eyebrow: "LinkedIn · target-audience reach · 1 Jan – {data_to}".
  - H1: "Is our content reaching our target audience?"
  - One-paragraph definition of TG impressions and TG share.
  - "Data to {data_to} · built {built}".
  - Signed-in user's email and a "Log out" link on the right.
- **Source switcher (pill buttons):** "Mangesh Zope profile" (default), "Peaceful-Loans page", "Newsletter". The profile has the sub-tabs below; the other two are single pages (§7.7, §7.8). Keep the selected source in the URL hash too (`#page`, `#newsletter`).
- **Tabs (underline style):** **Daily · Weekly · Monthly · Posts · What works · Data**. Daily is the default. Keep the selected tab in the URL hash (`#weekly`) so links can be shared.
- **Charts:** use hand-drawn SVG or a lightweight library such as Recharts.
  - Bars have a 2 px corner radius.
  - Tooltips show the exact value.
  - Axes are labelled.
  - The TG share axis is on the right, in teal.
  - Dashed vertical markers at 1 Aug, labelled "Creator onboarded", and at 19 Aug, labelled "First creator post".

## 7. Tabs

### 7.1 Daily (default)

- **Filters:**
  - From / To date inputs, limited to `data_from`–`data_to`.
  - Preset pills: Last 7 days · Last 30 days · {current month} · {previous month} · Creator Chart Era (19 Aug → data_to) · Before creator (1 Apr – 31 Jul) · All 2026.
  - Default preset: **Creator Chart Era**. If From > To, swap them.
- **KPI row (5 tiles):**

  | Tile | Main value | Subtext |
  |---|---|---|
  | TG impressions | Range TG impressions | "±x% vs previous N days" |
  | TG share of views | Range TG share | "±x.x pts vs previous N days" |
  | Avg TG impressions / day | TG impressions ÷ N | Date range |
  | Engagements | Total engagements | "reactions, comments, reposts" |
  | New followers | Total new followers | "{k} posts published in range" |

- **Chart, "TG impressions by day":**
  - Amber bars, one per day.
  - Teal dot for TG share on the right axis, 0–70%.
  - Days without data get no bar.
  - Show about 14 date labels.
- **"Who saw the content in this period":**
  - Six cards (Seniority, Job title, Industry, Location, Company size, Company), each a horizontal bar list with the %.
  - Note under the heading: "shares don't add to 100%".
  - Download button: "↓ Download viewer mix (CSV)".
- **"Day by day" table, newest first:**
  - Columns: Date (e.g. "Sun 27 Sept"), TG impressions (+ "TG may be higher" chip), TG share (teal bar + %), Engagements, New followers, Posts published.
  - Rows from 19 Aug onward are shaded.
  - Download button: "↓ Download these days (CSV)".
- **Footnote:** quiet days show "–"; use the Weekly/Monthly tabs for quiet stretches; a date range adds up the daily files in it.

### 7.2 Weekly

- **KPI tiles:**

  | Tile | Main value | Subtext |
  |---|---|---|
  | Avg weekly TG impressions | All full weeks starting on or after 17 Aug with data (currently 17 Aug – 27 Sep; 28 Sep – 3 Oct is partial and excluded); the subtext shows the real end date | vs 13 Apr – 2 Aug |
  | TG share, Creator Chart Era | Σtg ÷ Σ(tg/share) over the same weeks | vs 13 Apr – 2 Aug |
  | Best week, TG impressions | Highest week, full weeks only | Its dates |
  | Best week, TG share | Highest share among full weeks with ≥300 TG impressions | Its dates |

- **Chart:** amber bars (TG impressions, 0–10k axis) plus a teal line with dots (TG share, right axis), with era markers.
- **Table, newest first:**
  - Columns: Week (e.g. "14 Sept – 20 Sept", + "partial week" chip), TG impressions (or "below LinkedIn threshold", + "TG may be higher"), WoW %, TG share, WoW share (pts), Engagements, New followers, Posts published.
  - Partial weeks show "–" for WoW.
  - Download button: "↓ Download weekly data (CSV)".

### 7.3 Monthly

- **Table (Jan → latest):**
  - Columns: Month (+ "to {date}" chip if partial), TG impressions, MoM %, TG share, MoM share (pts), Engagements, New followers, Posts published (+ "{k} below threshold" chip), TG impressions from those posts, Their TG share.
- **Rules for the table:**
  - A partial month gets no MoM for TG impressions, but its share change is still shown.
  - A month that's null shows "below LinkedIn threshold".
  - "TG impressions from those posts" = Σ `tg_impressions_lifetime` of posts published in that month, from `posts[]`.
  - "Their TG share" = Σtg ÷ Σ(tg/share) over those posts.
- **Download button:** "↓ Download monthly data (CSV)".

### 7.4 Posts

- **Intro note:** define out-of-network and explain that "–" means the post was too small for a split.
- **Category filter pills:** All plus the 6 types.
- **Sortable table (click a header; Enter key works too):**
  - Default sort: newest first.
  - Columns: Published, Post (linked title + "media" chip for Media format), Type, TG impressions (amber mini-bar + number), TG share (teal bar + %), Out-of-network %, Engagements, Comments, Reposts, Followers gained.
  - Creator Chart Era rows are shaded.
- **Download button:** "↓ Download post data (CSV)".

#### 7.4.1 Changing a post's type (admin only)

Mangesh may disagree with how a post was categorised. Admins can change it on the site; viewers only see the result.

- **Who:** role `admin` only. For viewers the Type column is plain text; a changed type shows a small "edited" chip.
- **Control:** for admins, the Type cell is a dropdown with the 6 `meta.post_types`. When the post has been changed, the option equal to `auto_type` is labelled "{type} (auto)", so picking it undoes the change.
- **Info bar above the table (admins):** "Don't agree with a post's type? Change it in the Type column. It saves for everyone and recalculates What works. To undo, pick the option marked '(auto)'." plus "{n} changed" and a save status ("Saving…", "Saved", or the error).
- **Storage:** Firestore collection `post_type_overrides`, one document per changed post, id = `post_id`, body `{type, auto_type, title, changed_by, changed_at}`. Choosing the auto type again deletes the document. Writes go through a server route (`POST /api/post-type`) that checks the admin role and that `type` is one of `meta.post_types`. Viewers read overrides through `/api/data` (merge them into `posts[].type` on the server before returning the data).
- **Effective type** of a post = override if one exists, else `type` from the data file. Use the effective type everywhere: Posts tab filters, pill counts, CSV downloads, the What works tables and findings, and scatter tooltips.
- **Recalculate What works on change:** when any effective type differs from the data file's `type`, recompute `insights.groups.cat` from `posts[]`; otherwise use the file's precomputed values. Other groups (format, era, day) and correlations don't depend on type, so keep them from the file.
  - Per type: `n` = posts; `tg` / `sh` / `out` / `er` / `com` = median over non-null values, rounded to 1 decimal; `tgsum` = Σ `tg_impressions_lifetime` (null counts as 0).
  - p-values (`tg`, `sh`, `outnet`, `er`): Kruskal–Wallis H test over types that have ≥3 non-null values for that metric (skip if fewer than 2 such types), with the standard tie correction, p = upper tail of χ² with (groups − 1) degrees of freedom, rounded to 3 decimals. This is what `scipy.stats.kruskal` returns.
  - Key findings 3 and 4 must be generated from the recomputed rows (top 2 types by median TG impressions; type with the highest median TG share), not hard-coded to type names.
- **New data uploads keep the changes:** overrides live apart from the data file, keyed by `post_id`, so they survive every upload. If a new file's `type` already equals an override (Mangesh made the same change on the claude.ai dashboard), the override is harmless; offer an admin "Clear overrides that match the file" button.
- **Hand-back to the claude.ai build:** an admin-only "↓ Download type changes (JSON)" button saves `{post_id: type}` for all overrides, so Mangesh can give them to Claude and the claude.ai dashboard and future data files use the same types.

### 7.5 What works (statistics)

- **Intro:** based on all 2026 posts, using medians.
  - p-value meaning: under 0.05 = "reliable" chip, 0.05–0.15 = "lean", above = "not proven".
  - Groups are small (5–13 posts), so leans are hypotheses to test.
- **Key findings card:** generate these from `insights`, not hard-coded, so they update when the data does. The current texts, for reference:
  1. **The wider a post travels outside your network, the lower its TG share.**
     - Every +10 pts of out-of-network costs about 1.43 pts of TG share (ρ −0.53, p < 0.001, 48 posts with a split).
     - Followers and connections are TG-dense.
     - More reach still means more TG impressions overall, so aim for reach that stays senior.
  2. **Comments and reposts push a post out of network** (comments ρ 0.53, reposts ρ 0.53, p < 0.001).
  3. **{top type} and {second type} bring the most TG impressions per post** (types with ≥3 posts, ranked by median TG impressions). Currently: Founder journey & milestones 848 and Hiring & team 820, vs 267.5 (shown as 268) for Client story and 226 for Opinion & life lessons (p 0.001, reliable). Also name the single biggest TG post and the type with the lowest median TG share (currently Hiring & team, 40%: add "job-seekers are junior" only when that type is Hiring & team).
  4. **{type with the highest median TG share} is the best "dog-whistle" candidate.** Currently Opinion & life lessons (47.0%; Bank & industry critique is now 45.5%):
     - Highest median TG share (47.0%); show its out-of-network reach (29%) and engagement rate (2%) without calling them highest, because they aren't. Say "highest" only when it is.
     - How many Creator Chart Era posts are this type, and its median TG impressions per post (226; 3 of the 20 Creator Chart Era posts).
  5. **Media posts stay inside the network, text posts travel** (18% vs 39.5% out-of-network, p 0.004).
  6. **Creator Chart Era: more reach and engagement, same TG share, fewer TG impressions per post so far:**
     - Out-of-network 29 → 46% (p 0.009).
     - Engagement rate 1.5 → 2.6% (p 0.002).
     - TG share 46 → 45% (not proven).
     - Median TG impressions per post 588 → 283 (p 0.026, reliable). Newer posts have had less time to collect views.
  - Every verdict word ("reliable", "a lean", "not proven") comes from the p-value, never typed in.
- **Tables:** "By type of post", "By format", "Before vs Creator Chart Era", "By day posted".
  - Columns: Posts, Median TG impressions, Total TG impressions, Median TG share, Median out-of-network, Median engagement rate.
  - A last row, "Is the gap real?", shows p + chip for each metric.
  - Bold the best value in each column, among groups with n ≥ 3.
- **Category definitions** under the type table (add: "Mangesh can change any post's type in the Posts tab and this table recalculates."):
  - **Bank & industry critique:** calls out lender practices, RBI/IRDAI moves, bank ads.
  - **Home-loan explainer:** how rates, EMIs and eligibility work.
  - **Client story:** a real client or consumer conversation.
  - **Founder journey & milestones:** Peaceful-Loans' story, wins and numbers.
  - **Opinion & life lessons:** money and behaviour philosophy.
  - **Hiring & team:** job posts and team shout-outs.
- **Scatter chart:**
  - x = out-of-network % (0–100), y = TG share (25–60%).
  - One amber circle per post, radius 3 + √(tg/max)·14. Creator Chart Era posts are more opaque.
  - Dashed trend line from `fit`.
  - Tooltip: date, title, type, TG share, out-of-network, TG impressions.

### 7.6 Data (downloads)

- **Intro:** these are the numbers the report is built from; each comes from its own LinkedIn export; nothing is added up.
- **Eight cards with a download button each** (Company page and Newsletter added in v5, see §7.7–7.8):

  | Card | File |
  |---|---|
  | Daily | `daily_tg.csv` |
  | Weekly | `weekly_tg.csv` |
  | Monthly | `monthly_tg.csv` |
  | Posts | `posts_tg.csv` |
  | Viewer mix by day | `viewer_mix_daily.csv`, long format: date, dimension, value, pct_of_views |
  | Company page | `company_page_tg_monthly.csv` |
  | Newsletter | `newsletter_editions_tg.csv` |
  | Everything | `linkedin_tg_backend.json`, the full data file **minus `viewer_mix.day_weight`** |

- **CSV format:** UTF-8 with a header row, snake_case column names as in §4, and blank for null.
- **Generation:** client-side from the loaded data (Blob + `<a download>`).

### 7.7 Peaceful-Loans page (source switcher → "Peaceful-Loans page")

- **Intro note:** LinkedIn gives no viewer seniority for Page posts, so Page post reach can't be split into TG. TG for the page = who visits it and who follows it. TG share = TG views ÷ views with a known seniority.
- **KPI tiles:**

  | Tile | Main value | Subtext |
  |---|---|---|
  | TG page views, {latest full month} | `tg_page_views` (amber) | % change vs the previous full month |
  | TG share of page views, {latest full month} | `tg_share_pct` | pts change vs the previous full month |
  | TG followers | `followers.tg_followers` | "{tg_share_pct}% of followers with a known seniority" |
  | TG share of page views, last 12 months | `visitors_12m.tg_share_pct` | "{tg_page_views} TG page views, {start} – {end}" (dates with years) |

- **Chart:** amber bars per month (TG page views, value label on top), teal line with dots (TG share, right axis 20–60%). The partial month's bar is at 50% opacity.
- **Month-on-month table** (newest first): Month (+ "to {end}" chip if partial), TG page views, MoM, TG share (teal bar + %), MoM share. Partial months get "–" for both MoM columns. MoM compares with the previous **full** month. Creator Chart Era months (Aug onward) shaded.
- **Download:** `company_page_tg_monthly.csv` (month_start, month_end, tg_page_views, tg_share_of_page_views_pct).
- Optional, from the claude.ai reference: followers-by-seniority and visitors-by-seniority bar lists and a Page posts list. These need fields that aren't in the JSON yet; skip them in Antigravity for now.

### 7.8 Newsletter (source switcher → "Newsletter")

- **Intro note:** edition TG comes from each edition's own export (post + article, lifetime). LinkedIn lists only the top 3–4 seniority groups per edition, so edition TG is a floor. Editions also appear as posts in the profile's Posts tab. The 22 pre-2026 editions aren't included.
- **KPI tiles:**

  | Tile | Main value | Subtext |
  |---|---|---|
  | Subscribers | latest `subscribers[].subscribers` | "as of {date}" |
  | TG share of subscribers | "≥ {tg_share_floor_pct}%" (amber) | "from LinkedIn's top 5 seniority groups" |
  | Latest edition, TG impressions | "≥ " + `tg_impressions_lifetime` of the newest edition (amber) | "{published} · TG share ≥ {tg_share_pct}%" |
  | 2026 editions, median TG impressions | median of `tg_impressions_lifetime` | "{n} editions · median TG share {x}% (floors)" |

- **Edition table** (newest first): Edition (title, linked to `url`), Published, TG impressions ("≥ " + value + "TG may be higher" chip when `tg_is_floor`), TG share ("≥ " prefix when floor), Out-of-network %, Engagements, Comments, Reposts. Creator Chart Era rows shaded.
- **Subscribers table** (newest first): Recorded, Subscribers, TG share of subscribers ("≥ x%"). Note: history builds up from 4 Oct 2026, one row per refresh.
- **Download:** `newsletter_editions_tg.csv` (published, edition, url, tg_impressions_lifetime, tg_share_pct, tg_is_floor, out_of_network_pct, engagements, comments, reposts).
- **Data tab:** add "Company page" and "Newsletter" cards with the two downloads above. The "Everything" JSON now also includes `company_page` and `newsletter`.

## 8. Reference values: acceptance tests

With the supplied JSON, the app must show these values exactly:

| Check | Expected |
|---|---|
| Daily · All 2026 · TG impressions | **40,994** |
| Daily · All 2026 · TG share | **44.3%** |
| Daily · All 2026 · Engagements / New followers / Posts | **1,798 / 820 / 57** |
| Daily · Creator Chart Era (19 Aug – 3 Oct) · TG impressions | **15,761**, "+55% vs previous 46 days" |
| Daily · Creator Chart Era · TG share | **43.0%**, "−2.6 pts vs previous 46 days" |
| Daily · Last 7 days (27 Sep – 3 Oct) · TG impressions / share | **1,470 / 44.0%** (−46%, +4.3 pts vs 20–26 Sep) |
| Weekly · 14–20 Sep | **8,983 TG impressions, 42.0%** |
| Weekly · 21–27 Sep | **2,145, 38.0%**, full week, WoW **−76%**, **−4.0 pts** |
| Weekly · 28 Sep – 3 Oct | **1,409, 46.0%**, "partial week" chip, WoW "–" |
| Weekly · KPI tiles | Avg weekly TG impressions **2,477** (17 Aug – 27 Sep, 6 weeks) vs 1,547; TG share **41.6%** vs 44.5%; best week 14–20 Sep 8,983; best share 27 Jul – 2 Aug 49.0% |
| Monthly · Jan 2026 | "below LinkedIn threshold" |
| Monthly · Sep 2026 | **12,860**, **40.0%**, full month, MoM **+343%**, **−1.0 pts**; Aug 2026 = 2,906, 41.0% |
| Monthly · Oct 2026 | **755**, **51.0%**, chip "to 3 Oct", MoM "–", share **+11.0 pts** |
| Posts | **57** rows; **20** shaded Creator Chart Era rows (19 Aug – 3 Oct); **1** row with an "edited" chip (17 Sep, "I have been using instahelp services across": `type` Founder journey & milestones, `auto_type` Client story) |
| Posts · top by TG impressions | "A 10000 crore listed company and peaceful loans", 18 Sep: 7,866, 47.0%, 66% out-of-network |
| Page · KPI tiles | TG page views Sept 2026 **100**, "+28% vs Aug 2026"; TG share **38.8%**, "−6.5 pts vs Aug 2026"; TG followers **150**, 38.7%; last 12 months **42.0%**, 702 TG page views, 3 Oct 2025 – 2 Oct 2026 |
| Page · monthly table | Oct 2026 **3**, 50.0%, chip "to 2 Oct", MoM "–"; Sep **100**, 38.8%; Aug **78**, 45.3% (+20%, +11.1 pts); Jun **184**, 50.8% (highest month); Jan **29**, 38.7% (no MoM) |
| Newsletter · KPI tiles | Subscribers **1,843** (as of 4 Oct); TG share of subscribers **≥ 32%**; latest edition (3 Oct, "Are you switching homes every 8-10 years like cars?") **≥ 332**, TG share ≥ 32.0%; median TG impressions **332**, 7 editions, median TG share 31.0% |
| Newsletter · edition table | 7 rows, all with the "TG may be higher" chip; highest: 11 May "Section 54F - Top class weapon to avoid LTCG" **≥ 567**, ≥ 31.0%, 44% out-of-network |

The following must also hold:

- **No total impressions anywhere:** search the page source, network responses and every download for "impressions" fields other than TG ones. There must be none.
- **Unauthenticated access is blocked:** a signed-out request to `/api/data` returns 401, and every page redirects to `/login`.
- **Clean console:** no console errors.
- **Lighthouse accessibility:** score ≥ 90.
- **Phone width:** works at 375 px.

- **Post type changes (§7.4.1):**
  - With no overrides, recomputing `insights.groups.cat` in the app gives exactly the file's values (Founder journey & milestones: n 13, median TG 848, total 19,823, median share 46.0%; p-values tg 0.001, sh 0.226, outnet 0.27, er 0.455).
  - Changing the type of the 25 Sep post ("Your bank may just have lost a revenue", `post_id` 7509209819720032256) from Bank & industry critique to Hiring & team gives: Hiring & team n 6, median TG 756, total 4,976; Bank & industry critique n 7, median TG 356, total 2,571; p-values tg 0.001, sh 0.39, outnet 0.247, er 0.501. Undoing it restores the original values.
  - A viewer (non-admin) sees no dropdown, and `POST /api/post-type` returns 403 for them.

## 9. Keeping the data fresh

The data is produced by Mangesh's Claude refresh job. It downloads new LinkedIn exports on his Mac, rebuilds, and writes a new `creator_chart_dashboard_data.json` to `~/Downloads/Linkedin analysis/antigravity/`.

**How the new file gets into the app:**

- **Admin page:** `/admin` (admin role only) has an **Upload data** control.
- **Validation before replacing the live file:**
  - It parses as JSON.
  - It has `meta`, `daily`, `weekly`, `monthly`, `posts`, `viewer_mix` and `insights` (and, from v5, `company_page` and `newsletter`; accept files without them and show an empty state for that source).
  - `meta.data_to` is on or after the current `data_to`.
  - **Reject** it if any object key equals `impressions`, `imp`, `members_reached` or `sv`.
- **Versioning:** keep the previous 5 versions in storage, with a "Roll back" button.
- **Header:** after an upload, the header's "Data to … · built …" updates.
- **Optional:** also accept an upload through a signed `POST /api/data` endpoint for automation. It uses an `ADMIN_UPLOAD_TOKEN` env secret and the same validation.

**There is no "Refresh" button in this app.** Refreshing needs Mangesh's Mac and LinkedIn login, so it stays on the claude.ai version of the dashboard.

## 10. Out of scope, pending

- **Company page post reach:** LinkedIn gives no viewer seniority for Page posts, so Page post impressions stay out of the data and the app.
- **Newsletter editions before 2026** (22 editions, 2023–2025): not included.
- **Editing and comments:** no editing of data in the UI, and no comments.

## 11. Suggested build order for Antigravity

1. **Scaffold:** Next.js + TypeScript + Firebase Auth. Build the `/login` flow, middleware and the protected `/api/data` route. Test it with the JSON.
2. **Types and helpers:** types for §4, and the metric helpers in §5, with unit tests against the §8 values.
3. **Shell:** layout, tokens, header, source switcher and tabs (URL hash).
4. **Tabs:** Daily → Weekly → Monthly → Posts → What works → Data.
5. **Admin:** the upload page and validation.
6. **Checks:** accessibility and mobile pass, then the acceptance tests in §8.

---

## Change log

- **4 Oct 2026 (v5):** data refreshed to 3 Oct (daily 1–3 Oct; partial week 28 Sep – 3 Oct; partial month 1–3 Oct; 21 posts re-exported, 1 new: the 3 Oct newsletter edition's feed post). **New:** `company_page` (§4.8) and `newsletter` (§4.9) data sections and their source tabs (§7.7, §7.8), replacing the PENDING placeholders (§6, §10). Upload validation accepts the new sections (§9). Key finding 4 now picks Opinion & life lessons (§7.5). All §8 values updated, with new company page and newsletter checks.

- **1 Oct 2026 (v4):** data refreshed to 30 Sep (daily 28–30 Sep; partial week 28–30 Sep; September now a full month; 20 posts exported, 2 of them new: 28 Sep "Feeling embarrassed about taking a home loan" and 30 Sep "The day you bought your house 6 people made"). No structure or code changes: upload the new JSON and check against §8. Updated: dates, §4.3 partial-week note, §7.5 key-finding numbers, all §8 values.

- **28 Sep 2026 (v3):** data refreshed to 27 Sep (daily 27 Sep; full week 21–27 Sep; month 1–27 Sep; last 18 posts re-exported). Mangesh changed one post's type on the claude.ai dashboard (17 Sep post → Founder journey & milestones); it is already in `type`, with Claude's original in `auto_type`. Spec changes: partial weeks detected from dates (§4.3), Weekly KPI window no longer ends at a fixed date (§7.2), key findings 3, 4 and 6 fully generated from data (§7.5), all §8 values updated. See `ANTIGRAVITY_UPDATE_28Sep2026.md` for the step-by-step update.

- **27 Sep 2026 (b):** new feature §7.4.1: admins can change a post's type; What works recalculates. New data fields `post_id`, `auto_type` (posts) and `meta.post_types`. New acceptance tests in §8.

- **27 Sep 2026:** data refreshed to 26 Sep 2026 (new daily file for 26 Sep; new exports for the week 21–26 Sep and the month 1–26 Sep; the last 18 posts re-exported with their in/out-of-network split re-read). The JSON structure and field names are unchanged, so no code changes are needed: upload the new `creator_chart_dashboard_data.json` and check against the updated §8 values. Updated in this spec: the dates, the §7.5 key-finding numbers and the §8 acceptance values. `reference_dashboard.html` is the matching claude.ai build.
- **26 Sep 2026:** first version (data to 25 Sep).
