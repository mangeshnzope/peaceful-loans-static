"use client";

import { useMemo } from "react";
import { Insights, PostRow, GroupInsights, EngagementData } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface WhatWorksTabProps {
  insights: Insights;
  posts: PostRow[];
  engagement?: EngagementData;
}

export default function WhatWorksTab({ insights, posts, engagement }: WhatWorksTabProps) {
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
      rows.sort((a, b) => (!!a.ex ? 1 : 0) - (!!b.ex ? 1 : 0) || ((b.tg || 0) - (a.tg || 0)));
    }

    const eligible = rows.filter((r) => r.n >= 3 && !r.ex);
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
              const isEligible = r.n >= 3 && !r.ex;
              const isBestTg = isEligible && r.tg === maxMedianTg;
              const isBestSh = isEligible && r.sh === maxMedianSh;
              const isBestOut = isEligible && r.out === maxMedianOut;
              const isBestEr = isEligible && r.er === maxMedianEr;

              return (
                <tr key={r.g} style={{ opacity: r.ex ? 0.55 : 1 }}>
                  <td className="l">
                    {r.g}
                    {r.ex && (
                      <span className="chip w" style={{ marginLeft: 6 }}>
                        not in stats
                      </span>
                    )}
                  </td>
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

  const exclList = useMemo(() => insights.excl || ["Awards", "Media mention / PR"], [insights.excl]);
  const excludedCount = useMemo(() => posts.filter((p) => exclList.includes(p.type)).length, [posts, exclList]);
  const postsById = useMemo(() => Object.fromEntries(posts.map((p) => [p.post_id || p.url, p])), [posts]);
  const sortedEngagementPosts = useMemo(
    () => (engagement ? [...engagement.posts].sort((a, b) => b.published.localeCompare(a.published)) : []),
    [engagement]
  );

  // Dynamic Key Findings
  const keyFindings = useMemo(() => {
    const validPosts = posts.filter((p) => !exclList.includes(p.type));
    const GC = groups.cat;
    const big = GC.rows.filter((r) => r.n >= 3 && !r.ex);
    const byTg = [...big].sort((a, b) => (b.tg || 0) - (a.tg || 0));
    const bySh = [...big].sort((a, b) => (b.sh || 0) - (a.sh || 0));
    const topPost =
      [...validPosts].sort(
        (a, b) => (b.tg_impressions_lifetime || 0) - (a.tg_impressions_lifetime || 0)
      )[0] || { title: "", type: "", tg_impressions_lifetime: 0 };
    const A = byTg[0] || { g: "", tg: 0 };
    const B = byTg[1] || { g: "", tg: 0 };
    const lo = byTg.slice(-2);
    const dw = bySh[0] || { g: "", tg: 0, sh: 0, out: 0, er: 0 };
    const lowSh = bySh[bySh.length - 1] || { g: "", sh: 0 };
    const isTop = (m: "out" | "er", r: typeof dw) =>
      Math.max(...big.map((x) => x[m] || 0)) === r[m];
    const eraN = validPosts.filter((p) => p.creator_chart_era).length;
    const eraDw = validPosts.filter((p) => p.creator_chart_era && p.type === dw.g).length;

    const word = (p: number | null | undefined) =>
      p === null || p === undefined
        ? ""
        : p < 0.05
        ? "reliable"
        : p < 0.15
        ? "a lean"
        : "not proven";

    const fmtMap = Object.fromEntries(groups.fmt.rows.map((r) => [r.g, r]));
    const eraMap = Object.fromEntries(groups.era.rows.map((r) => [r.g, r]));

    const textFmt = fmtMap["Text/share"] || {};
    const mediaFmt = fmtMap["Media (ugcPost)"] || {};

    const beforeEra = eraMap["Before"] || {};
    const creatorEra = eraMap["Creator Chart Era"] || {};

    const slopeVal = Math.abs(fit.slope10).toFixed(1);
    const outShCorr = corr.out_vs_share;
    const comCorr = corr.comments_vs_out;
    const repCorr = corr.reposts_vs_out;

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
        title: `${A.g} and ${B.g} bring the most TG impressions per post.`,
        desc: `Median ${fmt(A.tg)} and ${fmt(B.tg)} TG impressions per post vs ${lo
          .map((r) => `${fmt(r.tg)} for ${r.g}`)
          .join(" and ")} (p ${formatPValue(GC.p.tg)}, ${word(GC.p.tg)}). The single biggest TG post was “${
          topPost.title
        }” (${topPost.type}, ${fmt(topPost.tg_impressions_lifetime)} TG impressions). ${
          lowSh.g
        } has the lowest median TG share (${pct(lowSh.sh)})${
          lowSh.g === "Hiring & team" ? ": job-seekers are junior" : ""
        }.`,
      },
      {
        title: `${dw.g} is the best "dog-whistle" candidate.`,
        desc: `Highest median TG share (${pct(dw.sh)})${
          isTop("out", dw)
            ? `, highest out-of-network reach (${dw.out}%)`
            : `, out-of-network reach ${dw.out}%`
        }${
          isTop("er", dw)
            ? ` and highest engagement rate (${dw.er}%)`
            : ` and engagement rate ${dw.er}%`
        }. TG share differences between types are ${word(GC.p.sh)} (p ${formatPValue(
          GC.p.sh
        )}). ${eraDw} of the ${eraN} Creator Chart Era posts are this type; median TG impressions per post ${fmt(
          dw.tg
        )}.`,
      },
      {
        title: "Media posts stay inside your network; text posts travel.",
        desc: `Out-of-network ${mediaFmt.out}% for media (image/video/document) vs ${textFmt.out}% for text posts (p ${formatPValue(
          groups.fmt.p.outnet
        )}, ${word(groups.fmt.p.outnet)}). TG share ${pct(mediaFmt.sh)} vs ${pct(
          textFmt.sh
        )} (${word(groups.fmt.p.sh)}).`,
      },
      {
        title: "Creator Chart Era: more reach and engagement, same TG share, fewer TG impressions per post so far.",
        desc: `Out-of-network ${beforeEra.out}% → ${creatorEra.out}% (p ${formatPValue(
          groups.era.p.outnet
        )}), engagement rate ${beforeEra.er}% → ${creatorEra.er}% (p ${formatPValue(
          groups.era.p.er
        )}), TG share ${pct(beforeEra.sh)} → ${pct(creatorEra.sh)} (${word(
          groups.era.p.sh
        )}), median TG impressions per post ${fmt(beforeEra.tg)} → ${fmt(
          creatorEra.tg
        )} (p ${formatPValue(groups.era.p.tg)}, ${word(
          groups.era.p.tg
        )}). Newer posts have had less time to collect views, so the last point partly reflects post age.`,
      },
    ];
  }, [groups, corr, fit, posts, exclList]);

  // Scatter Plot Data (non-brag posts only)
  const scatterPosts = useMemo(() => {
    return posts.filter(
      (p) => !exclList.includes(p.type) && p.out_of_network_pct !== null && p.tg_share_pct !== null
    );
  }, [posts, exclList]);

  const maxTg = useMemo(() => {
    return Math.max(...scatterPosts.map((p) => p.tg_impressions_lifetime || 0));
  }, [scatterPosts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Intro & Key Findings */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>What works: TG share, TG impressions and out-of-network reach</h2>
        <p className="note">
          Statistical read of {posts.length - excludedCount} posts of 2026, each from its own post export. <b>Awards</b> and <b>Media mention / PR</b> posts ({excludedCount}: e.g. BW 40 Under 40, quotes in Mint and ET) are left out of every number on this tab: wins and press mentions can't be produced every week, so they shouldn't steer what to post. They still show in the Posts tab and, greyed out, in the type table. Medians are used because a few viral posts would distort averages. <b>p</b> = chance the gap between groups is just noise (Kruskal–Wallis test for groups, Spearman for relationships). Under 0.05 = reliable, 0.05–0.15 = a lean, above = not proven. With 5–12 posts per group, treat leans as hypotheses to test, not rules.
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

      {/* Who engages: the same people, or new ones? */}
      {engagement && engagement.summary && (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>Who engages: the same people, or new ones?</h2>
          <div className="kpis">
            <div className="kpi">
              <span className="eyebrow">People who engaged</span>
              <span className="v num">{fmt(engagement.summary.people)}</span>
              <span className="s">
                across {engagement.summary.posts} non-award Creator Chart Era posts
              </span>
            </div>
            <div className="kpi">
              <span className="eyebrow">Engaged only once</span>
              <span className="v num">
                {Math.round((engagement.summary.engaged_once / engagement.summary.people) * 100)}%
              </span>
              <span className="s">{fmt(engagement.summary.engaged_once)} people never came back</span>
            </div>
            <div className="kpi">
              <span className="eyebrow">Regulars</span>
              <span className="v num">{fmt(engagement.summary.regulars)}</span>
              <span className="s">
                engaged with 3+ posts; {engagement.summary.regulars_6plus} of them with 6+
              </span>
            </div>
            <div className="kpi">
              <span className="eyebrow">Typical post</span>
              <span className="v num">{engagement.summary.median_regular_pct}% regulars</span>
              <span className="s">
                median {engagement.summary.median_new_people} new people per post;{" "}
                {engagement.summary.median_first_degree_pct}% of reactors are 1st-degree
              </span>
            </div>
          </div>

          <div className="card tw">
            <table>
              <thead>
                <tr>
                  <th className="l">Published</th>
                  <th className="l">Post</th>
                  <th className="l">Type</th>
                  <th>Engagers</th>
                  <th>Reactors</th>
                  <th>Commenters</th>
                  <th>1st-degree</th>
                  <th>Regulars</th>
                  <th>New people</th>
                  <th>Senior titles</th>
                  <th>Out-of-network</th>
                </tr>
              </thead>
              <tbody>
                {sortedEngagementPosts.map((r) => {
                  const p = postsById[r.post_id];
                  const isExcluded = exclList.includes(r.type || p?.type || "");
                  return (
                    <tr key={r.post_id} style={{ opacity: isExcluded ? 0.55 : 1 }}>
                      <td className="l" style={{ minWidth: 70, whiteSpace: "nowrap" }}>
                        {dd(r.published)}
                      </td>
                      <td className="l" style={{ minWidth: 200 }}>
                        {p?.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer">
                            {p.title}
                          </a>
                        ) : (
                          r.post_id
                        )}
                      </td>
                      <td className="l" style={{ fontSize: 12 }}>
                        {r.type}
                        {isExcluded && (
                          <span className="chip w" style={{ marginLeft: 6 }}>
                            not in stats
                          </span>
                        )}
                      </td>
                      <td>{fmt(r.engagers)}</td>
                      <td>{fmt(r.reactors)}</td>
                      <td>
                        {fmt(r.commenters)}
                        {r.commenters_is_floor ? "+" : ""}
                      </td>
                      <td>{r.first_degree_pct !== null ? `${r.first_degree_pct}%` : "–"}</td>
                      <td>{r.regular_pct !== null ? `${r.regular_pct}%` : "–"}</td>
                      <td>{fmt(r.new_people)}</td>
                      <td>{r.senior_title_pct !== null ? `${r.senior_title_pct}%` : "–"}</td>
                      <td>
                        {p?.out_of_network_pct !== null && p?.out_of_network_pct !== undefined
                          ? `${p.out_of_network_pct}%`
                          : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note">
            From the reactions list and comments on each Creator Chart Era post, read at refresh.{" "}
            <b>Regulars</b> = people who engaged with 3 or more of these posts (Awards and Media mention / PR posts don&apos;t
            count towards it). <b>New people</b> = engaged for the first time in the Creator Chart Era with this post.{" "}
            <b>1st-degree</b> = share of reactors who are your direct connections. <b>Senior titles</b> = share of reactors
            whose LinkedIn headline names a TG-type role (manager, director, VP, head, founder, CXO, partner, owner); a rough guide
            from headlines, not LinkedIn&apos;s seniority field. Out-of-network is views, from the post export. Awards and Media
            mention / PR posts are shown greyed out.
          </p>
        </section>
      )}


      {/* By Image */}
      {groups.img && (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>By image: real vs AI-generated vs none</h2>
          {renderGroupTable(groups.img, "Image", ["Real image", "AI-generated image", "No image"])}
          <p className="note">
            <b>Real image</b> = photo of Mangesh, team, event, document or real screenshot.{" "}
            <b>AI-generated image</b> = illustration, cartoon, infographic or stylised graphic made for the post.{" "}
            <b>No image</b> = text-only post (or link preview only). Mangesh can change any post&apos;s label in the Posts
            tab. Note: most AI-image posts were published in the Creator Chart Era (newer, less time to accrue views),
            so the TG-impressions gap between Real and AI partly reflects post age as well as the image itself.
          </p>
        </section>
      )}

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
