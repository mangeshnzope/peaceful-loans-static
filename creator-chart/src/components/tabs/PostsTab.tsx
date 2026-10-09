"use client";

import { useState, useMemo } from "react";
import { PostRow } from "@/lib/types";
import { fmt, pct, dd } from "@/lib/formatters";

interface PostsTabProps {
  posts: PostRow[];
}

type SortKey =
  | "published"
  | "title"
  | "type"
  | "image_type"
  | "tg_impressions_lifetime"
  | "tg_share_pct"
  | "out_of_network_pct"
  | "engagements"
  | "comments"
  | "reposts"
  | "followers_gained";

const THUMB_IDS = new Set([
  "7442690322368974849", "7445459598284767232", "7452195169958850560", "7453301722514341888",
  "7453637000353603584", "7454381198119694336", "7455200922739130368", "7455583847884226561",
  "7456915367701979138", "7457212195207172096", "7457285339645116416", "7457669375664377856",
  "7458129287511023616", "7458344649280167936", "7458404010568540160", "7459504747939799040",
  "7470747187702984704", "7474086780779040768", "7475722402409250816", "7476601108128342016",
  "7477531824806875137", "7479916369271144448", "7481948324732866560", "7484122133548347392",
  "7495063360074477570", "7495072253953609731", "7496445774369669121", "7497535248835076096",
  "7498269296268324865", "7498993755644076033", "7500092783240769536", "7500800657218744321",
  "7501557451943743492", "7502607226914639873", "7503390922131562496", "7504055163360362496",
  "7505589782421544960", "7506232694943473666", "7506575936201408512", "7507720186268119040",
  "7508405750621310978", "7509209819720032256", "7510245222912692224", "7510982370678865920",
  "7512042073336733696", "7513121763409580033"
]);

