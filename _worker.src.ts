import { createAEOWorker } from "@dualmark/cloudflare";
import defaultDashboardData from "./creator-chart/data/creator_chart_dashboard_data.json";

const aeoWorker = createAEOWorker({
  upstream: {
    async fetch(request, env, _ctx) {
      // Serve static assets directly from Cloudflare Pages
      return env.ASSETS.fetch(request);
    },
  },
  trailingSlash: "preserve",
  enableLinkHeader: true,
});

// A simple in-memory fallback for local dev (persists during isolate lifecycle)
const localDB = new Map<string, string>();

// --- LinkedIn TG Analytics Auth & Session Helpers ---
const TG_SESSION_SECRET = "peaceful-loans-creator-chart-tg-dashboard-secure-salt-2026";
const TG_DEFAULT_TEAM_PASSWORD = "creatorchart2026";
const TG_DEFAULT_ADMIN_PASSWORD = "PeacefulLoansAdmin2026";

const tgRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkTgRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = tgRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    tgRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

async function getTgSigningKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(TG_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createTgToken(user: { email: string; role: "viewer" | "admin" }): Promise<string> {
  const payload = JSON.stringify({ ...user, authenticatedAt: Date.now() });
  const enc = new TextEncoder();
  const key = await getTgSigningKey();
  const payloadBytes = enc.encode(payload);
  let binary = "";
  for (let i = 0; i < payloadBytes.length; i++) binary += String.fromCharCode(payloadBytes[i]);
  const payloadBase64 = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadBase64));
  let sigBinary = "";
  const sigBytes = new Uint8Array(sig);
  for (let i = 0; i < sigBytes.length; i++) sigBinary += String.fromCharCode(sigBytes[i]);
  const sigBase64 = btoa(sigBinary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${payloadBase64}.${sigBase64}`;
}

async function verifyTgToken(request: Request): Promise<{ email: string; role: "viewer" | "admin" } | null> {
  try {
    const cookieHeader = request.headers.get("Cookie") || "";
    const match = cookieHeader.match(/tg_session=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadBase64, sigBase64] = parts;

    const enc = new TextEncoder();
    const key = await getTgSigningKey();

    let sigB64 = sigBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (sigB64.length % 4) sigB64 += "=";
    const sigStr = atob(sigB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBytes[i] = sigStr.charCodeAt(i);

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payloadBase64));
    if (!valid) return null;

    let payB64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (payB64.length % 4) payB64 += "=";
    const payloadStr = atob(payB64);
    const data = JSON.parse(payloadStr);

    if (Date.now() - data.authenticatedAt > 7 * 24 * 60 * 60 * 1000) return null;
    return { email: data.email, role: data.role };
  } catch {
    return null;
  }
}


async function sendNotificationEmail(username: string, question: string, env: any): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Email notification skipped.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Peaceful Loans Q&A <info@peaceful-loans.com>",
        to: "mangesh@peaceful-loans.com",
        subject: `New Q&A Question from ${username}`,
        html: `
          <div style="font-family:sans-serif; line-height:1.6; max-width:600px; margin:0 auto; padding:1.5rem; border:1px solid #e5e7eb; border-radius:8px;">
            <h2 style="color:#1a4cc8; margin-top:0;">New Question Received</h2>
            <p>A borrower has posted a question anonymously on the Q&A landing page.</p>
            <hr style="border:0; border-top:1px solid #e5e7eb; margin:1.5rem 0;" />
            <p><strong>Username:</strong> <code style="background:#f3f4f6; padding:0.2rem 0.4rem; border-radius:4px; font-weight:600; color:#1a4cc8;">${username}</code></p>
            <p><strong>Question:</strong></p>
            <blockquote style="background:#f9fafb; padding:1.25rem; border-left:4px solid #1a4cc8; margin:0; border-radius:0 8px 8px 0; font-style:italic;">
              ${question.replace(/\n/g, "<br>")}
            </blockquote>
            <hr style="border:0; border-top:1px solid #e5e7eb; margin:1.5rem 0;" />
            <p style="margin-bottom:0;">
              <a href="https://peaceful-loans.com/admin-questions.html" style="display:inline-block; background:#1a4cc8; color:#ffffff; padding:0.6rem 1.2rem; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px;">Open Moderator Dashboard</a>
            </p>
          </div>
        `
      })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API error: ${res.status} - ${errText}`);
    }
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

