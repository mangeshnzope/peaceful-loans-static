# Creator Chart TG Dashboard: data update for Antigravity (9 Oct 2026, v5.2 with post thumbnails)

**From:** Mangesh Zope, Peaceful-Loans · **Data in this file:** profile 1 Jan – 8 Oct 2026, company page to 7 Oct 2026, newsletter subscribers snapshot 9 Oct

This is mainly a data refresh. `reference_dashboard.html` is the matching claude.ai version (visual reference only; do not reuse its embedded data). The spec is still **v5** (`creator_chart_dashboard_spec.md` from the 4 Oct package). There are two small additions: post image types (§2) and post thumbnails (§2b). v5.2 differs from the v5.1 package only by adding the thumbnails and a newer reference dashboard; the data file is the same.

## 1. Steps

1. Upload `creator_chart_dashboard_data.json` through `/admin` → Upload data.
2. Check the header shows "Data to 8 Oct · built 09 Oct 2026".
3. Run the spec §8 acceptance checks. In particular:
   - Weekly 5–8 Oct is a partial week ("to 8 Oct" chip). Week 28 Sep – 4 Oct is now complete.
   - Monthly October is partial, 1–8 Oct.
   - The company page's October month runs 1–7 Oct (partial).

## 2. New optional fields: post image type

- `meta.image_types`: `["Real image", "AI-generated image", "No image"]`
- Each post has `image_type` (Mangesh's choice, if he changed it) and `auto_image_type` (the automatic one).
- **Validation:** accept these fields, and still accept files without them.
- **Optional view:** add an "Image" column and a filter to the Posts table. Use the same pattern as `type` / `auto_type`.

## 2b. New optional assets: post thumbnails

- `thumbs/<post id>.jpg`: one small JPEG (about 240 px wide, 4–30 KB) for each of the 46 posts that have an image. The 14 posts with "No image" have no file.
- **Where:** put the folder in the site's static assets, for example `/public/thumbs/`.
- **Optional view:** in the Posts table's "Image" column, show the thumbnail, about 84 px wide, above the image type. Link it to the post's `url`. If no file exists for a post, show only the type text.
- **Data file:** unchanged. The JSON carries no image data, so look a thumbnail up by post `id`.
- **Privacy:** these are screenshots of Mangesh's own public LinkedIn posts. Keep them behind the same password as the rest of the site.

## 3. What changed in the data

- **Days:** 4–8 Oct added. **Weeks:** 28 Sep – 4 Oct is now complete; 5–8 Oct is new and partial. **Month:** October now runs to 8 Oct.
- **Posts:** 3 new posts, 60 in total.
  - 6 Oct: Client story, AI-generated image
  - 7 Oct: Home-loan explainer (RBI repo rate), no image
  - 8 Oct: Client story, no image
- **Lifetime numbers:** posts from the last 60 days were re-exported, so their lifetime numbers moved.
- **Company page:**
  - The October month is now 1–7 Oct.
  - The 12-month visitors window is now 8 Oct 2025 – 7 Oct 2026.
  - The followers count is as of 7 Oct.
- **Newsletter:** subscriber snapshot added for 9 Oct. No new edition since 3 Oct.
- TG-only as always. No total impressions anywhere in the file.
