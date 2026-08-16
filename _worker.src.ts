import { createAEOWorker } from "@dualmark/cloudflare";

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
      const { username, question, email, tag, utm_params, referrer } = await request.json() as any;
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

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, "");
    if (cleanPath === "/save-money-on-home-loan") {
      return Response.redirect(new URL("/", url.origin).toString(), 301);
    }
    
    // Intercept our Q&A API routes
    if (cleanPath.startsWith("/api/")) {
      return handleApiRequest(request, env, ctx);
    }

    return aeoWorker.fetch(request, env, ctx);
  }
};
