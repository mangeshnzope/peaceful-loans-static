"use client";

import { useMemo } from "react";
import { MonthlyRow, PostRow } from "@/lib/types";
import { calculateMonthlyMetrics } from "@/lib/metrics";
import { fmt, pct, dd } from "@/lib/formatters";

interface MonthlyTabProps {
  monthly: MonthlyRow[];
  posts: PostRow[];
}

export default function MonthlyTab({ monthly, posts }: MonthlyTabProps) {
  const calculatedMonths = useMemo(() => calculateMonthlyMetrics(monthly, posts), [monthly, posts]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const downloadMonthlyCsv = () => {
    const headers = [
      "month_start",
      "month_end",
      "tg_impressions",
      "tg_share_pct",
      "tg_may_be_higher",
      "engagements",
      "new_followers",
      "posts_published",
      "posts_tg_impressions",
      "posts_tg_share_pct",
    ];
    const rows = calculatedMonths.map((m) => [
      m.month_start,
      m.month_end,
      m.tg_impressions !== null ? m.tg_impressions : "",
      m.tg_share_pct !== null ? m.tg_share_pct.toFixed(1) : "",
      m.tg_may_be_higher ? "yes" : "",
      m.engagements,
      m.new_followers,
      m.posts_published,
      m.postsTgImpressions !== null ? m.postsTgImpressions : "",
      m.postsTgSharePct !== null ? m.postsTgSharePct.toFixed(1) : "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "monthly_tg.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Month on month</h2>
          <button onClick={downloadMonthlyCsv} className="dlb">
            ↓ Download monthly data (CSV)
          </button>
        </div>

        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Month</th>
                <th>TG impressions</th>
                <th>MoM</th>
                <th>TG share</th>
                <th>MoM share</th>
                <th>Engagements</th>
                <th>New followers</th>
                <th>Posts published</th>
                <th>TG impressions from those posts</th>
                <th>Their TG share</th>
              </tr>
            </thead>
            <tbody>
              {calculatedMonths.map((m) => {
                const monthIdx = parseInt(m.month_start.slice(5, 7), 10) - 1;
                const mName = monthNames[monthIdx];
                const isCreatorEra = m.month_start >= "2026-08-01";

                return (
                  <tr key={m.month_start} className={isCreatorEra ? "cr" : ""}>
                    <td className="l" style={{ minWidth: 140 }}>
                      {mName} 2026
                      {m.isPartial && <span className="chip w">to {dd(m.month_end)}</span>}
                    </td>

                    <td>
                      {m.tg_impressions !== null ? (
                        <>
                          {fmt(m.tg_impressions)}
                          {m.tg_may_be_higher && <span className="chip w">TG may be higher</span>}
                        </>
                      ) : (
                        <span className="muted">below LinkedIn threshold</span>
                      )}
                    </td>

                    <td>
                      {m.momImpressionsPct !== null ? (
                        <span className={m.momImpressionsPct >= 0 ? "up" : "dn"}>
                          {m.momImpressionsPct >= 0 ? "+" : ""}
                          {Math.round(m.momImpressionsPct)}%
                        </span>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>

                    <td>
                      {m.tg_share_pct !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: `${m.tg_share_pct * 1.2}px`,
                              background: "var(--accent)",
                            }}
                          />
                          {pct(m.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>

                    <td>
                      {m.momSharePts !== null ? (
                        <span className={m.momSharePts >= 0 ? "up" : "dn"}>
                          {m.momSharePts >= 0 ? "+" : ""}
                          {m.momSharePts.toFixed(1)} pts
                        </span>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>

                    <td>{fmt(m.engagements)}</td>
                    <td>{fmt(m.new_followers)}</td>

                    <td>
                      {m.posts_published || "–"}
                      {m.postsBelowThreshold > 0 && (
                        <span className="chip w">{m.postsBelowThreshold} below threshold</span>
                      )}
                    </td>

                    <td>{fmt(m.postsTgImpressions)}</td>
                    <td>{pct(m.postsTgSharePct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="note">
          From one LinkedIn export per calendar month; nothing is added up from days or weeks. September runs to 25 Sep,
          so it gets no MoM for TG impressions (its share change is still shown). <b>TG impressions from those posts</b> =
          lifetime TG views of the posts published that month, from each post's own page (posts too small for a seniority
          split are left out).
        </p>
      </section>
    </div>
  );
}