async function sendAnswerAlertEmail(borrowerEmail: string, username: string, question: string, id: string, env: any): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Mangesh from Peaceful Loans <mangesh@peaceful-loans.com>",
        to: borrowerEmail,
        subject: `Your Home Loan Question has been Answered!`,
        html: `
          <div style="font-family:sans-serif; line-height:1.6; max-width:600px; margin:0 auto; padding:1.5rem; border:1px solid #e5e7eb; border-radius:8px;">
            <h2 style="color:#1a4cc8; margin-top:0;">Your Question has been Answered</h2>
            <p>Hello ${username},</p>
            <p>Your anonymous question has been personally answered by our home loan expert.</p>
            <hr style="border:0; border-top:1px solid #e5e7eb; margin:1.5rem 0;" />
            <p><strong>Your Question:</strong></p>
            <blockquote style="background:#f9fafb; padding:1rem; border-left:4px solid #1a4cc8; margin:0; border-radius:0 8px 8px 0; font-style:italic;">
              ${question.replace(/\n/g, "<br>")}
            </blockquote>
            <hr style="border:0; border-top:1px solid #e5e7eb; margin:1.5rem 0;" />
            <p>You can read the detailed expert answer directly using your private link:</p>
            <p style="margin-bottom:0; margin-top:1.5rem;">
              <a href="https://peaceful-loans.com/ask.html?id=${id}" style="display:inline-block; background:#1a4cc8; color:#ffffff; padding:0.6rem 1.2rem; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px;">View Expert Answer</a>
            </p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API alert error: ${res.status} - ${errText}`);
    }
  } catch (err) {
    console.error("Failed to send answer alert email:", err);
  }
}

async function sendDailyCsvEmail(env: any): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Scheduled CSV email skipped.");
    return;
  }

  try {
    const kv = env.QUESTIONS_KV;
    const questions = [];

    if (kv) {
      const list = await kv.list({ prefix: "question:" });
      for (const key of list.keys) {
        const val = await kv.get(key.name);
        if (val) questions.push(JSON.parse(val));
      }
    } else {
      for (const val of localDB.values()) {
        questions.push(JSON.parse(val));
      }
    }

    // Sort by created_at desc
    questions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Build CSV content
    const csvRows = [];
    const headers = ["ID", "Username", "Email", "Category", "Status", "Created At", "Question", "Answer", "IP Address", "Referrer", "li_fat_id", "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content"];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

    for (const q of questions) {
      const utm = q.utm_params || {};
      const row = [
        q.id || "",
        q.username || "",
        q.email || "",
        q.tag || "General",
        q.status || "",
        q.created_at || "",
        q.question || "",
        q.answer || "",
        q.ip || "Unknown",
        q.referrer || "Direct",
        q.li_fat_id || "",
        utm.utm_source || "",
        utm.utm_medium || "",
        utm.utm_campaign || "",
        utm.utm_term || "",
        utm.utm_content || ""
      ];

      const escapedRow = row.map(val => {
        const stringVal = String(val).replace(/\r?\n/g, " ").replace(/"/g, '""');
        return `"${stringVal}"`;
      });
      csvRows.push(escapedRow.join(","));
    }

    const csvString = csvRows.join("\r\n");
    
    // Convert to Base64 (Using TextEncoder and btoa)
    const utf8Encoder = new TextEncoder();
    const u8arr = utf8Encoder.encode(csvString);
    let binary = "";
    for (let i = 0; i < u8arr.byteLength; i++) {
      binary += String.fromCharCode(u8arr[i]);
    }
    const base64Csv = btoa(binary);

    const dateStr = new Date().toISOString().slice(0, 10);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Peaceful Loans Reports <info@peaceful-loans.com>",
        to: "mangesh@peaceful-loans.com",
        subject: `Daily Q&A Report - ${dateStr}`,
        html: `
          <div style="font-family:sans-serif; line-height:1.6; max-width:600px; margin:0 auto; padding:1.5rem; border:1px solid #e5e7eb; border-radius:8px;">
            <h2 style="color:#1a4cc8; margin-top:0;">Daily Q&A Export Report</h2>
            <p>Hello,</p>
            <p>Please find attached the daily Q&A export report containing all questions, answers, and tracking/session details compiled up to today.</p>
            <hr style="border:0; border-top:1px solid #e5e7eb; margin:1.5rem 0;" />
            <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Records:</strong> ${questions.length}</p>
            <p>If you need to view the live moderator interface, please use the link below:</p>
            <p style="margin-bottom:0; margin-top:1.5rem;">
              <a href="https://peaceful-loans.com/admin-questions.html" style="display:inline-block; background:#1a4cc8; color:#ffffff; padding:0.6rem 1.2rem; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px;">Open Moderator Dashboard</a>
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `peaceful_loans_questions_${dateStr}.csv`,
            content: base64Csv
          }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API CSV email error: ${res.status} - ${errText}`);
    } else {
      console.log("Daily CSV Q&A email sent successfully.");
    }
  } catch (err) {
    console.error("Failed to compile and send daily CSV email:", err);
  }
}