export default function PostsTab({ posts }: PostsTabProps) {
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedImg, setSelectedImg] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("published");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(posts.map((p) => p.type)))];
  }, [posts]);

  const imageTypes = useMemo(() => {
    return ["All", "Real image", "AI-generated image", "No image"];
  }, []);

  const maxTgImp = useMemo(() => {
    return Math.max(...posts.map((p) => p.tg_impressions_lifetime || 0));
  }, [posts]);

  const filteredAndSortedPosts = useMemo(() => {
    let result = posts.filter(
      (p) =>
        (selectedCat === "All" || p.type === selectedCat) &&
        (selectedImg === "All" || (p.image_type || "No image") === selectedImg)
    );

    result = [...result].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];

      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;

      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [posts, selectedCat, selectedImg, sortKey, sortDir]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "type" || key === "image_type" ? "asc" : "desc");
    }
  };

  const downloadPostsCsv = () => {
    const headers = [
      "published",
      "post",
      "url",
      "type",
      "image_type",
      "format",
      "tg_impressions_lifetime",
      "tg_share_pct",
      "out_of_network_pct",
      "engagements",
      "comments",
      "reposts",
      "followers_gained",
      "creator_chart_era",
    ];

    const rows = posts.map((p) => [
      p.published,
      `"${p.title.replace(/"/g, '""')}"`,
      p.url,
      `"${p.type.replace(/"/g, '""')}"`,
      `"${(p.image_type || "No image").replace(/"/g, '""')}"`,
      p.format,
      p.tg_impressions_lifetime !== null ? p.tg_impressions_lifetime : "",
      p.tg_share_pct !== null ? p.tg_share_pct.toFixed(1) : "",
      p.out_of_network_pct !== null ? p.out_of_network_pct : "",
      p.engagements,
      p.comments,
      p.reposts,
      p.followers_gained,
      p.creator_chart_era ? "yes" : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "posts_tg.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: { key: SortKey; label: string; align: "l" | "r" }[] = [
    { key: "published", label: "Published", align: "l" },
    { key: "title", label: "Post", align: "l" },
    { key: "type", label: "Type", align: "l" },
    { key: "image_type", label: "Image", align: "l" },
    { key: "tg_impressions_lifetime", label: "TG impressions", align: "r" },
    { key: "tg_share_pct", label: "TG share", align: "r" },
    { key: "out_of_network_pct", label: "Out-of-network", align: "r" },
    { key: "engagements", label: "Engagements", align: "r" },
    { key: "comments", label: "Comments", align: "r" },
    { key: "reposts", label: "Reposts", align: "r" },
    { key: "followers_gained", label: "Followers gained", align: "r" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="dlrow">
          <h2>Post by post</h2>
          <button onClick={downloadPostsCsv} className="dlb">
            ↓ Download post data (CSV)
          </button>
        </div>

        <p className="note">
          Every post published in 2026 ({posts.length}), newest first, from one LinkedIn export per post (lifetime numbers).{" "}
          <b>Out-of-network</b> = % of the post&apos;s views from people who are not your followers or connections: reach
          LinkedIn gave the post beyond your network. &quot;–&quot; TG = post too small for LinkedIn to give a seniority split.
          Shaded rows = Creator Chart Era (from 19 Aug). Click a column to sort.
        </p>

        {/* Category & Image filter pills */}
        <div className="filters">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 2 }}>Type:</span>
            {categories.map((cat) => {
              const isSelected = selectedCat === cat;
              return (
                <button
                  key={cat}
                  className={`pre ${isSelected ? "on" : ""}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 2 }}>Image:</span>
            {imageTypes.map((im) => {
              const isSelected = selectedImg === im;
              return (
                <button
                  key={im}
                  className={`pre ${isSelected ? "on" : ""}`}
                  onClick={() => setSelectedImg(im)}
                >
                  {im}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card tw">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`sort ${c.align === "l" ? "l" : ""}`}
                    tabIndex={0}
                    onClick={() => handleHeaderClick(c.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleHeaderClick(c.key);
                      }
                    }}
                  >
                    {c.label}
                    {sortKey === c.key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPosts.map((p) => {
                const isMedia = p.format.startsWith("Media");
                const hasThumb = p.post_id ? THUMB_IDS.has(p.post_id) : false;
                return (
                  <tr key={p.url} className={p.creator_chart_era ? "cr" : ""}>
                    <td className="l" style={{ minWidth: 70, whiteSpace: "nowrap" }}>
                      {dd(p.published)}
                    </td>

                    <td className="l" style={{ minWidth: 240 }}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.title}
                      </a>
                      {isMedia && <span className="chip">media</span>}
                    </td>

                    <td className="l" style={{ minWidth: 130, fontSize: 12 }}>
                      {p.type}
                    </td>

                    <td className="l" style={{ minWidth: 110, fontSize: 12 }}>
                      {hasThumb && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", marginBottom: 4 }}
                        >
                          <img
                            src={`/thumbs/${p.post_id}.jpg`}
                            alt=""
                            loading="lazy"
                            style={{
                              width: 84,
                              maxHeight: 84,
                              objectFit: "cover",
                              borderRadius: 3,
                              border: "1px solid var(--rule)",
                              display: "block",
                            }}
                          />
                        </a>
                      )}
                      {p.image_type || "No image"}
                    </td>

                    <td>
                      {p.tg_impressions_lifetime !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: `${(p.tg_impressions_lifetime / maxTgImp) * 90}px`,
                            }}
                          />
                          {fmt(p.tg_impressions_lifetime)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>

                    <td>
                      {p.tg_share_pct !== null ? (
                        <>
                          <span
                            className="tbar"
                            style={{
                              width: `${p.tg_share_pct * 1.2}px`,
                              background: "var(--accent)",
                            }}
                          />
                          {pct(p.tg_share_pct)}
                        </>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>

                    <td>
                      {p.out_of_network_pct !== null ? `${p.out_of_network_pct}%` : <span className="muted">n/a</span>}
                    </td>

                    <td>{fmt(p.engagements)}</td>
                    <td>{fmt(p.comments)}</td>
                    <td>{fmt(p.reposts)}</td>
                    <td>{fmt(p.followers_gained)}</td>
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
