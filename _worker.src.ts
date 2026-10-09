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

async function createTgToken(user: { role: "viewer" | "admin" }): Promise<string> {
  const payload = JSON.stringify({ v: 2, role: user.role, authenticatedAt: Date.now() });
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

async function verifyTgToken(request: Request): Promise<{ role: "viewer" | "admin" } | null> {
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

    if (data.v !== 2) return null;
    if (Date.now() - data.authenticatedAt > 7 * 24 * 60 * 60 * 1000) return null;
    if (data.role !== "admin" && data.role !== "viewer") return null;
    return { role: data.role };
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
        if (!checkTgRateLimit(clientIp)) {
          return new Response(
            JSON.stringify({ error: "Too many failed sign-in attempts. Please try again in 15 minutes." }),
            { status: 429, headers }
          );
        }

        const teamPassword = env.TEAM_PASSWORD || TG_DEFAULT_TEAM_PASSWORD;
        const adminPassword = env.ADMIN_PASSWORD || TG_DEFAULT_ADMIN_PASSWORD;
        const pwd = typeof body.password === "string" ? body.password.trim() : "";

        let role: "viewer" | "admin" | null = null;
        if (pwd && pwd === adminPassword) {
          role = "admin";
        } else if (pwd && pwd === teamPassword) {
          role = "viewer";
        }

        if (!role) {
          return new Response(JSON.stringify({ error: "Password is incorrect" }), { status: 401, headers });
        }

        const token = await createTgToken({ role });
        const resHeaders = new Headers(headers);
        resHeaders.set("Set-Cookie", `tg_session=${token}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax; Secure`);

        return new Response(JSON.stringify({ success: true, user: { role } }), { status: 200, headers: resHeaders });
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

      let payload = JSON.parse(JSON.stringify(defaultDashboardData));
      const kv = env.QUESTIONS_KV;
      if (kv) {
        try {
          const liveStr = await kv.get("linkedin_data:live");
          if (liveStr) {
            const liveData = JSON.parse(liveStr);
            if (liveData.meta?.data_to && defaultDashboardData.meta?.data_to && liveData.meta.data_to > defaultDashboardData.meta.data_to) {
              payload = {
                ...defaultDashboardData,
                ...liveData,
                company_page: liveData.company_page || (defaultDashboardData as any).company_page,
                newsletter: liveData.newsletter || (defaultDashboardData as any).newsletter,
              };
            }
          }
        } catch {
          // fallback to defaultDashboardData
        }
      }

      // Merge post type overrides (§7.4.1)
      let overrides: Record<string, any> = {};
      let imageOverrides: Record<string, any> = {};
      if (kv) {
        try {
          const ovStr = await kv.get("linkedin_data:post_type_overrides");
          if (ovStr) overrides = JSON.parse(ovStr);
        } catch {}
        try {
          const imgOvStr = await kv.get("linkedin_data:post_image_overrides");
          if (imgOvStr) imageOverrides = JSON.parse(imgOvStr);
        } catch {}
      } else {
        const memStr = localDB.get("linkedin_data:post_type_overrides");
        if (memStr) overrides = JSON.parse(memStr);
        const imgMemStr = localDB.get("linkedin_data:post_image_overrides");
        if (imgMemStr) imageOverrides = JSON.parse(imgMemStr);
      }

      let overridesChanged = false;
      let imgOverridesChanged = false;
      if (Array.isArray(payload.posts)) {
        for (const p of payload.posts) {
          if (overrides && typeof overrides === "object") {
            const ov = overrides[p.post_id];
            if (ov) {
              const ovType = typeof ov === "string" ? ov : ov.type;
              if (ovType === (p.auto_type || p.type)) {
                delete overrides[p.post_id];
                overridesChanged = true;
              } else {
                p.type = ovType;
              }
            }
          }
          if (imageOverrides && typeof imageOverrides === "object") {
            const iov = imageOverrides[p.post_id];
            if (iov) {
              const ovImg = typeof iov === "string" ? iov : iov.image_type;
              if (ovImg === (p.auto_image_type || p.image_type)) {
                delete imageOverrides[p.post_id];
                imgOverridesChanged = true;
              } else {
                p.image_type = ovImg;
              }
            }
          }
        }
      }
      if (overridesChanged) {
        const serialized = JSON.stringify(overrides);
        if (kv) {
          ctx.waitUntil(kv.put("linkedin_data:post_type_overrides", serialized));
        }
        localDB.set("linkedin_data:post_type_overrides", serialized);
      }
      if (imgOverridesChanged) {
        const serializedImg = JSON.stringify(imageOverrides);
        if (kv) {
          ctx.waitUntil(kv.put("linkedin_data:post_image_overrides", serializedImg));
        }
        localDB.set("linkedin_data:post_image_overrides", serializedImg);
      }
      payload.overrides = overrides;
      payload.image_overrides = imageOverrides;

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

  // 8. Post Type Changes Export (Admin only, §3.2.4)
  if (cleanPath === "/api/linkedin-analytics/post-type/export" || cleanPath === "/api/post-type/export") {
    const user = await verifyTgToken(request);
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: user ? 403 : 401, headers });
    }
    const kv = env.QUESTIONS_KV;
    let overrides: Record<string, any> = {};
    if (kv) {
      try {
        const ovStr = await kv.get("linkedin_data:post_type_overrides");
        if (ovStr) overrides = JSON.parse(ovStr);
      } catch {}
    } else {
      const memStr = localDB.get("linkedin_data:post_type_overrides");
      if (memStr) overrides = JSON.parse(memStr);
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(overrides)) {
      out[k] = typeof v === "string" ? v : v.type;
    }
    const resHeaders = new Headers(headers);
    resHeaders.set("Content-Disposition", 'attachment; filename="post_type_changes.json"');
    resHeaders.set("Content-Type", "application/json");
    return new Response(JSON.stringify(out, null, 2), { status: 200, headers: resHeaders });
  }

  // 8b. Post Image Overrides (§2 of v5.2 brief)
  if (cleanPath === "/api/linkedin-analytics/post-image" || cleanPath === "/api/post-image") {
    const user = await verifyTgToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const kv = env.QUESTIONS_KV;

    if (request.method === "GET") {
      let overrides: Record<string, any> = {};
      if (kv) {
        try {
          const ovStr = await kv.get("linkedin_data:post_image_overrides");
          if (ovStr) overrides = JSON.parse(ovStr);
        } catch {}
      } else {
        const memStr = localDB.get("linkedin_data:post_image_overrides");
        if (memStr) overrides = JSON.parse(memStr);
      }
      return new Response(JSON.stringify({ overrides }), { status: 200, headers });
    }

    if (request.method === "POST") {
      if (user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Only admins can change image types." }), { status: 403, headers });
      }

      try {
        const body = await request.json() as any;
        const { post_id, image_type } = body;
        if (!post_id || typeof post_id !== "string" || !image_type || typeof image_type !== "string") {
          return new Response(JSON.stringify({ error: "post_id and image_type are required" }), { status: 400, headers });
        }

        const validImageTypes = (defaultDashboardData.meta as any)?.image_types || [
          "Real image",
          "AI-generated image",
          "No image"
        ];

        if (!validImageTypes.includes(image_type) && image_type !== "RESET" && image_type !== "DELETE") {
          return new Response(JSON.stringify({ error: `Invalid image_type. Must be one of: ${validImageTypes.join(", ")}` }), { status: 400, headers });
        }

        const post = (defaultDashboardData.posts as any[]).find((p: any) => p.post_id === post_id);
        if (!post && image_type !== "RESET" && image_type !== "DELETE") {
          return new Response(JSON.stringify({ error: `Unknown post_id '${post_id}'` }), { status: 404, headers });
        }

        const autoImageType = post ? (post.auto_image_type || post.image_type) : null;

        let overrides: Record<string, any> = {};
        if (kv) {
          try {
            const ovStr = await kv.get("linkedin_data:post_image_overrides");
            if (ovStr) overrides = JSON.parse(ovStr);
          } catch {}
        } else {
          const memStr = localDB.get("linkedin_data:post_image_overrides");
          if (memStr) overrides = JSON.parse(memStr);
        }

        if (image_type === "RESET" || image_type === "DELETE" || (autoImageType && image_type === autoImageType) || (!post && overrides[post_id])) {
          delete overrides[post_id];
        } else {
          overrides[post_id] = {
            image_type,
            auto_image_type: autoImageType,
            title: post ? post.title : "",
            changed_by: "admin",
            changed_at: new Date().toISOString()
          };
        }

        const serialized = JSON.stringify(overrides);
        if (kv) {
          await kv.put("linkedin_data:post_image_overrides", serialized);
        }
        localDB.set("linkedin_data:post_image_overrides", serialized);

        const outMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(overrides)) {
          outMap[k] = typeof v === "string" ? v : v.image_type;
        }

        return new Response(JSON.stringify({ success: true, post_id, image_type, auto_image_type: autoImageType, overrides: outMap }), { status: 200, headers });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
    }
  }

  // 8. Post Type Overrides (§7.4.1)
  if (cleanPath === "/api/linkedin-analytics/post-type" || cleanPath === "/api/post-type") {
    const user = await verifyTgToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const kv = env.QUESTIONS_KV;

    if (request.method === "GET") {
      let overrides: Record<string, any> = {};
      if (kv) {
        try {
          const ovStr = await kv.get("linkedin_data:post_type_overrides");
          if (ovStr) overrides = JSON.parse(ovStr);
        } catch {}
      } else {
        const memStr = localDB.get("linkedin_data:post_type_overrides");
        if (memStr) overrides = JSON.parse(memStr);
      }
      return new Response(JSON.stringify({ overrides }), { status: 200, headers });
    }

    if (request.method === "POST") {
      // Role admin only! Acceptance test: viewer receives 403
      if (user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Only admins can change post types." }), { status: 403, headers });
      }

      try {
        const body = await request.json() as any;
        const { post_id, type } = body;
        if (!post_id || typeof post_id !== "string" || !type || typeof type !== "string") {
          return new Response(JSON.stringify({ error: "post_id and type are required" }), { status: 400, headers });
        }

        const validTypes = (defaultDashboardData.meta as any)?.post_types || [
          "Bank & industry critique",
          "Home-loan explainer",
          "Client story",
          "Founder journey & milestones",
          "Opinion & life lessons",
          "Hiring & team"
        ];

        if (!validTypes.includes(type) && type !== "RESET" && type !== "DELETE") {
          return new Response(JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }), { status: 400, headers });
        }

        const post = (defaultDashboardData.posts as any[]).find((p: any) => p.post_id === post_id);
        if (!post && type !== "RESET" && type !== "DELETE") {
          return new Response(JSON.stringify({ error: `Unknown post_id '${post_id}'` }), { status: 404, headers });
        }

        const autoType = post ? (post.auto_type || post.type) : null;

        let overrides: Record<string, any> = {};
        if (kv) {
          try {
            const ovStr = await kv.get("linkedin_data:post_type_overrides");
            if (ovStr) overrides = JSON.parse(ovStr);
          } catch {}
        } else {
          const memStr = localDB.get("linkedin_data:post_type_overrides");
          if (memStr) overrides = JSON.parse(memStr);
        }

        if (type === "RESET" || type === "DELETE" || (autoType && type === autoType) || (!post && overrides[post_id])) {
          delete overrides[post_id];
        } else {
          overrides[post_id] = {
            type,
            auto_type: autoType,
            title: post ? post.title : "",
            changed_by: "admin",
            changed_at: new Date().toISOString()
          };
        }

        const serialized = JSON.stringify(overrides);
        if (kv) {
          await kv.put("linkedin_data:post_type_overrides", serialized);
        }
        localDB.set("linkedin_data:post_type_overrides", serialized);

        const outMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(overrides)) {
          outMap[k] = typeof v === "string" ? v : v.type;
        }

        return new Response(JSON.stringify({ success: true, post_id, type, auto_type: autoType, overrides: outMap }), { status: 200, headers });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
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

        // New for v3+: check meta.post_types and optional meta.image_types and validate all posts
        const postTypes = payload.meta?.post_types;
        if (!Array.isArray(postTypes) || postTypes.length === 0) {
          return new Response(JSON.stringify({ error: "Validation failed: meta.post_types is required." }), { status: 400, headers });
        }
        const imageTypes = Array.isArray(payload.meta?.image_types) ? payload.meta.image_types : null;
        if (!Array.isArray(payload.posts)) {
          return new Response(JSON.stringify({ error: "Validation failed: posts must be an array." }), { status: 400, headers });
        }
        for (const p of payload.posts) {
          if (!p.post_id || typeof p.post_id !== "string") {
            return new Response(JSON.stringify({ error: "Validation failed: every post must have a string post_id." }), { status: 400, headers });
          }
          if (!p.type || !postTypes.includes(p.type)) {
            return new Response(JSON.stringify({ error: `Validation failed: post ${p.post_id} type '${p.type}' not in meta.post_types.` }), { status: 400, headers });
          }
          if (!p.auto_type || !postTypes.includes(p.auto_type)) {
            return new Response(JSON.stringify({ error: `Validation failed: post ${p.post_id} auto_type '${p.auto_type}' not in meta.post_types.` }), { status: 400, headers });
          }
          if (imageTypes && p.image_type && !imageTypes.includes(p.image_type)) {
            return new Response(JSON.stringify({ error: `Validation failed: post ${p.post_id} image_type '${p.image_type}' not in meta.image_types.` }), { status: 400, headers });
          }
          if (imageTypes && p.auto_image_type && !imageTypes.includes(p.auto_image_type)) {
            return new Response(JSON.stringify({ error: `Validation failed: post ${p.post_id} auto_image_type '${p.auto_image_type}' not in meta.image_types.` }), { status: 400, headers });
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

  // 9. Manifesto Auth & Team Examples (Breakout Session Live Contributions)
  if (cleanPath === "/api/manifesto/auth" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      const candidate = String(body.password || "").trim();
      const validPassword = env.MANIFESTO_PASSWORD || "Peaceful-Loans-Manifesto";
      if (candidate === validPassword || candidate.toLowerCase() === validPassword.toLowerCase()) {
        return new Response(JSON.stringify({ authenticated: true }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ authenticated: false, error: "Invalid password" }), { status: 401, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
    }
  }

  if (cleanPath === "/api/manifesto/examples") {
    const providedPass = (request.headers.get("x-manifesto-password") || url.searchParams.get("password") || "").trim();
    const validPassword = env.MANIFESTO_PASSWORD || "Peaceful-Loans-Manifesto";
    if (providedPass.toLowerCase() !== validPassword.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Unauthorized. Manifesto password required." }), { status: 401, headers });
    }

    const kv = env.QUESTIONS_KV;
    const storageKey = "manifesto:examples";

    async function loadExamples(): Promise<any[]> {
      try {
        if (kv) {
          const raw = await kv.get(storageKey);
          if (raw) return JSON.parse(raw);
        }
        const localRaw = localDB.get(storageKey);
        if (localRaw) return JSON.parse(localRaw);
      } catch {}
      return [];
    }

    async function saveExamples(list: any[]): Promise<void> {
      const serialized = JSON.stringify(list);
      if (kv) {
        await kv.put(storageKey, serialized);
      }
      localDB.set(storageKey, serialized);
    }

    if (request.method === "GET") {
      const examples = await loadExamples();
      return new Response(JSON.stringify({ examples }), { status: 200, headers });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json() as any;
        const action = body.action || "add";
        let examples = await loadExamples();

        if (action === "delete" && body.id) {
          examples = examples.filter((item: any) => item.id !== body.id);
          await saveExamples(examples);
          return new Response(JSON.stringify({ success: true, examples }), { status: 200, headers });
        }

        if (action === "edit" && body.id) {
          examples = examples.map((item: any) => {
            if (item.id !== body.id) return item;
            return {
              ...item,
              principleId: Number(body.principleId || item.principleId),
              spottedIn: String(body.spottedIn ?? item.spottedIn).trim(),
              contributedBy: String(body.contributedBy ?? item.contributedBy).trim(),
              breakoutGroup: String(body.breakoutGroup ?? item.breakoutGroup ?? "").trim(),
              story: String(body.story ?? item.story).trim(),
              updatedAt: new Date().toISOString(),
            };
          });
          await saveExamples(examples);
          return new Response(JSON.stringify({ success: true, examples }), { status: 200, headers });
        }

        const principleId = Number(body.principleId);
        const spottedIn = String(body.spottedIn || "").trim();
        const contributedBy = String(body.contributedBy || "").trim();
        const breakoutGroup = String(body.breakoutGroup || "").trim();
        const story = String(body.story || "").trim();

        if (!principleId || principleId < 1 || principleId > 9 || !spottedIn || !contributedBy || !story) {
          return new Response(
            JSON.stringify({ error: "Please provide principle, colleague name, your name, and the example story." }),
            { status: 400, headers }
          );
        }

        const newEntry = {
          id: "ex_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          principleId,
          spottedIn,
          contributedBy,
          breakoutGroup,
          story,
          createdAt: new Date().toISOString(),
        };

        examples.unshift(newEntry);
        await saveExamples(examples);

        return new Response(JSON.stringify({ success: true, example: newEntry, examples }), { status: 200, headers });
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

    // Protect post thumbnails behind the dashboard password (§2b)
    if (cleanPath.startsWith("/thumbs/")) {
      const user = await verifyTgToken(request);
      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }
      const assetRes = await env.ASSETS.fetch(request);
      const thumbHeaders = new Headers(assetRes.headers);
      thumbHeaders.set("Cache-Control", "private, max-age=86400");
      thumbHeaders.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(assetRes.body, { status: assetRes.status, headers: thumbHeaders });
    }

    // Intercept Agent Discovery & Protocol Endpoints
    if (cleanPath === "/.well-known/api-catalog") {
      try {
        const assetRes = await env.ASSETS.fetch(new Request(new URL("/.well-known/api-catalog", request.url).toString(), { headers: { Accept: "*/*" } }));
        if (assetRes.ok) {
          const text = await assetRes.text();
          return new Response(text, {
            status: 200,
            headers: {
              "Content-Type": "application/linkset+json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      } catch {}
      return new Response(
        JSON.stringify({
          linkset: [
            {
              anchor: "https://peaceful-loans.com/.well-known/mcp/server-card.json",
              "service-doc": [{ href: "https://peaceful-loans.com/llms.txt", type: "text/markdown" }],
              "service-desc": [{ href: "https://peaceful-loans.com/.well-known/mcp/server-card.json", type: "application/json" }]
            },
            {
              anchor: "https://peaceful-loans.com/.well-known/agent-skills/index.json",
              "service-desc": [{ href: "https://peaceful-loans.com/.well-known/agent-skills/index.json", type: "application/json" }]
            },
            {
              anchor: "https://peaceful-loans.com/.well-known/ai-catalog.json",
              "service-desc": [{ href: "https://peaceful-loans.com/.well-known/ai-catalog.json", type: "application/json" }]
            }
          ]
        }, null, 2),
        {
          status: 200,
          headers: {
            "Content-Type": "application/linkset+json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
          },
        }
      );
    }

    if (cleanPath.startsWith("/.well-known/")) {
      const assetRes = await env.ASSETS.fetch(new Request(new URL(cleanPath, request.url).toString(), { headers: { Accept: "*/*" } }));
      const resHeaders = new Headers(assetRes.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      if (cleanPath.endsWith(".json")) {
        resHeaders.set("Content-Type", "application/json; charset=utf-8");
      }
      return new Response(assetRes.body, {
        status: assetRes.status,
        headers: resHeaders,
      });
    }

    if (cleanPath === "/llms.txt" || cleanPath === "/llms-full.txt") {
      const assetRes = await env.ASSETS.fetch(new Request(new URL(cleanPath, request.url).toString(), { headers: { Accept: "*/*" } }));
      return new Response(assetRes.body, {
        status: assetRes.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (cleanPath === "/auth.md") {
      const assetRes = await env.ASSETS.fetch(new Request(new URL("/auth.md", request.url).toString(), { headers: { Accept: "*/*" } }));
      return new Response(assetRes.body, {
        status: assetRes.status,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const response = await aeoWorker.fetch(request, env, ctx);
    const resHeaders = new Headers(response.headers);

    // Enhance Link headers for AI Agent Discovery
    const existingLink = resHeaders.get("Link");
    const agentLinks = [
      '</.well-known/mcp/server-card.json>; rel="service-desc"',
      '</.well-known/agent-skills/index.json>; rel="describedby"',
      '</.well-known/api-catalog>; rel="api-catalog"',
      '</.well-known/ai-catalog.json>; rel="ai-catalog"',
    ];
    resHeaders.set("Link", existingLink ? `${existingLink}, ${agentLinks.join(", ")}` : agentLinks.join(", "));

    if (cleanPath === "/manifesto" || cleanPath === "/manifesto.html") {
      resHeaders.set("X-Robots-Tag", "noindex, nofollow");
      resHeaders.set("Cache-Control", "no-cache, must-revalidate");
    }

    if (cleanPath === "/linkedin-analytics" || cleanPath === "/linkedin-analytics.html") {
      resHeaders.set("X-Robots-Tag", "noindex, nofollow");
      resHeaders.set("X-Frame-Options", "DENY");
      resHeaders.set("X-Content-Type-Options", "nosniff");
      resHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    }

    return new Response(response.body, { status: response.status, headers: resHeaders });
  },

  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(sendDailyCsvEmail(env));
  }
};
