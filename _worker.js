// node_modules/@dualmark/core/dist/index.js
function parseAcceptHeader(header) {
  if (!header) return [];
  return header.split(",").map((range) => {
    const [mediaType, ...params] = range.trim().split(";");
    const [type = "*", subtype = "*"] = (mediaType ?? "").trim().split("/");
    let quality = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key?.trim() === "q") {
        quality = Math.min(1, Math.max(0, parseFloat(value ?? "0") || 0));
      }
    }
    return {
      type: (type ?? "*").toLowerCase(),
      subtype: (subtype ?? "*").toLowerCase(),
      quality
    };
  }).sort((a, b) => {
    if (b.quality !== a.quality) return b.quality - a.quality;
    const specA = (a.type === "*" ? 0 : 1) + (a.subtype === "*" ? 0 : 1);
    const specB = (b.type === "*" ? 0 : 1) + (b.subtype === "*" ? 0 : 1);
    return specB - specA;
  });
}
function mediaTypeMatches(pref, type, subtype) {
  if (pref.quality === 0) return false;
  if (pref.type !== "*" && pref.type !== type) return false;
  if (pref.subtype !== "*" && pref.subtype !== subtype) return false;
  return true;
}
var FORMAT_REGISTRY = /* @__PURE__ */ new Map([
  [
    "html",
    [
      ["text", "html"],
      ["application", "xhtml+xml"]
    ]
  ],
  ["markdown", [["text", "markdown"]]]
]);
var DEFAULT_AVAILABLE = ["html", "markdown"];
function negotiateFormat(accept, available) {
  const formats = available ?? DEFAULT_AVAILABLE;
  if (formats.length === 0) return null;
  const prefs = parseAcceptHeader(accept);
  if (prefs.length === 0) return formats[0] ?? null;
  const formatQ = /* @__PURE__ */ new Map();
  for (const fmt of formats) formatQ.set(fmt, -1);
  for (const pref of prefs) {
    for (const fmt of formats) {
      if ((formatQ.get(fmt) ?? -1) >= 0) continue;
      const mediaTypes = FORMAT_REGISTRY.get(fmt);
      if (!mediaTypes) continue;
      for (const [type, subtype] of mediaTypes) {
        if (mediaTypeMatches(pref, type, subtype)) {
          formatQ.set(fmt, pref.quality);
          break;
        }
      }
    }
  }
  for (const fmt of formats) {
    if ((formatQ.get(fmt) ?? -1) >= 0) continue;
    const mediaTypes = FORMAT_REGISTRY.get(fmt);
    if (!mediaTypes) continue;
    const primaryType = mediaTypes[0]?.[0];
    for (const pref of prefs) {
      if (pref.type === "*" || primaryType !== void 0 && pref.type === primaryType && pref.subtype === "*") {
        formatQ.set(fmt, pref.quality);
        break;
      }
    }
  }
  let best = null;
  formats.forEach((fmt, idx) => {
    const q = formatQ.get(fmt) ?? -1;
    if (q <= 0) return;
    if (best === null || q > best.q || q === best.q && idx < best.idx) {
      best = { fmt, q, idx };
    }
  });
  return best === null ? null : best.fmt;
}
var defaultEstimator = (text) => text.split(/\s+/).filter(Boolean).length;
var currentEstimator = defaultEstimator;
function estimateTokens(text) {
  return currentEstimator(text);
}
function toMarkdownPath(pathname) {
  if (pathname.endsWith(".md")) return pathname;
  const trimmed = pathname.replace(/\/+$/, "");
  if (trimmed === "") return "/index.md";
  return trimmed + ".md";
}
var AI_BOTS = [
  {
    name: "GPTBot",
    uaPattern: "GPTBot",
    vendor: "OpenAI",
    purpose: "training",
    docsUrl: "https://platform.openai.com/docs/gptbot"
  },
  {
    name: "ChatGPT-User",
    uaPattern: "ChatGPT-User",
    vendor: "OpenAI",
    purpose: "user-action",
    docsUrl: "https://platform.openai.com/docs/bots"
  },
  {
    name: "OAI-SearchBot",
    uaPattern: "OAI-SearchBot",
    vendor: "OpenAI",
    purpose: "search",
    docsUrl: "https://platform.openai.com/docs/bots"
  },
  {
    name: "ClaudeBot",
    uaPattern: "ClaudeBot",
    vendor: "Anthropic",
    purpose: "training",
    docsUrl: "https://support.anthropic.com/en/articles/8896518"
  },
  {
    name: "Anthropic-ai",
    uaPattern: "Anthropic-ai",
    vendor: "Anthropic",
    purpose: "training"
  },
  {
    name: "Claude-Web",
    uaPattern: "Claude-Web",
    vendor: "Anthropic",
    purpose: "user-action"
  },
  {
    name: "Claude-SearchBot",
    uaPattern: "Claude-SearchBot",
    vendor: "Anthropic",
    purpose: "search",
    docsUrl: "https://support.anthropic.com/en/articles/8896518"
  },
  {
    name: "Claude-User",
    uaPattern: "Claude-User",
    vendor: "Anthropic",
    purpose: "user-action",
    docsUrl: "https://support.anthropic.com/en/articles/8896518"
  },
  {
    name: "PerplexityBot",
    uaPattern: "PerplexityBot",
    vendor: "Perplexity",
    purpose: "search",
    docsUrl: "https://docs.perplexity.ai/guides/bots"
  },
  {
    name: "Perplexity-User",
    uaPattern: "Perplexity-User",
    vendor: "Perplexity",
    purpose: "user-action",
    docsUrl: "https://docs.perplexity.ai/guides/bots"
  },
  {
    name: "Google-Extended",
    uaPattern: "Google-Extended",
    vendor: "Google",
    purpose: "training",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/google-extended"
  },
  {
    name: "Applebot-Extended",
    uaPattern: "Applebot-Extended",
    vendor: "Apple",
    purpose: "training",
    docsUrl: "https://support.apple.com/en-us/119829"
  },
  {
    name: "cohere-ai",
    uaPattern: "cohere-ai",
    vendor: "Cohere",
    purpose: "training"
  },
  {
    name: "CCBot",
    uaPattern: "CCBot",
    vendor: "Common Crawl",
    purpose: "training",
    docsUrl: "https://commoncrawl.org/ccbot"
  },
  {
    name: "Bytespider",
    uaPattern: "Bytespider",
    vendor: "ByteDance",
    purpose: "training"
  },
  {
    name: "DeepSeekBot",
    uaPattern: "DeepSeekBot",
    vendor: "DeepSeek",
    purpose: "training"
  },
  {
    name: "Amazonbot",
    uaPattern: "Amazonbot",
    vendor: "Amazon",
    purpose: "training",
    docsUrl: "https://developer.amazon.com/amazonbot"
  },
  {
    name: "YouBot",
    uaPattern: "YouBot",
    vendor: "You.com",
    purpose: "search"
  },
  {
    name: "Diffbot",
    uaPattern: "Diffbot",
    vendor: "Diffbot",
    purpose: "training"
  },
  {
    name: "ImagesiftBot",
    uaPattern: "ImagesiftBot",
    vendor: "ImageSift",
    purpose: "training"
  },
  {
    name: "Omgilibot",
    uaPattern: "Omgilibot",
    vendor: "Webz.io",
    purpose: "training"
  },
  {
    name: "DuckAssistBot",
    uaPattern: "DuckAssistBot",
    vendor: "DuckDuckGo",
    purpose: "search"
  },
  {
    name: "Meta-ExternalAgent",
    uaPattern: "meta-externalagent",
    vendor: "Meta",
    purpose: "training"
  },
  {
    name: "Meta-ExternalFetcher",
    uaPattern: "meta-externalfetcher",
    vendor: "Meta",
    purpose: "user-action"
  }
];
function matches(ua, pattern) {
  if (typeof pattern === "string") {
    return ua.toLowerCase().includes(pattern.toLowerCase());
  }
  return pattern.test(ua);
}
function detectAIBot(userAgent) {
  if (!userAgent) {
    return { isBot: false, name: null, vendor: null, purpose: null };
  }
  for (const entry of AI_BOTS) {
    if (matches(userAgent, entry.uaPattern)) {
      return {
        isBot: true,
        name: entry.name,
        vendor: entry.vendor,
        purpose: entry.purpose
      };
    }
  }
  return { isBot: false, name: null, vendor: null, purpose: null };
}