async function handleApiRequest(request: Request, env: any, ctx: any): Promise<Response> {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, "");

  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // 1. Submit Question
  if (cleanPath === "/api/questions" && request.method === "POST") {
    try {
      const { username, question, email, tag, utm_params, referrer, li_fat_id } = await request.json() as any;
      if (!username || !question) {
        return new Response(JSON.stringify({ error: "Username and question are required." }), { status: 400, headers });
      }

      const id = Math.random().toString(36).substring(2, 10);
      const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("cf-connecting-ip") || "Unknown";
      const data = {
        id,
        username,
        question,
        email: email || null,
        tag: tag || "General",
        answer: null,
        status: "pending",
        created_at: new Date().toISOString(),
        utm_params: utm_params || null,
        ip: clientIp,
        referrer: referrer || "Direct",
        li_fat_id: li_fat_id || null,
      };

      const kv = env.QUESTIONS_KV;
      if (kv) {
        await kv.put(`question:${id}`, JSON.stringify(data));
      } else {
        localDB.set(`question:${id}`, JSON.stringify(data));
      }

      // Trigger background email notification (don't block client response)
      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(sendNotificationEmail(username, question, env));
      } else {
        sendNotificationEmail(username, question, env).catch(console.error);
      }

      return new Response(JSON.stringify({ id }), { status: 200, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  // 2. Retrieve Question(s)
  if (cleanPath === "/api/questions" && request.method === "GET") {
    const id = url.searchParams.get("id");
    const kv = env.QUESTIONS_KV;

    // List all public answered questions if no ID is specified
    if (!id) {
      const questions = [];
      if (kv) {
        const list = await kv.list({ prefix: "question:" });
        for (const key of list.keys) {
          const val = await kv.get(key.name);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed.status === "answered") {
              questions.push({
                id: parsed.id,
                username: parsed.username,
                question: parsed.question,
                answer: parsed.answer,
                tag: parsed.tag || "General",
                status: parsed.status,
                created_at: parsed.created_at
              });
            }
          }
        }
      } else {
        for (const val of localDB.values()) {
          const parsed = JSON.parse(val);
          if (parsed.status === "answered") {
            questions.push({
              id: parsed.id,
              username: parsed.username,
              question: parsed.question,
              answer: parsed.answer,
              tag: parsed.tag || "General",
              status: parsed.status,
              created_at: parsed.created_at
            });
          }
        }
      }

      // Sort by created_at desc
      questions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return new Response(JSON.stringify(questions), { status: 200, headers });
    }

    // Retrieve specific question details
    let dataStr = kv ? await kv.get(`question:${id}`) : localDB.get(`question:${id}`);

    if (!dataStr) {
      return new Response(JSON.stringify({ error: "Question not found." }), { status: 404, headers });
    }

    const data = JSON.parse(dataStr);
    // Sanitize email when retrieving publicly
    const publicData = {
      id: data.id,
      username: data.username,
      question: data.question,
      answer: data.answer,
      tag: data.tag || "General",
      status: data.status,
      created_at: data.created_at,
    };

    return new Response(JSON.stringify(publicData), { status: 200, headers });
  }

  // 3. Admin: List Questions
  if (cleanPath === "/api/admin/questions" && request.method === "GET") {
    const secret = url.searchParams.get("secret");
    const adminSecret = env.ADMIN_SECRET || "PeacefulLoansAdmin2026";
    if (!secret || secret !== adminSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers });
    }

    const kv = env.QUESTIONS_KV;
    const questions = [];

    if (kv) {
      const list = await kv.list({ prefix: "question:" });
      for (const key of list.keys) {
        const val = await kv.get(key.name);
        if (val) questions.push(JSON.parse(val));
      }
    } else {
      for (const val of localDB.values()) {
        questions.push(JSON.parse(val));
      }
    }

    // Sort by created_at desc
    questions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return new Response(JSON.stringify(questions), { status: 200, headers });
  }

  // 4. Admin: Answer Question
  if (cleanPath === "/api/admin/answer" && request.method === "POST") {
    try {
      const { id, answer, tag, secret } = await request.json() as any;
      const adminSecret = env.ADMIN_SECRET || "PeacefulLoansAdmin2026";
      if (!secret || secret !== adminSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers });
      }
      if (!id || !answer) {
        return new Response(JSON.stringify({ error: "ID and answer are required." }), { status: 400, headers });
      }

      const kv = env.QUESTIONS_KV;
      let dataStr = kv ? await kv.get(`question:${id}`) : localDB.get(`question:${id}`);

      if (!dataStr) {
        return new Response(JSON.stringify({ error: "Question not found." }), { status: 404, headers });
      }

      const data = JSON.parse(dataStr);
      data.answer = answer;
      data.status = "answered";
      if (tag) {
        data.tag = tag;
      }

      if (kv) {
        await kv.put(`question:${id}`, JSON.stringify(data));
      } else {
        localDB.set(`question:${id}`, JSON.stringify(data));
      }

      // Trigger background email alert to borrower if they provided an email address
      if (data.email) {
        if (ctx && typeof ctx.waitUntil === "function") {
          ctx.waitUntil(sendAnswerAlertEmail(data.email, data.username, data.question, id, env));
        } else {
          sendAnswerAlertEmail(data.email, data.username, data.question, id, env).catch(console.error);
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  // 5. Admin: Manually trigger Daily CSV email report
  if (cleanPath === "/api/admin/send-report" && request.method === "POST") {
    try {
      const { secret } = await request.json() as any;
      const adminSecret = env.ADMIN_SECRET || "PeacefulLoansAdmin2026";
      if (!secret || secret !== adminSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers });
      }

      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(sendDailyCsvEmail(env));
      } else {
        await sendDailyCsvEmail(env);
      }

      return new Response(JSON.stringify({ success: true, message: "Report dispatch scheduled/triggered successfully." }), { status: 200, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  // 6. LinkedIn Analytics Auth (Login / Logout / Verify)
  if (cleanPath === "/api/linkedin-analytics/auth") {
    if (request.method === "GET") {
      const user = await verifyTgToken(request);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }
      return new Response(JSON.stringify({ user }), { status: 200, headers });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json() as any;
        if (body.action === "logout") {
          const resHeaders = new Headers(headers);
          resHeaders.set("Set-Cookie", "tg_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: resHeaders });
        }

        const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("cf-connecting-ip") || "unknown-ip";
        const rateKey = `${clientIp}:${body.email || ""}`;
        if (!checkTgRateLimit(rateKey)) {
          return new Response(
            JSON.stringify({ error: "Too many failed sign-in attempts. Please try again in 15 minutes." }),
            { status: 429, headers }
          );
        }

        const teamPassword = env.TEAM_PASSWORD || TG_DEFAULT_TEAM_PASSWORD;
        const adminPassword = env.ADMIN_PASSWORD || TG_DEFAULT_ADMIN_PASSWORD;

        let role: "viewer" | "admin" | null = null;
        if (body.password === adminPassword) {
          role = "admin";
        } else if (body.password === teamPassword) {
          role = "viewer";
        }

        if (!role) {
          return new Response(JSON.stringify({ error: "Email or password is incorrect" }), { status: 401, headers });
        }

        const email = body.email ? body.email.trim() : role === "admin" ? "mangesh@peaceful-loans.com" : "creator@creatorchart.com";
        const token = await createTgToken({ email, role });
        const resHeaders = new Headers(headers);
        resHeaders.set("Set-Cookie", `tg_session=${token}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax; Secure`);

        return new Response(JSON.stringify({ success: true, user: { email, role } }), { status: 200, headers: resHeaders });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
    }
  }

  // 7. LinkedIn Analytics Data (Zero total impressions enforced)
  if (cleanPath === "/api/linkedin-analytics/data" || cleanPath === "/api/data") {
    if (request.method === "GET") {
      const user = await verifyTgToken(request);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      let payload = defaultDashboardData;
      const kv = env.QUESTIONS_KV;
      if (kv) {
        try {
          const liveStr = await kv.get("linkedin_data:live");
          if (liveStr) {
            payload = JSON.parse(liveStr);
          }
        } catch {
          // fallback to defaultDashboardData
        }
      }

      // Guarantee zero total impressions
      const forbidden = ["impressions", "imp", "members_reached", "sv"];
      function sanitizeData(obj: any): any {
        if (Array.isArray(obj)) return obj.map(sanitizeData);
        if (obj !== null && typeof obj === "object") {
          const clean: Record<string, any> = {};
          for (const [k, v] of Object.entries(obj)) {
            if (!forbidden.includes(k.toLowerCase())) {
              clean[k] = sanitizeData(v);
            }
          }
          return clean;
        }
        return obj;
      }

      const resHeaders = new Headers(headers);
      resHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      resHeaders.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(JSON.stringify(sanitizeData(payload)), { status: 200, headers: resHeaders });
    }
  }

  // 8. LinkedIn Analytics Upload & Rollback (Admin only)
  if (cleanPath === "/api/linkedin-analytics/upload") {
    const user = await verifyTgToken(request);
    const uploadToken = request.headers.get("x-upload-token");
    const validToken = env.ADMIN_UPLOAD_TOKEN || "PeacefulLoansAdminUpload2026";
    const isAuthorized = (user && user.role === "admin") || (uploadToken && uploadToken === validToken);

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const kv = env.QUESTIONS_KV;

    if (request.method === "GET") {
      let versions: any[] = [];
      if (kv) {
        const vStr = await kv.get("linkedin_data:versions");
        if (vStr) versions = JSON.parse(vStr);
      }
      return new Response(JSON.stringify({ versions }), { status: 200, headers });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json() as any;

        // Rollback
        if (body.action === "rollback") {
          if (!kv) {
            return new Response(JSON.stringify({ error: "Storage not configured for rollback" }), { status: 500, headers });
          }
          const vStr = await kv.get("linkedin_data:versions");
          const versions = vStr ? JSON.parse(vStr) : [];
          const target = versions.find((v: any) => v.id === body.id);
          if (!target || !target.data) {
            return new Response(JSON.stringify({ error: "Version not found" }), { status: 404, headers });
          }
          await kv.put("linkedin_data:live", JSON.stringify(target.data));
          return new Response(JSON.stringify({ success: true, message: `Rolled back to ${target.data_to}` }), { status: 200, headers });
        }

        const payload = body.data || body;

        // Section 9 validation: check 7 required sections
        const requiredSections = ["meta", "daily", "weekly", "monthly", "posts", "viewer_mix", "insights"];
        for (const sec of requiredSections) {
          if (!payload[sec]) {
            return new Response(JSON.stringify({ error: `Validation failed: missing section '${sec}'.` }), { status: 400, headers });
          }
        }

        // Section 9 validation: reject total impressions keys
        const forbidden = ["impressions", "imp", "members_reached", "sv"];
        function checkForbiddenKeys(obj: any): string | null {
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const err = checkForbiddenKeys(item);
              if (err) return err;
            }
          } else if (obj !== null && typeof obj === "object") {
            for (const k of Object.keys(obj)) {
              if (forbidden.includes(k.toLowerCase())) return k;
              const err = checkForbiddenKeys(obj[k]);
              if (err) return err;
            }
          }
          return null;
        }

        const forbiddenKey = checkForbiddenKeys(payload);
        if (forbiddenKey) {
          return new Response(
            JSON.stringify({ error: `Validation failed: forbidden total impressions key '${forbiddenKey}' found.` }),
            { status: 400, headers }
          );
        }

        // Check monotonic data_to
        if (payload.meta?.data_to && defaultDashboardData.meta?.data_to) {
          if (payload.meta.data_to < defaultDashboardData.meta.data_to) {
            return new Response(
              JSON.stringify({ error: `Validation failed: data_to (${payload.meta.data_to}) is older than live data_to (${defaultDashboardData.meta.data_to}).` }),
              { status: 400, headers }
            );
          }
        }

        if (kv) {
          // Keep version history
          const vStr = await kv.get("linkedin_data:versions");
          const versions = vStr ? JSON.parse(vStr) : [];
          const currentLive = await kv.get("linkedin_data:live");
          const currentObj = currentLive ? JSON.parse(currentLive) : defaultDashboardData;

          versions.unshift({
            id: `v_${Date.now()}`,
            data_to: currentObj.meta?.data_to || "unknown",
            built: currentObj.meta?.built || "unknown",
            data: currentObj,
          });

          // Keep max 5 versions
          const trimmed = versions.slice(0, 5);
          await kv.put("linkedin_data:versions", JSON.stringify(trimmed));
          await kv.put("linkedin_data:live", JSON.stringify(payload));
        }

        return new Response(
          JSON.stringify({ success: true, message: "Data uploaded successfully.", data_to: payload.meta?.data_to, built: payload.meta?.built }),
          { status: 200, headers }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, "");
    if (cleanPath === "/save-money-on-home-loan") {
      return Response.redirect(new URL("/", url.origin).toString(), 301);
    }

    // Intercept our API routes
    if (cleanPath.startsWith("/api/")) {
      return handleApiRequest(request, env, ctx);
    }

    const response = await aeoWorker.fetch(request, env, ctx);

    if (cleanPath === "/linkedin-analytics" || cleanPath === "/linkedin-analytics.html") {
      const resHeaders = new Headers(response.headers);
      resHeaders.set("X-Robots-Tag", "noindex, nofollow");
      resHeaders.set("X-Frame-Options", "DENY");
      resHeaders.set("X-Content-Type-Options", "nosniff");
      return new Response(response.body, { status: response.status, headers: resHeaders });
    }

    return response;
  },

  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(sendDailyCsvEmail(env));
  }
};
