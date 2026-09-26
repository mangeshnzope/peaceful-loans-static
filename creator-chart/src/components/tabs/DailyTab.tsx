"use client";

import { useState, useMemo } from "react";
import { DailyRow, ViewerMix } from "@/lib/types";
import {
  aggregateDailyRange,
  compareDailyPeriods,
  getViewerMixForRange,
  addDays,
} from "@/lib/metrics";
import { fmt, pct, dd, wd } from "@/lib/formatters";

interface DailyTabProps {
  daily: DailyRow[];
  viewerMix: ViewerMix;
  dataFrom: string;
  dataTo: string;
  tgDefinition: string[];
}

export default function DailyTab({
  daily,
  viewerMix,
  dataFrom,
  dataTo,
  tgDefinition,
}: DailyTabProps) {
  // Presets definition
  const presets = useMemo(
    () => [
      { label: "Last 7 days", from: addDays(dataTo, -6), to: dataTo },
      { label: "Last 30 days", from: addDays(dataTo, -29), to: dataTo },
      { label: "September", from: "2026-09-01", to: dataTo },
      { label: "August", from: "2026-08-01", to: "2026-08-31" },
      { label: "Creator Chart Era", from: "2026-08-19", to: dataTo },
      { label: "Before creator", from: "2026-04-01", to: "2026-07-31" },
      { label: "All 2026", from: dataFrom, to: dataTo },
    ],
    [dataFrom, dataTo]
  );

  // Default preset is Creator Chart Era (19 Aug -> data_to)
  const [from, setFrom] = useState("2026-08-19");
  const [to, setTo] = useState(dataTo);

  const handleFromChange = (newFrom: string) => {
    if (newFrom > to) {
      setFrom(to);
      setTo(newFrom);
    } else {
      setFrom(newFrom);
    }
  };

  const handleToChange = (newTo: string) => {
    if (newTo < from) {
      setTo(from);
      setFrom(newTo);
    } else {
      setTo(newTo);
    }
  };

  const periodComparison = useMemo(() => {
    return compareDailyPeriods(daily, from, to, dataFrom);
  }, [daily, from, to, dataFrom]);

  const { current, previous, impressionsChangePct, shareChangePts } = periodComparison;

  // Filtered rows in range
  const filteredDaily = useMemo(() => {
    return daily.filter((d) => d.date >= from && d.date <= to);
  }, [daily, from, to]);

  // Viewer mix dimensions
  const dimensions = ["Seniority", "Job title", "Industry", "Location", "Company size", "Company"];

  // Download Handlers
  const downloadDaysCsv = () => {
    const headers = ["date", "tg_impressions", "tg_share_pct", "tg_may_be_higher", "engagements", "new_followers", "posts_published"];
    const rows = filteredDaily.map((d) => [
      d.date,
      d.tg_impressions !== null ? d.tg_impressions : "",
      d.tg_share_pct !== null ? d.tg_share_pct.toFixed(1) : "",
      d.tg_may_be_higher ? "yes" : "",
      d.engagements,
      d.new_followers,
      d.posts_published,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daily_tg_${from}_to_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMixCsv = () => {
    const headers = ["from", "to", "dimension", "value", "pct_of_views"];
    const rows: string[][] = [];
    dimensions.forEach((dim) => {
      const items = getViewerMixForRange(viewerMix, dim, from, to, 50);
      items.forEach((item) => {
        rows.push([from, to, dim, `"${item.name.replace(/"/g, '""')}"`, item.pct.toFixed(1)]);
      });
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `viewer_mix_${from}_to_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Computations
  const chartData = useMemo(() => {
    const R = filteredDaily;
    const maxVal = Math.max(50, ...R.map((x) => x.tg_impressions || 0));
    const step = maxVal > 4000 ? 1000 : maxVal > 1500 ? 500 : maxVal > 400 ? 100 : maxVal > 100 ? 25 : 10;
    const top = Math.ceil(maxVal / step) * step;
    return { R, maxVal, top, step };
  }, [filteredDaily]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Date Filter & Preset Pills */}
      <div className="filters">
        <label>
          From{" "}
          <input
            type="date"
            min={dataFrom}
            max={dataTo}
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            min={dataFrom}
            max={dataTo}
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {presets.map((p) => {
            const isActive = from === p.from && to === p.to;
            return (
              <button
                key={p.label}
                className={`pre ${isActive ? "on" : ""}`}
                onClick={() => {
                  setFrom(p.from);
                  setTo(p.to);
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Tiles (5 tiles) */}
      <div className="kpis">
        <div className="kpi t">
          <span className="eyebrow">TG impressions</span>
          <span className="v num">{fmt(current.tgImpressions)}</span>
          <span className="s">
            {previous ? (
              <>
                <span className={impressionsChangePct! >= 0 ? "up" : "dn"}>
                  {impressionsChangePct! >= 0 ? "+" : ""}
                  {Math.round(impressionsChangePct!)}%
                </span>{" "}
                vs previous {current.daysCount} days
              </>
            ) : (
              `${current.daysCount} days`
            )}
          </span>
        </div>

        <div className="kpi t">
          <span className="eyebrow">TG share of views</span>
          <span className="v num">{pct(current.tgSharePct)}</span>
          <span className="s">
            {previous && shareChangePts !== null ? (
              <>
                <span className={shareChangePts >= 0 ? "up" : "dn"}>
                  {shareChangePts >= 0 ? "+" : ""}
                  {shareChangePts.toFixed(1)} pts
                </span>{" "}
                vs previous {current.daysCount} days
              </>
            ) : (
              "of all views in range"
            )}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">Avg TG impressions / day</span>
          <span className="v num">
            {fmt(current.daysCount > 0 ? current.tgImpressions / current.daysCount : 0)}
          </span>
          <span className="s">
            {dd(from)} – {dd(to)}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">Engagements</span>
          <span className="v num">{fmt(current.engagements)}</span>
          <span className="s">reactions, comments, reposts</span>
        </div>

        <div className="kpi">
          <span className="eyebrow">New followers</span>
          <span className="v num">{fmt(current.newFollowers)}</span>
          <span className="s">
            {current.postsPublished} post{current.postsPublished === 1 ? "" : "s"} published in range
          </span>
        </div>
      </div>

      {/* Daily Chart */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>TG impressions by day</h2>
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
            const { R, top, step } = chartData;
            const width = Math.max(900, R.length * (R.length > 120 ? 4 : 10));
            const height = 250;
            const margin = { left: 48, right: 44, top: 16, bottom: 34 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            const barWidth = innerWidth / Math.max(1, R.length);

            const yImp = (v: number) => margin.top + innerHeight - (v / top) * innerHeight;
            const yShare = (v: number) => margin.top + innerHeight - (v / 70) * innerHeight;

            // Grid lines
            const gridTicks: number[] = [];
            for (let v = 0; v <= top; v += step) gridTicks.push(v);

            const labelStep = Math.max(1, Math.ceil(R.length / 14));

            return (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                role="img"
                aria-label="Daily TG impressions and share"
              >
                {/* Left Y Axis grid & labels */}
                {gridTicks.map((v) => (
                  <g key={`grid-${v}`}>
                    <line
                      x1={margin.left}
                      x2={width - margin.right}
                      y1={yImp(v)}
                      y2={yImp(v)}
                      stroke="var(--grid)"
                    />
                    <text x={margin.left - 6} y={yImp(v) + 3} textAnchor="end">
                      {v >= 1000 ? `${v / 1000}k` : v}
                    </text>
                  </g>
                ))}

                {/* Right Y Axis labels (Share 0-70%) */}
                {[0, 20, 40, 60].map((v) => (
                  <text
                    key={`share-lbl-${v}`}
                    x={width - margin.right + 6}
                    y={yShare(v) + 3}
                    style={{ fill: "var(--accent)" }}
                  >
                    {v}%
                  </text>
                ))}

                {/* Bars & Dots */}
                {R.map((row, i) => {
                  const x = margin.left + i * barWidth;
                  const hasData = row.tg_impressions !== null;
                  const barH = hasData ? Math.max(1, margin.top + innerHeight - yImp(row.tg_impressions!)) : 0;
                  const isEraStart = row.date === "2026-08-19";
                  const isOnboarded = row.date === "2026-08-01";

                  return (
                    <g key={row.date}>
                      {/* Vertical era markers */}
                      {(isEraStart || isOnboarded) && (
                        <>
                          <line
                            x1={x + barWidth / 2}
                            x2={x + barWidth / 2}
                            y1={margin.top}
                            y2={margin.top + innerHeight}
                            stroke="var(--ink)"
                            strokeDasharray="3 3"
                            opacity={0.5}
                          />
                          <text
                            x={x + barWidth / 2 + 4}
                            y={margin.top + (isOnboarded ? 12 : 24)}
                            style={{ fill: "var(--ink)", fontWeight: 500 }}
                          >
                            {isOnboarded ? "Creator onboarded" : "First creator post"}
                          </text>
                        </>
                      )}

                      {/* TG impression bar */}
                      {hasData && (
                        <rect
                          x={x + barWidth * 0.12}
                          y={yImp(row.tg_impressions!)}
                          width={Math.max(1, barWidth * 0.76)}
                          height={barH}
                          rx={1.5}
                          fill="var(--target)"
                        >
                          <title>
                            {wd(row.date)} {dd(row.date)}: {fmt(row.tg_impressions)} TG impressions
                            {row.tg_share_pct !== null ? ` (${pct(row.tg_share_pct)} share)` : ""}
                          </title>
                        </rect>
                      )}

                      {/* TG Share dot */}
                      {row.tg_share_pct !== null && (
                        <circle
                          cx={x + barWidth / 2}
                          cy={yShare(row.tg_share_pct)}
                          r={barWidth > 8 ? 3 : 2}
                          fill="var(--accent)"
                        >
                          <title>
                            {dd(row.date)}: TG share {pct(row.tg_share_pct)}
                          </title>
                        </circle>
                      )}

                      {/* X Axis Date Label */}
                      {i % labelStep === 0 && (
                        <text x={x + barWidth / 2} y={height - 14} textAnchor="middle">
                          {dd(row.date)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </section>

      {/* Viewer Mix Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Who saw the content in this period</h2>
          <button onClick={downloadMixCsv} className="dlb">
            ↓ Download viewer mix (CSV)
          </button>
        </div>
        <p className="note">
          Share of all views in the selected dates, from LinkedIn's daily viewer breakdown. LinkedIn lists only the biggest
          groups each day, so shares don't add to 100%.
        </p>

        <div className="mix-grid">
          {dimensions.map((dim) => {
            const items = getViewerMixForRange(viewerMix, dim, from, to);
            const maxVal = Math.max(1, ...items.map((it) => it.pct));

            return (
              <div key={dim} className="card">
                <h3 style={{ marginBottom: 12 }}>{dim}</h3>
                {items.length > 0 ? (
                  <div>
                    {items.map((item) => {
                      const isTg = dim === "Seniority" && tgDefinition.includes(item.name);
                      return (
                        <div key={item.name} className={`mr ${isTg ? "t" : ""}`}>
                          <span title={item.name}>{item.name}</span>
                          <span className="b">
                            <i style={{ width: `${(item.pct / maxVal) * 100}%` }} />
                          </span>
                          <span className="num">
                            {item.pct < 1 ? "<1" : Math.round(item.pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>No breakdown for these dates</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Day by Day Table */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Day by day</h2>
          <button onClick={downloadDaysCsv} className="dlb">
            ↓ Download these days (CSV)
          </button>
        </div>

        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Date</th>
                <th>TG impressions</th>
                <th>TG share</th>
                <th>Engagements</th>
                <th>New followers</th>
                <th>Posts published</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredDaily].reverse().map((row) => {
                const isCreatorEra = row.date >= "2026-08-19";
                return (
                  <tr key={row.date} className={isCreatorEra ? "cr" : ""}>
                    <td className="l" style={{ minWidth: 120 }}>
                      {wd(row.date)} {dd(row.date)}
                    </td>
                    <td>
                      {row.tg_impressions !== null ? (
                        <>
                          {fmt(row.tg_impressions)}
                          {row.tg_may_be_higher && <span className="chip w">TG may be higher</span>}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>
                      {row.tg_share_pct !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: `${row.tg_share_pct * 1.2}px`,
                              background: "var(--accent)",
                            }}
                          />
                          {pct(row.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>{fmt(row.engagements)}</td>
                    <td>{fmt(row.new_followers)}</td>
                    <td>{row.posts_published || "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="note">
          From one LinkedIn export per day. On quiet days (under ~50 views) LinkedIn gives no usable seniority split, so
          those show "–". For TG numbers on quiet stretches use the Weekly or Monthly tab, which come from their own
          exports. "TG may be higher" = LinkedIn hid some small groups that day. A date range adds up the daily files in
          it.
        </p>
      </section>
    </div>
  );
}
