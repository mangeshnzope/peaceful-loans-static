import { DailyRow, WeeklyRow, MonthlyRow, PostRow, ViewerMix, DashboardData } from "./types";

export interface RangeAggregate {
  tgImpressions: number;
  tgSharePct: number | null;
  engagements: number;
  newFollowers: number;
  postsPublished: number;
  daysCount: number;
}

export interface PeriodComparison {
  current: RangeAggregate;
  previous: RangeAggregate | null;
  impressionsChangePct: number | null;
  shareChangePts: number | null;
  previousStartDate: string;
  previousEndDate: string;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Aggregates daily metrics over a given date range [startDate, endDate] inclusive.
 */
export function aggregateDailyRange(
  daily: DailyRow[],
  startDate: string,
  endDate: string
): RangeAggregate {
  let tgImpressions = 0;
  let impliedViewsSum = 0;
  let engagements = 0;
  let newFollowers = 0;
  let postsPublished = 0;
  let daysCount = 0;

  for (const row of daily) {
    if (row.date >= startDate && row.date <= endDate) {
      daysCount++;
      engagements += row.engagements;
      newFollowers += row.new_followers;
      postsPublished += row.posts_published;

      if (row.tg_impressions !== null && row.tg_share_pct !== null && row.tg_share_pct > 0) {
        tgImpressions += row.tg_impressions;
        impliedViewsSum += row.tg_impressions / (row.tg_share_pct / 100);
      }
    }
  }

  const tgSharePct = impliedViewsSum > 0 ? (tgImpressions / impliedViewsSum) * 100 : null;

  return {
    tgImpressions,
    tgSharePct,
    engagements,
    newFollowers,
    postsPublished,
    daysCount,
  };
}

/**
 * Compares current date range with previous period of the exact same number of days.
 */
export function compareDailyPeriods(
  daily: DailyRow[],
  startDate: string,
  endDate: string,
  minDataDate: string
): PeriodComparison {
  const current = aggregateDailyRange(daily, startDate, endDate);
  const days = daysBetween(startDate, endDate);

  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -(days - 1));

  let previous: RangeAggregate | null = null;
  let impressionsChangePct: number | null = null;
  let shareChangePts: number | null = null;

  if (previousStartDate >= minDataDate) {
    previous = aggregateDailyRange(daily, previousStartDate, previousEndDate);
    if (previous.tgImpressions > 0) {
      impressionsChangePct = ((current.tgImpressions - previous.tgImpressions) / previous.tgImpressions) * 100;
    }
    if (current.tgSharePct !== null && previous.tgSharePct !== null) {
      shareChangePts = current.tgSharePct - previous.tgSharePct;
    }
  }

  return {
    current,
    previous,
    impressionsChangePct,
    shareChangePts,
    previousStartDate,
    previousEndDate,
  };
}

export interface ViewerMixItem {
  name: string;
  pct: number;
}

/**
 * Calculates weighted viewer mix percentages for a given dimension and range.
 */
export function getViewerMixForRange(
  viewerMix: ViewerMix,
  dimension: string,
  startDate: string,
  endDate: string,
  limit?: number
): ViewerMixItem[] {
  const dimObj = viewerMix.pct_of_views[dimension];
  if (!dimObj) return [];

  const weights = viewerMix.day_weight;

  // Find all dates in range that have data for this dimension
  const datesWithDim = new Set<string>();
  for (const group in dimObj) {
    for (const d in dimObj[group]) {
      if (d >= startDate && d <= endDate && weights[d] !== undefined) {
        datesWithDim.add(d);
      }
    }
  }

  const totalWeight = Array.from(datesWithDim).reduce((acc, d) => acc + (weights[d] || 0), 0);
  if (totalWeight <= 0) return [];

  const items: ViewerMixItem[] = [];
  for (const group in dimObj) {
    let weightedPctSum = 0;
    for (const d in dimObj[group]) {
      if (d >= startDate && d <= endDate && weights[d] !== undefined) {
        weightedPctSum += dimObj[group][d] * weights[d];
      }
    }
    const pct = weightedPctSum / totalWeight;
    if (pct > 0) {
      items.push({ name: group, pct });
    }
  }

  items.sort((a, b) => b.pct - a.pct);

  const maxItems = limit ?? (dimension === "Seniority" ? 10 : 8);
  return items.slice(0, maxItems);
}

/**
 * Weekly WoW calculations
 */
export function isPartialWeek(weekStart: string, weekEnd: string): boolean {
  return daysBetween(weekStart, weekEnd) < 7;
}

export function calculateWeeklyWoW(weeks: WeeklyRow[]) {
  return weeks.map((w, i) => {
    const isPartial = isPartialWeek(w.week_start, w.week_end);
    const prev = i > 0 ? weeks[i - 1] : null;

    let wowImpressionsPct: number | null = null;
    let wowSharePts: number | null = null;

    if (!isPartial && prev && !isPartialWeek(prev.week_start, prev.week_end)) {
      if (w.tg_impressions !== null && prev.tg_impressions !== null && prev.tg_impressions > 0) {
        wowImpressionsPct = ((w.tg_impressions - prev.tg_impressions) / prev.tg_impressions) * 100;
      }
      if (w.tg_share_pct !== null && prev.tg_share_pct !== null) {
        wowSharePts = w.tg_share_pct - prev.tg_share_pct;
      }
    }

    return {
      ...w,
      isPartial,
      wowImpressionsPct,
      wowSharePts,
    };
  });
}

/**
 * Monthly MoM calculations + post aggregations
 */
export function isPartialMonth(monthStart: string, monthEnd: string): boolean {
  const [y, m] = monthStart.split("-").map(Number);
  const lastDayOfMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const endDay = parseInt(monthEnd.slice(8), 10);
  return endDay < lastDayOfMonth;
}

export function calculateMonthlyMetrics(months: MonthlyRow[], posts: PostRow[]) {
  return months.map((m, i) => {
    const isPartial = isPartialMonth(m.month_start, m.month_end);
    const prev = i > 0 ? months[i - 1] : null;

    let momImpressionsPct: number | null = null;
    let momSharePts: number | null = null;

    if (!isPartial && prev && m.tg_impressions !== null && prev.tg_impressions !== null && prev.tg_impressions > 0) {
      momImpressionsPct = ((m.tg_impressions - prev.tg_impressions) / prev.tg_impressions) * 100;
    }
    if (prev && m.tg_share_pct !== null && prev.tg_share_pct !== null) {
      momSharePts = m.tg_share_pct - prev.tg_share_pct;
    }

    // Posts published in this month
    const ym = m.month_start.slice(0, 7);
    const monthPosts = posts.filter((p) => p.published.startsWith(ym));
    const validPosts = monthPosts.filter((p) => p.tg_impressions_lifetime !== null && p.tg_share_pct !== null);

    const postsTgImpressions = validPosts.reduce((acc, p) => acc + (p.tg_impressions_lifetime || 0), 0);
    const postsImpliedViews = validPosts.reduce(
      (acc, p) => acc + (p.tg_impressions_lifetime || 0) / ((p.tg_share_pct || 1) / 100),
      0
    );
    const postsTgSharePct = postsImpliedViews > 0 ? (postsTgImpressions / postsImpliedViews) * 100 : null;

    const postsBelowThreshold = monthPosts.length - validPosts.length;

    return {
      ...m,
      isPartial,
      momImpressionsPct,
      momSharePts,
      postsTgImpressions: validPosts.length > 0 ? postsTgImpressions : null,
      postsTgSharePct,
      postsBelowThreshold,
    };
  });
}
