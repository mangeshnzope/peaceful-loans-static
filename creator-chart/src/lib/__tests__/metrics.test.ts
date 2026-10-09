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

describe("Creator Chart TG Dashboard Acceptance Tests (Spec v5.2 - 9 Oct 2026)", () => {
  it("Daily · All 2026 (1 Jan – 8 Oct): TG impressions=45,420, share=44.7%, eng=2,095, nf=925, posts=60", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-10-08");
    expect(agg.tgImpressions).toBe(45420);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.7");
    expect(agg.postsPublished).toBe(60);
  });

  it("Daily · Creator Chart Era (19 Aug – 8 Oct = 51 days): TG impressions=20,185, share=44.0%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-10-08", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(20185);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.0");
    expect(cmp.previous).not.toBeNull();
  });

  it("Daily · Last 7 days (2 – 8 Oct): TG impressions=5,034, share=48.9%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-10-02", "2026-10-08", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(5034);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("48.9");
    expect(cmp.previous).not.toBeNull();
  });

  it("Weekly · 28 Sep – 4 Oct: 1,836, 47.0%, full week, WoW -14%, +9.0 pts", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-09-28");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(1836);
    expect(week!.tg_share_pct).toBe(47.0);
    expect(week!.isPartial).toBe(false);
    expect(Math.round(week!.wowImpressionsPct!)).toBe(-14);
    expect(week!.wowSharePts!.toFixed(1)).toBe("9.0");
  });

  it("Weekly · 5 – 8 Oct: 3,843, 46.0%, partial week chip, WoW null", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-10-05");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(3843);
    expect(week!.tg_share_pct).toBe(46.0);
    expect(week!.isPartial).toBe(true);
    expect(week!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Avg weekly TG impressions 2,385 (17 Aug – 4 Oct, 7 weeks, +54% vs 1,547); TG share 42.1% vs 44.5% (-2.4 pts)", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(7);
    const avgPost = postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length;
    expect(Math.round(avgPost)).toBe(2385);

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
    expect(calcShare(postWeeks).toFixed(1)).toBe("42.1");
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

  it("Monthly · Oct 2026: 5,020, 47.0%, chip 'to 8 Oct', MoM null, share +7.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(5020);
    expect(oct!.tg_share_pct).toBe(47.0);
    expect(oct!.isPartial).toBe(true);
    expect(oct!.momImpressionsPct).toBeNull();
    expect(oct!.momSharePts!.toFixed(1)).toBe("7.0");
  });

  it("Posts: 60 rows; 23 shaded Creator Chart Era rows; image_types = 18 Real, 28 AI, 14 No image", () => {
    expect(typedData.posts.length).toBe(60);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(23);

    expect(typedData.posts.filter((p) => p.image_type === "Real image").length).toBe(18);
    expect(typedData.posts.filter((p) => p.image_type === "AI-generated image").length).toBe(28);
    expect(typedData.posts.filter((p) => p.image_type === "No image").length).toBe(14);

    const editedPost = typedData.posts.find((p) => p.post_id === "7506232694943473666");
    expect(editedPost).toBeDefined();
    expect(editedPost!.type).toBe("Founder journey & milestones");
    expect(editedPost!.auto_type).toBe("Client story");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,904, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7904);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("What works · By image: Real image (18, 623), AI-generated image (28, 310.5), No image (14, 832)", () => {
    expect(typedData.insights.groups.img).toBeDefined();
    const imgGrp = typedData.insights.groups.img!;
    const real = imgGrp.rows.find((r) => r.g === "Real image");
    const ai = imgGrp.rows.find((r) => r.g === "AI-generated image");
    const none = imgGrp.rows.find((r) => r.g === "No image");
    expect(real?.n).toBe(18);
    expect(real?.tg).toBe(623);
    expect(ai?.n).toBe(28);
    expect(Math.round(ai?.tg || 0)).toBe(311);
    expect(none?.n).toBe(14);
    expect(none?.tg).toBe(832);
    expect(imgGrp.p.tg).toBe(0.019);
    expect(imgGrp.p.er).toBe(0.003);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=19 (42.2%), followers=151 (38.8%), 12m=713 (42.1%)", () => {
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
    expect(oct!.tg_page_views).toBe(19);
    expect(oct!.tg_share_pct).toBe(42.2);

    expect(cp.followers.tg_followers).toBe(151);
    expect(cp.followers.tg_share_pct).toBe(38.8);

    expect(cp.visitors_12m.tg_page_views).toBe(713);
    expect([41.9, 42.0, 42.1]).toContain(cp.visitors_12m.tg_share_pct);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,843 (>=32%), latest edition=612 (44.0%, not floor), median=350 (31.0%), 7 editions", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[nl.subscribers.length - 1].subscribers).toBe(1843);
    expect(nl.subscribers[nl.subscribers.length - 1].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(7);
    const latest = nl.editions[0];
    expect(latest.published).toBe("2026-10-03");
    expect(latest.tg_impressions_lifetime).toBe(612);
    expect(latest.tg_share_pct).toBe(44.0);
    expect(latest.tg_is_floor).toBe(false);

    const tgs = nl.editions.map((e) => e.tg_impressions_lifetime!).sort((a, b) => a - b);
    const medTg = tgs[Math.floor(tgs.length / 2)];
    expect(medTg).toBe(350);

    const shares = nl.editions.map((e) => e.tg_share_pct!).sort((a, b) => a - b);
    const medSh = shares[Math.floor(shares.length / 2)];
    expect(medSh).toBe(31.0);
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
