"use client";

import { DashboardData } from "@/lib/types";

interface DataTabProps {
  data: DashboardData;
}

export default function DataTab({ data }: DataTabProps) {
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const triggerDownload = (filename: string, content: string, mime = "text/csv;charset=utf-8;") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Daily
  const downloadDaily = () => {
    const headers = ["date", "tg_impressions", "tg_share_pct", "tg_may_be_higher", "engagements", "new_followers", "posts_published"];
    const rows = data.daily.map((d) => [
      d.date,
      d.tg_impressions !== null ? d.tg_impressions : "",
      d.tg_share_pct !== null ? d.tg_share_pct.toFixed(1) : "",
      d.tg_may_be_higher ? "yes" : "",
      d.engagements,
      d.new_followers,
      d.posts_published,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    triggerDownload("daily_tg.csv", csv);
  };

  // 2. Weekly
  const downloadWeekly = () => {
    const headers = [
      "week_start",
      "week_end",
      "tg_impressions",
      "tg_share_pct",
      "tg_may_be_higher",
      "engagements",
      "new_followers",
      "posts_published",
    ];
    const rows = data.weekly.map((w) => [
      w.week_start,
      w.week_end,
      w.tg_impressions !== null ? w.tg_impressions : "",
      w.tg_share_pct !== null ? w.tg_share_pct.toFixed(1) : "",
      w.tg_may_be_higher ? "yes" : "",
      w.engagements,
      w.new_followers,
      w.posts_published,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    triggerDownload("weekly_tg.csv", csv);
  };

  // 3. Monthly
  const downloadMonthly = () => {
    const headers = [
      "month_start",
      "month_end",
      "tg_impressions",
      "tg_share_pct",
      "tg_may_be_higher",
      "engagements",
      "new_followers",
      "posts_published",
    ];
    const rows = data.monthly.map((m) => [
      m.month_start,
      m.month_end,
      m.tg_impressions !== null ? m.tg_impressions : "",
      m.tg_share_pct !== null ? m.tg_share_pct.toFixed(1) : "",
      m.tg_may_be_higher ? "yes" : "",
      m.engagements,
      m.new_followers,
      m.posts_published,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    triggerDownload("monthly_tg.csv", csv);
  };

  // 4. Posts
  const downloadPosts = () => {
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
    const rows = data.posts.map((p) => [
      p.published,
      p.title,
      p.url,
      p.type,
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
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    triggerDownload("posts_tg.csv", csv);
  };

  // 5. Viewer mix by day (long format)
  const downloadViewerMixDaily = () => {
    const headers = ["date", "dimension", "value", "pct_of_views"];
    const rows: (string | number)[][] = [];
    const pcts = data.viewer_mix.pct_of_views;

    for (const dim in pcts) {
      for (const val in pcts[dim]) {
        for (const d in pcts[dim][val]) {
          rows.push([d, dim, val, pcts[dim][val][d]]);
        }
      }
    }

    // Sort by date ascending, then dimension, then value
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
      if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
      return a[2] < b[2] ? -1 : 1;
    });

    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    triggerDownload("viewer_mix_daily.csv", csv);
  };

  // 6. Everything (JSON minus viewer_mix.day_weight)
  const downloadEverythingJson = () => {
    // Deep clone data and delete day_weight as requested by Spec §7.6
    const clone = JSON.parse(JSON.stringify(data));
    if (clone.viewer_mix) {
      delete clone.viewer_mix.day_weight;
    }
    const jsonStr = JSON.stringify(clone, null, 1);
    triggerDownload("linkedin_tg_backend.json", jsonStr, "application/json;charset=utf-8;");
  };

  const cards = [
    {
      title: "Daily",
      desc: "One row per day, 1 Jan – 25 Sep 2026: TG impressions, TG share, engagements, new followers, posts published.",
      filename: "daily_tg.csv",
      action: downloadDaily,
    },
    {
      title: "Weekly",
      desc: "One row per Mon–Sun week, from weekly exports.",
      filename: "weekly_tg.csv",
      action: downloadWeekly,
    },
    {
      title: "Monthly",
      desc: "One row per calendar month, from monthly exports.",
      filename: "monthly_tg.csv",
      action: downloadMonthly,
    },
    {
      title: "Posts",
      desc: "Every 2026 post: type, format, lifetime TG impressions, TG share, out-of-network %, engagements, comments, reposts, followers gained.",
      filename: "posts_tg.csv",
      action: downloadPosts,
    },
    {
      title: "Viewer mix by day",
      desc: "Long format: date, dimension (seniority, job title, industry, location, company size, company), value, % of that day's views.",
      filename: "viewer_mix_daily.csv",
      action: downloadViewerMixDaily,
    },
    {
      title: "Everything",
      desc: "All of the above in one JSON file, the exact dataset the report is built from (minus day weights).",
      filename: "linkedin_tg_backend.json",
      action: downloadEverythingJson,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Download the data behind this report</h2>
        <p className="note">
          Everything this report is built from, as it appears here: TG impressions, TG share, engagements, new followers,
          posts and viewer mix. Each file comes from its own LinkedIn export (daily, weekly or monthly); nothing is added
          up.
        </p>

        <div className="dgrid">
          {cards.map((c) => (
            <div key={c.filename} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3>{c.title}</h3>
              <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>{c.desc}</span>
              <div>
                <button onClick={c.action} className="dlb" style={{ marginTop: 6 }}>
                  ↓ {c.filename}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