// node_modules/@dualmark/cloudflare/dist/index.js
var DEFAULT_SKIP_PREFIXES = ["/admin", "/api/", "/_"];
var DEFAULT_ASSET_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".xml",
  ".json",
  ".txt",
  ".pdf"
];
var DEFAULT_CACHE_CONTROL = "public, max-age=3600";
function shouldSkip(pathname, prefixes, extensions) {
  if (extensions.some((ext) => pathname.endsWith(ext))) return true;
  return prefixes.some((p) => pathname.startsWith(p));
}
function normalizePath(pathname) {
  return pathname.replace(/\/$/, "") || "/";
}
function buildMarkdownHeaders(body, cacheControl, redirectFrom, redirectTo) {
  const tokens = estimateTokens(body);
  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
    "X-Markdown-Tokens": String(tokens),
    "X-AEO-Version": "1.0",
    "Cache-Control": cacheControl,
    Vary: "Accept"
  });
  if (redirectFrom) headers.set("X-Redirect-From", redirectFrom);
  if (redirectTo) headers.set("X-Redirect-To", redirectTo);
  return headers;
}
function trackAnalytics(env, bindingName, info, request) {
  if (!bindingName) return;
  const ds = env[bindingName];
  if (!ds || typeof ds.writeDataPoint !== "function") return;
  const indexKey = info.botName ?? "accept:text/markdown";
  const ua = (request.headers.get("user-agent") ?? "unknown").slice(0, 256);
  const country = request.headers.get("cf-ipcountry") ?? "unknown";
  ds.writeDataPoint({
    indexes: [indexKey],
    blobs: [indexKey, info.pathname, country, info.cacheStatus, ua],
    doubles: [info.tokens, 1]
  });
}
function createAEOWorker(options) {
  const skipPrefixes = options.skip?.prefixes ?? DEFAULT_SKIP_PREFIXES;
  const skipExtensions = options.skip?.extensions ?? DEFAULT_ASSET_EXTENSIONS;
  const internalRedirects = options.redirects?.internal ?? {};
  const externalRedirects = options.redirects?.external ?? {};
  const trailingSlash = options.trailingSlash ?? "never";
  const cacheControl = options.headers?.cacheControl ?? DEFAULT_CACHE_CONTROL;
  const analyticsBinding = options.analytics?.binding;
  const enableLinkHeader = options.enableLinkHeader !== false;
  const onAIRequest = options.hooks?.onAIRequest;
  const onMiss = options.hooks?.onMiss;
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const pathname = url.pathname;
      if (trailingSlash === "never" && pathname !== "/" && pathname.endsWith("/") && !shouldSkip(pathname, skipPrefixes, skipExtensions)) {
        const clean = pathname.replace(/\/+$/, "");
        const target = new URL(clean + url.search, url.origin);
        return new Response(null, {
          status: 301,
          headers: { Location: target.href }
        });
      }
      if (trailingSlash === "always" && pathname !== "/" && !pathname.endsWith("/") && !pathname.endsWith(".md") && !shouldSkip(pathname, skipPrefixes, skipExtensions)) {
        const target = new URL(pathname + "/" + url.search, url.origin);
        return new Response(null, { status: 301, headers: { Location: target.href } });
      }
      if (pathname.endsWith(".md") && !shouldSkip(pathname, skipPrefixes, skipExtensions)) {
        let assetResponse = null;
        try {
          assetResponse = await env.ASSETS.fetch(new URL(pathname, url.origin));
        } catch {
          assetResponse = null;
        }
        if (assetResponse && assetResponse.ok) {
          const body = await assetResponse.text();
          return new Response(body, {
            status: 200,
            headers: buildMarkdownHeaders(body, cacheControl)
          });
        }
        return assetResponse ?? new Response("Not Found", { status: 404 });
      }
      if (!pathname.endsWith(".md") && !shouldSkip(pathname, skipPrefixes, skipExtensions)) {
        const ua = request.headers.get("user-agent") ?? "";
        const accept = request.headers.get("accept") ?? "";
        const bot = detectAIBot(ua);
        const fmt = negotiateFormat(accept);
        if (fmt === null && accept) {
          return new Response(
            "Not Acceptable\n\nSupported types: text/html, text/markdown\n",
            {
              status: 406,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                Vary: "Accept"
              }
            }
          );
        }
        const serveMarkdown = bot.isBot || fmt === "markdown";
        if (serveMarkdown) {
          const mdPath = toMarkdownPath(pathname);
          const assetUrl = new URL(mdPath, url.origin);
          let assetResponse = null;
          try {
            assetResponse = await env.ASSETS.fetch(assetUrl);
          } catch {
            assetResponse = null;
          }
          if (assetResponse && assetResponse.ok) {
            const body = await assetResponse.text();
            const tokens = estimateTokens(body);
            const info = {
              url,
              botName: bot.name,
              botVendor: bot.vendor,
              acceptHeader: accept,
              pathname,
              cacheStatus: "hit",
              tokens
            };
            trackAnalytics(env, analyticsBinding, info, request);
            if (onAIRequest) ctx.waitUntil(Promise.resolve(onAIRequest(info)));
            return new Response(body, {
              status: 200,
              headers: buildMarkdownHeaders(body, cacheControl)
            });
          }
          const cleanPath = normalizePath(pathname);
          const internalTarget = internalRedirects[cleanPath];
          if (internalTarget) {
            const targetMd = toMarkdownPath(internalTarget);
            try {
              const targetResp = await env.ASSETS.fetch(new URL(targetMd, url.origin));
              if (targetResp.ok) {
                const body = await targetResp.text();
                const tokens = estimateTokens(body);
                const info = {
                  url,
                  botName: bot.name,
                  botVendor: bot.vendor,
                  acceptHeader: accept,
                  pathname,
                  cacheStatus: "hit",
                  tokens
                };
                trackAnalytics(env, analyticsBinding, info, request);
                if (onAIRequest) ctx.waitUntil(Promise.resolve(onAIRequest(info)));
                return new Response(body, {
                  status: 200,
                  headers: buildMarkdownHeaders(body, cacheControl, cleanPath, internalTarget)
                });
              }
            } catch {
            }
          }
          const externalTarget = externalRedirects[cleanPath];
          if (externalTarget) {
            const body = `# Redirect

This page has moved to an external location.

- **Redirect**: [${externalTarget}](${externalTarget})
`;
            const tokens = estimateTokens(body);
            const info = {
              url,
              botName: bot.name,
              botVendor: bot.vendor,
              acceptHeader: accept,
              pathname,
              cacheStatus: "hit",
              tokens
            };
            trackAnalytics(env, analyticsBinding, info, request);
            if (onAIRequest) ctx.waitUntil(Promise.resolve(onAIRequest(info)));
            return new Response(body, {
              status: 200,
              headers: buildMarkdownHeaders(body, cacheControl, cleanPath, externalTarget)
            });
          }
          const missInfo = {
            url,
            botName: bot.name,
            pathname,
            acceptHeader: accept
          };
          const missAnalytics = {
            botName: bot.name,
            botVendor: bot.vendor,
            pathname,
            cacheStatus: "miss",
            tokens: 0
          };
          trackAnalytics(env, analyticsBinding, missAnalytics, request);
          if (onMiss) ctx.waitUntil(Promise.resolve(onMiss(missInfo)));
        }
      }
      const upstreamResponse = await options.upstream.fetch(request, env, ctx);
      if (enableLinkHeader && !shouldSkip(pathname, skipPrefixes, skipExtensions) && !pathname.endsWith(".md") && upstreamResponse.headers.get("content-type")?.includes("text/html")) {
        const mdPath = toMarkdownPath(pathname);
        const newHeaders = new Headers(upstreamResponse.headers);
        const link = `<${mdPath}>; rel="alternate"; type="text/markdown"`;
        const existing = newHeaders.get("Link");
        newHeaders.set("Link", existing ? `${existing}, ${link}` : link);
        const vary = newHeaders.get("Vary");
        if (!vary) {
          newHeaders.set("Vary", "Accept");
        } else if (!vary.split(",").map((s) => s.trim().toLowerCase()).includes("accept")) {
          newHeaders.set("Vary", `${vary}, Accept`);
        }
        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: newHeaders
        });
      }
      return upstreamResponse;
    }
  };
}

