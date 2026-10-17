"use client";

import { useMemo } from "react";
import { DashboardData } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface ReachPlanTabProps {
  data: DashboardData;
}

function calculateMedian(arr: number[]): number | null {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function ReachPlanTab({ data }: ReachPlanTabProps) {
  const tgFreq = data.tg_frequency;
  const windows = tgFreq?.windows_90d || [];

  const L = windows.length > 0 ? windows[windows.length - 1] : null;
  const Pv = windows.length > 1 ? windows[windows.length - 2] : null;

  const needed6x = useMemo(() => {
    if (!L || !L.tg_people_reached_est) return null;
    return Math.round(L.tg_people_reached_est * 6);
  }, [L]);

  // Table rows for "TG frequency by period"
  const periodRows = useMemo(() => {
    const rows: Array<{
      period: string;
      start: string;
      end: string;
      grain: string;
      tg: number | null;
      sh: number | null;
      reach: number | null;
      freq: number | null;
      isCreator: boolean;
    }> = [];

    // 90-day windows (reversed)
    [...windows].reverse().forEach((w) => {
      rows.push({
        period: `${dd(w.start)} – ${dd(w.end)}`,
        start: w.start,
        end: w.end,
        grain: "90 days",
        tg: w.tg_impressions,
        sh: w.tg_share_pct,
        reach: w.tg_people_reached_est,
        freq: w.tg_frequency_est,
        isCreator: w.start >= "2026-08-19",
      });
    });

    // Last 4 months (reversed) with frequency
    const validMonths = (data.monthly || []).filter((m) => m.tg_frequency_est != null);
    validMonths.slice(-4).reverse().forEach((m) => {
      rows.push({
        period: `${dd(m.month_start)} – ${dd(m.month_end)}`,
        start: m.month_start,
        end: m.month_end,
        grain: "Month",
        tg: m.tg_impressions,
        sh: m.tg_share_pct,
        reach: m.tg_people_reached_est ?? null,
        freq: m.tg_frequency_est ?? null,
        isCreator: m.month_start >= "2026-08-19",
      });
    });

    // Last 6 weeks (reversed) with frequency
    const validWeeks = (data.weekly || []).filter((w) => w.tg_frequency_est != null);
    validWeeks.slice(-6).reverse().forEach((w) => {
      rows.push({
        period: `${dd(w.week_start)} – ${dd(w.week_end)}`,
        start: w.week_start,
        end: w.week_end,
        grain: "Week",
        tg: w.tg_impressions,
        sh: w.tg_share_pct,
        reach: w.tg_people_reached_est ?? null,
        freq: w.tg_frequency_est ?? null,
        isCreator: w.week_start >= "2026-08-19",
      });
    });

    return rows;
  }, [windows, data.monthly, data.weekly]);

  // Strategy Levers calculations
  const strategyRows = useMemo(() => {
    // Excluded brag types
    const excl = data.meta.post_types_excluded_from_stats || data.insights.excl || ["Awards", "Media mention / PR"];
    const nonBragPosts = data.posts.filter((p) => !excl.includes(p.type));

    // Lever 2: Last 8 full weeks ppw
    const wk8 = (data.weekly || []).slice(-9, -1);
    const ppw = wk8.length
      ? wk8.reduce((s, w) => s + (w.posts_published || 0), 0) / wk8.length
      : null;

    // Lever 3: By type
    const catRows = (data.insights.groups.cat.rows || []).filter((r) => !r.ex);
    const top = catRows.filter((r) => r.n >= 3).sort((a, b) => (b.tg || 0) - (a.tg || 0));
    const topFilt = top.filter((r) => r.g !== "Hiring & team");
    const hiringRow = catRows.find((r) => r.g === "Hiring & team");

    // Lever 4 & 5: Engagement
    const ES = data.engagement?.summary;

    // Lever 6: Surfaces
    const subsList = data.newsletter?.subscribers;
    const latestSubs = subsList && subsList.length > 0 ? subsList[subsList.length - 1] : null;
    const cpFollowers = data.company_page?.followers;

    // Lever 7: Non-brag post correlations
    const c0 = calculateMedian(
      nonBragPosts
        .filter((p) => p.comments === 0 && p.tg_impressions_lifetime != null)
        .map((p) => p.tg_impressions_lifetime!)
    );
    const c2 = calculateMedian(
      nonBragPosts
        .filter((p) => p.comments >= 2 && p.tg_impressions_lifetime != null)
        .map((p) => p.tg_impressions_lifetime!)
    );

    const r0o = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts === 0 && p.out_of_network_pct != null)
        .map((p) => p.out_of_network_pct!)
    );
    const r1o = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts >= 1 && p.out_of_network_pct != null)
        .map((p) => p.out_of_network_pct!)
    );

    const r0 = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts === 0 && p.tg_impressions_lifetime != null)
        .map((p) => p.tg_impressions_lifetime!)
    );
    const r1 = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts >= 1 && p.tg_impressions_lifetime != null)
        .map((p) => p.tg_impressions_lifetime!)
    );

    const r0s = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts === 0 && p.tg_share_pct != null)
        .map((p) => p.tg_share_pct!)
    );
    const r1s = calculateMedian(
      nonBragPosts
        .filter((p) => p.reposts >= 1 && p.tg_share_pct != null)
        .map((p) => p.tg_share_pct!)
    );

    return [
      {
        lever: "1. Measure frequency on a fixed TG pool over 90 days",
        says: `Last 90 days: ${L ? L.tg_frequency_est.toFixed(1) : "–"}× on about ${
          L ? fmt(L.tg_people_reached_est) : "–"
        } TG people${
          Pv ? `; the 90 days before: ${Pv.tg_frequency_est.toFixed(1)}× on ${fmt(Pv.tg_people_reached_est)}` : ""
        }. Reach grew, frequency fell: more TG people see us, but fewer times each.`,
        target: "Target 6× over rolling 90 days. Track the 90-day row above every refresh.",
      },
      {
        lever: "2. Post more often, at a steady rhythm, in series",
        says: `About ${ppw == null ? "–" : ppw.toFixed(1)} posts a week over the last 8 full weeks. LinkedIn shows each post to only part of the network, so posting frequency drives frequency per person.`,
        target: "5 posts a week at the same times; run each theme as a 3–4 post series instead of one-offs.",
      },
      {
        lever: "3. Lean on the types that bring the most TG impressions",
        says: top.length
          ? `Median TG impressions per post: ${top
              .map((r) => `${r.g} ${fmt(r.tg)}`)
              .join(" · ")}. TG share is ${pct(Math.min(...top.map((r) => r.sh)))}–${pct(
              Math.max(...top.map((r) => r.sh))
            )} across types (p ${data.insights.groups.cat.p.sh}), so type changes volume, not quality.`
          : "–",
        target: `Weekly mix: 1–2 ${topFilt[0] ? topFilt[0].g : ""} posts, with ${topFilt
          .slice(1, 3)
          .map((r) => r.g)
          .join(" and ")} as the steady base. Hiring & team posts reach many people but have the lowest TG share (${
          hiringRow ? pct(hiringRow.sh) : "–"
        }): post them when hiring, not for awareness.`,
      },
      {
        lever: "4. Stay TG-dense: grow the network inside the TG",
        says: `Every +10 pts of out-of-network views costs about ${Math.abs(
          data.insights.fit.slope10
        )} pts of TG share.${
          ES ? ` ${ES.median_first_degree_pct}% of reactors on a typical post are 1st-degree connections.` : ""
        }`,
        target: "20–30 connection requests a week to founders, CXOs, VPs and partners in our cities; each new TG connection raises future frequency.",
      },
      {
        lever: "5. Get new TG people engaging, not just the regulars",
        says: ES
          ? `${fmt(ES.people)} people engaged across ${ES.posts} Creator Chart Era posts; ${Math.round(
              (ES.engaged_once / (ES.people || 1)) * 100
            )}% only once, ${ES.regulars} regulars, median ${ES.median_new_people} new people per post. Personal, newsworthy or contrarian posts drew the most new people.`
          : "See What works → Who engages.",
        target: "Comment daily on TG creators' posts, end posts with a question a senior professional would answer, tag 1–2 relevant people.",
      },
      {
        lever: "6. Repeat each message on every surface",
        says: `Newsletter ${
          latestSubs ? `${fmt(latestSubs.subscribers)} subscribers (≥${latestSubs.tg_share_floor_pct}% TG)` : ""
        }; company page ${cpFollowers ? `${fmt(cpFollowers.tg_followers)} TG followers` : ""}.`,
        target: "One idea a week as a post, a newsletter section and a team reshare: three chances at the same TG member.",
      },
      {
        lever: "7. Amplify through people, not paid: comments and quote-reposts from TG voices",
        says: `Comments go with more TG impressions: median ${fmt(c0)} TG for posts with no comments vs ${fmt(
          c2
        )} with 2+. Reposts push posts out of network (median out-of-network ${r0o}% with none vs ${r1o}% with 1+) but don't add TG impressions (${fmt(
          r0
        )} vs ${fmt(r1)}) and dilute TG share (${pct(r0s)} vs ${pct(
          r1s
        )}): who reposts matters more than how many. Correlations, not proof; most posts have 0–1 reposts.`,
        target: "No paid promotion. Line up 5–10 senior voices (founders, CXOs, wealth advisers, journalists) to comment in the first hours and to quote-repost with their own take; a plain repost from a non-TG account mostly adds non-TG views. A thoughtful TG comment beats a like.",
      },
    ];
  }, [data, L, Pv]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      {/* Intro section */}
      <section>
        <h2>Goal: every TG member sees us 6+ times</h2>
        <p className="note" style={{ marginTop: 8, marginBottom: 16 }}>
          <b>TG frequency</b> = how many times, on average, each person who saw the content saw it in that period:
          impressions ÷ members reached, from that period's own LinkedIn export. LinkedIn doesn't report reach by seniority,
          so TG viewers are assumed to see posts as often as everyone else, and <b>TG people reached</b> = members reached × TG share.
          Both are estimates. The goal is measured over rolling 90 days (one 90-day export each refresh), organically: no paid promotion.
        </p>

        {/* 4 KPI tiles */}
        <div className="kpis">
          {L ? (
            <>
              <div className="kpi t">
                <span className="eyebrow">TG frequency, last 90 days</span>
                <span className="v num">{L.tg_frequency_est.toFixed(1)}×</span>
                <span className="s">
                  {dd(L.start)} – {dd(L.end)}; goal 6×
                  {Pv ? ` · previous 90 days ${Pv.tg_frequency_est.toFixed(1)}×` : ""}
                </span>
              </div>
              <div className="kpi">
                <span className="eyebrow">TG people reached, last 90 days</span>
                <span className="v num">{fmt(L.tg_people_reached_est)}</span>
                <span className="s">
                  {Pv ? `previous 90 days ${fmt(Pv.tg_people_reached_est)}` : "estimate"}
                </span>
              </div>
              <div className="kpi">
                <span className="eyebrow">TG impressions, last 90 days</span>
                <span className="v num">{fmt(L.tg_impressions)}</span>
                <span className="s">TG share {pct(L.tg_share_pct)}</span>
              </div>
              <div className="kpi">
                <span className="eyebrow">Needed for 6× on that reach</span>
                <span className="v num">{fmt(needed6x)}</span>
                <span className="s">
                  {needed6x && L.tg_impressions
                    ? `${(needed6x / L.tg_impressions).toFixed(1)}× today's TG impressions, or about ${fmt(
                        needed6x / 13
                      )} a week`
                    : "–"}
                </span>
              </div>
            </>
          ) : (
            <div className="kpi">
              <span className="s">No 90-day export yet.</span>
            </div>
          )}
        </div>
      </section>

      {/* Period frequency table */}
      <section>
        <h2>TG frequency by period</h2>
        <div className="card tw" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th className="l">Period</th>
                <th className="l">Grain</th>
                <th>TG impressions</th>
                <th>TG share</th>
                <th>TG people reached (est.)</th>
                <th style={{ textAlign: "left" }}>TG frequency (est.)</th>
              </tr>
            </thead>
            <tbody>
              {periodRows.map((r, i) => {
                const barWidth = r.freq != null ? Math.min(r.freq / 6, 1) * 90 : 0;
                const isGreen = r.freq != null && r.freq >= 6;
                return (
                  <tr key={`${r.grain}-${r.period}-${i}`} className={r.isCreator ? "cr" : ""}>
                    <td className="l" style={{ whiteSpace: "nowrap" }}>
                      {r.period}
                    </td>
                    <td className="l">{r.grain}</td>
                    <td>{fmt(r.tg)}</td>
                    <td>{pct(r.sh)}</td>
                    <td>{fmt(r.reach)}</td>
                    <td style={{ textAlign: "left" }}>
                      {r.freq != null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: barWidth,
                              background: isGreen ? "var(--good)" : "var(--target)",
                            }}
                          />
                          {r.freq.toFixed(1)}×
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          Each row comes from its own export (90-day, month or week); nothing is added up. Frequency over a longer window is
          always higher than over a shorter one, because people see more posts as time passes, so only compare rows of the same length.
          The bar shows progress to 6.
        </p>
      </section>

      {/* Strategy Table */}
      <section>
        <h2>Strategy: what to do, and what the data says</h2>
        <div className="card tw" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th className="l">Lever</th>
                <th className="l">What the data says</th>
                <th className="l">Target / next step</th>
              </tr>
            </thead>
            <tbody>
              {strategyRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="l" style={{ minWidth: 200 }}>
                    <b>{row.lever}</b>
                  </td>
                  <td className="l" style={{ minWidth: 300, fontSize: 13 }}>
                    {row.says}
                  </td>
                  <td className="l" style={{ minWidth: 260, fontSize: 13 }}>
                    {row.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          Numbers update on every refresh. Awards and Media mention / PR posts are left out of the type and engagement figures.
          No paid promotion (Mangesh, 17 Oct 2026).
        </p>
      </section>
    </div>
  );
}
