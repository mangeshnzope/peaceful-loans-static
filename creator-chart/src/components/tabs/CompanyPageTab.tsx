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

      {/* Seniority Breakdowns */}
      <div className="grid2">
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Who follows the page</h2>
          <div className="card">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Senior", 143],
                ["Entry", 87],
                ["Manager", 43],
                ["Director", 42],
                ["Owner", 33],
                ["VP", 21],
                ["CXO", 9],
                ["Training", 8],
                ["Partner", 2],
              ].map(([k, v]) => {
                const isTg = ["Manager", "Director", "VP", "Owner", "CXO", "Partner"].includes(k as string);
                return (
                  <div key={k as string} className={`mr ${isTg ? "t" : ""}`}>
                    <span>{k}</span>
                    <span className="b">
                      <i style={{ width: `${((v as number) / 143) * 100}%` }}></i>
                    </span>
                    <span className="num">{Math.round(((v as number) / 388) * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="note">
            Page followers by seniority, as of {dd(F.as_of)} (388 followers with a known seniority). TG groups in amber.
          </p>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Who visited the page (last 12 months)</h2>
          <div className="card">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Senior", 561],
                ["Entry", 346],
                ["Director", 196],
                ["Owner", 173],
                ["Manager", 142],
                ["VP", 91],
                ["CXO", 76],
                ["Training", 63],
                ["Partner", 24],
              ].map(([k, v]) => {
                const isTg = ["Manager", "Director", "VP", "Owner", "CXO", "Partner"].includes(k as string);
                return (
                  <div key={k as string} className={`mr ${isTg ? "t" : ""}`}>
                    <span>{k}</span>
                    <span className="b">
                      <i style={{ width: `${((v as number) / 561) * 100}%` }}></i>
                    </span>
                    <span className="num">{Math.round(((v as number) / 1672) * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="note">
            Share of page views by seniority, {dy(V12.start)} – {dy(V12.end)}, from one 12-month visitor export.
          </p>
        </section>
      </div>

      {/* Page Posts */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Page posts</h2>
        <p className="note">
          Posts published on the Page in the last 12 months. Reach is left out because LinkedIn doesn&apos;t report Page post
          viewers by seniority.
        </p>
        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Post</th>
                <th className="l">Published</th>
                <th className="l">Posted by</th>
                <th className="l">Format</th>
                <th>Reactions</th>
                <th>Comments</th>
                <th>Reposts</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "2026-05-30", by: "Vamsi Mullapudi", type: "Video", title: "Most people focus heavily on getting their home loan approved.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7466511570936721408", reactions: 3, comments: 0, reposts: 0 },
                { date: "2026-05-22", by: "Vamsi Mullapudi", type: "Video", title: "A lot of borrowers assume that a good credit score is enough to get a home loan approved. ", url: "https://www.linkedin.com/feed/update/urn:li:activity:7463576320438865921", reactions: 3, comments: 0, reposts: 0 },
                { date: "2026-05-21", by: "Vamsi Mullapudi", type: "Video", title: "A lot of people assume that once a home loan is approved and disbursed, there’s no way to ", url: "https://www.linkedin.com/feed/update/urn:li:activity:7463221984869580800", reactions: 1, comments: 0, reposts: 0 },
                { date: "2026-05-19", by: "Vamsi Mullapudi", type: "Video", title: "One of the most expensive mistakes in home loans is often hidden inside the paperwork.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7462483258677673984", reactions: 5, comments: 0, reposts: 0 },
                { date: "2026-05-16", by: "Vamsi Mullapudi", type: "Video", title: "A lot of freelancers and self employed professionals think irregular income automatically ", url: "https://www.linkedin.com/feed/update/urn:li:activity:7461300208111636481", reactions: 3, comments: 0, reposts: 0 },
                { date: "2026-05-01", by: "Vamsi Mullapudi", type: "Video", title: "Most people think home loan interest rates are simple. Repo rate plus a spread, and your C", url: "https://www.linkedin.com/feed/update/urn:li:activity:7455936118308360192", reactions: 4, comments: 0, reposts: 0 },
                { date: "2026-04-29", by: "Vamsi Mullapudi", type: "Video", title: "Many buyers assume banks will reject a home loan if the building is more than 60 years old", url: "https://www.linkedin.com/feed/update/urn:li:activity:7455247062046232576", reactions: 3, comments: 0, reposts: 0 },
                { date: "2026-04-21", by: "Vamsi Mullapudi", type: "Video", title: "Most people think home loan prepayment is about paying a big lump sum once a year.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7452340408640245760", reactions: 5, comments: 0, reposts: 0 },
                { date: "2026-04-21", by: "Mangesh Zope", type: "", title: "We're #hiring a new Marketing Content Specialist in Kurla, Maharashtra. Apply today or sha", url: "https://www.linkedin.com/feed/update/urn:li:activity:7452320558345617408", reactions: 1, comments: 2, reposts: 0 },
                { date: "2026-04-15", by: "Vamsi Mullapudi", type: "Video", title: "It is a bit thin right now. Since the video is attached, the caption should give enough co", url: "https://www.linkedin.com/feed/update/urn:li:activity:7450162657258659841", reactions: 2, comments: 0, reposts: 0 },
                { date: "2026-04-07", by: "Vamsi Mullapudi", type: "Video", title: "If you’re planning to take a home loan this year, there’s one thing you should not ignore", url: "https://www.linkedin.com/feed/update/urn:li:activity:7447255825133260800", reactions: 1, comments: 0, reposts: 0 },
                { date: "2026-04-02", by: "Vamsi Mullapudi", type: "Video", title: "A customer asked me this recently.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7445452535563321346", reactions: 6, comments: 0, reposts: 3 },
                { date: "2026-03-27", by: "Vamsi Mullapudi", type: "Video", title: "𝗠𝗼𝘀𝘁 𝗽𝗲𝗼𝗽𝗹𝗲 𝗺𝗮𝗸𝗲 𝗼𝗻𝗲 𝗺𝗶𝘀𝘁𝗮𝗸𝗲 𝘄𝗵𝗲𝗻 𝗰𝗵𝗼𝗼𝘀𝗶𝗻𝗴 𝗮 𝗵𝗼𝗺𝗲 𝗹𝗼𝗮𝗻.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7443249111262482433", reactions: 1, comments: 0, reposts: 0 },
                { date: "2026-03-24", by: "Vamsi Mullapudi", type: "Video", title: "𝗢𝗻𝗲 𝘀𝗺𝗮𝗹𝗹 𝗺𝗶𝘀𝘁𝗮𝗸𝗲 𝗰𝗮𝗻 𝗿𝗲𝗱𝘂𝗰𝗲 𝘆𝗼𝘂𝗿 𝗵𝗼𝗺𝗲 𝗹𝗼𝗮𝗻 𝗲𝗹𝗶𝗴𝗶𝗯𝗶𝗹𝗶𝘁𝘆.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7442126548557701120", reactions: 3, comments: 0, reposts: 0 },
                { date: "2026-03-16", by: "Vamsi Mullapudi", type: "Video", title: "Understanding how banks calculate home loan interest rates is one of the most overlooked a", url: "https://www.linkedin.com/feed/update/urn:li:activity:7439299469453512704", reactions: 1, comments: 0, reposts: 1 },
                { date: "2026-03-11", by: "Vamsi Mullapudi", type: "Video", title: "Most borrowers assume that once they receive an in principle sanction for a home loan, the", url: "https://www.linkedin.com/feed/update/urn:li:activity:7437356539121790976", reactions: 3, comments: 0, reposts: 0 },
              ].map((p) => (
                <tr key={p.url}>
                  <td className="l">
                    <a href={p.url} target="_blank" rel="noopener">
                      {p.title}
                    </a>
                  </td>
                  <td className="l" style={{ whiteSpace: "nowrap" }}>
                    {dd(p.date)}
                  </td>
                  <td className="l">{p.by}</td>
                  <td className="l">{p.type || "–"}</td>
                  <td>{p.reactions}</td>
                  <td>{p.comments}</td>
                  <td>{p.reposts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

