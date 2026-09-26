import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "creator_chart_dashboard_data.json");

export async function GET(request: NextRequest) {
  const user = await getServerSession(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return NextResponse.json({ error: "Data file not found" }, { status: 500 });
    }

    const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    const json = JSON.parse(fileContent);

    // Sanitize to guarantee zero total impressions or raw view fields
    const forbiddenKeys = ["impressions", "imp", "members_reached", "sv"];
    function sanitize(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj !== null && typeof obj === "object") {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (!forbiddenKeys.includes(k.toLowerCase())) {
            clean[k] = sanitize(v);
          }
        }
        return clean;
      }
      return obj;
    }

    const cleanData = sanitize(json);

    return NextResponse.json(cleanData, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
