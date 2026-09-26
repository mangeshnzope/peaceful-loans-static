"use client";

import { Meta } from "@/lib/types";
import { dd } from "@/lib/formatters";
import { useRouter } from "next/navigation";

interface HeaderProps {
  meta: Meta;
  user: { email: string; role: "viewer" | "admin" } | null;
  activeSource: string;
  setActiveSource: (src: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({
  meta,
  user,
  activeSource,
  setActiveSource,
  activeTab,
  setActiveTab,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
    router.refresh();
  };

  const tabs = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "posts", label: "Posts" },
    { id: "works", label: "What works" },
    { id: "data", label: "Data" },
  ];

  return (
    <header>
      <div className="header-top">
        <span className="eyebrow" id="eyeb">
          LinkedIn · target-audience reach · 1 Jan – {dd(meta.data_to)}
        </span>
        {user && (
          <div className="user-status">
            <span>{user.email}</span>
            {user.role === "admin" && (
              <a
                href="/admin"
                style={{
                  color: "var(--target)",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "var(--mono)",
                }}
              >
                Admin
              </a>
            )}
            <button onClick={handleLogout} className="btn-logout" aria-label="Log out">
              Log out
            </button>
          </div>
        )}
      </div>

      <h1>Is our content reaching our target audience?</h1>

      <p className="note">
        Two numbers, everywhere. <b>TG impressions</b>: views from people whose LinkedIn seniority is{" "}
        <b>Manager, Director, VP, Owner, CXO or Partner</b>, the closest match to ₹50L+ households taking ₹2 Cr+ home
        loans. <b>TG share</b>: the % of all views that came from them. A rising share means the content speaks to our TG
        and LinkedIn is pushing it to them. Creator onboarded 1 Aug; first Creator Chart Era post 19 Aug.
      </p>

      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        Data to {dd(meta.data_to)} · built {meta.built}
      </div>

      {/* Source switcher */}
      <div className="sources" role="tablist" aria-label="Content sources">
        <button
          className="source-btn"
          role="tab"
          aria-selected={activeSource === "profile"}
          onClick={() => setActiveSource("profile")}
        >
          Mangesh Zope profile
        </button>
        <button
          className="source-btn"
          role="tab"
          aria-selected={activeSource === "page"}
          onClick={() => setActiveSource("page")}
        >
          Peaceful-Loans page <span className="pill">PENDING</span>
        </button>
        <button
          className="source-btn"
          role="tab"
          aria-selected={activeSource === "news"}
          onClick={() => setActiveSource("news")}
        >
          Newsletter <span className="pill">PENDING</span>
        </button>
      </div>

      {/* Tabs */}
      {activeSource === "profile" && (
        <nav className="nav-tabs" role="tablist" aria-label="Dashboard sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              className="nav-tab"
              aria-selected={activeTab === t.id}
              onClick={() => {
                setActiveTab(t.id);
                window.location.hash = t.id;
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
