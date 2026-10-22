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

describe("Creator Chart TG Dashboard Acceptance Tests (Spec v5.6 - 22 Oct 2026)", () => {
  it("Daily · All 2026 (1 Jan – 21 Oct): TG impressions=53,271, share=44.8%, eng=2,041, nf=906, posts=68", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-10-21");
    expect(agg.tgImpressions).toBe(53271);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.8");
    expect(agg.postsPublished).toBe(68);
    expect(agg.engagements).toBe(2041);
    expect(agg.newFollowers).toBe(906);
  });

  it("Daily · Creator Chart Era (19 Aug – 21 Oct = 64 days): TG impressions=28,036, share=44.4%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-10-21", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(28036);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.4");
    expect(cmp.current.daysCount).toBe(64);
    expect(cmp.previous).not.toBeNull();
  });

  it("Daily · Last 7 days (15 – 21 Oct): TG impressions=3,053, share=46.9%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-10-15", "2026-10-21", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(3053);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("46.9");
    expect(cmp.previous).not.toBeNull();
  });

  it("Weekly · 5 – 11 Oct: 7,211, 45.0%, full week, WoW +293%, -2.0 pts", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-10-05");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(7211);
    expect(week!.tg_share_pct).toBe(45.0);
    expect(week!.isPartial).toBe(false);
    expect(Math.round(week!.wowImpressionsPct!)).toBe(293);
    expect(week!.wowSharePts!.toFixed(1)).toBe("-2.0");
  });

  it("Weekly · 12 – 18 Oct (2,998, 44%) and partial week 19 – 21 Oct (1,207, 43%, WoW null)", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const weekOct12 = calculatedWeeks.find((w) => w.week_start === "2026-10-12");
    expect(weekOct12).toBeDefined();
    expect(weekOct12!.tg_impressions).toBe(2998);
    expect(weekOct12!.tg_share_pct).toBe(44.0);
    expect(weekOct12!.isPartial).toBe(false);

    const weekOct19 = calculatedWeeks.find((w) => w.week_start === "2026-10-19");
    expect(weekOct19).toBeDefined();
    expect(weekOct19!.tg_impressions).toBe(1207);
    expect(weekOct19!.tg_share_pct).toBe(43.0);
    expect(weekOct19!.isPartial).toBe(true);
    expect(weekOct19!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Avg weekly TG impressions 2,990 (17 Aug – 18 Oct, 9 weeks); TG share 43.1% vs 44.5%", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(9);
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
    expect(calcShare(postWeeks).toFixed(1)).toBe("43.1");
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

  it("Monthly · Oct 2026: 12,586, 45.0%, chip 'to 21 Oct', MoM null, share +5.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(12586);
    expect(oct!.tg_share_pct).toBe(45.0);
    expect(oct!.isPartial).toBe(true);
    expect(oct!.momImpressionsPct).toBeNull();
    expect(oct!.momSharePts!.toFixed(1)).toBe("5.0");
  });

  it("Posts: 68 rows; 31 shaded Creator Chart Era rows; image_types = 20 Real, 29 AI, 19 No image", () => {
    expect(typedData.posts.length).toBe(68);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(31);

    expect(typedData.posts.filter((p) => p.image_type === "Real image").length).toBe(20);
    expect(typedData.posts.filter((p) => p.image_type === "AI-generated image").length).toBe(29);
    expect(typedData.posts.filter((p) => p.image_type === "No image").length).toBe(19);

    const editedPost = typedData.posts.find((p) => p.post_id === "7506232694943473666");
    expect(editedPost).toBeDefined();
    expect(editedPost!.type).toBe("Founder journey & milestones");
    expect(editedPost!.auto_type).toBe("Client story");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,953, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7953);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("What works · By image (excluding brag posts): Real image (15, 448), AI-generated image (29, 316), No image (18, 732.5)", () => {
    expect(typedData.insights.groups.img).toBeDefined();
    const imgGrp = typedData.insights.groups.img!;
    const real = imgGrp.rows.find((r) => r.g === "Real image");
    const ai = imgGrp.rows.find((r) => r.g === "AI-generated image");
    const none = imgGrp.rows.find((r) => r.g === "No image");
    expect(real?.n).toBe(15);
    expect(real?.tg).toBe(448);
    expect(ai?.n).toBe(29);
    expect(Math.round(ai?.tg || 0)).toBe(316);
    expect(none?.n).toBe(18);
    expect(none?.tg).toBe(732.5);
    expect(imgGrp.p.tg).toBe(0.024);
    expect(imgGrp.p.er).toBe(0.001);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=46 (36.5%), followers=154 (38.0%), 12m=744 (42.0%)", () => {
    expect(typedData.company_page).toBeDefined();
    const cp = typedData.company_page!;
    const vm = cp.visitors_monthly;
    const sep = vm.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_page_views).toBe(100);
    expect(sep!.tg_share_pct).toBe(38.8);

    const aug = vm.find((m) => m.month_start === "2026-08-01");
    expect(aug).toBeDefined();
    expect(aug!.tg_page_views).toBe(78);
    expect(aug!.tg_share_pct).toBe(45.3);

    const oct = vm.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_page_views).toBe(46);
    expect(oct!.tg_share_pct).toBe(36.5);

    expect(cp.followers.tg_followers).toBe(154);
    expect(cp.followers.tg_share_pct).toBe(38.0);

    expect(cp.visitors_12m.tg_page_views).toBe(744);
    expect([41.9, 42.0, 42.1]).toContain(cp.visitors_12m.tg_share_pct);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,849 (>=32%), latest edition=null (–), 3 Oct edition=703 (46.0%, not floor)", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[nl.subscribers.length - 1].subscribers).toBe(1849);
    expect(nl.subscribers[nl.subscribers.length - 1].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(8);
    const latest = nl.editions[0];
    expect(latest.published).toBe("2026-10-10");
    expect(latest.tg_impressions_lifetime).toBeNull();
    expect(latest.tg_share_pct).toBeNull();

    const oct3 = nl.editions[1];
    expect(oct3.published).toBe("2026-10-03");
    expect(oct3.tg_impressions_lifetime).toBe(703);
    expect(oct3.tg_share_pct).toBe(46.0);
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
    expect(nonBragPosts.length).toBe(62);
  });

  it("Engagement mix · summary KPIs and per-post breakdown: 136 people, 99 engaged once (73%), 20 regulars (13 on 6+), 18 Sep and 17 Oct rows greyed out", () => {
    expect(typedData.engagement).toBeDefined();
    const eg = typedData.engagement!;
    const s = eg.summary;
    expect(s.people).toBe(136);
    expect(Math.round((s.engaged_once / s.people) * 100)).toBe(73);
    expect(s.engaged_once).toBe(99);
    expect(s.regulars).toBe(20);
    expect(s.regulars_6plus).toBe(13);
    expect(s.median_regular_pct).toBe(67);
    expect(s.median_new_people).toBe(2);
    expect(s.median_first_degree_pct).toBe(80);

    expect(eg.posts.length).toBe(31);
    const sep18 = eg.posts.find((p) => p.published === "2026-09-18");
    expect(sep18).toBeDefined();
    expect(sep18!.new_people).toBe(438);
    expect(sep18!.type).toBe("Awards");

    const oct17 = eg.posts.find((p) => p.published === "2026-10-17");
    expect(oct17).toBeDefined();
    expect(oct17!.type).toBe("Awards");
  });

  it("Reach plan · goal, 90-day windows, KPIs and strategy calculations: 2.1× (prev 3.3×), 16,140, 34,375, 96,840", () => {
    expect(typedData.tg_frequency).toBeDefined();
    const tgFreq = typedData.tg_frequency!;
    expect(tgFreq.goal).toBe(6);
    expect(tgFreq.windows_90d.length).toBe(2);

    const prev = tgFreq.windows_90d[0];
    const latest = tgFreq.windows_90d[1];

    expect(prev.start).toBe("2026-04-25");
    expect(prev.end).toBe("2026-07-23");
    expect(prev.tg_impressions).toBe(15061);
    expect(prev.tg_share_pct).toBe(41.0);
    expect(prev.tg_people_reached_est).toBe(4601);
    expect(prev.tg_frequency_est).toBeCloseTo(3.27, 2);

    expect(latest.start).toBe("2026-07-24");
    expect(latest.end).toBe("2026-10-21");
    expect(latest.tg_impressions).toBe(34375);
    expect(latest.tg_share_pct).toBe(44.0);
    expect(latest.tg_people_reached_est).toBe(16140);
    expect(latest.tg_frequency_est).toBeCloseTo(2.13, 2);
    expect(latest.tg_frequency_est.toFixed(1)).toBe("2.1");

    const needed = Math.round(latest.tg_people_reached_est * 6);
    expect(needed).toBe(96840);

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
    expect(c2).toBe(619);

    const r0o = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    const r1o = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.out_of_network_pct != null).map((p) => p.out_of_network_pct!));
    expect(r0o).toBe(26.5);
    expect(r1o).toBe(44);

    const r0 = calculateMedian(nonBrag.filter((p) => p.reposts === 0 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    const r1 = calculateMedian(nonBrag.filter((p) => p.reposts >= 1 && p.tg_impressions_lifetime != null).map((p) => p.tg_impressions_lifetime!));
    expect(r0).toBe(443);
    expect(r1).toBe(394);

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
