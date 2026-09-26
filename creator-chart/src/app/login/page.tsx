"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Email or password is incorrect");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", width: "100%" }}>
      <div className="card" style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
            Creator Chart · Target Audience Reach
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Peaceful-Loans</h1>
          <p className="note" style={{ marginTop: 8, fontSize: 13 }}>
            Sign in to access the LinkedIn TG reach dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div
              style={{
                background: "color-mix(in srgb, var(--bad) 12%, transparent)",
                color: "var(--bad)",
                padding: "10px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "var(--body)",
                border: "1px solid color-mix(in srgb, var(--bad) 30%, transparent)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ font: "500 12px var(--mono)", color: "var(--muted)" }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@creatorchart.com"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--rule)",
                background: "var(--bg)",
                color: "var(--ink)",
                font: "14px var(--body)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="password" style={{ font: "500 12px var(--mono)", color: "var(--muted)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--rule)",
                background: "var(--bg)",
                color: "var(--ink)",
                font: "14px var(--body)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1px solid var(--ink)",
              padding: "10px 16px",
              borderRadius: 6,
              font: "600 14px var(--body)",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
