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

describe("Creator Chart TG Dashboard Acceptance Tests (Spec v5.3 - 17 Oct 2026)", () => {
  it("Daily · All 2026 (1 Jan – 16 Oct): TG impressions=51,043, share=44.7%, eng=1,935, nf=883, posts=65", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-10-16");
    expect(agg.tgImpressions).toBe(51043);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.7");
    expect(agg.postsPublished).toBe(65);
    expect(agg.engagements).toBe(1935);
    expect(agg.newFollowers).toBe(883);
  });

  it("Daily · Creator Chart Era (19 Aug – 16 Oct = 59 days): TG impressions=25,808, share=44.2%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-10-16", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(25808);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.2");
    expect(cmp.current.daysCount).toBe(59);
    expect(cmp.previous).not.toBeNull();
  });

  it("Daily · Last 7 days (10 – 16 Oct): TG impressions=3,443, share=44.3%", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-10-10", "2026-10-16", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(3443);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.3");
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

  it("Weekly · 12 – 16 Oct: 2,128, 44.0%, partial week chip, WoW null", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-10-12");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(2128);
    expect(week!.tg_share_pct).toBe(44.0);
    expect(week!.isPartial).toBe(true);
    expect(week!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Avg weekly TG impressions 2,989 (17 Aug – 11 Oct, 8 weeks, +93% vs 1,547); TG share 42.9% vs 44.5% (-1.6 pts)", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(8);
    const avgPost = postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length;
    expect(Math.round(avgPost)).toBe(2989);

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
    expect(calcShare(postWeeks).toFixed(1)).toBe("42.9");
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

  it("Monthly · Oct 2026: 10,665, 46.0%, chip 'to 16 Oct', MoM null, share +6.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(10665);
    expect(oct!.tg_share_pct).toBe(46.0);
    expect(oct!.isPartial).toBe(true);
    expect(oct!.momImpressionsPct).toBeNull();
    expect(oct!.momSharePts!.toFixed(1)).toBe("6.0");
  });

  it("Posts: 65 rows; 28 shaded Creator Chart Era rows; image_types = 18 Real, 29 AI, 18 No image", () => {
    expect(typedData.posts.length).toBe(65);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(28);

    expect(typedData.posts.filter((p) => p.image_type === "Real image").length).toBe(18);
    expect(typedData.posts.filter((p) => p.image_type === "AI-generated image").length).toBe(29);
    expect(typedData.posts.filter((p) => p.image_type === "No image").length).toBe(18);

    const editedPost = typedData.posts.find((p) => p.post_id === "7506232694943473666");
    expect(editedPost).toBeDefined();
    expect(editedPost!.type).toBe("Founder journey & milestones");
    expect(editedPost!.auto_type).toBe("Client story");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,947, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7947);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("What works · By image: Real image (18, 623), AI-generated image (29, 314.5), No image (18, 604.5)", () => {
    expect(typedData.insights.groups.img).toBeDefined();
    const imgGrp = typedData.insights.groups.img!;
    const real = imgGrp.rows.find((r) => r.g === "Real image");
    const ai = imgGrp.rows.find((r) => r.g === "AI-generated image");
    const none = imgGrp.rows.find((r) => r.g === "No image");
    expect(real?.n).toBe(18);
    expect(real?.tg).toBe(623);
    expect(ai?.n).toBe(29);
    expect(Math.round(ai?.tg || 0)).toBe(315);
    expect(none?.n).toBe(18);
    expect(Math.round(none?.tg || 0)).toBe(605);
    expect(imgGrp.p.tg).toBe(0.012);
    expect(imgGrp.p.er).toBe(0.001);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=33 (34.0%), followers=154 (37.7%), 12m=724 (41.7%)", () => {
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
    expect(oct!.tg_page_views).toBe(33);
    expect(oct!.tg_share_pct).toBe(34.0);

    expect(cp.followers.tg_followers).toBe(154);
    expect(cp.followers.tg_share_pct).toBe(37.7);

    expect(cp.visitors_12m.tg_page_views).toBe(724);
    expect([41.7, 41.8, 41.9]).toContain(cp.visitors_12m.tg_share_pct);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,844 (>=32%), latest edition=null (–), 3 Oct edition=653 (44.0%, not floor), median=350 (31.0%), 8 editions", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[nl.subscribers.length - 1].subscribers).toBe(1844);
    expect(nl.subscribers[nl.subscribers.length - 1].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(8);
    const latest = nl.editions[0];
    expect(latest.published).toBe("2026-10-10");
    expect(latest.tg_impressions_lifetime).toBeNull();
    expect(latest.tg_share_pct).toBeNull();

    const oct3 = nl.editions[1];
    expect(oct3.published).toBe("2026-10-03");
    expect(oct3.tg_impressions_lifetime).toBe(653);
    expect(oct3.tg_share_pct).toBe(44.0);
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
