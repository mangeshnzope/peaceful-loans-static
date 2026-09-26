import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "creator_chart_dashboard_data.json");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  const user = await getServerSession(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, 5);

  const versions = files.map((filename) => {
    try {
      const content = fs.readFileSync(path.join(BACKUP_DIR, filename), "utf-8");
      const parsed = JSON.parse(content);
      return {
        filename,
        data_to: parsed.meta?.data_to || "unknown",
        built: parsed.meta?.built || "unknown",
        timestamp: filename.replace(".json", ""),
      };
    } catch {
      return { filename, data_to: "unknown", built: "unknown", timestamp: filename };
    }
  });

  return NextResponse.json({ versions });
}

export async function POST(request: NextRequest) {
  const user = await getServerSession(request);
  const uploadToken = request.headers.get("x-upload-token");
  const validToken = process.env.ADMIN_UPLOAD_TOKEN || "PeacefulLoansAdminUpload2026";

  const isAuthorized = (user && user.role === "admin") || (uploadToken && uploadToken === validToken);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if rollback request
    if (body.action === "rollback") {
      const { filename } = body;
      ensureBackupDir();
      const backupPath = path.join(BACKUP_DIR, filename);
      if (!fs.existsSync(backupPath)) {
        return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
      }
      fs.copyFileSync(backupPath, DATA_FILE_PATH);
      return NextResponse.json({ success: true, message: `Rolled back to ${filename}` });
    }

    const payload = body.data || body;

    // Validation 1: Required top-level sections
    const requiredSections = ["meta", "daily", "weekly", "monthly", "posts", "viewer_mix", "insights"];
    for (const sec of requiredSections) {
      if (!payload[sec]) {
        return NextResponse.json(
          { error: `Validation failed: missing section '${sec}'.` },
          { status: 400 }
        );
      }
    }

    // Validation 2: Ensure data_to is on or after current data_to
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        const currentData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
        if (currentData.meta?.data_to && payload.meta?.data_to) {
          if (payload.meta.data_to < currentData.meta.data_to) {
            return NextResponse.json(
              {
                error: `Validation failed: data_to (${payload.meta.data_to}) is older than current live data_to (${currentData.meta.data_to}).`,
              },
              { status: 400 }
            );
          }
        }
      } catch {
        // Current file unreadable, proceed
      }
    }

    // Validation 3: Reject if any key equals impressions, imp, members_reached, or sv
    const forbidden = ["impressions", "imp", "members_reached", "sv"];
    function checkForbiddenKeys(obj: any): string | null {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const err = checkForbiddenKeys(item);
          if (err) return err;
        }
      } else if (obj !== null && typeof obj === "object") {
        for (const k of Object.keys(obj)) {
          if (forbidden.includes(k.toLowerCase())) {
            return k;
          }
          const err = checkForbiddenKeys(obj[k]);
          if (err) return err;
        }
      }
      return null;
    }

    const forbiddenKeyFound = checkForbiddenKeys(payload);
    if (forbiddenKeyFound) {
      return NextResponse.json(
        {
          error: `Validation failed: forbidden total impressions key '${forbiddenKeyFound}' found in data payload.`,
        },
        { status: 400 }
      );
    }

    // Versioning: Backup current live file before replacing
    ensureBackupDir();
    if (fs.existsSync(DATA_FILE_PATH)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.copyFileSync(DATA_FILE_PATH, path.join(BACKUP_DIR, `data_backup_${timestamp}.json`));

      // Clean up to keep only previous 5 backups
      const allBackups = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort();
      while (allBackups.length > 5) {
        const oldest = allBackups.shift();
        if (oldest) fs.unlinkSync(path.join(BACKUP_DIR, oldest));
      }
    }

    // Save validated live file
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payload, null, 1), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Data uploaded and validated successfully.",
      data_to: payload.meta.data_to,
      built: payload.meta.built,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Upload error: ${err.message}` }, { status: 400 });
  }
}