// _worker.src.ts
var aeoWorker = createAEOWorker({
  upstream: {
    async fetch(request, env, _ctx) {
      return env.ASSETS.fetch(request);
    }
  },
  trailingSlash: "preserve",
  enableLinkHeader: true
});
var localDB = /* @__PURE__ */ new Map();
async function sendNotificationEmail(username, question, env) {
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
        from: "Peaceful Loans Q&A <onboarding@resend.dev>",
        to: "mangesh@peaceful-loan.com",
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
async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, "");
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (cleanPath === "/api/questions" && request.method === "POST") {
    try {
      const { username, question, email, tag } = await request.json();
      if (!username || !question) {
        return new Response(JSON.stringify({ error: "Username and question are required." }), { status: 400, headers });
      }
      const id = Math.random().toString(36).substring(2, 10);
      const data = {
        id,
        username,
        question,
        email: email || null,
        tag: tag || "General",
        answer: null,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const kv = env.QUESTIONS_KV;
      if (kv) {
        await kv.put(`question:${id}`, JSON.stringify(data));
      } else {
        localDB.set(`question:${id}`, JSON.stringify(data));
      }
      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(sendNotificationEmail(username, question, env));
      } else {
        sendNotificationEmail(username, question, env).catch(console.error);
      }
      return new Response(JSON.stringify({ id }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
  if (cleanPath === "/api/questions" && request.method === "GET") {
    const id = url.searchParams.get("id");
    const kv = env.QUESTIONS_KV;
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
      questions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return new Response(JSON.stringify(questions), { status: 200, headers });
    }
    let dataStr = kv ? await kv.get(`question:${id}`) : localDB.get(`question:${id}`);
    if (!dataStr) {
      return new Response(JSON.stringify({ error: "Question not found." }), { status: 404, headers });
    }
    const data = JSON.parse(dataStr);
    const publicData = {
      id: data.id,
      username: data.username,
      question: data.question,
      answer: data.answer,
      tag: data.tag || "General",
      status: data.status,
      created_at: data.created_at
    };
    return new Response(JSON.stringify(publicData), { status: 200, headers });
  }
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
    questions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return new Response(JSON.stringify(questions), { status: 200, headers });
  }
  if (cleanPath === "/api/admin/answer" && request.method === "POST") {
    try {
      const { id, answer, tag, secret } = await request.json();
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
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
}
var worker_src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, "");
    if (cleanPath === "/save-money-on-home-loan") {
      return Response.redirect(new URL("/", url.origin).toString(), 301);
    }
    if (cleanPath.startsWith("/api/")) {
      return handleApiRequest(request, env, ctx);
    }
    return aeoWorker.fetch(request, env, ctx);
  }
};
export {
  worker_src_default as default
};
