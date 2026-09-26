# Creator Chart TG Dashboard: build spec for Antigravity

**Owner:** Mangesh Zope, Peaceful-Loans · **Spec date:** 26 Sep 2026 · **Data covers:** 1 Jan – 25 Sep 2026

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
| `built` | string | When the data was built, e.g. "26 Sep 2026". |
| `data_from`, `data_to` | date | First and last day covered. |
| `tg_definition` | string[] | `["Manager","Director","VP","Owner","CXO","Partner"]` |
| `creator_chart_era_start` | date | `2026-08-19` |
| `creator_onboarded` | date | `2026-08-01` |
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

- **Partial weeks:** the first week (1–4 Jan) and the last (21–25 Sep) are partial. A partial week is one where `week_end - week_start < 6 days`.

### 4.4 `monthly[]`: calendar month, one export per month

Fields: `month_start`, `month_end`, `tg_impressions`, `tg_share_pct`, `tg_may_be_higher`, `engagements`, `new_followers`, `posts_published`.

- **Partial month:** the latest month is partial, with `month_end` before the month's last day.

### 4.5 `posts[]`: every post published in 2026, one export per post (lifetime numbers)

| Field | Type | Notes |
|---|---|---|
| `published` | date | |
| `weekday` | "Mon"…"Sun" | |
| `time` | string | e.g. "4:48 PM" |
| `title` | string | Opening words of the post. |
| `url` | string | LinkedIn post URL. Open it in a new tab. |
| `type` | string | One of 6 categories (§8.1). |
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
- **Source switcher (pill buttons):** "Mangesh Zope profile" (active), "Peaceful-Loans page · PENDING", "Newsletter · PENDING". The two pending ones show an empty-state card: "Not pulled yet."
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
  - Columns: Date (e.g. "Fri 25 Sept"), TG impressions (+ "TG may be higher" chip), TG share (teal bar + %), Engagements, New followers, Posts published.
  - Rows from 19 Aug onward are shaded.
  - Download button: "↓ Download these days (CSV)".
- **Footnote:** quiet days show "–"; use the Weekly/Monthly tabs for quiet stretches; a date range adds up the daily files in it.

### 7.2 Weekly

- **KPI tiles:**

  | Tile | Main value | Subtext |
  |---|---|---|
  | Avg weekly TG impressions | Creator Chart Era weeks (17 Aug – 20 Sep) | vs 13 Apr – 2 Aug |
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

### 7.5 What works (statistics)

- **Intro:** based on all 2026 posts, using medians.
  - p-value meaning: under 0.05 = "reliable" chip, 0.05–0.15 = "lean", above = "not proven".
  - Groups are small (5–12 posts), so leans are hypotheses to test.
- **Key findings card:** generate these from `insights`, not hard-coded, so they update when the data does. The current texts, for reference:
  1. **The wider a post travels outside your network, the lower its TG share.**
     - Every +10 pts of out-of-network costs about 1.2 pts of TG share (ρ −0.45, p 0.002).
     - Followers and connections are TG-dense.
     - More reach still means more TG impressions overall, so aim for reach that stays senior.
  2. **Comments and reposts push a post out of network** (ρ 0.52 each, p < 0.001).
  3. **Founder journey & milestones and Hiring & team bring the most TG impressions per post** (medians 811 and 820, vs 282 for explainers and 242 for opinion; p 0.003). Hiring has the lowest TG share (40%) because job-seekers are junior.
  4. **Bank & industry critique is the best "dog-whistle" candidate:**
     - Highest TG share (47%), out-of-network reach (55.5%) and engagement rate (2.5%).
     - TG impressions per post are still modest (347).
  5. **Media posts stay inside the network, text posts travel** (21.5% vs 40% out-of-network, p 0.01).
  6. **Creator Chart Era: more reach and engagement, same TG share, fewer TG impressions per post so far:**
     - Out-of-network 29 → 47%.
     - Engagement rate 1.5 → 2.6%.
     - TG share 46 → 45% (not proven).
     - Median TG impressions per post 588 → 280. Newer posts have had less time to collect views.
- **Tables:** "By type of post", "By format", "Before vs Creator Chart Era", "By day posted".
  - Columns: Posts, Median TG impressions, Total TG impressions, Median TG share, Median out-of-network, Median engagement rate.
  - A last row, "Is the gap real?", shows p + chip for each metric.
  - Bold the best value in each column, among groups with n ≥ 3.
