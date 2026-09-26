"use client";

import { useMemo } from "react";
import { Insights, PostRow, GroupInsights } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface WhatWorksTabProps {
  insights: Insights;
  posts: PostRow[];
}

export default function WhatWorksTab({ insights, posts }: WhatWorksTabProps) {
  const { groups, corr, fit } = insights;

  const formatPValue = (p: number | null | undefined): string => {
    if (p === null || p === undefined) return "–";
    if (p < 0.001) return "<0.001";
    return p.toFixed(3);
  };

  const getSigChip = (p: number | null | undefined) => {
    if (p === null || p === undefined) return null;
    if (p < 0.05) return <span className="chip">reliable</span>;
    if (p < 0.15) return <span className="chip w">lean</span>;
    return (
      <span className="chip w" style={{ opacity: 0.7 }}>
        not proven
      </span>
    );
  };

  // Helper to render statistical table
  const renderGroupTable = (
    groupData: GroupInsights,
    label: string,
    order?: string[]
  ) => {
    let rows = [...groupData.rows];
    if (order) {
      rows.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g));
    } else {
      rows.sort((a, b) => (b.tg || 0) - (a.tg || 0));
    }

    const eligible = rows.filter((r) => r.n >= 3);
    const maxMedianTg = Math.max(...eligible.map((r) => r.tg || 0));
    const maxMedianSh = Math.max(...eligible.map((r) => r.sh || 0));
    const maxMedianOut = Math.max(...eligible.map((r) => r.out || 0));
    const maxMedianEr = Math.max(...eligible.map((r) => r.er || 0));

    return (
      <div className="card tw">
        <table>
          <thead>
            <tr>
              <th className="l">{label}</th>
              <th>Posts</th>
              <th>Median TG impressions</th>
              <th>Total TG impressions</th>
              <th>Median TG share</th>
              <th>Median out-of-network</th>
              <th>Median engagement rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isEligible = r.n >= 3;
              const isBestTg = isEligible && r.tg === maxMedianTg;
              const isBestSh = isEligible && r.sh === maxMedianSh;
              const isBestOut = isEligible && r.out === maxMedianOut;
              const isBestEr = isEligible && r.er === maxMedianEr;

              return (
                <tr key={r.g}>
                  <td className="l">{r.g}</td>
                  <td>{r.n}</td>

                  <td>
                    {isBestTg ? (
                      <b style={{ color: "var(--target)" }}>{fmt(r.tg)}</b>
                    ) : (
                      fmt(r.tg)
                    )}
                  </td>

                  <td>{fmt(r.tgsum)}</td>

                  <td>
                    {isBestSh ? (
                      <b style={{ color: "var(--target)" }}>{pct(r.sh)}</b>
                    ) : (
                      pct(r.sh)
                    )}
                  </td>

                  <td>
                    {r.out !== null ? (
                      isBestOut ? (
                        <b style={{ color: "var(--target)" }}>{r.out}%</b>
                      ) : (
                        `${r.out}%`
                      )
                    ) : (
                      "–"
                    )}
                  </td>

                  <td>
                    {r.er !== null ? (
                      isBestEr ? (
                        <b style={{ color: "var(--target)" }}>{r.er}%</b>
                      ) : (
                        `${r.er}%`
                      )
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Is the gap real? row */}
            <tr>
              <td className="l muted" style={{ fontWeight: 500 }}>
                Is the gap real?
              </td>
              <td />
              <td>
                p {formatPValue(groupData.p.tg)} {getSigChip(groupData.p.tg)}
              </td>
              <td />
              <td>
                p {formatPValue(groupData.p.sh)} {getSigChip(groupData.p.sh)}
              </td>
              <td>
                p {formatPValue(groupData.p.outnet)} {getSigChip(groupData.p.outnet)}
              </td>
              <td>
                p {formatPValue(groupData.p.er)} {getSigChip(groupData.p.er)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Dynamic Key Findings
  const keyFindings = useMemo(() => {
    const catMap = Object.fromEntries(groups.cat.rows.map((r) => [r.g, r]));
    const fmtMap = Object.fromEntries(groups.fmt.rows.map((r) => [r.g, r]));
    const eraMap = Object.fromEntries(groups.era.rows.map((r) => [r.g, r]));

    const slopeVal = Math.abs(fit.slope10).toFixed(1);
    const outShCorr = corr.out_vs_share;
    const comCorr = corr.comments_vs_out;
    const repCorr = corr.reposts_vs_out;

    const fj = catMap["Founder journey & milestones"] || {};
    const ht = catMap["Hiring & team"] || {};
    const hl = catMap["Home-loan explainer"] || {};
    const op = catMap["Opinion & life lessons"] || {};
    const bc = catMap["Bank & industry critique"] || {};

    const textFmt = fmtMap["Text/share"] || {};
    const mediaFmt = fmtMap["Media (ugcPost)"] || {};

    const beforeEra = eraMap["Before"] || {};
    const creatorEra = eraMap["Creator Chart Era"] || {};

    return [
      {
        title: "The wider a post travels outside your network, the lower its TG share.",
        desc: `Every +10 pts of out-of-network views costs about ${slopeVal} pts of TG share (Spearman ρ ${outShCorr.rho}, p ${formatPValue(
          outShCorr.p
        )}, ${outShCorr.n} posts). Your followers and connections are TG-dense; strangers LinkedIn adds are less senior. But more reach still means more TG impressions overall (the two aren't in conflict), so aim for reach that stays senior.`,
      },
      {
        title: "Comments and reposts are what push a post out of network.",
        desc: `Comments ρ ${comCorr.rho} and reposts ρ ${repCorr.rho} with out-of-network share (both p ${formatPValue(
          comCorr.p
        )}). Posts that invite a reply or a reshare are the ones LinkedIn distributes beyond your network.`,
      },
      {
        title: "Founder journey & milestones and Hiring & team bring the most TG impressions per post.",
        desc: `Median ${fmt(fj.tg)} and ${fmt(ht.tg)} TG impressions vs ${fmt(hl.tg)} for explainers and ${fmt(
          op.tg
        )} for opinion posts (p ${formatPValue(groups.cat.p.tg)}, reliable). Founder journey posts also produced the single biggest TG post (10,000-crore listed company, 7,502 TG impressions). Hiring posts get volume but the lowest TG share (${pct(
          ht.sh
        )}): job-seekers are junior.`,
      },
      {
        title: 'Bank & industry critique is the best "dog-whistle" candidate.',
        desc: `Highest median TG share (${pct(bc.sh)}), highest out-of-network reach (${bc.out}%) and highest engagement rate (${
          bc.er
        }%). It travels AND stays senior. It's the Creator Chart Era's main format (6 of 7 such posts) but TG impressions per post are still modest (${fmt(
          bc.tg
        )}); pairing it with a founder/Peaceful-Loans angle is the obvious test.`,
      },
      {
        title: "Media posts stay inside your network; text posts travel.",
        desc: `Out-of-network ${mediaFmt.out}% for media (image/video/document) vs ${textFmt.out}% for text posts (p ${formatPValue(
          groups.fmt.p.outnet
        )}, reliable). TG share is similar (${pct(mediaFmt.sh)} vs ${pct(textFmt.sh)}, not proven).`,
      },
      {
        title: "Creator Chart Era: more reach and engagement, same TG share, fewer TG impressions per post so far.",
        desc: `Out-of-network ${beforeEra.out}% → ${creatorEra.out}% (p ${formatPValue(
          groups.era.p.outnet
        )}), engagement rate ${beforeEra.er}% → ${creatorEra.er}% (p ${formatPValue(
          groups.era.p.er
        )}), TG share ${pct(beforeEra.sh)} → ${pct(creatorEra.sh)} (not proven), median TG impressions per post ${fmt(
          beforeEra.tg
        )} → ${fmt(creatorEra.tg)} (p ${formatPValue(
          groups.era.p.tg
        )}). Newer posts have had less time to collect views, so the last point partly reflects post age.`,
      },
    ];
  }, [groups, corr, fit]);

  // Scatter Plot Data
  const scatterPosts = useMemo(() => {
    return posts.filter((p) => p.out_of_network_pct !== null && p.tg_share_pct !== null);
  }, [posts]);

  const maxTg = useMemo(() => {
    return Math.max(...scatterPosts.map((p) => p.tg_impressions_lifetime || 0));
  }, [scatterPosts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Intro & Key Findings */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>What works: TG share, TG impressions and out-of-network reach</h2>
        <p className="note">
          Statistical read of all {posts.length} posts of 2026, each from its own post export. Medians are used because a
          few viral posts would distort averages. <b>p</b> = chance the gap between groups is just noise (Kruskal–Wallis
          test for groups, Spearman for relationships). Under 0.05 = reliable, 0.05–0.15 = a lean, above = not proven.
          With 5–12 posts per group, treat leans as hypotheses to test, not rules.
        </p>

        <div className="card">
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {keyFindings.map((kf, i) => (
              <li key={i}>
                <b>{kf.title}</b>
                <br />
                <span style={{ fontSize: 13, color: "var(--muted)", display: "inline-block", marginTop: 2 }}>
                  {kf.desc}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* By Type */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>By type of post</h2>
        {renderGroupTable(groups.cat, "Type")}
        <p className="note">
          Categories were assigned from each post&apos;s opening line. <b>Bank &amp; industry critique</b> = calling out
          lender practices, RBI/IRDAI moves, bank ads. <b>Home-loan explainer</b> = how rates, EMIs, eligibility work.{" "}
          <b>Client story</b> = a real client or consumer conversation. <b>Founder journey &amp; milestones</b> =
          Peaceful-Loans&apos; story, wins, numbers. <b>Opinion &amp; life lessons</b> = money/behaviour philosophy.{" "}
          <b>Hiring &amp; team</b> = job posts and team shout-outs.
        </p>
      </section>

      {/* Scatter Chart */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Out-of-network reach vs TG share</h2>
        <div className="legend">
          <span>
            <i className="sw" style={{ background: "var(--target)", borderRadius: "50%" }} />
            One post (size = TG impressions)
          </span>
          <span>
            <i className="sw" style={{ background: "var(--ink)", height: 2, verticalAlign: 3 }} />
            Trend line
          </span>
        </div>

        <div className="card chart">
          {(() => {
            const width = 800;
            const height = 320;
            const margin = { left: 48, right: 24, top: 16, bottom: 44 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            const xPos = (v: number) => margin.left + (v / 100) * innerWidth;
            const yPos = (v: number) => margin.top + innerHeight - ((v - 25) / 35) * innerHeight;

            // Trendline end points (x=0 to x=100)
            const y0 = fit.a;
            const y100 = fit.a + fit.b * 100;

            return (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                height={height}
                role="img"
                aria-label="Scatter plot of out-of-network reach vs TG share"
              >
                {/* Y Axis Grid lines (30, 40, 50, 60%) */}
                {[30, 40, 50, 60].map((v) => (
                  <g key={`sc-grid-${v}`}>
                    <line
                      x1={margin.left}
                      x2={width - margin.right}
                      y1={yPos(v)}
                      y2={yPos(v)}
                      stroke="var(--grid)"
                    />
                    <text x={margin.left - 6} y={yPos(v) + 3} textAnchor="end">
                      {v}%
                    </text>
                  </g>
                ))}

                {/* X Axis Grid labels (0, 25, 50, 75, 100%) */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <text key={`sc-x-${v}`} x={xPos(v)} y={height - 24} textAnchor="middle">
                    {v}%
                  </text>
                ))}

                {/* Axis Titles */}
                <text x={margin.left + innerWidth / 2} y={height - 6} textAnchor="middle" style={{ fill: "var(--ink)" }}>
                  Out-of-network share of views →
                </text>
                <text
                  x={12}
                  y={margin.top + innerHeight / 2}
                  transform={`rotate(-90 12 ${margin.top + innerHeight / 2})`}
                  textAnchor="middle"
                  style={{ fill: "var(--ink)" }}
                >
                  TG share →
                </text>

                {/* Trend Line */}
                <line
                  x1={xPos(0)}
                  y1={yPos(y0)}
                  x2={xPos(100)}
                  y2={yPos(y100)}
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  opacity={0.7}
                />

                {/* Scatter Bubbles */}
                {scatterPosts.map((p) => {
                  const cx = xPos(p.out_of_network_pct!);
                  const cy = yPos(p.tg_share_pct!);
                  const radius = 3 + Math.sqrt((p.tg_impressions_lifetime || 0) / maxTg) * 14;

                  return (
                    <circle
                      key={p.url}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="var(--target)"
                      fillOpacity={p.creator_chart_era ? 0.85 : 0.45}
                      stroke="var(--surface)"
                      strokeWidth={1}
                    >
                      <title>
                        {dd(p.published)} · {p.title}
                        {"\n"}
                        {p.type}
                        {"\n"}TG share {p.tg_share_pct}% · out-of-network {p.out_of_network_pct}% ·{" "}
                        {fmt(p.tg_impressions_lifetime)} TG impressions
                      </title>
                    </circle>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </section>

      {/* Grid2: By Format & Before vs Creator Chart Era */}
      <div className="grid2">
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>By format</h2>
          {renderGroupTable(groups.fmt, "Format")}
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Before vs Creator Chart Era</h2>
          {renderGroupTable(groups.era, "Period", ["Before", "Creator Chart Era"])}
        </section>
      </div>

      {/* By Day Posted */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>By day posted</h2>
        {renderGroupTable(groups.dow, "Day", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])}
      </section>
    </div>
  );
}
