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
  | "tg_impressions_lifetime"
  | "tg_share_pct"
  | "out_of_network_pct"
  | "engagements"
  | "comments"
  | "reposts"
  | "followers_gained";

export default function PostsTab({ posts }: PostsTabProps) {
  const [selectedCat, setSelectedCat] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("published");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(posts.map((p) => p.type)))];
  }, [posts]);

  const maxTgImp = useMemo(() => {
    return Math.max(...posts.map((p) => p.tg_impressions_lifetime || 0));
  }, [posts]);

  const filteredAndSortedPosts = useMemo(() => {
    let result = posts.filter((p) => selectedCat === "All" || p.type === selectedCat);

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
  }, [posts, selectedCat, sortKey, sortDir]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "type" ? "asc" : "desc");
    }
  };

  const downloadPostsCsv = () => {
    const headers = [
      "published",
      "post",
      "url",
      "type",
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

        {/* Category filter pills */}
        <div className="filters">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
