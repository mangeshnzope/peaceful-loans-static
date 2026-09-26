import { describe, it, expect, beforeEach } from "vitest";
import { POST as authPost } from "../../app/api/auth/route";
import { GET as dataGet } from "../../app/api/data/route";
import { POST as adminUploadPost, GET as adminUploadGet } from "../../app/api/admin/upload/route";
import { createSessionToken } from "../auth";
import { NextRequest } from "next/server";

describe("API Route Handlers In-Process Tests", () => {
  it("Auth: Rejects invalid password", async () => {
    const req = new NextRequest("http://localhost/api/auth", {
      method: "POST",
      body: JSON.stringify({ email: "test@creatorchart.com", password: "invalid" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await authPost(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Email or password is incorrect");
  });

  it("Auth: Accepts team password and returns viewer session", async () => {
    const req = new NextRequest("http://localhost/api/auth", {
      method: "POST",
      body: JSON.stringify({ email: "creator@creatorchart.com", password: "creatorchart2026" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await authPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("viewer");

    // Check session cookie set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("tg_dashboard_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("Admin Upload: Rejects payload with forbidden total impressions keys", async () => {
    const badPayload = {
      meta: { data_to: "2026-09-30", built: "30 Sep 2026" },
      daily: [],
      weekly: [],
      monthly: [],
      posts: [],
      viewer_mix: {},
      insights: {},
      impressions: 12345, // forbidden
    };

    const req = new NextRequest("http://localhost/api/admin/upload", {
      method: "POST",
      body: JSON.stringify(badPayload),
      headers: {
        "Content-Type": "application/json",
        "x-upload-token": "PeacefulLoansAdminUpload2026",
      },
    });

    const res = await adminUploadPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("forbidden total impressions key");
  });

  it("Admin Upload: Rejects payload missing required sections", async () => {
    const incompletePayload = {
      meta: { data_to: "2026-09-30" },
      // missing daily, weekly, etc.
    };

    const req = new NextRequest("http://localhost/api/admin/upload", {
      method: "POST",
      body: JSON.stringify(incompletePayload),
      headers: {
        "Content-Type": "application/json",
        "x-upload-token": "PeacefulLoansAdminUpload2026",
      },
    });

    const res = await adminUploadPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Validation failed: missing section");
  });
});
