import { describe, it, expect } from "vitest";
import data from "../../../data/creator_chart_dashboard_data.json";
import {
  aggregateDailyRange,
  compareDailyPeriods,
  getViewerMixForRange,
  calculateWeeklyWoW,
  calculateMonthlyMetrics,
} from "../metrics";
import { DashboardData } from "../types";

const typedData = data as unknown as DashboardData;

describe("Creator Chart TG Dashboard Acceptance Tests (Spec Section 8)", () => {
  it("Daily · All 2026: TG impressions=39,314, share=44.4%, eng=1754, nf=805, posts=54", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-09-25");
    expect(agg.tgImpressions).toBe(39314);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.4");
    expect(agg.engagements).toBe(1754);
    expect(agg.newFollowers).toBe(805);
    expect(agg.postsPublished).toBe(54);
  });

  it("Daily · Creator Chart Era (19 Aug - 25 Sep = 38 days): TG impressions=14,079, +46% vs prev 38 days (9,649), share=43.0%, -2.9 pts vs prev (45.9%)", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-09-25", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(14079);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("43.0");

    expect(cmp.previous).not.toBeNull();
    expect(cmp.previous!.tgImpressions).toBe(9649);
    expect(cmp.previous!.tgSharePct!.toFixed(1)).toBe("45.9");

    expect(Math.round(cmp.impressionsChangePct!)).toBe(46);
    expect(cmp.shareChangePts!.toFixed(1)).toBe("-2.9");
  });

  it("Daily · Last 7 days (19–25 Sep): TG impressions=3,999, share=40.4%", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-09-19", "2026-09-25");
    expect(agg.tgImpressions).toBe(3999);
    expect(agg.tgSharePct!.toFixed(1)).toBe("40.4");
  });

  it("Weekly · 14–20 Sep: TG impressions=8,983, share=42.0%", () => {
    const week = typedData.weekly.find((w) => w.week_start === "2026-09-14");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(8983);
    expect(week!.tg_share_pct).toBe(42.0);
  });

  it("Weekly · 21–25 Sep: TG impressions=1,754, share=38.0%, partial week, WoW=null", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-09-21");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(1754);
    expect(week!.tg_share_pct).toBe(38.0);
    expect(week!.isPartial).toBe(true);
    expect(week!.wowImpressionsPct).toBeNull();
  });

  it("Monthly · Jan 2026: null (below LinkedIn threshold)", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const jan = calculatedMonths.find((m) => m.month_start === "2026-01-01");
    expect(jan).toBeDefined();
    expect(jan!.tg_impressions).toBeNull();
    expect(jan!.tg_share_pct).toBeNull();
  });

  it("Monthly · Sep 2026: 11,818, 40.0%, partial to 25 Sept", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const sep = calculatedMonths.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_impressions).toBe(11818);
    expect(sep!.tg_share_pct).toBe(40.0);
    expect(sep!.isPartial).toBe(true);
  });

  it("Posts: 54 rows; 17 shaded Creator Chart Era rows", () => {
    expect(typedData.posts.length).toBe(54);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(17);
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,502, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7502);
    expect(top.tg_share_pct).toBe(47.0);
    expect(top.out_of_network_pct).toBe(66);
  });

  it("Zero total impressions anywhere in dataset keys", () => {
    const forbiddenKeys = ["impressions", "imp", "members_reached", "sv"];
    function checkKeys(obj: any) {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        expect(forbiddenKeys.includes(key)).toBe(false);
        checkKeys(obj[key]);
      }
    }
    checkKeys(typedData);
  });
});
