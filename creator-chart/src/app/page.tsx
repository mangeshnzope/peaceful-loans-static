"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DailyTab from "@/components/tabs/DailyTab";
import WeeklyTab from "@/components/tabs/WeeklyTab";
import MonthlyTab from "@/components/tabs/MonthlyTab";
import PostsTab from "@/components/tabs/PostsTab";
import WhatWorksTab from "@/components/tabs/WhatWorksTab";
import DataTab from "@/components/tabs/DataTab";
import { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; role: "viewer" | "admin" } | null>(null);

  const [activeSource, setActiveSource] = useState("profile");
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    // Check URL hash on initial load
    const hash = window.location.hash.replace("#", "");
    if (["daily", "weekly", "monthly", "posts", "works", "data"].includes(hash)) {
      setActiveTab(hash);
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      if (["daily", "weekly", "monthly", "posts", "works", "data"].includes(currentHash)) {
        setActiveTab(currentHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch current authenticated user
        const authRes = await fetch("/api/auth");
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.user);
        }

        // Fetch dashboard data
        const res = await fetch("/api/data");
        if (!res.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px", color: "var(--muted)" }}>
        <p>Loading Creator Chart TG Dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px", color: "var(--bad)" }}>
        <p>{error || "Could not load data"}</p>
      </div>
    );
  }

  return (
    <>
      <Header
        meta={data.meta}
        user={user}
        activeSource={activeSource}
        setActiveSource={setActiveSource}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {activeSource === "page" && (
          <div className="card pending">Peaceful-Loans page not pulled yet.</div>
        )}

        {activeSource === "news" && (
          <div className="card pending">Newsletter not pulled yet.</div>
        )}

        {activeSource === "profile" && (
          <>
            {activeTab === "daily" && (
              <DailyTab
                daily={data.daily}
                viewerMix={data.viewer_mix}
                dataFrom={data.meta.data_from}
                dataTo={data.meta.data_to}
                tgDefinition={data.meta.tg_definition}
              />
            )}

            {activeTab === "weekly" && <WeeklyTab weekly={data.weekly} />}

            {activeTab === "monthly" && <MonthlyTab monthly={data.monthly} posts={data.posts} />}

            {activeTab === "posts" && <PostsTab posts={data.posts} />}

            {activeTab === "works" && <WhatWorksTab insights={data.insights} posts={data.posts} />}

            {activeTab === "data" && <DataTab data={data} />}
          </>
        )}
      </main>
    </>
  );
}
