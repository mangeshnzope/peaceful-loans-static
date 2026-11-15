import { describe, it, expect } from "vitest";
import data from "../../../data/creator_chart_dashboard_data.json";
import {
  aggregateDailyRange,
  compareDailyPeriods,
  getViewerMixForRange,
  calculateWeeklyWoW,
  calculateMonthlyMetrics,
  isPartialWeek,
} from "../metrics";
import { DashboardData, WeeklyRow } from "../types";

const typedData = data as unknown as DashboardData;

describe("Creator Chart TG Dashboard Acceptance Tests (Spec v5.8 - 15 Nov 2026)", () => {
  it("Daily · All 2026 (1 Jan – 14 Nov): TG impressions=68,255, share=44.9%, eng=2,305, nf=1,013, posts=80", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-11-14");
    expect(agg.tgImpressions).toBe(68255);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.9");
    expect(agg.postsPublished).toBe(80);
    expect(agg.engagements).toBe(2305);
    expect(agg.newFollowers).toBe(1013);
  });

  it("Daily · Creator Chart Era (19 Aug – 14 Nov = 88 days): TG impressions=43,020, share=44.7%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-11-14", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(43020);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.7");
    expect(cmp.current.daysCount).toBe(88);
    expect(cmp.previous).not.toBeNull();
  });

  it("Daily · Last 7 days (8 – 14 Nov): TG impressions=2,379, share=49.0%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-11-08", "2026-11-14", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(2379);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("49.0");
    expect(cmp.previous).not.toBeNull();
  });

  it("Weekly · 2–8 Nov (1,876, 42.0%, WoW −79%, −2.0 pts), 26 Oct – 1 Nov (8,877, 44.0%, WoW +197%), and partial week 9–14 Nov (2,274, 48.0%, WoW null)", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const weekNov2 = calculatedWeeks.find((w) => w.week_start === "2026-11-02");
    expect(weekNov2).toBeDefined();
    expect(weekNov2!.tg_impressions).toBe(1876);
    expect(weekNov2!.tg_share_pct).toBe(42.0);
    expect(weekNov2!.isPartial).toBe(false);
    expect(Math.round(weekNov2!.wowImpressionsPct!)).toBe(-79);
    expect(weekNov2!.wowSharePts!.toFixed(1)).toBe("-2.0");

    const weekOct26 = calculatedWeeks.find((w) => w.week_start === "2026-10-26");
    expect(weekOct26).toBeDefined();
    expect(weekOct26!.tg_impressions).toBe(8877);
    expect(weekOct26!.tg_share_pct).toBe(44.0);
    expect(weekOct26!.isPartial).toBe(false);
    expect(Math.round(weekOct26!.wowImpressionsPct!)).toBe(197);

    const weekNov9 = calculatedWeeks.find((w) => w.week_start === "2026-11-09");
    expect(weekNov9).toBeDefined();
    expect(weekNov9!.tg_impressions).toBe(2274);
    expect(weekNov9!.tg_share_pct).toBe(48.0);
    expect(weekNov9!.isPartial).toBe(true);
    expect(weekNov9!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Latest full week 1,876 (−79%), share 42.0% (−2.0 pts); Avg weekly TG 3,388 vs 1,299; Share 43.4% vs 45.7%", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const fwWithTg = fullWeeks.filter((w) => w.tg_impressions !== null);
    const lw = fwWithTg[fwWithTg.length - 1];
    const pw = fwWithTg[fwWithTg.length - 2];

    expect(lw.tg_impressions).toBe(1876);
    expect(lw.tg_share_pct).toBe(42.0);
    expect(pw.tg_impressions).toBe(8877);
    expect(pw.tg_share_pct).toBe(44.0);

    const wowImp = ((lw.tg_impressions! - pw.tg_impressions!) / pw.tg_impressions!) * 100;
    const wowSh = lw.tg_share_pct! - pw.tg_share_pct!;
    expect(Math.round(wowImp)).toBe(-79);
    expect(wowSh.toFixed(1)).toBe("-2.0");

    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(12);
    const avgPost = postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length;
    expect(Math.round(avgPost)).toBe(3388);

    const preWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-05-11" && w.week_start <= "2026-07-27" && w.tg_impressions !== null
    );
    expect(preWeeks.length).toBe(12);
    const avgPre = preWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / preWeeks.length;
    expect(Math.round(avgPre)).toBe(1299);

    const calcShare = (wks: WeeklyRow[]) => {
      const tgSum = wks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0);
      const implied = wks.reduce((acc, w) => acc + (w.tg_impressions || 0) / ((w.tg_share_pct || 1) / 100), 0);
      return (tgSum / implied) * 100;
    };
    expect(calcShare(postWeeks).toFixed(1)).toBe("43.4");
    expect(calcShare(preWeeks).toFixed(1)).toBe("45.7");

    const bestImp = [...fullWeeks].sort((a, b) => (b.tg_impressions || 0) - (a.tg_impressions || 0))[0];
    expect(bestImp.tg_impressions).toBe(8983);
    expect(bestImp.week_start).toBe("2026-09-14");
    expect(bestImp.week_end).toBe("2026-09-20");

    const bestSh = [...fullWeeks]
      .filter((w) => (w.tg_impressions || 0) >= 300 && w.tg_share_pct !== null)
      .sort((a, b) => (b.tg_share_pct || 0) - (a.tg_share_pct || 0))[0];
    expect(bestSh.tg_share_pct).toBe(49.0);
    expect(bestSh.week_start).toBe("2026-07-27");
    expect(bestSh.week_end).toBe("2026-08-02");
  });

  it("Monthly · Jan 2026: null (below LinkedIn threshold)", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const jan = calculatedMonths.find((m) => m.month_start === "2026-01-01");
    expect(jan).toBeDefined();
    expect(jan!.tg_impressions).toBeNull();
    expect(jan!.tg_share_pct).toBeNull();
  });

  it("Monthly · Sep 2026: 12,860, 40.0%, Oct 2026: 23,250, 45.0% (full months)", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const sep = calculatedMonths.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_impressions).toBe(12860);
    expect(sep!.tg_share_pct).toBe(40.0);
    expect(sep!.isPartial).toBe(false);

    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(23250);
    expect(oct!.tg_share_pct).toBe(45.0);
    expect(oct!.isPartial).toBe(false);
    expect(Math.round(oct!.momImpressionsPct!)).toBe(81);
    expect(oct!.momSharePts!.toFixed(1)).toBe("5.0");
  });

  it("Monthly · Nov 2026: 4,189, 44.0%, chip 'to 14 Nov', MoM null, share -1.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const nov = calculatedMonths.find((m) => m.month_start === "2026-11-01");
    expect(nov).toBeDefined();
    expect(nov!.tg_impressions).toBe(4189);
    expect(nov!.tg_share_pct).toBe(44.0);
    expect(nov!.isPartial).toBe(true);
    expect(nov!.momImpressionsPct).toBeNull();
    expect(nov!.momSharePts!.toFixed(1)).toBe("-1.0");
  });

  it("Posts: 80 rows; 43 shaded Creator Chart Era rows; image_types = 25 Real, 32 AI, 23 No image", () => {
    expect(typedData.posts.length).toBe(80);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(43);

    expect(typedData.posts.filter((p) => p.image_type === "Real image").length).toBe(25);
    expect(typedData.posts.filter((p) => p.image_type === "AI-generated image").length).toBe(32);
    expect(typedData.posts.filter((p) => p.image_type === "No image").length).toBe(23);

    const newestPost = typedData.posts[0];
    expect(newestPost.published).toBe("2026-11-14");
    expect(newestPost.post_id).toBe("7527244337932574720");
    expect(newestPost.type).toBe("Founder journey & milestones");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,993, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7993);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("What works · By image (excluding brag posts): Real image (19, 448), AI-generated image (32, 290), No image (22, 884.5)", () => {
    expect(typedData.insights.groups.img).toBeDefined();
    const imgGrp = typedData.insights.groups.img!;
    const real = imgGrp.rows.find((r) => r.g === "Real image");
    const ai = imgGrp.rows.find((r) => r.g === "AI-generated image");
    const none = imgGrp.rows.find((r) => r.g === "No image");
    expect(real?.n).toBe(19);
    expect(real?.tg).toBe(448);
    expect(ai?.n).toBe(32);
    expect(Math.round(ai?.tg || 0)).toBe(290);
    expect(none?.n).toBe(22);
    expect(none?.tg).toBe(884.5);
    expect(imgGrp.p.tg).toBe(0.003);
    expect(imgGrp.p.er).toBe(0.0);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=76 (41.8%), Nov 2026=26 (68.4%), followers=160 (38.9%), 12m=780 (43.1%)", () => {
    expect(typedData.company_page).toBeDefined();
    const cp = typedData.company_page!;
    const vm = cp.visitors_monthly;
    const sep = vm.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_page_views).toBe(100);
    expect(sep!.tg_share_pct).toBe(38.8);

    const oct = vm.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_page_views).toBe(76);
    expect(oct!.tg_share_pct).toBe(41.8);

    const nov = vm.find((m) => m.month_start === "2026-11-01");
    expect(nov).toBeDefined();
    expect(nov!.tg_page_views).toBe(26);
    expect(nov!.tg_share_pct).toBe(68.4);

    expect(cp.followers.tg_followers).toBe(160);
    expect(cp.followers.tg_share_pct).toBe(38.9);

    expect(cp.visitors_12m.tg_page_views).toBe(780);
    expect(cp.visitors_12m.tg_share_pct).toBe(43.1);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,874 (>=32%), 31 Oct edition=308 (48.0%), 3 Oct edition=745 (43.0%), 10 Oct edition shows 0 / floor", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[nl.subscribers.length - 1].subscribers).toBe(1874);
    expect(nl.subscribers[nl.subscribers.length - 1].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(10);
    const oct31 = nl.editions[0];
    expect(oct31.published).toBe("2026-10-31");
    expect(oct31.tg_impressions_lifetime).toBe(308);
    expect(oct31.tg_share_pct).toBe(48.0);
    expect(oct31.tg_is_floor).toBe(true);

    const oct10 = nl.editions.find((e) => e.published === "2026-10-10");
    expect(oct10).toBeDefined();
    expect(oct10!.tg_impressions_lifetime).toBe(0);
    expect(oct10!.tg_is_floor).toBe(true);

    const oct3 = nl.editions.find((e) => e.published === "2026-10-03");
    expect(oct3).toBeDefined();
    expect(oct3!.tg_impressions_lifetime).toBe(745);
    expect(oct3!.tg_share_pct).toBe(43.0);
    expect(oct3!.tg_is_floor).toBe(false);

    const tgs = nl.editions
      .map((e) => e.tg_impressions_lifetime)
      .filter((x): x is number => x !== null)
      .sort((a, b) => a - b);
    const medTg = (tgs[4] + tgs[5]) / 2;
    expect(Math.round(medTg)).toBe(269);
  });

  it("What works · By type with brag exclusion: 6 normal rows + 2 excluded rows (Media mention / PR: 5 posts, Awards: 2 posts). Founder journey shows 10 posts, Client story shows 16 posts", () => {
    expect(typedData.insights.groups.cat).toBeDefined();
    const catGrp = typedData.insights.groups.cat;
    const normalRows = catGrp.rows.filter((r) => !r.ex);
    const exRows = catGrp.rows.filter((r) => r.ex);
    expect(normalRows.length).toBe(6);
    expect(exRows.length).toBe(2);

    const mm = exRows.find((r) => r.g === "Media mention / PR");
    expect(mm).toBeDefined();
    expect(mm!.n).toBe(5);
    expect(mm!.ex).toBe(true);

    const aw = exRows.find((r) => r.g === "Awards");
    expect(aw).toBeDefined();
    expect(aw!.n).toBe(2);
    expect(aw!.ex).toBe(true);

    const fj = normalRows.find((r) => r.g === "Founder journey & milestones");
    expect(fj).toBeDefined();
    expect(fj!.n).toBe(10);
    expect(Math.round(fj!.tg)).toBe(985);

    const cs = normalRows.find((r) => r.g === "Client story");
    expect(cs).toBeDefined();
    expect(cs!.n).toBe(16);
    expect(cs!.tg).toBe(443);

    expect(catGrp.p.tg).toBe(0.010);
    expect(catGrp.p.sh).toBe(0.094);

    const exclList = typedData.meta.post_types_excluded_from_stats || [];
    expect(exclList).toContain("Awards");
    expect(exclList).toContain("Media mention / PR");

    const nonBragPosts = typedData.posts.filter((p) => !exclList.includes(p.type));
    expect(nonBragPosts.length).toBe(73);
  });

  it("Engagement mix · summary KPIs and per-post breakdown: 177 people, 132 engaged once (75%), 21 regulars (15 on 6+), 18 Sep and 17 Oct rows greyed out", () => {
    expect(typedData.engagement).toBeDefined();
    const eg = typedData.engagement!;
    const s = eg.summary;
    expect(s.people).toBe(177);
    expect(Math.round((s.engaged_once / s.people) * 100)).toBe(75);
    expect(s.engaged_once).toBe(132);
    expect(s.regulars).toBe(21);
    expect(s.regulars_6plus).toBe(15);
    expect(s.median_regular_pct).toBe(67);
    expect(s.median_new_people).toBe(2);
    expect(s.median_first_degree_pct).toBe(80);

    expect(eg.posts.length).toBe(34);
    const sep18 = eg.posts.find((p) => p.published === "2026-09-18");
    expect(sep18).toBeDefined();
    expect(sep18!.new_people).toBe(438);
    expect(sep18!.type).toBe("Awards");

    const oct17 = eg.posts.find((p) => p.published === "2026-10-17");
    expect(oct17).toBeDefined();
    expect(oct17!.type).toBe("Awards");
  });

  it("Reach plan · goal, 90-day windows, KPIs and strategy calculations: 2.3× (prev 2.3×), 18,615, 42,358, 111,690", () => {
    expect(typedData.tg_frequency).toBeDefined();
    const tgFreq = typedData.tg_frequency!;
    expect(tgFreq.goal).toBe(6);
    expect(tgFreq.windows_90d.length).toBe(2);

    const prev = tgFreq.windows_90d[0];
    const latest = tgFreq.windows_90d[1];

    expect(prev.start).toBe("2026-05-19");
    expect(prev.end).toBe("2026-08-16");
    expect(prev.tg_impressions).toBe(14601);
    expect(prev.tg_share_pct).toBe(44.0);
    expect(prev.tg_people_reached_est).toBe(6263);
    expect(prev.tg_frequency_est).toBeCloseTo(2.33, 2);

    expect(latest.start).toBe("2026-08-17");
    expect(latest.end).toBe("2026-11-14");
    expect(latest.tg_impressions).toBe(42358);
    expect(latest.tg_share_pct).toBe(43.0);
    expect(latest.tg_people_reached_est).toBe(18615);
    expect(latest.tg_frequency_est).toBeCloseTo(2.28, 2);
    expect(latest.tg_frequency_est.toFixed(1)).toBe("2.3");

    const needed = Math.round(latest.tg_people_reached_est * 6);
    expect(needed).toBe(111690);

    // Strategy row 7 check (non-brag posts):
    const exclList = typedData.meta.post_types_excluded_from_stats || [];
    const nonBrag = typedData.posts.filter((p) => !exclList.includes(p.type));

    const calculateMedian = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    };

    const c0 = calculateMedian(nonBrag.filter((p) => p.comments === 0 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    const c2 = calculateMedian(nonBrag.filter((p) => p.comments >= 2 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    expect(c0).toBe(315);
    expect(Math.round(c2!)).toBe(691);

    const r0o = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    const r1o = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    expect(r0o).toBe(27);
    expect(r1o).toBe(45);

    const r0 = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    const r1 = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    expect(r0).toBe(443);
    expect(r1).toBe(426);

    const r0s = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.tg_share_pct != null).map((p) => p.tg_share_pct!));
    const r1s = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.tg_share_pct != null).map((p) => p.tg_share_pct!));
    expect(r0s).toBe(47.0);
    expect(r1s).toBe(45.0);
  });

  it("Zero total impressions anywhere in dataset keys", () => {
    const forbiddenKeys = ["impressions", "imp", "members_reached", "sv"];
    function checkKeys(obj: any) {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        expect(forbiddenKeys.includes(key.toLowerCase())).toBe(false);
        checkKeys(obj[key]);
      }
    }
    checkKeys(typedData);
  });
});
