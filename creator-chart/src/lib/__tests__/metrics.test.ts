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

describe("Creator Chart TG Dashboard Acceptance Tests (Spec Section 8 - Updated 27 Sep 2026)", () => {
  it("Daily · All 2026: TG impressions=39,527, share=44.3%, eng=1,763, nf=806, posts=54", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-01-01", "2026-09-26");
    expect(agg.tgImpressions).toBe(39527);
    expect(agg.tgSharePct).not.toBeNull();
    expect(agg.tgSharePct!.toFixed(1)).toBe("44.3");
    expect(agg.engagements).toBe(1763);
    expect(agg.newFollowers).toBe(806);
    expect(agg.postsPublished).toBe(54);
  });

  it("Daily · Creator Chart Era (19 Aug - 26 Sep = 39 days): TG impressions=14,292, +48% vs prev 39 days (9,649), share=42.9%, -3.0 pts vs prev (45.9%)", () => {
    const cmp = compareDailyPeriods(typedData.daily, "2026-08-19", "2026-09-26", "2026-01-01");
    expect(cmp.current.tgImpressions).toBe(14292);
    expect(cmp.current.tgSharePct!.toFixed(1)).toBe("42.9");

    expect(cmp.previous).not.toBeNull();
    expect(cmp.previous!.tgImpressions).toBe(9649);
    expect(cmp.previous!.tgSharePct!.toFixed(1)).toBe("45.9");

    expect(Math.round(cmp.impressionsChangePct!)).toBe(48);
    expect(cmp.shareChangePts!.toFixed(1)).toBe("-3.0");
  });

  it("Daily · Last 7 days (20–26 Sep): TG impressions=2,740, share=39.7%", () => {
    const agg = aggregateDailyRange(typedData.daily, "2026-09-20", "2026-09-26");
    expect(agg.tgImpressions).toBe(2740);
    expect(agg.tgSharePct!.toFixed(1)).toBe("39.7");
  });

  it("Weekly · 14–20 Sep: TG impressions=8,983, share=42.0%", () => {
    const week = typedData.weekly.find((w) => w.week_start === "2026-09-14");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(8983);
    expect(week!.tg_share_pct).toBe(42.0);
  });

  it("Weekly · 21–26 Sep: TG impressions=1,979, share=38.0%, partial week, WoW=null", () => {
    const calculatedWeeks = calculateWeeklyWoW(typedData.weekly);
    const week = calculatedWeeks.find((w) => w.week_start === "2026-09-21");
    expect(week).toBeDefined();
    expect(week!.tg_impressions).toBe(1979);
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

  it("Monthly · Sep 2026: 12,055, 40.0%, partial to 26 Sept", () => {
    const calculatedMonths = calculateMonthlyMetrics(typedData.monthly, typedData.posts);
    const sep = calculatedMonths.find((m) => m.month_start === "2026-09-01");
    expect(sep).toBeDefined();
    expect(sep!.tg_impressions).toBe(12055);
    expect(sep!.tg_share_pct).toBe(40.0);
    expect(sep!.isPartial).toBe(true);
  });

  it("Posts: 54 rows; 17 shaded Creator Chart Era rows", () => {
    expect(typedData.posts.length).toBe(54);
    const eraPosts = typedData.posts.filter((p) => p.creator_chart_era);
    expect(eraPosts.length).toBe(17);
  });

  it("Posts · top by TG impressions: 'A 10000 crore listed company and peaceful loans', 18 Sep: 7,586, 47.0%, 66% out-of-network", () => {
    const top = [...typedData.posts].sort((a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0))[0];
    expect(top.title).toContain("A 10000 crore listed company and peaceful loans");
    expect(top.published).toBe("2026-09-18");
    expect(top.tg_impressions_lifetime).toBe(7586);
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