- **Category definitions** under the type table:
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
- **Six cards with a download button each:**

  | Card | File |
  |---|---|
  | Daily | `daily_tg.csv` |
  | Weekly | `weekly_tg.csv` |
  | Monthly | `monthly_tg.csv` |
  | Posts | `posts_tg.csv` |
  | Viewer mix by day | `viewer_mix_daily.csv`, long format: date, dimension, value, pct_of_views |
  | Everything | `linkedin_tg_backend.json`, the full data file **minus `viewer_mix.day_weight`** |

- **CSV format:** UTF-8 with a header row, snake_case column names as in §4, and blank for null.
- **Generation:** client-side from the loaded data (Blob + `<a download>`).

## 8. Reference values: acceptance tests

With the supplied JSON, the app must show these values exactly:

| Check | Expected |
|---|---|
| Daily · All 2026 · TG impressions | **39,314** |
| Daily · All 2026 · TG share | **44.4%** |
| Daily · All 2026 · Engagements / New followers / Posts | **1,754 / 805 / 54** |
| Daily · Creator Chart Era · TG impressions | **14,079**, "+46% vs previous 38 days" (previous 38 days = 9,649) |
| Daily · Creator Chart Era · TG share | **43.0%**, "−2.9 pts vs previous 38 days" (previous = 45.9%) |
| Daily · Last 7 days (19–25 Sep) · TG impressions / share | **3,999 / 40.4%** |
| Weekly · 14–20 Sep | **8,983 TG impressions, 42.0%** |
| Weekly · 21–25 Sep | 1,754, 38.0%, "partial week", WoW "–" |
| Monthly · Jan 2026 | "below LinkedIn threshold" |
| Monthly · Sep 2026 | **11,818**, **40.0%**, chip "to 25 Sept" |
| Posts | **54** rows; **17** shaded Creator Chart Era rows (19 Aug – 25 Sep) |
| Posts · top by TG impressions | "A 10000 crore listed company and peaceful loans", 18 Sep: 7,502, 47.0%, 66% out-of-network |

The following must also hold:

- **No total impressions anywhere:** search the page source, network responses and every download for "impressions" fields other than TG ones. There must be none.
- **Unauthenticated access is blocked:** a signed-out request to `/api/data` returns 401, and every page redirects to `/login`.
- **Clean console:** no console errors.
- **Lighthouse accessibility:** score ≥ 90.
- **Phone width:** works at 375 px.

## 9. Keeping the data fresh

The data is produced by Mangesh's Claude refresh job. It downloads new LinkedIn exports on his Mac, rebuilds, and writes a new `creator_chart_dashboard_data.json` to `~/Downloads/Linkedin analysis/antigravity/`.

**How the new file gets into the app:**

- **Admin page:** `/admin` (admin role only) has an **Upload data** control.
- **Validation before replacing the live file:**
  - It parses as JSON.
  - It has `meta`, `daily`, `weekly`, `monthly`, `posts`, `viewer_mix` and `insights`.
  - `meta.data_to` is on or after the current `data_to`.
  - **Reject** it if any object key equals `impressions`, `imp`, `members_reached` or `sv`.
- **Versioning:** keep the previous 5 versions in storage, with a "Roll back" button.
- **Header:** after an upload, the header's "Data to … · built …" updates.
- **Optional:** also accept an upload through a signed `POST /api/data` endpoint for automation. It uses an `ADMIN_UPLOAD_TOKEN` env secret and the same validation.

**There is no "Refresh" button in this app.** Refreshing needs Mangesh's Mac and LinkedIn login, so it stays on the claude.ai version of the dashboard.

## 10. Out of scope, pending

- **Peaceful-Loans company page and newsletter tabs:** keep them as "PENDING" placeholders. Later data files will add `company_page` and `newsletter` sections shaped like the profile data.
- **Editing and comments:** no editing of data in the UI, and no comments.

## 11. Suggested build order for Antigravity

1. **Scaffold:** Next.js + TypeScript + Firebase Auth. Build the `/login` flow, middleware and the protected `/api/data` route. Test it with the JSON.
2. **Types and helpers:** types for §4, and the metric helpers in §5, with unit tests against the §8 values.
3. **Shell:** layout, tokens, header, source switcher and tabs (URL hash).
4. **Tabs:** Daily → Weekly → Monthly → Posts → What works → Data.
5. **Admin:** the upload page and validation.
6. **Checks:** accessibility and mobile pass, then the acceptance tests in §8.
