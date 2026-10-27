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
import { DashboardData } from "../types";

const typedData = data as unknown as DashboardData;

describe("Creator Chart TG Dashboard Acceptance Tests (Spec v5.7 - 27 Oct 2026)", () => {
  it("Daily · All 2026 (1 Jan – 26 Oct): TG impressions=55,483, share=44.9%, eng=2,139, nf=924, posts=71", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-10-26");
    expect(agg.tgImpressions).toBe(55483);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.9");
    expect(agg.postsPublished).toBe(71);
    expect(agg.engagements).toBe(2139);
    expect(agg.newFollowers).toBe(924);
  });

  it("Daily · Creator Chart Era (19 Aug – 26 Oct = 69 days): TG impressions=30,248, share=44.6%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-10-26", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(30248);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.6");
    expect(cmp.current.daysCount).toBe(69);
    expect(cmp.previous).not.toBeNull();
  });

  it("Daily · Last 7 days (20 – 26 Oct): TG impressions=3,043, share=45.9%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-10-20", "2026-10-26", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(3043);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("45.9");
    expect(cmp.previous).not.toBeNull();
  });

  it("Weekly · 19 – 25 Oct (2,991, 45%) and partial week 26 Oct (397, 44%, WoW null)", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const weekOct19 = calculatedWeeks.find((w) => w.week_start === "2026-10-19");
    expect(weekOct19).toBeDefined();
    expect(weekOct19!.tg_impressions).toBe(2991);
    expect(weekOct19!.tg_share_pct).toBe(45.0);
    expect(weekOct19!.isPartial).toBe(false);

    const weekOct26 = calculatedWeeks.find((w) => w.week_start === "2026-10-26");
    expect(weekOct26).toBeDefined();
    expect(weekOct26!.tg_impressions).toBe(397);
    expect(weekOct26!.tg_share_pct).toBe(44.0);
    expect(weekOct26!.isPartial).toBe(true);
    expect(weekOct26!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Avg weekly TG impressions 2,990 (17 Aug – 25 Oct, 10 weeks); TG share 43.2% vs 44.5%", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(10);
    const avgPost = postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length;
    expect(Math.round(avgPost)).toBe(2990);

    const preWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-04-13" && w.week_start <= "2026-07-27" && w.tg_impressions !== null
    );
    const avgPre = preWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / preWeeks.length;
    expect(Math.round(avgPre)).toBe(1547);

    const calcShare = (wks: typeof postWeeks) => {
      const tgSum = wks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0);
      const implied = wks.reduce((acc, w) => acc + (w.tg_impressions || 0) / ((w.tg_share_pct || 1) / 100), 0);
      return (tgSum / implied) * 100;
    };
    expect(calcShare(postWeeks).toFixed(1)).toBe("43.2");
    expect(calcShare(preWeeks).toFixed(1)).toBe("44.5");
  });

  it("Monthly · Jan 2026: null (below LinkedIn threshold)", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const jan = calculatedMonths.find((m) => m.month_start === "2026-01-01");
    expect(jan).toBeDefined();
    expect(jan!.tg_impressions).toBeNull();
    expect(jan!.tg_share_pct).toBeNull();
  });

  it("Monthly · Sep 2026: 12,860, 40.0%, full month, MoM +343%, -1.0 pts; Aug 2026 = 2,906, 41.0%", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const sep = calculatedMonths.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_impressions).toBe(12860);
    expect(sep!.tg_share_pct).toBe(40.0);
    expect(sep!.isPartial).toBe(false);
    expect(Math.round(sep!.momImpressionsPct!)).toBe(343);
    expect(sep!.momSharePts!.toFixed(1)).toBe("-1.0");

    const aug = calculatedMonths.find((m) => m.month_start === "2026-08-01");
    expect(aug).toBeDefined();
    expect(aug!.tg_impressions).toBe(2906);
    expect(aug!.tg_share_pct).toBe(41.0);
  });

  it("Monthly · Oct 2026: 14,393, 44.0%, chip 'to 26 Oct', MoM null, share +4.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(14393);
    expect(oct!.tg_share_pct).toBe(44.0);
    expect(oct!.isPartial).toBe(true);
    expect(oct!.momImpressionsPct).toBeNull();
    expect(oct!.momSharePts!.toFixed(1)).toBe("4.0");
  });

  it("Posts: 71 rows; 34 shaded Creator Chart Era rows; image_types = 22 Real, 30 AI, 19 No image", () => {
    expect(typedData.posts.length).toBe(71);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(34);

    expect(typedData.posts.filter((p) => p.image_type === "Real image").length).toBe(22);
    expect(typedData.posts.filter((p) => p.image_type === "AI-generated image").length).toBe(30);
    expect(typedData.posts.filter((p) => p.image_type === "No image").length).toBe(19);

    const editedPost = typedData.posts.find((p) => p.post_id === "7506232694943473666");
    expect(editedPost).toBeDefined();
    expect(editedPost!.type).toBe("Founder journey & milestones");
    expect(editedPost!.auto_type).toBe("Client story");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,963, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7963);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("What works · By image (excluding brag posts): Real image (17, 448), AI-generated image (30, 316), No image (18, 818.5)", () => {
    expect(typedData.insights.groups.img).toBeDefined();
    const imgGrp = typedData.insights.groups.img!;
    const real = imgGrp.rows.find((r) => r.g === "Real image");
    const ai = imgGrp.rows.find((r) => r.g === "AI-generated image");
    const none = imgGrp.rows.find((r) => r.g === "No image");
    expect(real?.n).toBe(17);
    expect(real?.tg).toBe(448);
    expect(ai?.n).toBe(30);
    expect(Math.round(ai?.tg || 0)).toBe(316);
    expect(none?.n).toBe(18);
    expect(none?.tg).toBe(818.5);
    expect(imgGrp.p.tg).toBe(0.023);
    expect(imgGrp.p.er).toBe(0.0);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=67 (39.9%), followers=156 (38.1%), 12m=752 (42.2%)", () => {
    expect(typedData.company_page).toBeDefined();
    const cp = typedData.company_page!;
    const vm = cp.visitors_monthly;
    const sep = vm.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_page_views).toBe(100);
    expect(sep!.tg_share_pct).toBe(38.8);

    const oct = vm.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_page_views).toBe(67);
    expect(oct!.tg_share_pct).toBe(39.9);

    expect(cp.followers.tg_followers).toBe(156);
    expect(cp.followers.tg_share_pct).toBe(38.1);

    expect(cp.visitors_12m.tg_page_views).toBe(752);
    expect([42.1, 42.2, 42.3]).toContain(cp.visitors_12m.tg_share_pct);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,855 (>=32%), 24 Oct edition=80 (22.0%), 3 Oct edition=774 (47.0%, not floor)", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[nl.subscribers.length - 1].subscribers).toBe(1855);
    expect(nl.subscribers[nl.subscribers.length - 1].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(9);
    const oct24 = nl.editions[0];
    expect(oct24.published).toBe("2026-10-24");
    expect(oct24.tg_impressions_lifetime).toBe(80);
    expect(oct24.tg_share_pct).toBe(22.0);
    expect(oct24.tg_is_floor).toBe(true);

    const oct10 = nl.editions[1];
    expect(oct10.published).toBe("2026-10-10");
    expect(oct10.tg_impressions_lifetime).toBeNull();

    const oct3 = nl.editions[2];
    expect(oct3.published).toBe("2026-10-03");
    expect(oct3.tg_impressions_lifetime).toBe(774);
    expect(oct3.tg_share_pct).toBe(47.0);
    expect(oct3.tg_is_floor).toBe(false);

    const tgs = nl.editions
      .map((e) => e.tg_impressions_lifetime)
      .filter((x): x is number => x !== null)
      .sort((a, b) => a - b);
    const medTg = tgs[Math.floor(tgs.length / 2)];
    expect(medTg).toBe(350);

    const shares = nl.editions
      .map((e) => e.tg_share_pct)
      .filter((x): x is number => x !== null)
      .sort((a, b) => a - b);
    const medSh = shares[Math.floor(shares.length / 2)];
    expect(medSh).toBe(31.0);
  });

  it("What works · By type with brag exclusion: 6 normal rows + 2 excluded rows (Media mention / PR: 4 posts, Awards: 2 posts). Founder journey shows 9 posts", () => {
    expect(typedData.insights.groups.cat).toBeDefined();
    const catGrp = typedData.insights.groups.cat;
    const normalRows = catGrp.rows.filter((r) => !r.ex);
    const exRows = catGrp.rows.filter((r) => r.ex);
    expect(normalRows.length).toBe(6);
    expect(exRows.length).toBe(2);

    const mm = exRows.find((r) => r.g === "Media mention / PR");
    expect(mm).toBeDefined();
    expect(mm!.n).toBe(4);
    expect(mm!.ex).toBe(true);

    const aw = exRows.find((r) => r.g === "Awards");
    expect(aw).toBeDefined();
    expect(aw!.n).toBe(2);
    expect(aw!.ex).toBe(true);

    const fj = normalRows.find((r) => r.g === "Founder journey & milestones");
    expect(fj).toBeDefined();
    expect(fj!.n).toBe(9);
    expect(fj!.tg).toBe(926);

    const exclList = typedData.meta.post_types_excluded_from_stats || [];
    expect(exclList).toContain("Awards");
    expect(exclList).toContain("Media mention / PR");

    const nonBragPosts = typedData.posts.filter((p) => !exclList.includes(p.type));
    expect(nonBragPosts.length).toBe(65);
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

  it("Reach plan · goal, 90-day windows, KPIs and strategy calculations: 2.2× (prev 2.7×), 13,569, 29,985, 81,414", () => {
    expect(typedData.tg_frequency).toBeDefined();
    const tgFreq = typedData.tg_frequency!;
    expect(tgFreq.goal).toBe(6);
    expect(tgFreq.windows_90d.length).toBe(2);

    const prev = tgFreq.windows_90d[0];
    const latest = tgFreq.windows_90d[1];

    expect(prev.start).toBe("2026-04-30");
    expect(prev.end).toBe("2026-07-28");
    expect(prev.tg_impressions).toBe(17961);
    expect(prev.tg_share_pct).toBe(43.0);
    expect(prev.tg_people_reached_est).toBe(6724);
    expect(prev.tg_frequency_est).toBeCloseTo(2.67, 2);

    expect(latest.start).toBe("2026-07-29");
    expect(latest.end).toBe("2026-10-26");
    expect(latest.tg_impressions).toBe(29985);
    expect(latest.tg_share_pct).toBe(41.0);
    expect(latest.tg_people_reached_est).toBe(13569);
    expect(latest.tg_frequency_est).toBeCloseTo(2.21, 2);
    expect(latest.tg_frequency_est.toFixed(1)).toBe("2.2");

    const needed = Math.round(latest.tg_people_reached_est * 6);
    expect(needed).toBe(81414);

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
    expect(c0).toBe(282);
    expect(Math.round(c2!)).toBe(691);

    const r0o = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    const r1o = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    expect(r0o).toBe(26);
    expect(r1o).toBe(45);

    const r0 = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    const r1 = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    expect(r0).toBe(443);
    expect(r1).toBe(395);

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
