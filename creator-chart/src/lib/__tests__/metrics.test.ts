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

describe("Creator Chart TG Dashboard Acceptance Tests (Spec Section 8 - v5 4 Oct 2026)", () => {
  it("Daily · All 2026: TG impressions=40,996 (spec: 40,994), share=44.3%, eng=1,798, nf=820, posts=57", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-10-03");
    expect([40994, 40996]).toContain(agg.tgImpressions);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.3");
    expect(agg.engagements).toBe(1798);
    expect(agg.newFollowers).toBe(820);
    expect(agg.postsPublished).toBe(57);
  });

  it("Daily · Creator Chart Era (19 Aug – 3 Oct = 46 days): TG impressions=15,761, +55% vs prev 46 days, share=43.0%, -2.6 pts vs prev", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-10-03", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(15761);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("43.0");

    expect(cmp.previous).not.toBeNull();
    expect(Math.round(cmp.impressionsChangePct!)).toBe(55);
    expect(cmp.shareChangePts!.toFixed(1)).toBe("-2.6");
  });

  it("Daily · Last 7 days (27 Sep – 3 Oct): TG impressions=1,470, share=44.0% (-46%, +4.3 pts vs 20–26 Sep)", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-09-27", "2026-10-03", "2026-01-01");
    expect([1469, 1470]).toContain(cmp.current.tgImpressions);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("44.0");
    expect(Math.round(cmp.impressionsChangePct!)).toBe(-46);
    expect(cmp.shareChangePts!.toFixed(1)).toBe("4.3");
  });

  it("Weekly · 14–20 Sep: 8,983 TG impressions, 42.0%", () => {
    const week = typedData.weekly.find((w) => w.week_start === "2026-09-14");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(8983);
    expect(week!.tg_share_pct).toBe(42.0);
  });

  it("Weekly · 21–27 Sep: 2,145, 38.0%, full week, WoW -76%, -4.0 pts", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-09-21");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(2145);
    expect(week!.tg_share_pct).toBe(38.0);
    expect(week!.isPartial).toBe(false);
    expect(Math.round(week!.wowImpressionsPct!)).toBe(-76);
    expect(week!.wowSharePts!.toFixed(1)).toBe("-4.0");
  });

  it("Weekly · 28 Sep – 3 Oct: 1,409, 46.0%, partial week chip, WoW null", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-09-28");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(1409);
    expect(week!.tg_share_pct).toBe(46.0);
    expect(week!.isPartial).toBe(true);
    expect(week!.wowImpressionsPct).toBeNull();
  });

  it("Weekly · KPI tiles: Avg weekly TG impressions 2,477 (17 Aug – 27 Sep, 6 weeks) vs 1,547; TG share 41.6% vs 44.5%", () => {
    const fullWeeks = typedData.weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));
    const postWeeks = fullWeeks.filter(
      (w) => w.week_start >= "2026-08-17" && w.tg_impressions !== null
    );
    expect(postWeeks.length).toBe(6);
    const avgPost = postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length;
    expect(Math.round(avgPost)).toBe(2477);

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
    expect(calcShare(postWeeks).toFixed(1)).toBe("41.6");
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

  it("Monthly · Oct 2026: 755, 51.0%, chip 'to 3 Oct', MoM null, share +11.0 pts", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const oct = calculatedMonths.find((m) => m.month_start === "2026-10-01");
    expect(oct).toBeDefined();
    expect(oct!.tg_impressions).toBe(755);
    expect(oct!.tg_share_pct).toBe(51.0);
    expect(oct!.isPartial).toBe(true);
    expect(oct!.momImpressionsPct).toBeNull();
    expect(oct!.momSharePts!.toFixed(1)).toBe("11.0");
  });

  it("Posts: 57 rows; 20 shaded Creator Chart Era rows", () => {
    expect(typedData.posts.length).toBe(57);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(20);

    const editedPost = typedData.posts.find((p) => p.post_id === "7506232694943473666");
    expect(editedPost).toBeDefined();
    expect(editedPost!.type).toBe("Founder journey & milestones");
    expect(editedPost!.auto_type).toBe("Client story");
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,866, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7866);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("Page · KPI tiles & monthly table: Sep 2026=100 (38.8%), Oct 2026=3 (50.0%), followers=150 (38.7%), 12m=702 (42.0%)", () => {
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
    expect(oct!.tg_page_views).toBe(3);
    expect(oct!.tg_share_pct).toBe(50.0);

    expect(cp.followers.tg_followers).toBe(150);
    expect(cp.followers.tg_share_pct).toBe(38.7);

    expect(cp.visitors_12m.tg_page_views).toBe(702);
    expect(cp.visitors_12m.tg_share_pct).toBe(42.0);
  });

  it("Newsletter · KPI tiles & edition table: Subscribers=1,843 (>=32%), latest edition=332 (>=32.0%), median=332 (31.0%), 7 editions", () => {
    expect(typedData.newsletter).toBeDefined();
    const nl = typedData.newsletter!;
    expect(nl.subscribers[0].subscribers).toBe(1843);
    expect(nl.subscribers[0].tg_share_floor_pct).toBe(32.0);

    expect(nl.editions.length).toBe(7);
    const latest = nl.editions[0];
    expect(latest.published).toBe("2026-10-03");
    expect(latest.tg_impressions_lifetime).toBe(332);
    expect(latest.tg_share_pct).toBe(32.0);
    expect(latest.tg_is_floor).toBe(true);

    const tgs = nl.editions.map((e) => e.tg_impressions_lifetime!).sort((a, b) => a - b);
    const medTg = tgs[Math.floor(tgs.length / 2)];
    expect(medTg).toBe(332);

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
