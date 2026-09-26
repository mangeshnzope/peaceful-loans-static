"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface VersionItem {
  filename: string;
  data_to: string;
  built: string;
  timestamp: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [fileContent, setFileContent] = useState<string>("");
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/admin/upload");
      if (res.ok) {
        const json = await res.json();
        setVersions(json.versions || []);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(fileContent);
      } catch {
        setMessage({ text: "File is not valid JSON.", type: "error" });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedJson),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage({ text: result.error || "Upload failed.", type: "error" });
      } else {
        setMessage({
          text: `Success! Live data updated. Data to ${result.data_to}, built ${result.built}.`,
          type: "success",
        });
        setFileContent("");
        fetchVersions();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (filename: string) => {
    if (!confirm(`Are you sure you want to roll back to ${filename}?`)) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", filename }),
      });

      const result = await res.json();
      if (!res.ok) {
        setMessage({ text: result.error || "Rollback failed.", type: "error" });
      } else {
        setMessage({ text: result.message || "Rollback successful.", type: "success" });
        fetchVersions();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to rollback.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="eyebrow">Admin Console</span>
          <h1 style={{ fontSize: 24, marginTop: 4 }}>Data Refresh &amp; Upload</h1>
        </div>
        <Link href="/" className="dlb">
          ← Back to Dashboard
        </Link>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 14,
            background:
              message.type === "success"
                ? "color-mix(in srgb, var(--good) 15%, transparent)"
                : "color-mix(in srgb, var(--bad) 15%, transparent)",
            color: message.type === "success" ? "var(--good)" : "var(--bad)",
            border: `1px solid color-mix(in srgb, ${message.type === "success" ? "var(--good)" : "var(--bad)"} 30%, transparent)`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Upload Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Upload New creator_chart_dashboard_data.json</h2>
        <p className="note">
          Select or paste the newly generated <code>creator_chart_dashboard_data.json</code> file. Strict validation
          checks that it contains all 7 core sections, has no total impressions keys, and that <code>data_to</code> is not
          older than the current data.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "500 12px var(--mono)", color: "var(--muted)" }}>Select JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{
                padding: "8px",
                border: "1px solid var(--rule)",
                borderRadius: 6,
                background: "var(--bg)",
                font: "13px var(--mono)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "500 12px var(--mono)", color: "var(--muted)" }}>
              Or Paste JSON Content Directly
            </label>
            <textarea
              rows={8}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Paste creator_chart_dashboard_data.json here..."
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--rule)",
                borderRadius: 6,
                background: "var(--bg)",
                color: "var(--ink)",
                font: "12px var(--mono)",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !fileContent.trim()}
              style={{
                background: "var(--ink)",
                color: "var(--bg)",
                border: "1px solid var(--ink)",
                padding: "10px 18px",
                borderRadius: 6,
                font: "600 14px var(--body)",
                cursor: loading || !fileContent.trim() ? "not-allowed" : "pointer",
                opacity: loading || !fileContent.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Validating & Uploading…" : "Upload and Replace Live Data"}
            </button>
          </div>
        </form>
      </div>

      {/* Version History & Rollback Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Version History &amp; Rollback</h2>
        <p className="note">
          The previous 5 uploads are stored as version backups. You can roll back to any previous version at any time.
        </p>

        {versions.length > 0 ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th className="l">Backup File</th>
                  <th>Data Covered To</th>
                  <th>Built Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((ver) => (
                  <tr key={ver.filename}>
                    <td className="l" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                      {ver.filename}
                    </td>
                    <td>{ver.data_to}</td>
                    <td>{ver.built}</td>
                    <td>
                      <button
                        onClick={() => handleRollback(ver.filename)}
                        disabled={loading}
                        className="dlb"
                        style={{ padding: "3px 8px", fontSize: 11 }}
                      >
                        Roll back
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            No previous backup versions available yet. Backups are created automatically when you upload new data.
          </p>
        )}
      </div>
    </div>
  );
}
