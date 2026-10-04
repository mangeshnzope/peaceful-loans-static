"use client";

import { useMemo } from "react";
import { CompanyPage } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface CompanyPageTabProps {
  companyPage?: CompanyPage;
}

export default function CompanyPageTab({ companyPage }: CompanyPageTabProps) {
  if (!companyPage) {
    return (
      <div className="card pending" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        Company page data not available.
      </div>
    );
  }

  const { visitors_monthly: M, visitors_12m: V12, followers: F } = companyPage;

  const dy = (s: string) =>
    new Date(s + "T00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const mon = (s: string) =>
    new Date(s + "T00:00").toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });

  const isFullMonth = (o: { month_start: string; month_end: string }) => {
    const [y, m] = o.month_start.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const endDay = parseInt(o.month_end.slice(8), 10);
    return endDay >= lastDay;
  };

  const chg = (a: number | null, b: number | null) => {
    if (a === null || !b) return <span className="muted">–</span>;
    const c = ((a - b) / b) * 100;
    return (
      <span className={c >= 0 ? "up" : "dn"}>
        {c >= 0 ? "+" : ""}
        {Math.round(c)}%
      </span>
    );
  };

  const pts = (a: number | null, b: number | null) => {
    if (a === null || b === null) return <span className="muted">–</span>;
    const c = a - b;
    return (
      <span className={c >= 0 ? "up" : "dn"}>
        {c >= 0 ? "+" : ""}
        {c.toFixed(1)} pts
      </span>
    );
  };

  // KPIs
  const fullMonths = useMemo(() => M.filter(isFullMonth), [M]);
  const latestFull = fullMonths[fullMonths.length - 1];
  const prevFull = fullMonths.length > 1 ? fullMonths[fullMonths.length - 2] : null;

  // Chart setup
  const chartSvg = useMemo(() => {
    const w = Math.max(560, M.length * 70);
    const h = 240;
    const m = { l: 40, r: 40, t: 16, b: 30 };
    const iw = w - m.l - m.r;
    const ih = h - m.t - m.b;
    const bw = iw / M.length;

    const maxViews = Math.max(...M.map((o) => o.tg_page_views)) * 1.15;
    const y = (v: number) => m.t + ih - (v / maxViews) * ih;
    const ys = (v: number) => m.t + ih - ((v - 20) / 40) * ih;

    const lines = [20, 30, 40, 50, 60].map((v) => (
      <g key={v}>
        <line x1={m.l} x2={w - m.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid)" />
        <text x={w - m.r + 4} y={ys(v) + 3} style={{ fill: "var(--accent)", fontSize: 10 }}>
          {v}%
        </text>
      </g>
    ));

    let pathD = "";
    M.forEach((o, i) => {
      const x = m.l + i * bw + bw / 2;
      if (o.tg_share_pct !== null) {
        const shareClamped = Math.min(60, Math.max(20, o.tg_share_pct));
        pathD += (pathD ? "L" : "M") + `${x} ${ys(shareClamped)}`;
      }
    });

    return {
      w,
      h,
      lines,
      pathD,
      bars: M.map((o, i) => {
        const x = m.l + i * bw;
        const full = isFullMonth(o);
        const barH = Math.max(1, m.t + ih - y(o.tg_page_views));
        const barY = y(o.tg_page_views);
        const shareY = o.tg_share_pct !== null ? ys(Math.min(60, Math.max(20, o.tg_share_pct))) : null;

        return (
          <g key={o.month_start}>
            <rect
              x={x + 8}
              y={barY}
              width={bw - 16}
              height={barH}
              rx={2}
              fill="var(--target)"
              opacity={full ? 1 : 0.5}
            >
              <title>{`${mon(o.month_start)}${full ? "" : " (to " + dd(o.month_end) + ")"}: ${o.tg_page_views} TG page views, ${pct(o.tg_share_pct)}`}</title>
            </rect>
            <text x={x + bw / 2} y={barY - 4} textAnchor="middle" style={{ fill: "var(--ink)", fontSize: 10 }}>
              {o.tg_page_views}
            </text>
            <text x={x + bw / 2} y={h - 12} textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 10 }}>
              {mon(o.month_start).slice(0, 3)}
            </text>
            {shareY !== null && (
              <circle
                cx={x + bw / 2}
                cy={shareY}
                r={3.5}
                fill="var(--accent)"
              >
                <title>{`${mon(o.month_start)}: TG share ${pct(o.tg_share_pct)}`}</title>
              </circle>
            )}
          </g>
        );
      }),
    };
  }, [M]);

  // MoM Table calculation
  const tableRows = useMemo(() => {
    let lastFullItem: { month_start: string; month_end: string; tg_page_views: number; tg_share_pct: number | null } | null = null;
    const computed = M.map((o) => {
      const full = isFullMonth(o);
      const prev = lastFullItem;
      if (full) {
        lastFullItem = o;
      }
      return {
        ...o,
        isFull: full,
        prevFull: prev,
      };
    });

    return [...computed].reverse();
  }, [M]);

  const downloadCsv = () => {
    const headers = ["month_start", "month_end", "tg_page_views", "tg_share_of_page_views_pct"];
    const rows = M.map((o) => [
      o.month_start,
      o.month_end,
      o.tg_page_views,
      o.tg_share_pct !== null ? o.tg_share_pct.toFixed(1) : "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "company_page_tg_monthly.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <p className="note">
        Peaceful-Loans company page. LinkedIn gives <b>no viewer seniority for Page posts</b>, so Page post reach can't be
        split into TG. The TG signal for the page is <b>who visits it</b> (TG page views and TG share of page views, from
        LinkedIn's visitor export, one export per month) and <b>who follows it</b> (followers by seniority). TG share = TG
        views ÷ views where LinkedIn knows the viewer's seniority.
      </p>

      {/* KPI Tiles */}
      <div className="kpis">
        <div className="kpi t">
          <span className="eyebrow">TG page views, {latestFull ? mon(latestFull.month_start) : ""}</span>
          <span className="v num">{latestFull ? fmt(latestFull.tg_page_views) : "–"}</span>
          <span className="s">
            {latestFull && prevFull ? (
              <>
                {chg(latestFull.tg_page_views, prevFull.tg_page_views)} vs {mon(prevFull.month_start)}
              </>
            ) : (
              "–"
            )}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">TG share of page views, {latestFull ? mon(latestFull.month_start) : ""}</span>
          <span className="v num">{latestFull ? pct(latestFull.tg_share_pct) : "–"}</span>
          <span className="s">
            {latestFull && prevFull ? (
              <>
                {pts(latestFull.tg_share_pct, prevFull.tg_share_pct)} vs {mon(prevFull.month_start)}
              </>
            ) : (
              "–"
            )}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">TG followers</span>
          <span className="v num">{fmt(F.tg_followers)}</span>
          <span className="s">{pct(F.tg_share_pct)} of followers with a known seniority</span>
        </div>

        <div className="kpi">
          <span className="eyebrow">TG share of page views, last 12 months</span>
          <span className="v num">{pct(V12.tg_share_pct)}</span>
          <span className="s">
            {fmt(V12.tg_page_views)} TG page views, {dy(V12.start)} – {dy(V12.end)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>TG page views, month by month</h2>
        <div className="legend">
          <span>
            <i className="sw" style={{ background: "var(--target)" }}></i>TG page views
          </span>
          <span>
            <i className="sw" style={{ background: "var(--accent)", borderRadius: "50%" }}></i>TG share (right axis)
          </span>
        </div>
        <div className="card chart" style={{ overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${chartSvg.w} ${chartSvg.h}`}
            width={chartSvg.w}
            height={chartSvg.h}
            role="img"
            aria-label="Monthly TG page views"
          >
            {chartSvg.lines}
            {chartSvg.bars}
            <path d={chartSvg.pathD} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          </svg>
        </div>
      </section>

      {/* MoM Table */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Month on month</h2>
          <button onClick={downloadCsv} className="dlb">
            ↓ Download page data (CSV)
          </button>
        </div>
        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Month</th>
                <th>TG page views</th>
                <th>MoM</th>
                <th>TG share</th>
                <th>MoM share</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((o) => {
                const era = o.month_start >= "2026-08-01";
                return (
                  <tr key={o.month_start} className={era ? "cr" : ""}>
                    <td className="l">
                      {mon(o.month_start)}
                      {!o.isFull && <span className="chip w">to {dd(o.month_end)}</span>}
                    </td>
                    <td>{fmt(o.tg_page_views)}</td>
                    <td>{o.isFull ? chg(o.tg_page_views, o.prevFull?.tg_page_views ?? null) : <span className="muted">–</span>}</td>
                    <td>
                      {o.tg_share_pct !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{ width: `${o.tg_share_pct * 1.2}px`, background: "var(--accent)" }}
                          ></span>
                          {pct(o.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>{o.isFull ? pts(o.tg_share_pct, o.prevFull?.tg_share_pct ?? null) : <span className="muted">–</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
