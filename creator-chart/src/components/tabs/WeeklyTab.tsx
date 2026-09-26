"use client";

import { useMemo } from "react";
import { WeeklyRow } from "@/lib/types";
import { calculateWeeklyWoW, daysBetween, isPartialWeek } from "@/lib/metrics";
import { fmt, pct, dd } from "@/lib/formatters";

interface WeeklyTabProps {
  weekly: WeeklyRow[];
}

export default function WeeklyTab({ weekly }: WeeklyTabProps) {
  const calculatedWeeks = useMemo(() => calculateWeeklyWoW(weekly), [weekly]);

  // KPI Calculations
  const { avgPostImpressions, avgPreImpressions, postShare, preShare, bestWeekImp, bestWeekShare } = useMemo(() => {
    const fullWeeks = weekly.filter((w) => !isPartialWeek(w.week_start, w.week_end));

    // Creator Chart Era: 17 Aug – 20 Sep (5 full weeks)
    const postWeeks = weekly.filter(
      (w) => w.week_start >= "2026-08-17" && w.week_start <= "2026-09-14" && w.tg_impressions !== null
    );
    // Baseline: 13 Apr – 2 Aug (16 full weeks)
    const preWeeks = weekly.filter(
      (w) => w.week_start >= "2026-04-13" && w.week_start <= "2026-07-27" && w.tg_impressions !== null
    );

    const avgPost = postWeeks.length
      ? postWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / postWeeks.length
      : 0;
    const avgPre = preWeeks.length
      ? preWeeks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0) / preWeeks.length
      : 0;

    const calcShare = (wks: WeeklyRow[]) => {
      const tgSum = wks.reduce((acc, w) => acc + (w.tg_impressions || 0), 0);
      const impliedViews = wks.reduce(
        (acc, w) => acc + (w.tg_impressions || 0) / ((w.tg_share_pct || 1) / 100),
        0
      );
      return impliedViews > 0 ? (tgSum / impliedViews) * 100 : null;
    };

    const bestImp = [...fullWeeks].sort((a, b) => (b.tg_impressions || 0) - (a.tg_impressions || 0))[0];
    const bestSh = [...fullWeeks]
      .filter((w) => (w.tg_impressions || 0) >= 300 && w.tg_share_pct !== null)
      .sort((a, b) => (b.tg_share_pct || 0) - (a.tg_share_pct || 0))[0];

    return {
      avgPostImpressions: avgPost,
      avgPreImpressions: avgPre,
      postShare: calcShare(postWeeks),
      preShare: calcShare(preWeeks),
      bestWeekImp: bestImp,
      bestWeekShare: bestSh,
    };
  }, [weekly]);

  const downloadWeeklyCsv = () => {
    const headers = [
      "week_start",
      "week_end",
      "tg_impressions",
      "tg_share_pct",
      "tg_may_be_higher",
      "engagements",
      "new_followers",
      "posts_published",
    ];
    const rows = weekly.map((w) => [
      w.week_start,
      w.week_end,
      w.tg_impressions !== null ? w.tg_impressions : "",
      w.tg_share_pct !== null ? w.tg_share_pct.toFixed(1) : "",
      w.tg_may_be_higher ? "yes" : "",
      w.engagements,
      w.new_followers,
      w.posts_published,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "weekly_tg.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Tiles (4 tiles) */}
      <div className="kpis">
        <div className="kpi t">
          <span className="eyebrow">Avg weekly TG impressions</span>
          <span className="v num">{fmt(avgPostImpressions)}</span>
          <span className="s">
            Creator Chart Era (17 Aug – 20 Sep) vs {fmt(avgPreImpressions)} (13 Apr – 2 Aug)
          </span>
        </div>

        <div className="kpi t">
          <span className="eyebrow">TG share, Creator Chart Era</span>
          <span className="v num">{pct(postShare)}</span>
          <span className="s">vs {pct(preShare)} for 13 Apr – 2 Aug</span>
        </div>

        <div className="kpi">
          <span className="eyebrow">Best week, TG impressions</span>
          <span className="v num">{bestWeekImp ? fmt(bestWeekImp.tg_impressions) : "–"}</span>
          <span className="s">
            {bestWeekImp ? `${dd(bestWeekImp.week_start)} – ${dd(bestWeekImp.week_end)}` : ""}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">Best week, TG share</span>
          <span className="v num">{bestWeekShare ? pct(bestWeekShare.tg_share_pct) : "–"}</span>
          <span className="s">
            {bestWeekShare
              ? `${dd(bestWeekShare.week_start)} – ${dd(bestWeekShare.week_end)} (weeks with 300+ TG views)`
              : ""}
          </span>
        </div>
      </div>

      {/* Weekly Chart */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>TG impressions and TG share, week by week</h2>
        <div className="legend">
          <span>
            <i className="sw" style={{ background: "var(--target)" }} />
            TG impressions
          </span>
          <span>
            <i className="sw" style={{ background: "var(--accent)", borderRadius: "50%" }} />
            TG share (right axis)
          </span>
        </div>

        <div className="card chart">
          {(() => {
            const W = weekly;
            const width = Math.max(900, W.length * 24);
            const height = 250;
            const margin = { left: 48, right: 44, top: 16, bottom: 36 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            const barWidth = innerWidth / Math.max(1, W.length);

            const top = 10000;
            const yImp = (v: number) => margin.top + innerHeight - (v / top) * innerHeight;
            const yShare = (v: number) => margin.top + innerHeight - (v / 70) * innerHeight;

            // Trendline path
            let path = "";
            W.forEach((wk, i) => {
              if (wk.tg_share_pct !== null) {
                const x = margin.left + i * barWidth + barWidth / 2;
                const y = yShare(wk.tg_share_pct);
                path += (path === "" ? "M" : "L") + `${x} ${y}`;
              }
            });

            return (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                role="img"
                aria-label="Weekly TG impressions and share"
              >
                {/* Left Y Axis grid & labels (0 - 10k) */}
                {[0, 2500, 5000, 7500, 10000].map((v) => (
                  <g key={`w-grid-${v}`}>
                    <line
                      x1={margin.left}
                      x2={width - margin.right}
                      y1={yImp(v)}
                      y2={yImp(v)}
                      stroke="var(--grid)"
                    />
                    <text x={margin.left - 6} y={yImp(v) + 3} textAnchor="end">
                      {v / 1000}k
                    </text>
                  </g>
                ))}

                {/* Right Y Axis labels (Share 0-70%) */}
                {[0, 20, 40, 60].map((v) => (
                  <text
                    key={`w-share-${v}`}
                    x={width - margin.right + 6}
                    y={yShare(v) + 3}
                    style={{ fill: "var(--accent)" }}
                  >
                    {v}%
                  </text>
                ))}

                {/* Era Markers */}
                {[
                  { date: "2026-08-01", label: "Creator onboarded", yOffset: 12 },
                  { date: "2026-08-19", label: "First creator post", yOffset: 24 },
                ].map((marker) => {
                  const idx = W.findIndex((w) => w.week_start <= marker.date && marker.date <= w.week_end);
                  if (idx === -1) return null;
                  const x = margin.left + idx * barWidth + barWidth / 2;
                  return (
                    <g key={marker.label}>
                      <line
                        x1={x}
                        x2={x}
                        y1={margin.top}
                        y2={margin.top + innerHeight}
                        stroke="var(--ink)"
                        strokeDasharray="3 3"
                        opacity={0.5}
                      />
                      <text
                        x={x - 4}
                        y={margin.top + marker.yOffset}
                        textAnchor="end"
                        style={{ fill: "var(--ink)", fontWeight: 500 }}
                      >
                        {marker.label}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {W.map((wk, i) => {
                  const x = margin.left + i * barWidth;
                  const hasImp = wk.tg_impressions !== null;
                  const barH = hasImp ? Math.max(1, margin.top + innerHeight - yImp(wk.tg_impressions!)) : 0;
                  const isEra = wk.week_start >= "2026-08-17";

                  return (
                    <g key={wk.week_start}>
                      {hasImp && (
                        <rect
                          x={x + 3}
                          y={yImp(wk.tg_impressions!)}
                          width={Math.max(1, barWidth - 6)}
                          height={barH}
                          rx={2}
                          fill="var(--target)"
                          opacity={isEra ? 1 : 0.75}
                        >
                          <title>
                            {dd(wk.week_start)} – {dd(wk.week_end)}: {fmt(wk.tg_impressions)} TG impressions,{" "}
                            {pct(wk.tg_share_pct)} share
                          </title>
                        </rect>
                      )}

                      {/* X Axis Date labels every 2 weeks */}
                      {i % 2 === 0 && (
                        <text x={x + barWidth / 2} y={height - 14} textAnchor="middle">
                          {dd(wk.week_start)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Trend line */}
                {path && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={1.5} opacity={0.8} />}

                {/* Dots */}
                {W.map((wk, i) => {
                  if (wk.tg_share_pct === null) return null;
                  const cx = margin.left + i * barWidth + barWidth / 2;
                  const cy = yShare(wk.tg_share_pct);
                  return (
                    <circle
                      key={`dot-${wk.week_start}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="var(--accent)"
                      stroke="var(--surface)"
                      strokeWidth={1}
                    >
                      <title>
                        {dd(wk.week_start)}: TG share {pct(wk.tg_share_pct)}
                      </title>
                    </circle>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </section>

      {/* Week on Week Table */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Week-on-week</h2>
          <button onClick={downloadWeeklyCsv} className="dlb">
            ↓ Download weekly data (CSV)
          </button>
        </div>

        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Week</th>
                <th>TG impressions</th>
                <th>WoW</th>
                <th>TG share</th>
                <th>WoW share</th>
                <th>Engagements</th>
                <th>New followers</th>
                <th>Posts published</th>
              </tr>
            </thead>
            <tbody>
              {[...calculatedWeeks].reverse().map((w) => {
                const isCreatorEra = w.week_start >= "2026-08-17";
                return (
                  <tr key={w.week_start} className={isCreatorEra ? "cr" : ""}>
                    <td className="l" style={{ minWidth: 160 }}>
                      {dd(w.week_start)} – {dd(w.week_end)}
                      {w.isPartial && <span className="chip w">partial week</span>}
                    </td>
                    <td>
                      {w.tg_impressions !== null ? (
                        <>
                          {fmt(w.tg_impressions)}
                          {w.tg_may_be_higher && <span className="chip w">TG may be higher</span>}
                        </>
                      ) : (
                        <span className="muted">below LinkedIn threshold</span>
                      )}
                    </td>
                    <td>
                      {w.wowImpressionsPct !== null ? (
                        <span className={w.wowImpressionsPct >= 0 ? "up" : "dn"}>
                          {w.wowImpressionsPct >= 0 ? "+" : ""}
                          {Math.round(w.wowImpressionsPct)}%
                        </span>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>
                      {w.tg_share_pct !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: `${w.tg_share_pct * 1.2}px`,
                              background: "var(--accent)",
                            }}
                          />
                          {pct(w.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>
                      {w.wowSharePts !== null ? (
                        <span className={w.wowSharePts >= 0 ? "up" : "dn"}>
                          {w.wowSharePts >= 0 ? "+" : ""}
                          {w.wowSharePts.toFixed(1)} pts
                        </span>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>{fmt(w.engagements)}</td>
                    <td>{fmt(w.new_followers)}</td>
                    <td>{w.posts_published || "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="note">
          Weeks run Monday–Sunday, from one LinkedIn export per week. The first (1–4 Jan) and last (21–25 Sep) weeks are
          partial, so they get no WoW figure.
        </p>
      </section>
    </div>
  );
}
