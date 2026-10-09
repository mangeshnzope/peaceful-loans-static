"use client";

import { useMemo } from "react";
import { Newsletter } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface NewsletterTabProps {
  newsletter?: Newsletter;
}

export default function NewsletterTab({ newsletter }: NewsletterTabProps) {
  if (!newsletter) {
    return (
      <div className="card pending" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        Newsletter data not available.
      </div>
    );
  }

  const { editions: allEditions, subscribers } = newsletter;

  // Filter 2026 editions, newest first
  const editions = useMemo(
    () => allEditions.filter((e) => e.published >= "2026-01-01"),
    [allEditions]
  );

  const latestSub = subscribers[subscribers.length - 1];
  const latestEd = editions[0];

  const median = (arr: (number | null)[]) => {
    const valid = arr.filter((x): x is number => x !== null).sort((a, b) => a - b);
    if (!valid.length) return null;
    const mid = Math.floor(valid.length / 2);
    return valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  };

  const medTg = useMemo(() => median(editions.map((e) => e.tg_impressions_lifetime)), [editions]);
  const medShare = useMemo(() => median(editions.map((e) => e.tg_share_pct)), [editions]);

  const downloadCsv = () => {
    const headers = [
      "published",
      "edition",
      "url",
      "tg_impressions_lifetime",
      "tg_share_pct",
      "tg_is_floor",
      "out_of_network_pct",
      "engagements",
      "comments",
      "reposts",
    ];
    const rows = editions.map((e) => [
      e.published,
      `"${e.title.replace(/"/g, '""')}"`,
      e.url,
      e.tg_impressions_lifetime !== null ? e.tg_impressions_lifetime : "",
      e.tg_share_pct !== null ? e.tg_share_pct.toFixed(1) : "",
      e.tg_is_floor ? "yes" : "",
      e.out_of_network_pct !== null ? e.out_of_network_pct : "",
      e.engagements,
      e.comments,
      e.reposts,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "newsletter_editions_tg.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <p className="note">
        Mangesh's newsletter <b>Demystifying Home Loan India</b>. TG impressions and TG share per edition come from each
        edition's own LinkedIn export (lifetime, post + article). LinkedIn lists only the top 3–4 seniority groups for an
        edition, so edition TG is a <b>floor</b>: the real figure can only be higher. Editions also appear as posts in the
        profile's Posts tab. The newsletter has 22 older editions (2023–2025) that aren't included here.
      </p>

      {/* KPI Tiles */}
      <div className="kpis">
        <div className="kpi">
          <span className="eyebrow">Subscribers</span>
          <span className="v num">{latestSub ? fmt(latestSub.subscribers) : "–"}</span>
          <span className="s">{latestSub ? `as of ${dd(latestSub.date)}` : "–"}</span>
        </div>

        <div className="kpi t">
          <span className="eyebrow">TG share of subscribers</span>
          <span className="v num">{latestSub ? `≥ ${latestSub.tg_share_floor_pct}%` : "–"}</span>
          <span className="s">from LinkedIn's top 5 seniority groups</span>
        </div>

        <div className="kpi t">
          <span className="eyebrow">Latest edition, TG impressions</span>
          <span className="v num">
            {latestEd && latestEd.tg_impressions_lifetime !== null
              ? `≥ ${fmt(latestEd.tg_impressions_lifetime)}`
              : "–"}
          </span>
          <span className="s">
            {latestEd
              ? `${dd(latestEd.published)} · TG share ≥ ${pct(latestEd.tg_share_pct)}`
              : "–"}
          </span>
        </div>

        <div className="kpi">
          <span className="eyebrow">2026 editions, median TG impressions</span>
          <span className="v num">{medTg !== null ? fmt(medTg) : "–"}</span>
          <span className="s">
            {editions.length} editions · median TG share {medShare !== null ? pct(medShare) : "–"} (floors)
          </span>
        </div>
      </div>

      {/* Edition Table */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Edition by edition (2026)</h2>
          <button onClick={downloadCsv} className="dlb">
            ↓ Download edition data (CSV)
          </button>
        </div>
        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Edition</th>
                <th className="l">Published</th>
                <th>TG impressions</th>
                <th>TG share</th>
                <th>Out-of-network</th>
                <th>Engagements</th>
                <th>Comments</th>
                <th>Reposts</th>
              </tr>
            </thead>
            <tbody>
              {editions.map((e) => {
                const era = e.published >= "2026-08-19";
                return (
                  <tr key={e.activity_id} className={era ? "cr" : ""}>
                    <td className="l">
                      <a href={e.url} target="_blank" rel="noopener">
                        {e.title}
                      </a>
                    </td>
                    <td className="l" style={{ whiteSpace: "nowrap" }}>
                      {dd(e.published)}
                    </td>
                    <td>
                      {e.tg_impressions_lifetime !== null ? (
                        <>
                          {e.tg_is_floor ? "≥ " : ""}
                          {fmt(e.tg_impressions_lifetime)}
                          {e.tg_is_floor && <span className="chip w">TG may be higher</span>}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>
                      {e.tg_share_pct !== null ? (
                        <>
                          {e.tg_is_floor ? "≥ " : ""}
                          {pct(e.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td>{e.out_of_network_pct !== null ? `${e.out_of_network_pct}%` : <span className="muted">–</span>}</td>
                    <td>{fmt(e.engagements)}</td>
                    <td>{e.comments}</td>
                    <td>{e.reposts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscribers Table */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Subscribers</h2>
        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th className="l">Recorded</th>
                <th>Subscribers</th>
                <th>TG share of subscribers</th>
                <th className="l">Seniority groups LinkedIn showed</th>
              </tr>
            </thead>
            <tbody>
              {[...subscribers].reverse().map((s) => (
                <tr key={s.date}>
                  <td className="l">{dd(s.date)}</td>
                  <td>{fmt(s.subscribers)}</td>
                  <td>≥ {s.tg_share_floor_pct}%</td>
                  <td className="l">Senior 28, Entry 14, Director 12, Manager 12, Owner 8</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          LinkedIn has no subscriber export. Each refresh records the subscriber count and the seniority mix shown on the
          newsletter&apos;s analytics page (top 5 groups only, so TG share of subscribers is a floor). The history builds up from
          4 Oct 2026.
        </p>
      </section>
    </div>
  );
}

