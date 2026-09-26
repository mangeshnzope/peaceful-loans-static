import { describe, it, expect } from "vitest";
import { authenticateUser, createSessionToken, verifySessionToken } from "../auth";
import fs from "fs";
import path from "path";

describe("Auth and Security Engine Tests", () => {
  it("Validates team password and rejects incorrect password", () => {
    const user = authenticateUser("mangesh@peaceful-loans.com", "creatorchart2026");
    expect(user).not.toBeNull();
    expect(user!.role).toBe("viewer");

    const failed = authenticateUser("mangesh@peaceful-loans.com", "wrongpassword");
    expect(failed).toBeNull();
  });

  it("Validates admin password and grants admin role", () => {
    const admin = authenticateUser("mangesh@peaceful-loans.com", "PeacefulLoansAdmin2026");
    expect(admin).not.toBeNull();
    expect(admin!.role).toBe("admin");
  });

  it("Generates and verifies cryptographic HMAC-SHA256 session token", async () => {
    const user = {
      email: "creator@creatorchart.com",
      role: "viewer" as const,
      authenticatedAt: Date.now(),
    };
    const token = await createSessionToken(user);
    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified!.email).toBe("creator@creatorchart.com");
    expect(verified!.role).toBe("viewer");

    // Tampered token fails
    const tampered = token + "xyz";
    const failed = await verifySessionToken(tampered);
    expect(failed).toBeNull();
  });

  it("Guarantees NO total impressions or raw view fields in stored data file", () => {
    const dataPath = path.join(process.cwd(), "data", "creator_chart_dashboard_data.json");
    expect(fs.existsSync(dataPath)).toBe(true);
    const raw = fs.readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(raw);

    const forbidden = ["impressions", "imp", "members_reached", "sv"];
    function checkKeys(obj: any) {
      if (!obj || typeof obj !== "object") return;
      for (const k of Object.keys(obj)) {
        expect(forbidden.includes(k.toLowerCase())).toBe(false);
        checkKeys(obj[k]);
      }
    }
    checkKeys(parsed);
  });
});
