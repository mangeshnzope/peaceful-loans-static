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

// creator-chart/data/creator_chart_dashboard_data.json
var creator_chart_dashboard_data_default = {
  meta: {
    built: "26 Sep 2026",
    data_from: "2026-01-01",
    data_to: "2026-09-25",
    tg_definition: [
      "Manager",
      "Director",
      "VP",
      "Owner",
      "CXO",
      "Partner"
    ],
    creator_chart_era_start: "2026-08-19",
    creator_onboarded: "2026-08-01",
    notes: "TG impressions = impressions from viewers whose LinkedIn seniority is in tg_definition. TG share = % of all views from TG. Every grain comes from its own LinkedIn export. No total impressions are included by design."
  },
  daily: [
    {
      date: "2026-01-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-02",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-01-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-01-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-17",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-20",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-21",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-23",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-24",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-25",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-26",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-01-27",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-28",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-01-29",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-30",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-01-31",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-02-02",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-02-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-02-17",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-02-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-20",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-21",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-02-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-23",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-24",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-02-25",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-02-26",
      tg_impressions: 288,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 6,
      new_followers: 0,
      posts_published: 1
    },
    {
      date: "2026-02-27",
      tg_impressions: 40,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-02-28",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-02",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-03-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-17",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-20",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-21",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-03-23",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-24",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-25",
      tg_impressions: 29,
      tg_share_pct: 42.9,
      tg_may_be_higher: true,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-26",
      tg_impressions: 238,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 9,
      new_followers: 3,
      posts_published: 1
    },
    {
      date: "2026-03-27",
      tg_impressions: 37,
      tg_share_pct: 41,
      tg_may_be_higher: true,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-03-28",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-29",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-30",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-03-31",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-02",
      tg_impressions: 104,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 0,
      posts_published: 1
    },
    {
      date: "2026-04-03",
      tg_impressions: 58,
      tg_share_pct: 53,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-04-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-04-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-04-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-04-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-14",
      tg_impressions: 1705,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 51,
      new_followers: 9,
      posts_published: 1
    },
    {
      date: "2026-04-15",
      tg_impressions: 331,
      tg_share_pct: 40,
      tg_may_be_higher: false,
      engagements: 12,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-16",
      tg_impressions: 80,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-17",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-04-20",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-04-21",
      tg_impressions: 390,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 36,
      new_followers: 5,
      posts_published: 1
    },
    {
      date: "2026-04-22",
      tg_impressions: 59,
      tg_share_pct: 31,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-04-23",
      tg_impressions: 277,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 7,
      new_followers: 4,
      posts_published: 1
    },
    {
      date: "2026-04-24",
      tg_impressions: 398,
      tg_share_pct: 48,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 3,
      posts_published: 1
    },
    {
      date: "2026-04-25",
      tg_impressions: 531,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 14,
      new_followers: 0,
      posts_published: 1
    },
    {
      date: "2026-04-26",
      tg_impressions: 124,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-04-27",
      tg_impressions: 1177,
      tg_share_pct: 51,
      tg_may_be_higher: false,
      engagements: 48,
      new_followers: 4,
      posts_published: 2
    },
    {
      date: "2026-04-28",
      tg_impressions: 246,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 8,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-04-29",
      tg_impressions: 254,
      tg_share_pct: 50,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 6,
      posts_published: 1
    },
    {
      date: "2026-04-30",
      tg_impressions: 538,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 25,
      new_followers: 5,
      posts_published: 1
    },
    {
      date: "2026-05-01",
      tg_impressions: 219,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-02",
      tg_impressions: 93,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-05-03",
      tg_impressions: 76,
      tg_share_pct: 37,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-05-04",
      tg_impressions: 270,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 16,
      new_followers: 14,
      posts_published: 1
    },
    {
      date: "2026-05-05",
      tg_impressions: 900,
      tg_share_pct: 51,
      tg_may_be_higher: false,
      engagements: 18,
      new_followers: 8,
      posts_published: 2
    },
    {
      date: "2026-05-06",
      tg_impressions: 340,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 11,
      new_followers: 7,
      posts_published: 1
    },
    {
      date: "2026-05-07",
      tg_impressions: 255,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 6,
      new_followers: 6,
      posts_published: 1
    },
    {
      date: "2026-05-08",
      tg_impressions: 819,
      tg_share_pct: 33,
      tg_may_be_higher: true,
      engagements: 25,
      new_followers: 4,
      posts_published: 2
    },
    {
      date: "2026-05-09",
      tg_impressions: 145,
      tg_share_pct: 35,
      tg_may_be_higher: true,
      engagements: 21,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-05-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-11",
      tg_impressions: 1076,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 27,
      new_followers: 22,
      posts_published: 1
    },
    {
      date: "2026-05-12",
      tg_impressions: 122,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 5,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-13",
      tg_impressions: 118,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 5,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-05-14",
      tg_impressions: 114,
      tg_share_pct: 46,
      tg_may_be_higher: true,
      engagements: 3,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-05-15",
      tg_impressions: 76,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-05-16",
      tg_impressions: 86,
      tg_share_pct: 43,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-05-17",
      tg_impressions: 85,
      tg_share_pct: 39,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-05-18",
      tg_impressions: 102,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 5,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-05-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-05-20",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-21",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-05-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-05-23",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-05-24",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-05-25",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 9,
      posts_published: 0
    },
    {
      date: "2026-05-26",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-27",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-05-28",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-05-29",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-05-30",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-05-31",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-06-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 6,
      posts_published: 0
    },
    {
      date: "2026-06-02",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-06-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-06-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-11",
      tg_impressions: 548,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 36,
      new_followers: 4,
      posts_published: 1
    },
    {
      date: "2026-06-12",
      tg_impressions: 91,
      tg_share_pct: 32,
      tg_may_be_higher: true,
      engagements: 8,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-06-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-06-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-06-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-06-17",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 9,
      posts_published: 0
    },
    {
      date: "2026-06-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-06-19",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-06-20",
      tg_impressions: 430,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 15,
      new_followers: 2,
      posts_published: 1
    },
    {
      date: "2026-06-21",
      tg_impressions: 324,
      tg_share_pct: 50,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-06-22",
      tg_impressions: 109,
      tg_share_pct: 43,
      tg_may_be_higher: true,
      engagements: 3,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-06-23",
      tg_impressions: 119,
      tg_share_pct: 40,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 4,
      posts_published: 1
    },
    {
      date: "2026-06-24",
      tg_impressions: 59,
      tg_share_pct: 39,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-06-25",
      tg_impressions: 510,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 57,
      new_followers: 18,
      posts_published: 1
    },
    {
      date: "2026-06-26",
      tg_impressions: 78,
      tg_share_pct: 42,
      tg_may_be_higher: true,
      engagements: 3,
      new_followers: 8,
      posts_published: 0
    },
    {
      date: "2026-06-27",
      tg_impressions: 191,
      tg_share_pct: 54,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 5,
      posts_published: 1
    },
    {
      date: "2026-06-28",
      tg_impressions: 72,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 5,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-06-29",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-06-30",
      tg_impressions: 636,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 19,
      new_followers: 14,
      posts_published: 1
    },
    {
      date: "2026-07-01",
      tg_impressions: 89,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 7,
      posts_published: 0
    },
    {
      date: "2026-07-02",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 10,
      posts_published: 0
    },
    {
      date: "2026-07-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-07-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-07-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-07-06",
      tg_impressions: 290,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 15,
      new_followers: 7,
      posts_published: 1
    },
    {
      date: "2026-07-07",
      tg_impressions: 124,
      tg_share_pct: 35,
      tg_may_be_higher: false,
      engagements: 6,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-07-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-07-09",
      tg_impressions: 74,
      tg_share_pct: 36,
      tg_may_be_higher: true,
      engagements: 11,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-07-10",
      tg_impressions: 42,
      tg_share_pct: 39,
      tg_may_be_higher: true,
      engagements: 6,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-07-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-07-12",
      tg_impressions: 541,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 33,
      new_followers: 15,
      posts_published: 1
    },
    {
      date: "2026-07-13",
      tg_impressions: 142,
      tg_share_pct: 36,
      tg_may_be_higher: true,
      engagements: 8,
      new_followers: 7,
      posts_published: 0
    },
    {
      date: "2026-07-14",
      tg_impressions: 468,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 12,
      new_followers: 11,
      posts_published: 2
    },
    {
      date: "2026-07-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-07-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-07-17",
      tg_impressions: 121,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 6,
      posts_published: 1
    },
    {
      date: "2026-07-18",
      tg_impressions: 308,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 17,
      new_followers: 10,
      posts_published: 1
    },
    {
      date: "2026-07-19",
      tg_impressions: 64,
      tg_share_pct: 33,
      tg_may_be_higher: true,
      engagements: 4,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-07-20",
      tg_impressions: 636,
      tg_share_pct: 37,
      tg_may_be_higher: true,
      engagements: 27,
      new_followers: 9,
      posts_published: 1
    },
    {
      date: "2026-07-21",
      tg_impressions: 122,
      tg_share_pct: 32,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 8,
      posts_published: 0
    },
    {
      date: "2026-07-22",
      tg_impressions: 1290,
      tg_share_pct: 50,
      tg_may_be_higher: false,
      engagements: 12,
      new_followers: 1,
      posts_published: 2
    },
    {
      date: "2026-07-23",
      tg_impressions: 121,
      tg_share_pct: 38,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-07-24",
      tg_impressions: 2451,
      tg_share_pct: 48,
      tg_may_be_higher: false,
      engagements: 23,
      new_followers: 13,
      posts_published: 1
    },
    {
      date: "2026-07-25",
      tg_impressions: 889,
      tg_share_pct: 50,
      tg_may_be_higher: false,
      engagements: 7,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-07-26",
      tg_impressions: 546,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-07-27",
      tg_impressions: 585,
      tg_share_pct: 52,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-07-28",
      tg_impressions: 253,
      tg_share_pct: 45,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-07-29",
      tg_impressions: 230,
      tg_share_pct: 50,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-07-30",
      tg_impressions: 240,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-07-31",
      tg_impressions: 94,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 8,
      posts_published: 0
    },
    {
      date: "2026-08-01",
      tg_impressions: 72,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-02",
      tg_impressions: 60,
      tg_share_pct: 38,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-08-03",
      tg_impressions: 96,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 3,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-08-04",
      tg_impressions: 52,
      tg_share_pct: 29,
      tg_may_be_higher: true,
      engagements: 3,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-08-05",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-08-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-08-07",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-09",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-08-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 8,
      posts_published: 0
    },
    {
      date: "2026-08-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-08-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 7,
      posts_published: 0
    },
    {
      date: "2026-08-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-08-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 0,
      posts_published: 0
    },
    {
      date: "2026-08-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-08-17",
      tg_impressions: 191,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 15,
      new_followers: 4,
      posts_published: 1
    },
    {
      date: "2026-08-18",
      tg_impressions: 77,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 4,
      posts_published: 0
    },
    {
      date: "2026-08-19",
      tg_impressions: 314,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 17,
      new_followers: 3,
      posts_published: 1
    },
    {
      date: "2026-08-20",
      tg_impressions: 66,
      tg_share_pct: 32,
      tg_may_be_higher: true,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-21",
      tg_impressions: 181,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 13,
      new_followers: 1,
      posts_published: 1
    },
    {
      date: "2026-08-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-08-23",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-24",
      tg_impressions: 181,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 7,
      new_followers: 5,
      posts_published: 1
    },
    {
      date: "2026-08-25",
      tg_impressions: 88,
      tg_share_pct: 48,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-08-26",
      tg_impressions: 220,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 14,
      new_followers: 2,
      posts_published: 1
    },
    {
      date: "2026-08-27",
      tg_impressions: 173,
      tg_share_pct: 45,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-08-28",
      tg_impressions: 374,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 26,
      new_followers: 1,
      posts_published: 1
    },
    {
      date: "2026-08-29",
      tg_impressions: 102,
      tg_share_pct: 51,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-08-30",
      tg_impressions: 62,
      tg_share_pct: 37,
      tg_may_be_higher: false,
      engagements: 7,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-08-31",
      tg_impressions: 146,
      tg_share_pct: 40,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 2,
      posts_published: 1
    },
    {
      date: "2026-09-01",
      tg_impressions: 106,
      tg_share_pct: 30,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-09-02",
      tg_impressions: 158,
      tg_share_pct: 40,
      tg_may_be_higher: false,
      engagements: 20,
      new_followers: 2,
      posts_published: 1
    },
    {
      date: "2026-09-03",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-09-04",
      tg_impressions: 242,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 1,
      posts_published: 1
    },
    {
      date: "2026-09-05",
      tg_impressions: 68,
      tg_share_pct: 37,
      tg_may_be_higher: true,
      engagements: 7,
      new_followers: 6,
      posts_published: 0
    },
    {
      date: "2026-09-06",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 4,
      new_followers: 6,
      posts_published: 0
    },
    {
      date: "2026-09-07",
      tg_impressions: 173,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 6,
      new_followers: 6,
      posts_published: 1
    },
    {
      date: "2026-09-08",
      tg_impressions: 47,
      tg_share_pct: 36,
      tg_may_be_higher: true,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-09-09",
      tg_impressions: 168,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 9,
      new_followers: 2,
      posts_published: 1
    },
    {
      date: "2026-09-10",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-09-11",
      tg_impressions: 256,
      tg_share_pct: 52,
      tg_may_be_higher: false,
      engagements: 16,
      new_followers: 3,
      posts_published: 1
    },
    {
      date: "2026-09-12",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-09-13",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 7,
      posts_published: 0
    },
    {
      date: "2026-09-14",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 1,
      posts_published: 0
    },
    {
      date: "2026-09-15",
      tg_impressions: 180,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 3,
      posts_published: 1
    },
    {
      date: "2026-09-16",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 2,
      posts_published: 0
    },
    {
      date: "2026-09-17",
      tg_impressions: 875,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 13,
      new_followers: 24,
      posts_published: 1
    },
    {
      date: "2026-09-18",
      tg_impressions: 5900,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 463,
      new_followers: 26,
      posts_published: 1
    },
    {
      date: "2026-09-19",
      tg_impressions: 1472,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 71,
      new_followers: 21,
      posts_published: 0
    },
    {
      date: "2026-09-20",
      tg_impressions: 777,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 36,
      new_followers: 11,
      posts_published: 0
    },
    {
      date: "2026-09-21",
      tg_impressions: 553,
      tg_share_pct: 38,
      tg_may_be_higher: false,
      engagements: 27,
      new_followers: 10,
      posts_published: 1
    },
    {
      date: "2026-09-22",
      tg_impressions: 327,
      tg_share_pct: 39,
      tg_may_be_higher: false,
      engagements: 20,
      new_followers: 3,
      posts_published: 0
    },
    {
      date: "2026-09-23",
      tg_impressions: 421,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 18,
      new_followers: 4,
      posts_published: 1
    },
    {
      date: "2026-09-24",
      tg_impressions: 191,
      tg_share_pct: 32,
      tg_may_be_higher: true,
      engagements: 16,
      new_followers: 5,
      posts_published: 0
    },
    {
      date: "2026-09-25",
      tg_impressions: 258,
      tg_share_pct: 45,
      tg_may_be_higher: false,
      engagements: 15,
      new_followers: 2,
      posts_published: 1
    }
  ],
  weekly: [
    {
      week_start: "2026-01-01",
      week_end: "2026-01-04",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 4,
      posts_published: 0
    },
    {
      week_start: "2026-01-05",
      week_end: "2026-01-11",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 11,
      posts_published: 0
    },
    {
      week_start: "2026-01-12",
      week_end: "2026-01-18",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 6,
      posts_published: 0
    },
    {
      week_start: "2026-01-19",
      week_end: "2026-01-25",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 5,
      posts_published: 0
    },
    {
      week_start: "2026-01-26",
      week_end: "2026-02-01",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 5,
      posts_published: 0
    },
    {
      week_start: "2026-02-02",
      week_end: "2026-02-08",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 2,
      posts_published: 0
    },
    {
      week_start: "2026-02-09",
      week_end: "2026-02-15",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 5,
      posts_published: 0
    },
    {
      week_start: "2026-02-16",
      week_end: "2026-02-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 11,
      posts_published: 0
    },
    {
      week_start: "2026-02-23",
      week_end: "2026-03-01",
      tg_impressions: 389,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 9,
      new_followers: 10,
      posts_published: 1
    },
    {
      week_start: "2026-03-02",
      week_end: "2026-03-08",
      tg_impressions: 88,
      tg_share_pct: 39,
      tg_may_be_higher: false,
      engagements: 1,
      new_followers: 6,
      posts_published: 0
    },
    {
      week_start: "2026-03-09",
      week_end: "2026-03-15",
      tg_impressions: 72,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 11,
      posts_published: 0
    },
    {
      week_start: "2026-03-16",
      week_end: "2026-03-22",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 0,
      new_followers: 8,
      posts_published: 0
    },
    {
      week_start: "2026-03-23",
      week_end: "2026-03-29",
      tg_impressions: 408,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 13,
      new_followers: 11,
      posts_published: 1
    },
    {
      week_start: "2026-03-30",
      week_end: "2026-04-05",
      tg_impressions: 312,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 9,
      new_followers: 6,
      posts_published: 1
    },
    {
      week_start: "2026-04-06",
      week_end: "2026-04-12",
      tg_impressions: 47,
      tg_share_pct: 29,
      tg_may_be_higher: true,
      engagements: 2,
      new_followers: 10,
      posts_published: 0
    },
    {
      week_start: "2026-04-13",
      week_end: "2026-04-19",
      tg_impressions: 2277,
      tg_share_pct: 45,
      tg_may_be_higher: false,
      engagements: 68,
      new_followers: 13,
      posts_published: 1
    },
    {
      week_start: "2026-04-20",
      week_end: "2026-04-26",
      tg_impressions: 1668,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 69,
      new_followers: 18,
      posts_published: 4
    },
    {
      week_start: "2026-04-27",
      week_end: "2026-05-03",
      tg_impressions: 2578,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 105,
      new_followers: 24,
      posts_published: 4
    },
    {
      week_start: "2026-05-04",
      week_end: "2026-05-10",
      tg_impressions: 2644,
      tg_share_pct: 38,
      tg_may_be_higher: false,
      engagements: 100,
      new_followers: 48,
      posts_published: 7
    },
    {
      week_start: "2026-05-11",
      week_end: "2026-05-17",
      tg_impressions: 1076,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 27,
      new_followers: 22,
      posts_published: 1
    },
    {
      week_start: "2026-05-18",
      week_end: "2026-05-24",
      tg_impressions: 273,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 15,
      new_followers: 13,
      posts_published: 0
    },
    {
      week_start: "2026-05-25",
      week_end: "2026-05-31",
      tg_impressions: 291,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 8,
      new_followers: 28,
      posts_published: 0
    },
    {
      week_start: "2026-06-01",
      week_end: "2026-06-07",
      tg_impressions: 103,
      tg_share_pct: 29,
      tg_may_be_higher: true,
      engagements: 2,
      new_followers: 12,
      posts_published: 0
    },
    {
      week_start: "2026-06-08",
      week_end: "2026-06-14",
      tg_impressions: 779,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 50,
      new_followers: 13,
      posts_published: 1
    },
    {
      week_start: "2026-06-15",
      week_end: "2026-06-21",
      tg_impressions: 891,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 30,
      new_followers: 31,
      posts_published: 1
    },
    {
      week_start: "2026-06-22",
      week_end: "2026-06-28",
      tg_impressions: 1171,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 86,
      new_followers: 44,
      posts_published: 3
    },
    {
      week_start: "2026-06-29",
      week_end: "2026-07-05",
      tg_impressions: 923,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 28,
      new_followers: 38,
      posts_published: 1
    },
    {
      week_start: "2026-07-06",
      week_end: "2026-07-12",
      tg_impressions: 1155,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 71,
      new_followers: 38,
      posts_published: 2
    },
    {
      week_start: "2026-07-13",
      week_end: "2026-07-19",
      tg_impressions: 1234,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 49,
      new_followers: 43,
      posts_published: 4
    },
    {
      week_start: "2026-07-20",
      week_end: "2026-07-26",
      tg_impressions: 6130,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 73,
      new_followers: 38,
      posts_published: 4
    },
    {
      week_start: "2026-07-27",
      week_end: "2026-08-02",
      tg_impressions: 1559,
      tg_share_pct: 49,
      tg_may_be_higher: false,
      engagements: 9,
      new_followers: 22,
      posts_published: 0
    },
    {
      week_start: "2026-08-03",
      week_end: "2026-08-09",
      tg_impressions: 387,
      tg_share_pct: 39,
      tg_may_be_higher: true,
      engagements: 7,
      new_followers: 13,
      posts_published: 0
    },
    {
      week_start: "2026-08-10",
      week_end: "2026-08-16",
      tg_impressions: 209,
      tg_share_pct: 34,
      tg_may_be_higher: true,
      engagements: 0,
      new_followers: 25,
      posts_published: 0
    },
    {
      week_start: "2026-08-17",
      week_end: "2026-08-23",
      tg_impressions: 924,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 54,
      new_followers: 16,
      posts_published: 3
    },
    {
      week_start: "2026-08-24",
      week_end: "2026-08-30",
      tg_impressions: 1222,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 66,
      new_followers: 19,
      posts_published: 3
    },
    {
      week_start: "2026-08-31",
      week_end: "2026-09-06",
      tg_impressions: 824,
      tg_share_pct: 38,
      tg_may_be_higher: false,
      engagements: 53,
      new_followers: 21,
      posts_published: 3
    },
    {
      week_start: "2026-09-07",
      week_end: "2026-09-13",
      tg_impressions: 764,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 35,
      new_followers: 26,
      posts_published: 3
    },
    {
      week_start: "2026-09-14",
      week_end: "2026-09-20",
      tg_impressions: 8983,
      tg_share_pct: 42,
      tg_may_be_higher: false,
      engagements: 595,
      new_followers: 88,
      posts_published: 3
    },
    {
      week_start: "2026-09-21",
      week_end: "2026-09-25",
      tg_impressions: 1754,
      tg_share_pct: 38,
      tg_may_be_higher: false,
      engagements: 98,
      new_followers: 24,
      posts_published: 3
    }
  ],
  monthly: [
    {
      month_start: "2026-01-01",
      month_end: "2026-01-31",
      tg_impressions: null,
      tg_share_pct: null,
      tg_may_be_higher: false,
      engagements: 2,
      new_followers: 29,
      posts_published: 0
    },
    {
      month_start: "2026-02-01",
      month_end: "2026-02-28",
      tg_impressions: 558,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 10,
      new_followers: 30,
      posts_published: 1
    },
    {
      month_start: "2026-03-01",
      month_end: "2026-03-31",
      tg_impressions: 734,
      tg_share_pct: 47,
      tg_may_be_higher: false,
      engagements: 19,
      new_followers: 37,
      posts_published: 1
    },
    {
      month_start: "2026-04-01",
      month_end: "2026-04-30",
      tg_impressions: 6156,
      tg_share_pct: 43,
      tg_may_be_higher: false,
      engagements: 236,
      new_followers: 62,
      posts_published: 10
    },
    {
      month_start: "2026-05-01",
      month_end: "2026-05-31",
      tg_impressions: 4514,
      tg_share_pct: 39,
      tg_may_be_higher: false,
      engagements: 164,
      new_followers: 119,
      posts_published: 8
    },
    {
      month_start: "2026-06-01",
      month_end: "2026-06-30",
      tg_impressions: 3528,
      tg_share_pct: 44,
      tg_may_be_higher: false,
      engagements: 189,
      new_followers: 116,
      posts_published: 6
    },
    {
      month_start: "2026-07-01",
      month_end: "2026-07-31",
      tg_impressions: 10167,
      tg_share_pct: 46,
      tg_may_be_higher: false,
      engagements: 207,
      new_followers: 160,
      posts_published: 10
    },
    {
      month_start: "2026-08-01",
      month_end: "2026-08-31",
      tg_impressions: 2906,
      tg_share_pct: 41,
      tg_may_be_higher: false,
      engagements: 139,
      new_followers: 78,
      posts_published: 7
    },
    {
      month_start: "2026-09-01",
      month_end: "2026-09-25",
      tg_impressions: 11818,
      tg_share_pct: 40,
      tg_may_be_higher: false,
      engagements: 771,
      new_followers: 157,
      posts_published: 11
    }
  ],
  posts: [
    {
      published: "2026-09-25",
      weekday: "Fri",
      time: "4:48 PM",
      title: "Your bank may just have lost a revenue",
      url: "https://www.linkedin.com/posts/mangeshzope_your-bank-may-just-have-lost-a-revenue-share-7509209819720032256-3mbB",
      type: "Bank & industry critique",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 199,
      tg_share_pct: 53,
      out_of_network_pct: 64,
      in_network_pct: 36,
      engagements: 11,
      comments: 2,
      reposts: 1,
      followers_gained: 1,
      engagement_rate_pct: 2.93
    },
    {
      published: "2026-09-23",
      weekday: "Wed",
      time: "11:33 AM",
      title: "Waiting for the right time to buy a home",
      url: "https://www.linkedin.com/posts/mangeshzope_waiting-for-the-right-time-to-buy-a-home-share-7508405750621310978-nuDC",
      type: "Home-loan explainer",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 211,
      tg_share_pct: 52,
      out_of_network_pct: 24,
      in_network_pct: 76,
      engagements: 16,
      comments: 5,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 3.94
    },
    {
      published: "2026-09-21",
      weekday: "Mon",
      time: "2:09 PM",
      title: "Should i take a home loan is the wrong",
      url: "https://www.linkedin.com/posts/mangeshzope_should-i-take-a-home-loan-is-the-wrong-share-7507720186268119040-lN6l",
      type: "Home-loan explainer",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 282,
      tg_share_pct: 49,
      out_of_network_pct: 61,
      in_network_pct: 39,
      engagements: 10,
      comments: 1,
      reposts: 2,
      followers_gained: 0,
      engagement_rate_pct: 1.74
    },
    {
      published: "2026-09-18",
      weekday: "Fri",
      time: "10:33 AM",
      title: "A 10000 crore listed company and peaceful loans",
      url: "https://www.linkedin.com/posts/mangeshzope_a-10000-crore-listed-company-and-peaceful-loans-share-7506575936201408512-zFxQ",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 7502,
      tg_share_pct: 47,
      out_of_network_pct: 66,
      in_network_pct: 34,
      engagements: 577,
      comments: 142,
      reposts: 4,
      followers_gained: 5,
      engagement_rate_pct: 3.62
    },
    {
      published: "2026-09-17",
      weekday: "Thu",
      time: "11:38 AM",
      title: "I have been using instahelp services across",
      url: "https://www.linkedin.com/posts/mangeshzope_i-have-been-using-instahelp-services-across-share-7506232694943473666-3DiR",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 2267,
      tg_share_pct: 32,
      out_of_network_pct: 86,
      in_network_pct: 14,
      engagements: 40,
      comments: 4,
      reposts: 0,
      followers_gained: 2,
      engagement_rate_pct: 0.56
    },
    {
      published: "2026-09-15",
      weekday: "Tue",
      time: "5:04 PM",
      title: "The bank manager convinces you to fix your",
      url: "https://www.linkedin.com/posts/mangeshzope_the-bank-manager-convinces-you-to-fix-your-share-7505589782421544960-AhLg",
      type: "Bank & industry critique",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 253,
      tg_share_pct: 47,
      out_of_network_pct: 54,
      in_network_pct: 46,
      engagements: 14,
      comments: 2,
      reposts: 1,
      followers_gained: 2,
      engagement_rate_pct: 2.6
    },
    {
      published: "2026-09-11",
      weekday: "Fri",
      time: "11:26 AM",
      title: "I saw an sbi ad recently aapka bachcha",
      url: "https://www.linkedin.com/posts/mangeshzope_i-saw-an-sbi-ad-recently-aapka-bachcha-ugcPost-7504055163360362496-EDO2",
      type: "Bank & industry critique",
      format: "Media (ugcPost)",
      creator_chart_era: true,
      tg_impressions_lifetime: 478,
      tg_share_pct: 52,
      out_of_network_pct: 31,
      in_network_pct: 69,
      engagements: 19,
      comments: 4,
      reposts: 1,
      followers_gained: 1,
      engagement_rate_pct: 2.07
    },
    {
      published: "2026-09-09",
      weekday: "Wed",
      time: "3:26 PM",
      title: "Your interest rate went up but your emi",
      url: "https://www.linkedin.com/posts/mangeshzope_your-interest-rate-went-up-but-your-emi-share-7503390922131562496-JObH",
      type: "Home-loan explainer",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 181,
      tg_share_pct: 45,
      out_of_network_pct: 47,
      in_network_pct: 53,
      engagements: 12,
      comments: 0,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 2.98
    },
    {
      published: "2026-09-07",
      weekday: "Mon",
      time: "11:32 AM",
      title: "Paying full in cash for your dream home isnt",
      url: "https://www.linkedin.com/posts/mangeshzope_paying-full-in-cash-for-your-dream-home-isnt-share-7502607226914639873-ndxG",
      type: "Home-loan explainer",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 169,
      tg_share_pct: 44,
      out_of_network_pct: 42,
      in_network_pct: 58,
      engagements: 9,
      comments: 0,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 2.35
    },
    {
      published: "2026-09-04",
      weekday: "Fri",
      time: "2:01 PM",
      title: "If a bank employee cant figure out his own",
      url: "https://www.linkedin.com/posts/mangeshzope_if-a-bank-employee-cant-figure-out-his-own-share-7501557451943743492-1SXu",
      type: "Bank & industry critique",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 280,
      tg_share_pct: 44,
      out_of_network_pct: 62,
      in_network_pct: 38,
      engagements: 16,
      comments: 2,
      reposts: 1,
      followers_gained: 1,
      engagement_rate_pct: 2.52
    },
    {
      published: "2026-09-02",
      weekday: "Wed",
      time: "11:53 AM",
      title: "One of our clients had been banking with",
      url: "https://www.linkedin.com/posts/mangeshzope_one-of-our-clients-had-been-banking-with-share-7500800657218744321-AucK",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 200,
      tg_share_pct: 40,
      out_of_network_pct: 47,
      in_network_pct: 53,
      engagements: 18,
      comments: 2,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 3.59
    },
    {
      published: "2026-08-31",
      weekday: "Mon",
      time: "1:01 PM",
      title: "Net worth doesnt buy financial judgment",
      url: "https://www.linkedin.com/posts/mangeshzope_net-worth-doesnt-buy-financial-judgment-share-7500092783240769536-tWkF",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 163,
      tg_share_pct: 43,
      out_of_network_pct: 43,
      in_network_pct: 57,
      engagements: 12,
      comments: 1,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 3.17
    },
    {
      published: "2026-08-28",
      weekday: "Fri",
      time: "12:13 PM",
      title: "Mint quoted me in their article on the rbis",
      url: "https://www.linkedin.com/posts/mangeshzope_mint-quoted-me-in-their-article-on-the-rbis-ugcPost-7498993755644076033-SoRP",
      type: "Bank & industry critique",
      format: "Media (ugcPost)",
      creator_chart_era: true,
      tg_impressions_lifetime: 491,
      tg_share_pct: 49,
      out_of_network_pct: null,
      in_network_pct: null,
      engagements: 34,
      comments: 6,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 3.39
    },
    {
      published: "2026-08-26",
      weekday: "Wed",
      time: "12:15 PM",
      title: "Financial freedom is a lie sold to people",
      url: "https://www.linkedin.com/posts/mangeshzope_financial-freedom-is-a-lie-sold-to-people-share-7498269296268324865-ZI2A",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 428,
      tg_share_pct: 50,
      out_of_network_pct: 24,
      in_network_pct: 76,
      engagements: 19,
      comments: 4,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 2.22
    },
    {
      published: "2026-08-24",
      weekday: "Mon",
      time: "11:38 AM",
      title: "A yes from a bank means nothing until the",
      url: "https://www.linkedin.com/posts/mangeshzope_a-yes-from-a-bank-means-nothing-until-the-share-7497535248835076096-GvMH",
      type: "Bank & industry critique",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 347,
      tg_share_pct: 43,
      out_of_network_pct: 57,
      in_network_pct: 43,
      engagements: 20,
      comments: 2,
      reposts: 1,
      followers_gained: 1,
      engagement_rate_pct: 2.48
    },
    {
      published: "2026-08-21",
      weekday: "Fri",
      time: "11:29 AM",
      title: "We were on a zoom call with one of our clients",
      url: "https://www.linkedin.com/posts/mangeshzope_we-were-on-a-zoom-call-with-one-of-our-clients-share-7496445774369669121-LRnO",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 231,
      tg_share_pct: 45,
      out_of_network_pct: 44,
      in_network_pct: 56,
      engagements: 18,
      comments: 0,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 3.51
    },
    {
      published: "2026-08-19",
      weekday: "Wed",
      time: "9:25 AM",
      title: "When i started peaceful loans i went to",
      url: "https://www.linkedin.com/posts/mangeshzope_when-i-started-peaceful-loans-i-went-to-share-7495072253953609731-g83Z",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: true,
      tg_impressions_lifetime: 423,
      tg_share_pct: 45,
      out_of_network_pct: 38,
      in_network_pct: 62,
      engagements: 18,
      comments: 1,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.92
    },
    {
      published: "2026-08-17",
      weekday: "Mon",
      time: "3:55 PM",
      title: "I was talking to one of our clients today",
      url: "https://www.linkedin.com/posts/mangeshzope_i-was-talking-to-one-of-our-clients-today-share-7495063360074477570-XVvU",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 288,
      tg_share_pct: 48,
      out_of_network_pct: 27,
      in_network_pct: 73,
      engagements: 22,
      comments: 0,
      reposts: 0,
      followers_gained: 1,
      engagement_rate_pct: 3.67
    },
    {
      published: "2026-07-24",
      weekday: "Fri",
      time: "7:56 AM",
      title: "Recently had a great conversation with an",
      url: "https://www.linkedin.com/posts/mangeshzope_recently-had-a-great-conversation-with-an-share-7486245321606619138-me99",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 5160,
      tg_share_pct: 50,
      out_of_network_pct: 76,
      in_network_pct: 24,
      engagements: 27,
      comments: 6,
      reposts: 0,
      followers_gained: 6,
      engagement_rate_pct: 0.26
    },
    {
      published: "2026-07-22",
      weekday: "Wed",
      time: "6:13 AM",
      title: "Smita is looking for her next challenge in",
      url: "https://www.linkedin.com/posts/mangeshzope_smita-is-looking-for-her-next-challenge-in-ugcPost-7485494610555781120-9WyG",
      type: "Hiring & team",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 1376,
      tg_share_pct: 51,
      out_of_network_pct: 8,
      in_network_pct: 92,
      engagements: 5,
      comments: 0,
      reposts: 0,
      followers_gained: 1,
      engagement_rate_pct: 0.19
    },
    {
      published: "2026-07-22",
      weekday: "Wed",
      time: "8:24 AM",
      title: "Love and greed both are blind despite knowledge",
      url: "https://www.linkedin.com/posts/mangeshzope_love-and-greed-both-are-blind-despite-knowledge-share-7485527693921431552-Uhs9",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 212,
      tg_share_pct: 47,
      out_of_network_pct: 29,
      in_network_pct: 71,
      engagements: 5,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.11
    },
    {
      published: "2026-07-20",
      weekday: "Mon",
      time: "8:01 AM",
      title: "Trying to find interns who are really interested",
      url: "https://www.linkedin.com/posts/mangeshzope_trying-to-find-interns-who-are-really-interested-share-7484796987507335168-oFCC",
      type: "Hiring & team",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 1071,
      tg_share_pct: 33,
      out_of_network_pct: 68,
      in_network_pct: 32,
      engagements: 25,
      comments: 3,
      reposts: 2,
      followers_gained: 0,
      engagement_rate_pct: 0.77
    },
    {
      published: "2026-07-18",
      weekday: "Sat",
      time: "11:19 AM",
      title: "Peaceful loans why property prices almost",
      url: "https://www.linkedin.com/posts/mangeshzope_peaceful-loans-why-property-prices-almost-ugcPost-7484122133548347392-oQg_",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 450,
      tg_share_pct: 41,
      out_of_network_pct: 42,
      in_network_pct: 58,
      engagements: 19,
      comments: 2,
      reposts: 0,
      followers_gained: 3,
      engagement_rate_pct: 1.73
    },
    {
      published: "2026-07-17",
      weekday: "Fri",
      time: "4:58 AM",
      title: "Kickass",
      url: "https://www.linkedin.com/posts/mangeshzope_kickass-ugcPost-7483663913348358144-abrO",
      type: "Founder journey & milestones",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 118,
      tg_share_pct: 47,
      out_of_network_pct: 18,
      in_network_pct: 82,
      engagements: 0,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0
    },
    {
      published: "2026-07-14",
      weekday: "Tue",
      time: "5:56 AM",
      title: "God rationed brains but he was generous",
      url: "https://www.linkedin.com/posts/mangeshzope_god-rationed-brains-but-he-was-generous-share-7482591414866874368-f09T",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 147,
      tg_share_pct: 44,
      out_of_network_pct: 22,
      in_network_pct: 78,
      engagements: 12,
      comments: 1,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 3.58
    },
    {
      published: "2026-07-14",
      weekday: "Tue",
      time: "2:31 PM",
      title: "Moments like these are a validation for us",
      url: "https://www.linkedin.com/posts/mangeshzope_moments-like-these-are-a-validation-for-us-share-7482720969816604672-2K7s",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 388,
      tg_share_pct: 49,
      out_of_network_pct: 4,
      in_network_pct: 96,
      engagements: 8,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.01
    },
    {
      published: "2026-07-12",
      weekday: "Sun",
      time: "11:21 AM",
      title: "Looking to hire for full time role in our",
      url: "https://www.linkedin.com/posts/mangeshzope_looking-to-hire-for-full-time-role-in-our-share-7481948324732866560-PeR4",
      type: "Hiring & team",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 692,
      tg_share_pct: 40,
      out_of_network_pct: 50,
      in_network_pct: 50,
      engagements: 36,
      comments: 3,
      reposts: 1,
      followers_gained: 1,
      engagement_rate_pct: 2.08
    },
    {
      published: "2026-07-06",
      weekday: "Mon",
      time: "8:47 PM",
      title: "Grateful and honestly a little pleasantly",
      url: "https://www.linkedin.com/posts/mangeshzope_grateful-and-honestly-a-little-pleasantly-ugcPost-7479916369271144448-gX5C",
      type: "Founder journey & milestones",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 735,
      tg_share_pct: 42,
      out_of_network_pct: 35,
      in_network_pct: 65,
      engagements: 41,
      comments: 2,
      reposts: 0,
      followers_gained: 2,
      engagement_rate_pct: 2.34
    },
    {
      published: "2026-06-30",
      weekday: "Tue",
      time: "6:51 AM",
      title: "Started this journey of ensuring home loan",
      url: "https://www.linkedin.com/posts/mangeshzope_started-this-journey-of-ensuring-home-loan-share-7477531824806875137-sMqv",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 773,
      tg_share_pct: 48,
      out_of_network_pct: 33,
      in_network_pct: 67,
      engagements: 24,
      comments: 2,
      reposts: 1,
      followers_gained: 2,
      engagement_rate_pct: 1.49
    },
    {
      published: "2026-06-27",
      weekday: "Sat",
      time: "5:13 PM",
      title: "Witneesed a game of cat and mouse at bluedart",
      url: "https://www.linkedin.com/posts/mangeshzope_witneesed-a-game-of-cat-and-mouse-at-bluedart-share-7476601108128342016-GDa0",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 253,
      tg_share_pct: 51,
      out_of_network_pct: 33,
      in_network_pct: 67,
      engagements: 9,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.81
    },
    {
      published: "2026-06-25",
      weekday: "Thu",
      time: "7:01 AM",
      title: "When i started my journey 10 years back as",
      url: "https://www.linkedin.com/posts/mangeshzope_when-i-started-my-journey-10-years-back-as-share-7475722402409250816-3ZUJ",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 689,
      tg_share_pct: 46,
      out_of_network_pct: 39,
      in_network_pct: 61,
      engagements: 65,
      comments: 2,
      reposts: 3,
      followers_gained: 3,
      engagement_rate_pct: 4.34
    },
    {
      published: "2026-06-23",
      weekday: "Tue",
      time: "6:32 PM",
      title: "Winners ego is termed as principles loser",
      url: "https://www.linkedin.com/posts/mangeshzope_winners-ego-is-termed-as-principles-loser-share-7475171466703982593-GPG_",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 166,
      tg_share_pct: 46,
      out_of_network_pct: 19,
      in_network_pct: 81,
      engagements: 15,
      comments: 1,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 4.16
    },
    {
      published: "2026-06-20",
      weekday: "Sat",
      time: "6:42 PM",
      title: "Komal nishad 25 of this came in last 30",
      url: "https://www.linkedin.com/posts/mangeshzope_komal-nishad-25-of-this-came-in-last-30-share-7474086780779040768-Z-O-",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 1043,
      tg_share_pct: 47,
      out_of_network_pct: 25,
      in_network_pct: 75,
      engagements: 27,
      comments: 1,
      reposts: 0,
      followers_gained: 2,
      engagement_rate_pct: 1.22
    },
    {
      published: "2026-06-11",
      weekday: "Thu",
      time: "1:32 PM",
      title: "A small but meaningful milestone for us at",
      url: "https://www.linkedin.com/posts/mangeshzope_a-small-but-meaningful-milestone-for-us-at-share-7470747187702984704-bz3M",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 848,
      tg_share_pct: 44,
      out_of_network_pct: 40,
      in_network_pct: 60,
      engagements: 49,
      comments: 2,
      reposts: 1,
      followers_gained: 2,
      engagement_rate_pct: 2.54
    },
    {
      published: "2026-05-11",
      weekday: "Mon",
      time: "12:58 PM",
      title: "In this day and age where the govt wants",
      url: "https://www.linkedin.com/posts/mangeshzope_in-this-day-and-age-where-the-govt-wants-ugcPost-7459504747939799040-2ig5",
      type: "Opinion & life lessons",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 44,
      in_network_pct: 56,
      engagements: 15,
      comments: 1,
      reposts: 1,
      followers_gained: 3,
      engagement_rate_pct: 0.83
    },
    {
      published: "2026-05-08",
      weekday: "Fri",
      time: "8:08 AM",
      title: "We are looking to hire a follow up expert",
      url: "https://www.linkedin.com/posts/mangeshzope_we-are-looking-to-hire-a-follow-up-expert-share-7458344649280167936-WASz",
      type: "Hiring & team",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 820,
      tg_share_pct: 34,
      out_of_network_pct: 60,
      in_network_pct: 40,
      engagements: 28,
      comments: 13,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.16
    },
    {
      published: "2026-05-08",
      weekday: "Fri",
      time: "12:04 PM",
      title: "Plot loans a topic of interest for every",
      url: "https://www.linkedin.com/posts/mangeshzope_plot-loans-a-topic-of-interest-for-every-ugcPost-7458404010568540160-GDvs",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 61,
      in_network_pct: 39,
      engagements: 13,
      comments: 4,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.68
    },
    {
      published: "2026-05-07",
      weekday: "Thu",
      time: "5:53 PM",
      title: "Not able to make sense of emi number on net banking",
      url: "https://www.linkedin.com/posts/mangeshzope_not-able-to-make-sense-of-emi-number-on-net-banking-ugcPost-7458129287511023616-8EtG",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 16,
      in_network_pct: 84,
      engagements: 11,
      comments: 1,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.86
    },
    {
      published: "2026-05-06",
      weekday: "Wed",
      time: "11:25 AM",
      title: "3rd and 4th home loan will attract higher",
      url: "https://www.linkedin.com/posts/mangeshzope_3rd-and-4th-home-loan-will-attract-higher-ugcPost-7457669375664377856-wo-C",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 15,
      in_network_pct: 85,
      engagements: 12,
      comments: 5,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.94
    },
    {
      published: "2026-05-05",
      weekday: "Tue",
      time: "5:08 AM",
      title: "One consumer conversation over the last few",
      url: "https://www.linkedin.com/posts/mangeshzope_one-consumer-conversation-over-the-last-few-ugcPost-7457212195207172096-6BrX",
      type: "Client story",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 4,
      in_network_pct: 96,
      engagements: 10,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0.86
    },
    {
      published: "2026-05-05",
      weekday: "Tue",
      time: "9:59 AM",
      title: "Can self employed professionals get home",
      url: "https://www.linkedin.com/posts/mangeshzope_can-self-employed-professionals-get-home-ugcPost-7457285339645116416-ndNf",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: null,
      tg_share_pct: null,
      out_of_network_pct: 25,
      in_network_pct: 75,
      engagements: 14,
      comments: 1,
      reposts: 1,
      followers_gained: 0,
      engagement_rate_pct: 1.18
    },
    {
      published: "2026-05-04",
      weekday: "Mon",
      time: "9:29 AM",
      title: "One consumer conversation over the last few",
      url: "https://www.linkedin.com/posts/mangeshzope_one-consumer-conversation-over-the-last-few-share-7456915367701979138-Gm-S",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 386,
      tg_share_pct: 38,
      out_of_network_pct: 48,
      in_network_pct: 52,
      engagements: 14,
      comments: 2,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.38
    },
    {
      published: "2026-04-30",
      weekday: "Thu",
      time: "5:18 PM",
      title: "After 4 years of tireless consumer conversations",
      url: "https://www.linkedin.com/posts/mangeshzope_after-4-years-of-tireless-consumer-conversations-ugcPost-7455583847884226561-E0Hk",
      type: "Founder journey & milestones",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 926,
      tg_share_pct: 41,
      out_of_network_pct: 33,
      in_network_pct: 67,
      engagements: 58,
      comments: 13,
      reposts: 2,
      followers_gained: 0,
      engagement_rate_pct: 2.57
    },
    {
      published: "2026-04-29",
      weekday: "Wed",
      time: "3:56 PM",
      title: "There is a professional bias called curse",
      url: "https://www.linkedin.com/posts/mangeshzope_there-is-a-professional-bias-called-curse-share-7455200922739130368-PKjS",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 272,
      tg_share_pct: 52,
      out_of_network_pct: 29,
      in_network_pct: 71,
      engagements: 9,
      comments: 1,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.72
    },
    {
      published: "2026-04-27",
      weekday: "Mon",
      time: "4:00 PM",
      title: "Over this weekend a customer asked us a question",
      url: "https://www.linkedin.com/posts/mangeshzope_over-this-weekend-a-customer-asked-us-a-question-share-7454381198119694336-4McC",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 187,
      tg_share_pct: 41,
      out_of_network_pct: 32,
      in_network_pct: 68,
      engagements: 11,
      comments: 1,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 2.42
    },
    {
      published: "2026-04-27",
      weekday: "Mon",
      time: "10:41 AM",
      title: "Freak this is the problem we are solving",
      url: "https://www.linkedin.com/posts/mangeshzope_freak-this-is-the-problem-we-are-solving-share-7454396670374494208-Rc2G",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 1188,
      tg_share_pct: 52,
      out_of_network_pct: 12,
      in_network_pct: 88,
      engagements: 9,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0.39
    },
    {
      published: "2026-04-25",
      weekday: "Sat",
      time: "8:22 AM",
      title: "Perfect example of andha andhe ko rah dikha",
      url: "https://www.linkedin.com/posts/mangeshzope_perfect-example-of-andha-andhe-ko-rah-dikha-ugcPost-7453637000353603584-3WJo",
      type: "Opinion & life lessons",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 588,
      tg_share_pct: 51,
      out_of_network_pct: null,
      in_network_pct: null,
      engagements: 8,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0.69
    },
    {
      published: "2026-04-24",
      weekday: "Fri",
      time: "10:10 AM",
      title: "One of our consumers recently wrote a review",
      url: "https://www.linkedin.com/posts/mangeshzope_one-of-our-consumers-recently-wrote-a-review-share-7453301722514341888-7hJb",
      type: "Client story",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 443,
      tg_share_pct: 45,
      out_of_network_pct: 26,
      in_network_pct: 74,
      engagements: 9,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0.91
    },
    {
      published: "2026-04-23",
      weekday: "Thu",
      time: "9:42 AM",
      title: "Recently i was reading a book called trusted",
      url: "https://www.linkedin.com/posts/mangeshzope_recently-i-was-reading-a-book-called-trusted-share-7452932302931750913-j4rg",
      type: "Opinion & life lessons",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 415,
      tg_share_pct: 46,
      out_of_network_pct: 28,
      in_network_pct: 72,
      engagements: 15,
      comments: 2,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.66
    },
    {
      published: "2026-04-21",
      weekday: "Tue",
      time: "8:53 AM",
      title: "We at peaceful loans are looking to hire",
      url: "https://www.linkedin.com/posts/mangeshzope_we-at-peaceful-loans-are-looking-to-hire-share-7452195169958850560-1oh6",
      type: "Hiring & team",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 658,
      tg_share_pct: 40,
      out_of_network_pct: 45,
      in_network_pct: 55,
      engagements: 44,
      comments: 12,
      reposts: 2,
      followers_gained: 1,
      engagement_rate_pct: 2.67
    },
    {
      published: "2026-04-14",
      weekday: "Tue",
      time: "5:23 AM",
      title: "Google we peaceful loanscom had 132",
      url: "https://www.linkedin.com/posts/mangeshzope_google-we-peaceful-loanscom-had-132-share-7449605775037145088-Gvoq",
      type: "Founder journey & milestones",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 2382,
      tg_share_pct: 44,
      out_of_network_pct: 40,
      in_network_pct: 60,
      engagements: 36,
      comments: 7,
      reposts: 0,
      followers_gained: 2,
      engagement_rate_pct: 0.66
    },
    {
      published: "2026-04-02",
      weekday: "Thu",
      time: "6:48 PM",
      title: "Demystifying home loans contd",
      url: "https://www.linkedin.com/posts/mangeshzope_demystifying-home-loans-contd-ugcPost-7445459598284767232-zx9E",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 315,
      tg_share_pct: 47,
      out_of_network_pct: 6,
      in_network_pct: 94,
      engagements: 10,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 1.49
    },
    {
      published: "2026-03-26",
      weekday: "Thu",
      time: "3:24 AM",
      title: "Busting the myths on home loans",
      url: "https://www.linkedin.com/posts/mangeshzope_busting-the-myths-on-home-loans-ugcPost-7442690322368974849-PsfV",
      type: "Home-loan explainer",
      format: "Media (ugcPost)",
      creator_chart_era: false,
      tg_impressions_lifetime: 448,
      tg_share_pct: 46,
      out_of_network_pct: 16,
      in_network_pct: 84,
      engagements: 14,
      comments: 1,
      reposts: 0,
      followers_gained: 1,
      engagement_rate_pct: 1.44
    },
    {
      published: "2026-02-26",
      weekday: "Thu",
      time: "9:39 AM",
      title: "Do you think we have a similar state of affairs",
      url: "https://www.linkedin.com/posts/mangeshzope_do-you-think-we-have-a-similar-state-of-affairs-share-7432637819463974912-BU6o",
      type: "Bank & industry critique",
      format: "Text/share",
      creator_chart_era: false,
      tg_impressions_lifetime: 593,
      tg_share_pct: 47,
      out_of_network_pct: 9,
      in_network_pct: 91,
      engagements: 11,
      comments: 0,
      reposts: 0,
      followers_gained: 0,
      engagement_rate_pct: 0.87
    }
  ],
  viewer_mix: {
    day_weight: {
      "2026-01-26": 13e-4,
      "2026-02-16": 37e-4,
      "2026-02-26": 0.0468,
      "2026-02-27": 71e-4,
      "2026-02-28": 54e-4,
      "2026-03-01": 25e-4,
      "2026-03-02": 39e-4,
      "2026-03-03": 41e-4,
      "2026-03-05": 19e-4,
      "2026-03-10": 16e-4,
      "2026-03-17": 22e-4,
      "2026-03-23": 23e-4,
      "2026-03-24": 54e-4,
      "2026-03-25": 51e-4,
      "2026-03-26": 0.0362,
      "2026-03-27": 67e-4,
      "2026-03-28": 55e-4,
      "2026-03-29": 37e-4,
      "2026-03-30": 5e-3,
      "2026-03-31": 31e-4,
      "2026-04-01": 43e-4,
      "2026-04-02": 0.0176,
      "2026-04-03": 82e-4,
      "2026-04-04": 57e-4,
      "2026-04-05": 56e-4,
      "2026-04-06": 25e-4,
      "2026-04-07": 26e-4,
      "2026-04-14": 0.2705,
      "2026-04-15": 0.0617,
      "2026-04-16": 0.0142,
      "2026-04-17": 0.0104,
      "2026-04-18": 91e-4,
      "2026-04-19": 95e-4,
      "2026-04-20": 42e-4,
      "2026-04-21": 0.0708,
      "2026-04-22": 0.0142,
      "2026-04-23": 0.0422,
      "2026-04-24": 0.0619,
      "2026-04-25": 0.0808,
      "2026-04-26": 0.022,
      "2026-04-27": 0.1721,
      "2026-04-28": 0.0374,
      "2026-04-29": 0.0379,
      "2026-04-30": 0.0932,
      "2026-05-01": 0.038,
      "2026-05-02": 0.0151,
      "2026-05-03": 0.0154,
      "2026-05-04": 0.0491,
      "2026-05-05": 0.1316,
      "2026-05-06": 0.0603,
      "2026-05-07": 0.0463,
      "2026-05-08": 0.185,
      "2026-05-09": 0.0309,
      "2026-05-10": 0.0156,
      "2026-05-11": 0.1744,
      "2026-05-12": 0.0221,
      "2026-05-13": 0.0205,
      "2026-05-14": 0.0186,
      "2026-05-15": 0.0133,
      "2026-05-16": 0.0149,
      "2026-05-17": 0.0163,
      "2026-05-18": 0.0166,
      "2026-05-19": 62e-4,
      "2026-05-20": 66e-4,
      "2026-05-21": 67e-4,
      "2026-05-22": 46e-4,
      "2026-05-23": 54e-4,
      "2026-05-24": 37e-4,
      "2026-05-25": 92e-4,
      "2026-05-26": 47e-4,
      "2026-05-27": 45e-4,
      "2026-05-28": 0.0123,
      "2026-05-29": 76e-4,
      "2026-05-30": 89e-4,
      "2026-05-31": 45e-4,
      "2026-06-01": 58e-4,
      "2026-06-02": 51e-4,
      "2026-06-03": 36e-4,
      "2026-06-05": 44e-4,
      "2026-06-06": 32e-4,
      "2026-06-07": 8e-4,
      "2026-06-11": 0.087,
      "2026-06-12": 0.0212,
      "2026-06-13": 75e-4,
      "2026-06-14": 63e-4,
      "2026-06-15": 0.0125,
      "2026-06-16": 96e-4,
      "2026-06-17": 55e-4,
      "2026-06-18": 38e-4,
      "2026-06-20": 0.0697,
      "2026-06-21": 0.0483,
      "2026-06-22": 0.0189,
      "2026-06-23": 0.0222,
      "2026-06-24": 0.0113,
      "2026-06-25": 0.0808,
      "2026-06-26": 0.0139,
      "2026-06-27": 0.0264,
      "2026-06-28": 0.0122,
      "2026-06-29": 0.0116,
      "2026-06-30": 0.0967,
      "2026-07-01": 0.0161,
      "2026-07-02": 72e-4,
      "2026-07-03": 54e-4,
      "2026-07-04": 63e-4,
      "2026-07-05": 31e-4,
      "2026-07-06": 0.0471,
      "2026-07-07": 0.0263,
      "2026-07-08": 83e-4,
      "2026-07-09": 0.0153,
      "2026-07-10": 81e-4,
      "2026-07-11": 89e-4,
      "2026-07-12": 0.0961,
      "2026-07-13": 0.0294,
      "2026-07-14": 0.0711,
      "2026-07-15": 0.0168,
      "2026-07-16": 95e-4,
      "2026-07-17": 0.0204,
      "2026-07-18": 0.0523,
      "2026-07-19": 0.0144,
      "2026-07-20": 0.1281,
      "2026-07-21": 0.0283,
      "2026-07-22": 0.1924,
      "2026-07-23": 0.0238,
      "2026-07-24": 0.3808,
      "2026-07-25": 0.1326,
      "2026-07-26": 0.0866,
      "2026-07-27": 0.0839,
      "2026-07-28": 0.042,
      "2026-07-29": 0.0343,
      "2026-07-30": 0.0365,
      "2026-07-31": 0.0171,
      "2026-08-01": 0.0116,
      "2026-08-02": 0.0119,
      "2026-08-03": 0.0166,
      "2026-08-04": 0.0135,
      "2026-08-05": 0.0126,
      "2026-08-06": 0.0123,
      "2026-08-07": 95e-4,
      "2026-08-08": 45e-4,
      "2026-08-09": 5e-3,
      "2026-08-10": 76e-4,
      "2026-08-11": 7e-3,
      "2026-08-12": 71e-4,
      "2026-08-13": 8e-3,
      "2026-08-14": 0.0118,
      "2026-08-15": 16e-4,
      "2026-08-17": 0.0309,
      "2026-08-18": 0.0131,
      "2026-08-19": 0.0544,
      "2026-08-20": 0.0153,
      "2026-08-21": 0.0329,
      "2026-08-22": 92e-4,
      "2026-08-23": 83e-4,
      "2026-08-24": 0.0314,
      "2026-08-25": 0.0136,
      "2026-08-26": 0.0356,
      "2026-08-27": 0.0287,
      "2026-08-28": 0.0569,
      "2026-08-29": 0.015,
      "2026-08-30": 0.0125,
      "2026-08-31": 0.0272,
      "2026-09-01": 0.0263,
      "2026-09-02": 0.0295,
      "2026-09-03": 0.0122,
      "2026-09-04": 0.0384,
      "2026-09-05": 0.0137,
      "2026-09-06": 0.0145,
      "2026-09-07": 0.0314,
      "2026-09-08": 97e-4,
      "2026-09-09": 0.0298,
      "2026-09-10": 72e-4,
      "2026-09-11": 0.0368,
      "2026-09-12": 79e-4,
      "2026-09-13": 68e-4,
      "2026-09-14": 87e-4,
      "2026-09-15": 0.0292,
      "2026-09-16": 0.015,
      "2026-09-17": 0.1331,
      "2026-09-18": 1,
      "2026-09-19": 0.2677,
      "2026-09-20": 0.1413,
      "2026-09-21": 0.1086,
      "2026-09-22": 0.0625,
      "2026-09-23": 0.0714,
      "2026-09-24": 0.0445,
      "2026-09-25": 0.0427
    },
    pct_of_views: {
      Seniority: {
        Senior: {
          "2026-01-26": 75,
          "2026-02-26": 26,
          "2026-02-27": 30,
          "2026-02-28": 19,
          "2026-03-01": 33,
          "2026-03-02": 41.9,
          "2026-03-03": 38,
          "2026-03-05": 35,
          "2026-03-10": 55.9,
          "2026-03-17": 64,
          "2026-03-24": 25,
          "2026-03-25": 24,
          "2026-03-26": 25,
          "2026-03-27": 23,
          "2026-03-28": 28,
          "2026-03-29": 32,
          "2026-03-30": 25.1,
          "2026-04-01": 21,
          "2026-04-02": 34,
          "2026-04-03": 20,
          "2026-04-04": 17,
          "2026-04-05": 25.1,
          "2026-04-06": 37.1,
          "2026-04-07": 36,
          "2026-04-14": 28,
          "2026-04-15": 31,
          "2026-04-16": 27,
          "2026-04-17": 29,
          "2026-04-18": 25,
          "2026-04-19": 35,
          "2026-04-21": 27,
          "2026-04-22": 30,
          "2026-04-23": 25,
          "2026-04-24": 27,
          "2026-04-25": 26,
          "2026-04-26": 24,
          "2026-04-27": 24,
          "2026-04-28": 26,
          "2026-04-29": 25,
          "2026-04-30": 27,
          "2026-05-01": 28,
          "2026-05-02": 19,
          "2026-05-03": 22,
          "2026-05-04": 22,
          "2026-05-05": 24,
          "2026-05-06": 26,
          "2026-05-07": 25,
          "2026-05-08": 28,
          "2026-05-09": 30,
          "2026-05-10": 23,
          "2026-05-11": 26,
          "2026-05-12": 30,
          "2026-05-13": 29,
          "2026-05-14": 20,
          "2026-05-15": 23,
          "2026-05-16": 28,
          "2026-05-17": 31,
          "2026-05-18": 24,
          "2026-05-19": 24,
          "2026-05-20": 31,
          "2026-05-21": 35,
          "2026-05-22": 16,
          "2026-05-23": 14,
          "2026-05-24": 24.1,
          "2026-05-25": 30,
          "2026-05-26": 32.1,
          "2026-05-27": 32,
          "2026-05-28": 25,
          "2026-05-29": 37,
          "2026-05-30": 24,
          "2026-05-31": 36,
          "2026-06-01": 17.9,
          "2026-06-02": 25.9,
          "2026-06-05": 33.1,
          "2026-06-07": 88.2,
          "2026-06-11": 26,
          "2026-06-12": 26,
          "2026-06-13": 32,
          "2026-06-14": 40,
          "2026-06-15": 29,
          "2026-06-16": 29,
          "2026-06-17": 15,
          "2026-06-18": 39,
          "2026-06-20": 23,
          "2026-06-21": 24,
          "2026-06-22": 24,
          "2026-06-23": 27,
          "2026-06-24": 34,
          "2026-06-25": 26,
          "2026-06-26": 21,
          "2026-06-27": 21,
          "2026-06-28": 27,
          "2026-06-29": 20,
          "2026-06-30": 27,
          "2026-07-01": 27,
          "2026-07-02": 26,
          "2026-07-03": 26,
          "2026-07-04": 32,
          "2026-07-05": 26.1,
          "2026-07-06": 24,
          "2026-07-07": 24,
          "2026-07-08": 18,
          "2026-07-09": 26,
          "2026-07-10": 21,
          "2026-07-11": 23,
          "2026-07-12": 26,
          "2026-07-13": 25,
          "2026-07-14": 27,
          "2026-07-15": 29,
          "2026-07-16": 29,
          "2026-07-17": 24,
          "2026-07-18": 23,
          "2026-07-19": 33,
          "2026-07-20": 27,
          "2026-07-21": 33,
          "2026-07-22": 27,
          "2026-07-23": 24,
          "2026-07-24": 28,
          "2026-07-25": 28,
          "2026-07-26": 31,
          "2026-07-27": 26,
          "2026-07-28": 32,
          "2026-07-29": 26,
          "2026-07-30": 28,
          "2026-07-31": 32,
          "2026-08-01": 28,
          "2026-08-02": 26,
          "2026-08-03": 22,
          "2026-08-04": 27,
          "2026-08-05": 26,
          "2026-08-06": 24,
          "2026-08-07": 25,
          "2026-08-08": 26.1,
          "2026-08-09": 24,
          "2026-08-10": 26,
          "2026-08-11": 20,
          "2026-08-12": 26,
          "2026-08-13": 25,
          "2026-08-17": 24,
          "2026-08-18": 28,
          "2026-08-19": 23,
          "2026-08-20": 32,
          "2026-08-21": 30,
          "2026-08-22": 29,
          "2026-08-23": 32,
          "2026-08-24": 28,
          "2026-08-25": 26,
          "2026-08-26": 25,
          "2026-08-27": 24,
          "2026-08-28": 24,
          "2026-08-29": 21,
          "2026-08-30": 28,
          "2026-08-31": 27,
          "2026-09-01": 28,
          "2026-09-02": 28,
          "2026-09-03": 30,
          "2026-09-04": 29,
          "2026-09-05": 24,
          "2026-09-06": 22,
          "2026-09-07": 24,
          "2026-09-08": 28,
          "2026-09-09": 31,
          "2026-09-10": 25,
          "2026-09-11": 24,
          "2026-09-12": 27,
          "2026-09-13": 23,
          "2026-09-14": 32,
          "2026-09-15": 25,
          "2026-09-16": 25,
          "2026-09-17": 25,
          "2026-09-18": 28,
          "2026-09-19": 31,
          "2026-09-20": 30,
          "2026-09-21": 30,
          "2026-09-22": 30,
          "2026-09-23": 27,
          "2026-09-24": 32,
          "2026-09-25": 31
        },
        Entry: {
          "2026-02-16": 41,
          "2026-02-26": 13,
          "2026-02-27": 10,
          "2026-02-28": 16.9,
          "2026-03-01": 22.1,
          "2026-03-23": 27.1,
          "2026-03-24": 10,
          "2026-03-25": 11,
          "2026-03-26": 13,
          "2026-03-27": 12,
          "2026-03-30": 27,
          "2026-03-31": 18.1,
          "2026-04-01": 16,
          "2026-04-02": 7,
          "2026-04-03": 16,
          "2026-04-05": 22,
          "2026-04-06": 22.1,
          "2026-04-14": 13,
          "2026-04-15": 18,
          "2026-04-16": 15,
          "2026-04-17": 14,
          "2026-04-18": 12,
          "2026-04-19": 26,
          "2026-04-21": 12,
          "2026-04-22": 20,
          "2026-04-23": 13,
          "2026-04-24": 12,
          "2026-04-25": 14,
          "2026-04-26": 14,
          "2026-04-27": 11,
          "2026-04-28": 13,
          "2026-04-29": 12,
          "2026-04-30": 14,
          "2026-05-01": 10,
          "2026-05-02": 16,
          "2026-05-03": 16,
          "2026-05-04": 15,
          "2026-05-05": 12,
          "2026-05-06": 16,
          "2026-05-07": 21,
          "2026-05-08": 16,
          "2026-05-09": 12,
          "2026-05-10": 15,
          "2026-05-11": 13,
          "2026-05-12": 12,
          "2026-05-13": 11,
          "2026-05-14": 12,
          "2026-05-15": 19,
          "2026-05-16": 7,
          "2026-05-17": 18,
          "2026-05-18": 13,
          "2026-05-19": 28,
          "2026-05-20": 22,
          "2026-05-21": 19,
          "2026-05-22": 24,
          "2026-05-23": 19,
          "2026-05-25": 18,
          "2026-05-26": 26,
          "2026-05-28": 19,
          "2026-05-30": 16,
          "2026-06-01": 17.9,
          "2026-06-06": 50,
          "2026-06-11": 13,
          "2026-06-12": 15,
          "2026-06-13": 12,
          "2026-06-15": 23,
          "2026-06-16": 25,
          "2026-06-17": 12,
          "2026-06-20": 15,
          "2026-06-21": 12,
          "2026-06-22": 12,
          "2026-06-23": 15,
          "2026-06-24": 9,
          "2026-06-25": 13,
          "2026-06-26": 16,
          "2026-06-27": 11,
          "2026-06-28": 10,
          "2026-06-29": 18,
          "2026-06-30": 12,
          "2026-07-01": 16,
          "2026-07-02": 16,
          "2026-07-04": 14,
          "2026-07-06": 14,
          "2026-07-07": 20,
          "2026-07-08": 30,
          "2026-07-09": 9,
          "2026-07-10": 15,
          "2026-07-11": 23,
          "2026-07-12": 15,
          "2026-07-13": 16,
          "2026-07-14": 11,
          "2026-07-15": 12,
          "2026-07-17": 15,
          "2026-07-18": 16,
          "2026-07-19": 13,
          "2026-07-20": 13,
          "2026-07-21": 9,
          "2026-07-22": 10,
          "2026-07-23": 19,
          "2026-07-24": 12,
          "2026-07-25": 11,
          "2026-07-26": 13,
          "2026-07-27": 12,
          "2026-07-28": 13,
          "2026-07-29": 14,
          "2026-07-30": 9,
          "2026-07-31": 12,
          "2026-08-01": 14,
          "2026-08-02": 15,
          "2026-08-03": 20,
          "2026-08-04": 17,
          "2026-08-05": 16,
          "2026-08-06": 16,
          "2026-08-09": 24,
          "2026-08-11": 15,
          "2026-08-12": 19.1,
          "2026-08-13": 22,
          "2026-08-14": 32,
          "2026-08-15": 40,
          "2026-08-17": 13,
          "2026-08-18": 14,
          "2026-08-19": 16,
          "2026-08-20": 12,
          "2026-08-21": 12,
          "2026-08-22": 15,
          "2026-08-23": 13,
          "2026-08-24": 11,
          "2026-08-25": 13,
          "2026-08-26": 14,
          "2026-08-27": 13,
          "2026-08-28": 11,
          "2026-08-29": 14,
          "2026-08-30": 19,
          "2026-08-31": 11,
          "2026-09-01": 14,
          "2026-09-02": 14,
          "2026-09-03": 17,
          "2026-09-04": 11,
          "2026-09-05": 12,
          "2026-09-06": 15,
          "2026-09-07": 16,
          "2026-09-08": 14,
          "2026-09-09": 7,
          "2026-09-10": 14,
          "2026-09-11": 9,
          "2026-09-12": 20,
          "2026-09-13": 19,
          "2026-09-15": 17,
          "2026-09-17": 11,
          "2026-09-18": 13,
          "2026-09-19": 16,
          "2026-09-20": 14,
          "2026-09-21": 16,
          "2026-09-22": 14,
          "2026-09-23": 15,
          "2026-09-24": 15,
          "2026-09-25": 11
        },
        Director: {
          "2026-02-26": 15,
          "2026-02-27": 19.1,
          "2026-02-28": 16.9,
          "2026-03-02": 24,
          "2026-03-24": 21.9,
          "2026-03-25": 17.1,
          "2026-03-26": 16,
          "2026-03-27": 11,
          "2026-03-30": 14,
          "2026-03-31": 18.1,
          "2026-04-02": 10,
          "2026-04-03": 22,
          "2026-04-04": 13,
          "2026-04-14": 12,
          "2026-04-15": 12,
          "2026-04-16": 13,
          "2026-04-18": 16,
          "2026-04-21": 10,
          "2026-04-22": 8,
          "2026-04-23": 14,
          "2026-04-24": 12,
          "2026-04-25": 13,
          "2026-04-26": 14,
          "2026-04-27": 15,
          "2026-04-28": 12,
          "2026-04-29": 13,
          "2026-04-30": 11,
          "2026-05-01": 16,
          "2026-05-02": 17,
          "2026-05-03": 8,
          "2026-05-04": 11,
          "2026-05-05": 14,
          "2026-05-06": 10,
          "2026-05-07": 11,
          "2026-05-08": 9,
          "2026-05-09": 12,
          "2026-05-10": 8,
          "2026-05-11": 12,
          "2026-05-12": 11,
          "2026-05-13": 11,
          "2026-05-14": 8,
          "2026-05-15": 6,
          "2026-05-16": 11,
          "2026-05-17": 10,
          "2026-05-18": 11,
          "2026-05-19": 13,
          "2026-05-20": 13,
          "2026-05-23": 14,
          "2026-05-25": 11,
          "2026-05-26": 17.9,
          "2026-05-28": 19,
          "2026-05-30": 20,
          "2026-05-31": 16,
          "2026-06-02": 25.9,
          "2026-06-03": 25,
          "2026-06-11": 14,
          "2026-06-12": 13,
          "2026-06-15": 8,
          "2026-06-17": 17,
          "2026-06-20": 12,
          "2026-06-21": 15,
          "2026-06-22": 9,
          "2026-06-23": 8,
          "2026-06-24": 12,
          "2026-06-25": 12,
          "2026-06-26": 10,
          "2026-06-27": 13,
          "2026-06-28": 11,
          "2026-06-29": 10,
          "2026-06-30": 15,
          "2026-07-01": 8,
          "2026-07-06": 12,
          "2026-07-07": 6,
          "2026-07-09": 8,
          "2026-07-10": 10,
          "2026-07-12": 11,
          "2026-07-13": 9,
          "2026-07-14": 15,
          "2026-07-15": 11,
          "2026-07-16": 10,
          "2026-07-17": 13,
          "2026-07-18": 11,
          "2026-07-19": 7,
          "2026-07-20": 10,
          "2026-07-21": 13,
          "2026-07-22": 15,
          "2026-07-23": 10,
          "2026-07-24": 15,
          "2026-07-25": 15,
          "2026-07-26": 13,
          "2026-07-27": 14,
          "2026-07-28": 14,
          "2026-07-29": 13,
          "2026-07-30": 12,
          "2026-07-31": 6,
          "2026-08-01": 8,
          "2026-08-02": 11,
          "2026-08-03": 14,
          "2026-08-04": 10,
          "2026-08-05": 7,
          "2026-08-06": 17,
          "2026-08-07": 12,
          "2026-08-14": 21,
          "2026-08-17": 14,
          "2026-08-18": 9,
          "2026-08-19": 12,
          "2026-08-20": 9,
          "2026-08-21": 12,
          "2026-08-24": 11,
          "2026-08-25": 13,
          "2026-08-26": 13,
          "2026-08-27": 14,
          "2026-08-28": 12,
          "2026-08-29": 12,
          "2026-08-30": 8,
          "2026-08-31": 10,
          "2026-09-01": 6,
          "2026-09-02": 11,
          "2026-09-04": 8,
          "2026-09-05": 10,
          "2026-09-07": 12,
          "2026-09-08": 8,
          "2026-09-09": 10,
          "2026-09-11": 9,
          "2026-09-15": 8,
          "2026-09-17": 13,
          "2026-09-18": 13,
          "2026-09-19": 11,
          "2026-09-20": 12,
          "2026-09-21": 9,
          "2026-09-22": 12,
          "2026-09-23": 10,
          "2026-09-24": 8,
          "2026-09-25": 10
        },
        Manager: {
          "2026-02-26": 11,
          "2026-02-27": 10,
          "2026-03-03": 18,
          "2026-03-25": 11,
          "2026-03-26": 10,
          "2026-03-27": 12,
          "2026-03-28": 15.9,
          "2026-04-01": 16,
          "2026-04-02": 9,
          "2026-04-03": 8,
          "2026-04-05": 22,
          "2026-04-14": 12,
          "2026-04-15": 9,
          "2026-04-16": 7,
          "2026-04-17": 9,
          "2026-04-18": 12,
          "2026-04-20": 20,
          "2026-04-21": 11,
          "2026-04-22": 8,
          "2026-04-23": 12,
          "2026-04-24": 10,
          "2026-04-25": 13,
          "2026-04-26": 14,
          "2026-04-27": 11,
          "2026-04-28": 15,
          "2026-04-29": 14,
          "2026-04-30": 11,
          "2026-05-01": 10,
          "2026-05-02": 16,
          "2026-05-03": 13,
          "2026-05-04": 10,
          "2026-05-05": 11,
          "2026-05-06": 12,
          "2026-05-07": 10,
          "2026-05-08": 8,
          "2026-05-09": 12,
          "2026-05-10": 15,
          "2026-05-11": 17,
          "2026-05-12": 15,
          "2026-05-13": 15,
          "2026-05-14": 25,
          "2026-05-15": 32,
          "2026-05-16": 16,
          "2026-05-17": 18,
          "2026-05-18": 21,
          "2026-05-19": 11,
          "2026-05-22": 16,
          "2026-05-23": 24,
          "2026-05-29": 20,
          "2026-05-31": 14,
          "2026-06-11": 12,
          "2026-06-12": 13,
          "2026-06-13": 12,
          "2026-06-15": 16,
          "2026-06-17": 15,
          "2026-06-20": 11,
          "2026-06-21": 11,
          "2026-06-22": 10,
          "2026-06-23": 13,
          "2026-06-24": 12,
          "2026-06-25": 11,
          "2026-06-26": 9,
          "2026-06-27": 10,
          "2026-06-28": 12,
          "2026-06-29": 22,
          "2026-06-30": 10,
          "2026-07-01": 16,
          "2026-07-02": 22,
          "2026-07-03": 17.9,
          "2026-07-04": 16,
          "2026-07-06": 9,
          "2026-07-07": 9,
          "2026-07-09": 13,
          "2026-07-10": 12,
          "2026-07-11": 12,
          "2026-07-12": 10,
          "2026-07-13": 11,
          "2026-07-14": 10,
          "2026-07-15": 9,
          "2026-07-17": 12,
          "2026-07-18": 9,
          "2026-07-19": 14,
          "2026-07-20": 11,
          "2026-07-21": 9,
          "2026-07-22": 12,
          "2026-07-23": 12,
          "2026-07-24": 12,
          "2026-07-25": 15,
          "2026-07-26": 15,
          "2026-07-27": 18,
          "2026-07-28": 14,
          "2026-07-29": 17,
          "2026-07-30": 19,
          "2026-07-31": 15,
          "2026-08-01": 15,
          "2026-08-02": 8,
          "2026-08-03": 12,
          "2026-08-04": 12,
          "2026-08-05": 13,
          "2026-08-06": 15,
          "2026-08-07": 14,
          "2026-08-10": 19,
          "2026-08-11": 22,
          "2026-08-12": 19.1,
          "2026-08-17": 9,
          "2026-08-18": 18,
          "2026-08-19": 11,
          "2026-08-20": 16,
          "2026-08-21": 12,
          "2026-08-22": 12,
          "2026-08-23": 15,
          "2026-08-24": 19,
          "2026-08-25": 20,
          "2026-08-26": 16,
          "2026-08-27": 12,
          "2026-08-28": 11,
          "2026-08-29": 19,
          "2026-08-30": 13,
          "2026-08-31": 14,
          "2026-09-01": 14,
          "2026-09-02": 10,
          "2026-09-03": 20,
          "2026-09-04": 19,
          "2026-09-05": 14,
          "2026-09-06": 18,
          "2026-09-07": 14,
          "2026-09-08": 14,
          "2026-09-09": 12,
          "2026-09-10": 14,
          "2026-09-11": 12,
          "2026-09-12": 13,
          "2026-09-15": 15,
          "2026-09-16": 19,
          "2026-09-17": 11,
          "2026-09-18": 11,
          "2026-09-19": 13,
          "2026-09-20": 15,
          "2026-09-21": 13,
          "2026-09-22": 13,
          "2026-09-23": 15,
          "2026-09-24": 9,
          "2026-09-25": 16
        },
        Owner: {
          "2026-02-26": 8,
          "2026-02-27": 12.9,
          "2026-03-26": 8,
          "2026-03-27": 9,
          "2026-04-02": 9,
          "2026-04-03": 14,
          "2026-04-14": 8,
          "2026-04-15": 8,
          "2026-04-16": 8,
          "2026-04-17": 9,
          "2026-04-19": 8,
          "2026-04-21": 9,
          "2026-04-22": 8,
          "2026-04-23": 11,
          "2026-04-24": 12,
          "2026-04-25": 8,
          "2026-04-26": 8,
          "2026-04-27": 9,
          "2026-04-28": 9,
          "2026-04-29": 8,
          "2026-04-30": 8,
          "2026-05-01": 8,
          "2026-05-02": 6,
          "2026-05-03": 9,
          "2026-05-04": 8,
          "2026-05-05": 10,
          "2026-05-06": 8,
          "2026-05-07": 8,
          "2026-05-08": 8,
          "2026-05-09": 5,
          "2026-05-11": 6,
          "2026-05-12": 5,
          "2026-05-13": 9,
          "2026-05-14": 7,
          "2026-05-16": 11,
          "2026-05-17": 5,
          "2026-05-18": 7,
          "2026-05-25": 11,
          "2026-05-28": 19,
          "2026-06-11": 7,
          "2026-06-12": 6,
          "2026-06-13": 12,
          "2026-06-20": 9,
          "2026-06-21": 9,
          "2026-06-22": 8,
          "2026-06-23": 11,
          "2026-06-24": 15,
          "2026-06-25": 10,
          "2026-06-26": 13,
          "2026-06-27": 12,
          "2026-06-28": 13,
          "2026-06-30": 8,
          "2026-07-01": 11,
          "2026-07-06": 8,
          "2026-07-07": 8,
          "2026-07-09": 9,
          "2026-07-10": 9,
          "2026-07-12": 10,
          "2026-07-13": 6,
          "2026-07-14": 8,
          "2026-07-15": 6,
          "2026-07-17": 8,
          "2026-07-18": 9,
          "2026-07-20": 6,
          "2026-07-21": 3,
          "2026-07-22": 7,
          "2026-07-23": 6,
          "2026-07-24": 5,
          "2026-07-25": 4,
          "2026-07-26": 3,
          "2026-07-27": 4,
          "2026-07-28": 3,
          "2026-07-29": 6,
          "2026-07-30": 3,
          "2026-07-31": 7,
          "2026-08-01": 6,
          "2026-08-02": 6,
          "2026-08-03": 5,
          "2026-08-17": 12,
          "2026-08-19": 8,
          "2026-08-21": 8,
          "2026-08-22": 10,
          "2026-08-24": 8,
          "2026-08-25": 7,
          "2026-08-26": 8,
          "2026-08-27": 6,
          "2026-08-28": 10,
          "2026-08-29": 6,
          "2026-08-30": 7,
          "2026-08-31": 7,
          "2026-09-01": 5,
          "2026-09-02": 9,
          "2026-09-04": 9,
          "2026-09-05": 6,
          "2026-09-06": 8,
          "2026-09-07": 7,
          "2026-09-08": 14,
          "2026-09-09": 12,
          "2026-09-10": 12,
          "2026-09-11": 12,
          "2026-09-15": 8,
          "2026-09-16": 13,
          "2026-09-17": 9,
          "2026-09-18": 6,
          "2026-09-19": 5,
          "2026-09-20": 4,
          "2026-09-21": 6,
          "2026-09-22": 7,
          "2026-09-23": 9,
          "2026-09-24": 7,
          "2026-09-25": 6
        },
        VP: {
          "2026-02-26": 7,
          "2026-03-25": 15,
          "2026-03-26": 9,
          "2026-03-27": 9,
          "2026-04-02": 9,
          "2026-04-03": 9,
          "2026-04-14": 7,
          "2026-04-15": 6,
          "2026-04-16": 8,
          "2026-04-19": 8,
          "2026-04-21": 5,
          "2026-04-22": 7,
          "2026-04-23": 6,
          "2026-04-24": 7,
          "2026-04-25": 8,
          "2026-04-26": 6,
          "2026-04-27": 8,
          "2026-04-28": 6,
          "2026-04-29": 5,
          "2026-04-30": 7,
          "2026-05-01": 5,
          "2026-05-02": 7,
          "2026-05-03": 7,
          "2026-05-04": 7,
          "2026-05-05": 8,
          "2026-05-06": 6,
          "2026-05-07": 6,
          "2026-05-08": 3,
          "2026-05-09": 3,
          "2026-05-11": 6,
          "2026-05-12": 7,
          "2026-05-13": 8,
          "2026-05-14": 6,
          "2026-05-15": 5,
          "2026-05-16": 5,
          "2026-05-17": 6,
          "2026-05-18": 7,
          "2026-05-30": 12,
          "2026-06-11": 8,
          "2026-06-20": 6,
          "2026-06-21": 7,
          "2026-06-22": 10,
          "2026-06-25": 6,
          "2026-06-26": 10,
          "2026-06-27": 10,
          "2026-06-30": 8,
          "2026-07-06": 8,
          "2026-07-07": 8,
          "2026-07-09": 6,
          "2026-07-10": 8,
          "2026-07-12": 5,
          "2026-07-13": 5,
          "2026-07-14": 6,
          "2026-07-16": 10,
          "2026-07-17": 7,
          "2026-07-18": 8,
          "2026-07-19": 6,
          "2026-07-20": 5,
          "2026-07-21": 3,
          "2026-07-22": 8,
          "2026-07-23": 6,
          "2026-07-24": 10,
          "2026-07-25": 11,
          "2026-07-26": 11,
          "2026-07-27": 13,
          "2026-07-28": 10,
          "2026-07-29": 11,
          "2026-07-30": 12,
          "2026-07-31": 8,
          "2026-08-01": 11,
          "2026-08-02": 8,
          "2026-08-03": 7,
          "2026-08-04": 7,
          "2026-08-17": 7,
          "2026-08-18": 8,
          "2026-08-19": 6,
          "2026-08-20": 7,
          "2026-08-21": 4,
          "2026-08-24": 5,
          "2026-08-25": 8,
          "2026-08-26": 4,
          "2026-08-27": 8,
          "2026-08-28": 8,
          "2026-08-29": 8,
          "2026-08-30": 9,
          "2026-08-31": 6,
          "2026-09-01": 5,
          "2026-09-02": 6,
          "2026-09-04": 4,
          "2026-09-05": 7,
          "2026-09-07": 5,
          "2026-09-09": 5,
          "2026-09-11": 10,
          "2026-09-15": 9,
          "2026-09-17": 8,
          "2026-09-18": 7,
          "2026-09-19": 7,
          "2026-09-20": 6,
          "2026-09-21": 5,
          "2026-09-22": 4,
          "2026-09-23": 5,
          "2026-09-24": 5,
          "2026-09-25": 7
        },
        CXO: {
          "2026-02-26": 5,
          "2026-03-26": 6,
          "2026-04-02": 7,
          "2026-04-14": 6,
          "2026-04-15": 4,
          "2026-04-16": 6,
          "2026-04-21": 4,
          "2026-04-23": 6,
          "2026-04-24": 5,
          "2026-04-25": 4,
          "2026-04-27": 5,
          "2026-04-28": 5,
          "2026-04-29": 8,
          "2026-04-30": 4,
          "2026-05-01": 4,
          "2026-05-04": 3,
          "2026-05-05": 5,
          "2026-05-06": 3,
          "2026-05-07": 4,
          "2026-05-08": 3,
          "2026-05-09": 3,
          "2026-05-11": 3,
          "2026-05-12": 3,
          "2026-06-11": 4,
          "2026-06-20": 6,
          "2026-06-21": 6,
          "2026-06-22": 6,
          "2026-06-23": 4,
          "2026-06-25": 6,
          "2026-06-27": 5,
          "2026-06-28": 8,
          "2026-06-30": 5,
          "2026-07-01": 6,
          "2026-07-06": 7,
          "2026-07-07": 4,
          "2026-07-12": 4,
          "2026-07-13": 5,
          "2026-07-14": 7,
          "2026-07-17": 4,
          "2026-07-18": 4,
          "2026-07-19": 6,
          "2026-07-20": 3,
          "2026-07-21": 4,
          "2026-07-22": 6,
          "2026-07-23": 4,
          "2026-07-24": 4,
          "2026-07-25": 4,
          "2026-07-26": 4,
          "2026-07-27": 2,
          "2026-07-28": 4,
          "2026-07-29": 3,
          "2026-07-30": 3,
          "2026-07-31": 5,
          "2026-08-01": 6,
          "2026-08-02": 5,
          "2026-08-03": 5,
          "2026-08-17": 4,
          "2026-08-18": 9,
          "2026-08-19": 3,
          "2026-08-21": 5,
          "2026-08-26": 3,
          "2026-08-27": 5,
          "2026-08-28": 6,
          "2026-08-29": 6,
          "2026-08-31": 3,
          "2026-09-02": 4,
          "2026-09-04": 4,
          "2026-09-07": 3,
          "2026-09-09": 3,
          "2026-09-11": 6,
          "2026-09-15": 6,
          "2026-09-17": 4,
          "2026-09-18": 5,
          "2026-09-19": 4,
          "2026-09-20": 3,
          "2026-09-21": 3,
          "2026-09-22": 2,
          "2026-09-23": 4,
          "2026-09-24": 3,
          "2026-09-25": 4
        },
        Partner: {
          "2026-04-14": 2,
          "2026-04-15": 1,
          "2026-04-21": 2,
          "2026-04-24": 2,
          "2026-04-25": 3,
          "2026-04-27": 3,
          "2026-04-28": 2,
          "2026-04-29": 2,
          "2026-04-30": 2,
          "2026-05-04": 2,
          "2026-05-05": 3,
          "2026-05-06": 3,
          "2026-05-07": 2,
          "2026-05-08": 2,
          "2026-05-11": 2,
          "2026-06-11": 2,
          "2026-06-20": 2,
          "2026-06-21": 2,
          "2026-06-23": 4,
          "2026-06-25": 2,
          "2026-06-27": 4,
          "2026-06-30": 3,
          "2026-07-06": 2,
          "2026-07-12": 2,
          "2026-07-14": 3,
          "2026-07-18": 3,
          "2026-07-20": 2,
          "2026-07-22": 2,
          "2026-07-24": 2,
          "2026-07-25": 1,
          "2026-07-26": 1,
          "2026-07-27": 1,
          "2026-08-19": 3,
          "2026-08-26": 2,
          "2026-08-28": 2,
          "2026-09-04": 3,
          "2026-09-11": 3,
          "2026-09-17": 4,
          "2026-09-18": 2,
          "2026-09-19": 1,
          "2026-09-20": 1,
          "2026-09-21": 2,
          "2026-09-22": 1,
          "2026-09-23": 1,
          "2026-09-25": 2
        },
        Training: {
          "2026-04-14": 1,
          "2026-04-15": 1,
          "2026-04-21": 3,
          "2026-04-22": 5,
          "2026-04-24": 1,
          "2026-04-25": 0.5,
          "2026-04-27": 0.5,
          "2026-04-30": 1,
          "2026-05-04": 2,
          "2026-05-05": 1,
          "2026-05-06": 2,
          "2026-05-07": 2,
          "2026-05-08": 2,
          "2026-05-11": 1,
          "2026-06-11": 1,
          "2026-06-20": 2,
          "2026-06-21": 1,
          "2026-06-25": 2,
          "2026-06-30": 1,
          "2026-07-06": 2,
          "2026-07-07": 3,
          "2026-07-08": 11,
          "2026-07-12": 1,
          "2026-07-20": 2,
          "2026-07-22": 1,
          "2026-07-24": 0.5,
          "2026-08-31": 3,
          "2026-09-09": 3,
          "2026-09-17": 0.5,
          "2026-09-18": 1,
          "2026-09-19": 1,
          "2026-09-20": 0.5,
          "2026-09-21": 1,
          "2026-09-22": 2,
          "2026-09-25": 2
        }
      },
      Location: {
        "Mumbai Metropolitan Region": {
          "2026-02-07": 43.2,
          "2026-02-14": 69.2,
          "2026-02-26": 26,
          "2026-02-27": 36,
          "2026-02-28": 48.1,
          "2026-03-01": 22.1,
          "2026-03-02": 33.1,
          "2026-03-03": 32,
          "2026-03-10": 44.1,
          "2026-03-11": 38.9,
          "2026-03-17": 55,
          "2026-03-23": 31.9,
          "2026-03-24": 28.1,
          "2026-03-25": 30,
          "2026-03-26": 34,
          "2026-03-27": 20,
          "2026-03-28": 33,
          "2026-03-29": 23.1,
          "2026-03-30": 36,
          "2026-03-31": 36,
          "2026-04-01": 24,
          "2026-04-02": 34,
          "2026-04-03": 37,
          "2026-04-04": 30,
          "2026-04-05": 38.9,
          "2026-04-06": 52.1,
          "2026-04-07": 39.1,
          "2026-04-09": 66.9,
          "2026-04-11": 50,
          "2026-04-14": 23,
          "2026-04-15": 23,
          "2026-04-16": 21,
          "2026-04-17": 17,
          "2026-04-18": 27,
          "2026-04-19": 30,
          "2026-04-20": 28.9,
          "2026-04-21": 27,
          "2026-04-22": 27,
          "2026-04-23": 27,
          "2026-04-24": 28,
          "2026-04-25": 30,
          "2026-04-26": 23,
          "2026-04-27": 30,
          "2026-04-28": 29,
          "2026-04-29": 29,
          "2026-04-30": 28,
          "2026-05-01": 28,
          "2026-05-02": 26,
          "2026-05-03": 21,
          "2026-05-04": 29,
          "2026-05-05": 32,
          "2026-05-06": 23,
          "2026-05-07": 27,
          "2026-05-08": 30,
          "2026-05-09": 34,
          "2026-05-10": 27,
          "2026-05-11": 26,
          "2026-05-12": 28,
          "2026-05-13": 24,
          "2026-05-14": 22,
          "2026-05-15": 22,
          "2026-05-16": 31,
          "2026-05-17": 28,
          "2026-05-18": 22,
          "2026-05-19": 35.1,
          "2026-05-20": 40,
          "2026-05-21": 35,
          "2026-05-22": 30,
          "2026-05-23": 29,
          "2026-05-24": 28,
          "2026-05-25": 37,
          "2026-05-26": 29,
          "2026-05-27": 37,
          "2026-05-28": 53,
          "2026-05-29": 35,
          "2026-05-30": 31,
          "2026-05-31": 32,
          "2026-06-01": 47.1,
          "2026-06-02": 34.9,
          "2026-06-04": 47.1,
          "2026-06-08": 70,
          "2026-06-11": 30,
          "2026-06-12": 32,
          "2026-06-13": 29,
          "2026-06-14": 29,
          "2026-06-15": 20,
          "2026-06-16": 19,
          "2026-06-17": 25,
          "2026-06-18": 30,
          "2026-06-19": 47,
          "2026-06-20": 29,
          "2026-06-21": 31,
          "2026-06-22": 30,
          "2026-06-23": 33,
          "2026-06-24": 31,
          "2026-06-25": 30,
          "2026-06-26": 30,
          "2026-06-27": 28,
          "2026-06-28": 29,
          "2026-06-29": 36,
          "2026-06-30": 32,
          "2026-07-01": 27,
          "2026-07-02": 35,
          "2026-07-03": 17.9,
          "2026-07-04": 30,
          "2026-07-06": 27,
          "2026-07-07": 26,
          "2026-07-08": 24,
          "2026-07-09": 38,
          "2026-07-10": 26,
          "2026-07-11": 30,
          "2026-07-12": 28,
          "2026-07-13": 30,
          "2026-07-14": 28,
          "2026-07-15": 29,
          "2026-07-16": 24,
          "2026-07-17": 26,
          "2026-07-18": 28,
          "2026-07-19": 24,
          "2026-07-20": 29,
          "2026-07-21": 26,
          "2026-07-22": 29,
          "2026-07-23": 32,
          "2026-07-24": 27,
          "2026-07-25": 24,
          "2026-07-26": 27,
          "2026-07-27": 28,
          "2026-07-28": 28,
          "2026-07-29": 29,
          "2026-07-30": 30,
          "2026-07-31": 28,
          "2026-08-01": 25,
          "2026-08-02": 25,
          "2026-08-03": 22,
          "2026-08-04": 24,
          "2026-08-05": 32,
          "2026-08-06": 29,
          "2026-08-07": 38,
          "2026-08-08": 22,
          "2026-08-09": 48.1,
          "2026-08-10": 38,
          "2026-08-11": 17,
          "2026-08-12": 34.9,
          "2026-08-13": 25,
          "2026-08-14": 41,
          "2026-08-16": 32.1,
          "2026-08-17": 37,
          "2026-08-18": 36,
          "2026-08-19": 30,
          "2026-08-20": 26,
          "2026-08-21": 30,
          "2026-08-22": 28,
          "2026-08-23": 24,
          "2026-08-24": 24,
          "2026-08-25": 28,
          "2026-08-26": 27,
          "2026-08-27": 23,
          "2026-08-28": 29,
          "2026-08-29": 37,
          "2026-08-30": 33,
          "2026-08-31": 30,
          "2026-09-01": 28,
          "2026-09-02": 30,
          "2026-09-03": 23,
          "2026-09-04": 22,
          "2026-09-05": 24,
          "2026-09-06": 20,
          "2026-09-07": 22,
          "2026-09-08": 14,
          "2026-09-09": 25,
          "2026-09-10": 25,
          "2026-09-11": 31,
          "2026-09-12": 24,
          "2026-09-13": 23,
          "2026-09-15": 22,
          "2026-09-16": 29,
          "2026-09-17": 31,
          "2026-09-18": 21,
          "2026-09-19": 21,
          "2026-09-20": 19,
          "2026-09-21": 21,
          "2026-09-22": 22,
          "2026-09-23": 22,
          "2026-09-24": 20,
          "2026-09-25": 30
        },
        "Greater Delhi Area": {
          "2026-02-26": 15,
          "2026-02-27": 12.9,
          "2026-03-24": 15,
          "2026-03-26": 14,
          "2026-03-27": 11,
          "2026-04-02": 9,
          "2026-04-03": 20,
          "2026-04-04": 20,
          "2026-04-14": 15,
          "2026-04-15": 15,
          "2026-04-16": 11,
          "2026-04-17": 18,
          "2026-04-18": 11,
          "2026-04-19": 12,
          "2026-04-21": 15,
          "2026-04-22": 15,
          "2026-04-23": 16,
          "2026-04-24": 14,
          "2026-04-25": 15,
          "2026-04-26": 11,
          "2026-04-27": 16,
          "2026-04-28": 16,
          "2026-04-29": 11,
          "2026-04-30": 16,
          "2026-05-01": 20,
          "2026-05-02": 18,
          "2026-05-03": 16,
          "2026-05-04": 14,
          "2026-05-05": 17,
          "2026-05-06": 15,
          "2026-05-07": 13,
          "2026-05-08": 16,
          "2026-05-09": 9,
          "2026-05-10": 12,
          "2026-05-11": 15,
          "2026-05-12": 14,
          "2026-05-13": 12,
          "2026-05-14": 13,
          "2026-05-15": 15,
          "2026-05-16": 4,
          "2026-05-17": 18,
          "2026-05-18": 14,
          "2026-05-23": 14,
          "2026-05-29": 16,
          "2026-05-30": 12,
          "2026-05-31": 16,
          "2026-06-02": 25.9,
          "2026-06-11": 14,
          "2026-06-12": 18,
          "2026-06-13": 11,
          "2026-06-15": 13,
          "2026-06-16": 12,
          "2026-06-18": 18,
          "2026-06-20": 17,
          "2026-06-21": 13,
          "2026-06-22": 13,
          "2026-06-23": 15,
          "2026-06-24": 11,
          "2026-06-25": 14,
          "2026-06-26": 17,
          "2026-06-27": 18,
          "2026-06-28": 13,
          "2026-06-29": 9,
          "2026-06-30": 14,
          "2026-07-01": 13,
          "2026-07-02": 16,
          "2026-07-03": 26,
          "2026-07-06": 17,
          "2026-07-07": 16,
          "2026-07-08": 13,
          "2026-07-09": 13,
          "2026-07-10": 24,
          "2026-07-11": 14,
          "2026-07-12": 15,
          "2026-07-13": 10,
          "2026-07-14": 15,
          "2026-07-15": 14,
          "2026-07-16": 14,
          "2026-07-17": 11,
          "2026-07-18": 18,
          "2026-07-19": 13,
          "2026-07-20": 14,
          "2026-07-21": 21,
          "2026-07-22": 17,
          "2026-07-23": 10,
          "2026-07-24": 15,
          "2026-07-25": 18,
          "2026-07-26": 20,
          "2026-07-27": 16,
          "2026-07-28": 14,
          "2026-07-29": 15,
          "2026-07-30": 17,
          "2026-07-31": 11,
          "2026-08-01": 8,
          "2026-08-02": 16,
          "2026-08-03": 11,
          "2026-08-04": 12,
          "2026-08-05": 14,
          "2026-08-06": 20,
          "2026-08-07": 16,
          "2026-08-17": 12,
          "2026-08-18": 12,
          "2026-08-19": 13,
          "2026-08-20": 9,
          "2026-08-21": 19,
          "2026-08-23": 15,
          "2026-08-24": 17,
          "2026-08-25": 13,
          "2026-08-26": 14,
          "2026-08-27": 13,
          "2026-08-28": 14,
          "2026-08-29": 13,
          "2026-08-30": 15,
          "2026-08-31": 16,
          "2026-09-01": 11,
          "2026-09-02": 13,
          "2026-09-03": 9,
          "2026-09-04": 13,
          "2026-09-05": 14,
          "2026-09-06": 15,
          "2026-09-07": 14,
          "2026-09-08": 18,
          "2026-09-09": 16,
          "2026-09-10": 12,
          "2026-09-11": 17,
          "2026-09-13": 16,
          "2026-09-14": 21,
          "2026-09-15": 16,
          "2026-09-16": 13,
          "2026-09-17": 17,
          "2026-09-18": 17,
          "2026-09-19": 15,
          "2026-09-20": 15,
          "2026-09-21": 16,
          "2026-09-22": 13,
          "2026-09-23": 15,
          "2026-09-24": 17,
          "2026-09-25": 19
        },
        "Greater Bengaluru Area": {
          "2026-02-26": 14,
          "2026-02-27": 10,
          "2026-03-01": 22.1,
          "2026-03-03": 21.1,
          "2026-03-25": 21,
          "2026-03-26": 11,
          "2026-03-27": 14,
          "2026-04-01": 26,
          "2026-04-02": 13,
          "2026-04-03": 8,
          "2026-04-14": 14,
          "2026-04-15": 12,
          "2026-04-16": 14,
          "2026-04-17": 9,
          "2026-04-19": 14,
          "2026-04-21": 16,
          "2026-04-22": 16,
          "2026-04-23": 9,
          "2026-04-24": 14,
          "2026-04-25": 12,
          "2026-04-26": 12,
          "2026-04-27": 12,
          "2026-04-28": 12,
          "2026-04-29": 12,
          "2026-04-30": 10,
          "2026-05-01": 10,
          "2026-05-02": 13,
          "2026-05-03": 13,
          "2026-05-04": 13,
          "2026-05-05": 11,
          "2026-05-06": 11,
          "2026-05-07": 13,
          "2026-05-08": 9,
          "2026-05-09": 10,
          "2026-05-10": 5,
          "2026-05-11": 11,
          "2026-05-12": 8,
          "2026-05-13": 7,
          "2026-05-14": 14,
          "2026-05-15": 10,
          "2026-05-16": 12,
          "2026-05-17": 9,
          "2026-05-18": 9,
          "2026-05-19": 11,
          "2026-05-25": 17,
          "2026-05-26": 17.9,
          "2026-05-30": 12,
          "2026-06-06": 33,
          "2026-06-11": 16,
          "2026-06-12": 11,
          "2026-06-13": 16,
          "2026-06-15": 8,
          "2026-06-20": 10,
          "2026-06-21": 12,
          "2026-06-22": 13,
          "2026-06-23": 6,
          "2026-06-24": 12,
          "2026-06-25": 17,
          "2026-06-26": 13,
          "2026-06-27": 13,
          "2026-06-28": 11,
          "2026-06-29": 7,
          "2026-06-30": 15,
          "2026-07-01": 14,
          "2026-07-03": 17.9,
          "2026-07-05": 26.1,
          "2026-07-06": 11,
          "2026-07-07": 14,
          "2026-07-08": 16,
          "2026-07-09": 12,
          "2026-07-11": 8,
          "2026-07-12": 11,
          "2026-07-13": 12,
          "2026-07-14": 16,
          "2026-07-15": 11,
          "2026-07-16": 14,
          "2026-07-17": 18,
          "2026-07-18": 12,
          "2026-07-19": 20,
          "2026-07-20": 12,
          "2026-07-21": 11,
          "2026-07-22": 14,
          "2026-07-23": 10,
          "2026-07-24": 16,
          "2026-07-25": 13,
          "2026-07-26": 13,
          "2026-07-27": 14,
          "2026-07-28": 12,
          "2026-07-29": 11,
          "2026-07-30": 12,
          "2026-07-31": 8,
          "2026-08-01": 15,
          "2026-08-02": 14,
          "2026-08-03": 16,
          "2026-08-04": 10,
          "2026-08-06": 10,
          "2026-08-10": 14,
          "2026-08-12": 23.1,
          "2026-08-17": 14,
          "2026-08-18": 13,
          "2026-08-19": 12,
          "2026-08-20": 23,
          "2026-08-21": 12,
          "2026-08-22": 12,
          "2026-08-23": 9,
          "2026-08-24": 12,
          "2026-08-25": 12,
          "2026-08-26": 14,
          "2026-08-27": 16,
          "2026-08-28": 15,
          "2026-08-29": 11,
          "2026-08-30": 11,
          "2026-08-31": 12,
          "2026-09-01": 11,
          "2026-09-02": 10,
          "2026-09-03": 13,
          "2026-09-04": 14,
          "2026-09-05": 9,
          "2026-09-06": 15,
          "2026-09-07": 13,
          "2026-09-08": 8,
          "2026-09-09": 16,
          "2026-09-10": 23,
          "2026-09-11": 12,
          "2026-09-12": 18,
          "2026-09-13": 16,
          "2026-09-14": 24,
          "2026-09-15": 10,
          "2026-09-16": 13,
          "2026-09-17": 14,
          "2026-09-18": 19,
          "2026-09-19": 18,
          "2026-09-20": 19,
          "2026-09-21": 21,
          "2026-09-22": 25,
          "2026-09-23": 21,
          "2026-09-24": 23,
          "2026-09-25": 19
        },
        "Greater Hyderabad Area": {
          "2026-02-26": 3,
          "2026-03-26": 3,
          "2026-04-14": 3,
          "2026-04-15": 4,
          "2026-04-21": 2,
          "2026-04-24": 3,
          "2026-04-25": 2,
          "2026-04-26": 6,
          "2026-04-27": 3,
          "2026-04-28": 2,
          "2026-04-29": 2,
          "2026-04-30": 2,
          "2026-05-04": 2,
          "2026-05-05": 3,
          "2026-05-06": 4,
          "2026-05-07": 2,
          "2026-05-08": 3,
          "2026-05-09": 4,
          "2026-05-10": 5,
          "2026-05-11": 4,
          "2026-05-12": 6,
          "2026-05-13": 6,
          "2026-05-15": 6,
          "2026-05-17": 5,
          "2026-06-11": 3,
          "2026-06-20": 4,
          "2026-06-21": 4,
          "2026-06-25": 3,
          "2026-06-30": 2,
          "2026-07-06": 2,
          "2026-07-10": 8,
          "2026-07-12": 2,
          "2026-07-13": 3,
          "2026-07-14": 2,
          "2026-07-18": 3,
          "2026-07-20": 3,
          "2026-07-21": 3,
          "2026-07-22": 3,
          "2026-07-24": 4,
          "2026-07-25": 5,
          "2026-07-26": 4,
          "2026-07-27": 4,
          "2026-07-28": 3,
          "2026-07-29": 4,
          "2026-07-30": 5,
          "2026-08-01": 7,
          "2026-08-02": 5,
          "2026-08-03": 5,
          "2026-08-17": 3,
          "2026-08-19": 2,
          "2026-08-20": 8,
          "2026-08-28": 3,
          "2026-09-04": 4,
          "2026-09-07": 3,
          "2026-09-11": 3,
          "2026-09-12": 11,
          "2026-09-15": 4,
          "2026-09-17": 3,
          "2026-09-18": 3,
          "2026-09-19": 4,
          "2026-09-20": 3,
          "2026-09-21": 4,
          "2026-09-22": 3,
          "2026-09-23": 3,
          "2026-09-24": 2,
          "2026-09-25": 2
        },
        "Pune/Pimpri-Chinchwad Area": {
          "2026-02-26": 2,
          "2026-03-26": 3,
          "2026-04-14": 2,
          "2026-04-15": 4,
          "2026-04-16": 4,
          "2026-04-21": 2,
          "2026-04-23": 4,
          "2026-04-24": 3,
          "2026-04-25": 3,
          "2026-04-26": 5,
          "2026-04-27": 3,
          "2026-04-28": 2,
          "2026-04-29": 2,
          "2026-04-30": 3,
          "2026-05-01": 3,
          "2026-05-04": 3,
          "2026-05-05": 3,
          "2026-05-06": 6,
          "2026-05-07": 6,
          "2026-05-08": 3,
          "2026-05-09": 4,
          "2026-05-11": 4,
          "2026-05-12": 3,
          "2026-05-13": 6,
          "2026-05-15": 6,
          "2026-05-16": 7,
          "2026-06-11": 3,
          "2026-06-15": 9,
          "2026-06-20": 2,
          "2026-06-21": 2,
          "2026-06-25": 2,
          "2026-06-27": 3,
          "2026-06-28": 6,
          "2026-06-30": 3,
          "2026-07-06": 3,
          "2026-07-07": 3,
          "2026-07-12": 2,
          "2026-07-14": 1,
          "2026-07-18": 2,
          "2026-07-20": 2,
          "2026-07-21": 3,
          "2026-07-22": 2,
          "2026-07-23": 3,
          "2026-07-24": 2,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-28": 3,
          "2026-07-29": 4,
          "2026-07-30": 3,
          "2026-08-19": 3,
          "2026-08-24": 4,
          "2026-08-26": 2,
          "2026-08-27": 3,
          "2026-08-28": 3,
          "2026-08-31": 4,
          "2026-09-02": 3,
          "2026-09-04": 4,
          "2026-09-11": 2,
          "2026-09-15": 4,
          "2026-09-17": 2,
          "2026-09-18": 2,
          "2026-09-19": 2,
          "2026-09-20": 2,
          "2026-09-21": 2,
          "2026-09-22": 2,
          "2026-09-23": 2,
          "2026-09-24": 3,
          "2026-09-25": 2
        },
        "New York City Metropolitan Area": {
          "2026-02-26": 2,
          "2026-04-15": 2,
          "2026-04-21": 1,
          "2026-04-25": 1,
          "2026-04-28": 2,
          "2026-05-01": 2,
          "2026-05-05": 2,
          "2026-06-11": 2,
          "2026-06-21": 2,
          "2026-06-30": 1,
          "2026-07-14": 2,
          "2026-08-19": 2,
          "2026-09-17": 1
        },
        "San Francisco Bay Area": {
          "2026-02-26": 2,
          "2026-03-26": 2,
          "2026-04-14": 2,
          "2026-04-15": 3,
          "2026-04-23": 2,
          "2026-04-24": 2,
          "2026-04-25": 1,
          "2026-04-28": 2,
          "2026-04-30": 2,
          "2026-05-03": 5,
          "2026-05-04": 2,
          "2026-05-05": 1,
          "2026-05-06": 2,
          "2026-05-07": 2,
          "2026-06-11": 1,
          "2026-06-20": 2,
          "2026-06-21": 2,
          "2026-06-25": 2,
          "2026-06-30": 2,
          "2026-07-14": 2,
          "2026-07-18": 2,
          "2026-08-19": 2,
          "2026-09-19": 1,
          "2026-09-20": 2,
          "2026-09-21": 1
        },
        "London Area, United Kingdom": {
          "2026-02-26": 2,
          "2026-04-24": 2,
          "2026-06-20": 2,
          "2026-06-21": 2,
          "2026-06-25": 2,
          "2026-08-28": 2
        },
        "Greater Kolkata Area": {
          "2026-02-26": 2,
          "2026-04-14": 3,
          "2026-04-15": 2,
          "2026-04-21": 2,
          "2026-04-27": 2,
          "2026-04-30": 2,
          "2026-05-06": 3,
          "2026-05-08": 2,
          "2026-05-11": 2,
          "2026-06-11": 1,
          "2026-06-22": 5,
          "2026-06-30": 1,
          "2026-07-06": 2,
          "2026-07-12": 3,
          "2026-07-18": 1,
          "2026-07-20": 1,
          "2026-07-22": 2,
          "2026-07-24": 2,
          "2026-07-25": 3,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-28": 3,
          "2026-07-29": 2,
          "2026-07-30": 3,
          "2026-08-19": 2,
          "2026-08-28": 2,
          "2026-09-04": 3,
          "2026-09-18": 2,
          "2026-09-19": 2,
          "2026-09-20": 2,
          "2026-09-21": 2,
          "2026-09-22": 2,
          "2026-09-23": 2,
          "2026-09-24": 2,
          "2026-09-25": 2
        },
        "Greater Ahmedabad Area": {
          "2026-03-26": 3,
          "2026-04-23": 2,
          "2026-04-24": 2,
          "2026-04-25": 2,
          "2026-04-27": 1,
          "2026-04-30": 2,
          "2026-05-04": 2,
          "2026-05-07": 2,
          "2026-05-08": 1,
          "2026-05-09": 3,
          "2026-05-11": 2,
          "2026-05-13": 4,
          "2026-05-14": 4,
          "2026-06-11": 2,
          "2026-06-22": 4,
          "2026-07-06": 2,
          "2026-07-12": 2,
          "2026-07-14": 2,
          "2026-07-18": 2,
          "2026-07-20": 2,
          "2026-07-22": 1,
          "2026-07-24": 2,
          "2026-07-25": 2,
          "2026-07-26": 1,
          "2026-07-27": 2,
          "2026-07-28": 2,
          "2026-07-30": 2,
          "2026-09-07": 3,
          "2026-09-09": 3,
          "2026-09-15": 3,
          "2026-09-17": 2,
          "2026-09-18": 2,
          "2026-09-19": 2,
          "2026-09-20": 2,
          "2026-09-21": 2,
          "2026-09-22": 2,
          "2026-09-23": 2
        },
        Noida: {
          "2026-03-26": 2,
          "2026-04-14": 2,
          "2026-04-21": 2,
          "2026-04-23": 2,
          "2026-04-27": 1,
          "2026-04-29": 2,
          "2026-05-05": 1,
          "2026-05-06": 2,
          "2026-05-07": 2,
          "2026-05-08": 2,
          "2026-05-11": 2,
          "2026-06-20": 2,
          "2026-06-25": 1,
          "2026-06-27": 3,
          "2026-06-30": 2,
          "2026-07-06": 2,
          "2026-07-12": 2,
          "2026-07-14": 2,
          "2026-07-18": 2,
          "2026-07-20": 1,
          "2026-07-22": 2,
          "2026-07-27": 2,
          "2026-07-28": 2,
          "2026-09-04": 4,
          "2026-09-11": 3,
          "2026-09-17": 1,
          "2026-09-18": 2,
          "2026-09-21": 2,
          "2026-09-23": 2
        },
        "Greater Chennai Area": {
          "2026-04-14": 2,
          "2026-04-15": 3,
          "2026-04-24": 2,
          "2026-04-25": 2,
          "2026-04-27": 2,
          "2026-04-29": 2,
          "2026-04-30": 2,
          "2026-05-01": 2,
          "2026-05-05": 1,
          "2026-05-06": 2,
          "2026-05-07": 2,
          "2026-05-08": 1,
          "2026-05-11": 2,
          "2026-05-12": 3,
          "2026-06-21": 2,
          "2026-06-25": 2,
          "2026-07-07": 4,
          "2026-07-12": 2,
          "2026-07-13": 4,
          "2026-07-20": 1,
          "2026-07-21": 3,
          "2026-07-22": 2,
          "2026-07-24": 2,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-29": 2,
          "2026-07-30": 2,
          "2026-08-19": 2,
          "2026-08-21": 3,
          "2026-08-28": 3,
          "2026-09-15": 2,
          "2026-09-17": 1,
          "2026-09-18": 2,
          "2026-09-19": 2,
          "2026-09-20": 2,
          "2026-09-22": 2,
          "2026-09-23": 2,
          "2026-09-24": 2
        },
        "Greater Jaipur Area": {
          "2026-04-21": 1,
          "2026-05-14": 4,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-29": 2,
          "2026-08-25": 5,
          "2026-08-26": 2
        },
        "Greater Toronto Area, Canada": {
          "2026-06-20": 1
        },
        Singapore: {
          "2026-07-24": 2
        }
      },
      "Company size": {
        "10,001+ employees": {
          "2026-02-14": 45.8,
          "2026-02-16": 34.9,
          "2026-02-26": 24,
          "2026-02-27": 30,
          "2026-02-28": 19,
          "2026-03-01": 37,
          "2026-03-03": 34.9,
          "2026-03-06": 64,
          "2026-03-10": 44.1,
          "2026-03-12": 46,
          "2026-03-14": 50,
          "2026-03-24": 13.1,
          "2026-03-25": 27.9,
          "2026-03-26": 26,
          "2026-03-27": 20,
          "2026-03-28": 30,
          "2026-03-29": 19,
          "2026-03-30": 20,
          "2026-04-01": 24,
          "2026-04-02": 26,
          "2026-04-03": 16,
          "2026-04-04": 26.1,
          "2026-04-05": 33.1,
          "2026-04-14": 25,
          "2026-04-15": 32,
          "2026-04-16": 26,
          "2026-04-17": 28,
          "2026-04-18": 32,
          "2026-04-19": 22,
          "2026-04-20": 17,
          "2026-04-21": 15,
          "2026-04-22": 29,
          "2026-04-23": 22,
          "2026-04-24": 22,
          "2026-04-25": 28,
          "2026-04-26": 24,
          "2026-04-27": 22,
          "2026-04-28": 24,
          "2026-04-29": 19,
          "2026-04-30": 20,
          "2026-05-01": 21,
          "2026-05-02": 22,
          "2026-05-03": 26,
          "2026-05-04": 24,
          "2026-05-05": 20,
          "2026-05-06": 23,
          "2026-05-07": 24,
          "2026-05-08": 17,
          "2026-05-09": 24,
          "2026-05-10": 22,
          "2026-05-11": 21,
          "2026-05-12": 16,
          "2026-05-13": 21,
          "2026-05-14": 19,
          "2026-05-15": 26,
          "2026-05-16": 31,
          "2026-05-17": 25,
          "2026-05-18": 25,
          "2026-05-19": 28,
          "2026-05-20": 29,
          "2026-05-21": 17,
          "2026-05-22": 24,
          "2026-05-23": 29,
          "2026-05-24": 24.1,
          "2026-05-25": 37,
          "2026-05-26": 35.1,
          "2026-05-27": 16.1,
          "2026-05-28": 31,
          "2026-05-29": 29,
          "2026-05-30": 31,
          "2026-05-31": 16,
          "2026-06-01": 24,
          "2026-06-03": 29,
          "2026-06-11": 26,
          "2026-06-12": 22,
          "2026-06-13": 16,
          "2026-06-14": 21,
          "2026-06-15": 29,
          "2026-06-16": 25,
          "2026-06-17": 19.1,
          "2026-06-18": 27.1,
          "2026-06-19": 32.2,
          "2026-06-20": 20,
          "2026-06-21": 23,
          "2026-06-22": 22,
          "2026-06-23": 27,
          "2026-06-24": 26,
          "2026-06-25": 25,
          "2026-06-26": 25,
          "2026-06-27": 24,
          "2026-06-28": 19,
          "2026-06-29": 20,
          "2026-06-30": 22,
          "2026-07-01": 23,
          "2026-07-02": 24,
          "2026-07-03": 24,
          "2026-07-04": 36,
          "2026-07-06": 25,
          "2026-07-07": 22,
          "2026-07-08": 19,
          "2026-07-09": 14,
          "2026-07-10": 15,
          "2026-07-11": 18,
          "2026-07-12": 16,
          "2026-07-13": 26,
          "2026-07-14": 25,
          "2026-07-15": 26,
          "2026-07-16": 18,
          "2026-07-17": 26,
          "2026-07-18": 20,
          "2026-07-19": 30,
          "2026-07-20": 17,
          "2026-07-21": 22,
          "2026-07-22": 25,
          "2026-07-23": 25,
          "2026-07-24": 33,
          "2026-07-25": 37,
          "2026-07-26": 36,
          "2026-07-27": 37,
          "2026-07-28": 38,
          "2026-07-29": 37,
          "2026-07-30": 37,
          "2026-07-31": 24,
          "2026-08-01": 29,
          "2026-08-02": 26,
          "2026-08-03": 21,
          "2026-08-04": 26,
          "2026-08-05": 23,
          "2026-08-06": 20,
          "2026-08-07": 14,
          "2026-08-09": 18.1,
          "2026-08-10": 19,
          "2026-08-11": 15,
          "2026-08-12": 23.1,
          "2026-08-13": 17,
          "2026-08-14": 24,
          "2026-08-17": 20,
          "2026-08-18": 16,
          "2026-08-19": 23,
          "2026-08-20": 34,
          "2026-08-21": 23,
          "2026-08-22": 29,
          "2026-08-23": 36,
          "2026-08-24": 26,
          "2026-08-25": 29,
          "2026-08-26": 26,
          "2026-08-27": 22,
          "2026-08-28": 22,
          "2026-08-29": 40,
          "2026-08-30": 32,
          "2026-08-31": 24,
          "2026-09-01": 21,
          "2026-09-02": 22,
          "2026-09-03": 37,
          "2026-09-04": 23,
          "2026-09-05": 24,
          "2026-09-06": 22,
          "2026-09-07": 26,
          "2026-09-08": 17,
          "2026-09-09": 20,
          "2026-09-10": 23,
          "2026-09-11": 18,
          "2026-09-12": 31,
          "2026-09-13": 35.1,
          "2026-09-14": 35,
          "2026-09-15": 27,
          "2026-09-16": 14,
          "2026-09-17": 21,
          "2026-09-18": 23,
          "2026-09-19": 26,
          "2026-09-20": 25,
          "2026-09-21": 20,
          "2026-09-22": 22,
          "2026-09-23": 20,
          "2026-09-24": 18,
          "2026-09-25": 26
        },
        "1,001-5,000 employees": {
          "2026-02-26": 16,
          "2026-02-27": 14,
          "2026-02-28": 16.9,
          "2026-03-02": 18.1,
          "2026-03-24": 20,
          "2026-03-26": 10,
          "2026-03-27": 15,
          "2026-03-31": 18.1,
          "2026-04-02": 14,
          "2026-04-03": 12,
          "2026-04-14": 11,
          "2026-04-15": 10,
          "2026-04-16": 14,
          "2026-04-17": 8,
          "2026-04-18": 9,
          "2026-04-21": 9,
          "2026-04-22": 7,
          "2026-04-23": 8,
          "2026-04-24": 11,
          "2026-04-25": 12,
          "2026-04-26": 10,
          "2026-04-27": 10,
          "2026-04-28": 12,
          "2026-04-29": 12,
          "2026-04-30": 11,
          "2026-05-01": 9,
          "2026-05-02": 14,
          "2026-05-03": 13,
          "2026-05-04": 12,
          "2026-05-05": 11,
          "2026-05-06": 12,
          "2026-05-07": 11,
          "2026-05-08": 9,
          "2026-05-09": 10,
          "2026-05-10": 12,
          "2026-05-11": 14,
          "2026-05-12": 19,
          "2026-05-13": 16,
          "2026-05-14": 14,
          "2026-05-15": 15,
          "2026-05-16": 14,
          "2026-05-17": 22,
          "2026-05-18": 16,
          "2026-05-19": 14.9,
          "2026-05-21": 21,
          "2026-05-27": 18,
          "2026-05-30": 12,
          "2026-05-31": 23,
          "2026-06-11": 10,
          "2026-06-12": 10,
          "2026-06-13": 18,
          "2026-06-15": 9,
          "2026-06-16": 15,
          "2026-06-17": 12,
          "2026-06-20": 8,
          "2026-06-21": 10,
          "2026-06-22": 10,
          "2026-06-23": 7,
          "2026-06-25": 11,
          "2026-06-26": 10,
          "2026-06-27": 10,
          "2026-06-28": 13,
          "2026-06-29": 11,
          "2026-06-30": 10,
          "2026-07-01": 7,
          "2026-07-04": 16,
          "2026-07-06": 12,
          "2026-07-07": 10,
          "2026-07-08": 11,
          "2026-07-09": 12,
          "2026-07-10": 14,
          "2026-07-11": 19,
          "2026-07-12": 8,
          "2026-07-13": 8,
          "2026-07-14": 10,
          "2026-07-15": 9,
          "2026-07-17": 8,
          "2026-07-18": 9,
          "2026-07-19": 12,
          "2026-07-20": 10,
          "2026-07-21": 9,
          "2026-07-22": 11,
          "2026-07-23": 7,
          "2026-07-24": 11,
          "2026-07-25": 13,
          "2026-07-26": 12,
          "2026-07-27": 12,
          "2026-07-28": 13,
          "2026-07-29": 14,
          "2026-07-30": 13,
          "2026-07-31": 15,
          "2026-08-01": 15,
          "2026-08-02": 8,
          "2026-08-03": 15,
          "2026-08-04": 8,
          "2026-08-05": 10,
          "2026-08-06": 12,
          "2026-08-10": 17,
          "2026-08-12": 14,
          "2026-08-15": 40,
          "2026-08-17": 11,
          "2026-08-18": 12,
          "2026-08-19": 10,
          "2026-08-20": 11,
          "2026-08-21": 11,
          "2026-08-22": 15,
          "2026-08-24": 13,
          "2026-08-25": 12,
          "2026-08-26": 12,
          "2026-08-27": 12,
          "2026-08-28": 9,
          "2026-08-29": 7,
          "2026-08-30": 13,
          "2026-08-31": 12,
          "2026-09-01": 9,
          "2026-09-02": 12,
          "2026-09-03": 13,
          "2026-09-04": 14,
          "2026-09-05": 11,
          "2026-09-06": 14,
          "2026-09-07": 13,
          "2026-09-08": 15,
          "2026-09-09": 10,
          "2026-09-11": 10,
          "2026-09-15": 10,
          "2026-09-17": 12,
          "2026-09-18": 12,
          "2026-09-19": 15,
          "2026-09-20": 12,
          "2026-09-21": 14,
          "2026-09-22": 13,
          "2026-09-23": 11,
          "2026-09-24": 14,
          "2026-09-25": 17
        },
        "51-200 employees": {
          "2026-02-26": 11,
          "2026-02-27": 12.9,
          "2026-03-02": 18.1,
          "2026-03-26": 9,
          "2026-03-30": 16,
          "2026-04-02": 6,
          "2026-04-03": 9,
          "2026-04-04": 13,
          "2026-04-14": 10,
          "2026-04-15": 8,
          "2026-04-16": 8,
          "2026-04-17": 6,
          "2026-04-19": 10,
          "2026-04-20": 20,
          "2026-04-21": 12,
          "2026-04-22": 12,
          "2026-04-23": 10,
          "2026-04-24": 10,
          "2026-04-25": 8,
          "2026-04-26": 10,
          "2026-04-27": 10,
          "2026-04-28": 10,
          "2026-04-29": 10,
          "2026-04-30": 12,
          "2026-05-01": 10,
          "2026-05-02": 15,
          "2026-05-03": 9,
          "2026-05-04": 7,
          "2026-05-05": 11,
          "2026-05-06": 11,
          "2026-05-07": 10,
          "2026-05-08": 12,
          "2026-05-09": 7,
          "2026-05-10": 10,
          "2026-05-11": 8,
          "2026-05-12": 10,
          "2026-05-13": 6,
          "2026-05-14": 7,
          "2026-05-15": 5,
          "2026-05-16": 6,
          "2026-05-17": 8,
          "2026-05-18": 6,
          "2026-05-21": 15,
          "2026-05-29": 12,
          "2026-06-01": 16,
          "2026-06-11": 9,
          "2026-06-12": 7,
          "2026-06-13": 11,
          "2026-06-15": 13,
          "2026-06-16": 8,
          "2026-06-20": 11,
          "2026-06-21": 7,
          "2026-06-22": 10,
          "2026-06-23": 6,
          "2026-06-24": 7,
          "2026-06-25": 10,
          "2026-06-26": 11,
          "2026-06-27": 8,
          "2026-06-28": 8,
          "2026-06-29": 8,
          "2026-06-30": 10,
          "2026-07-01": 13,
          "2026-07-06": 9,
          "2026-07-07": 12,
          "2026-07-09": 13,
          "2026-07-10": 11,
          "2026-07-11": 14,
          "2026-07-12": 10,
          "2026-07-13": 7,
          "2026-07-14": 8,
          "2026-07-15": 12,
          "2026-07-16": 10,
          "2026-07-17": 5,
          "2026-07-18": 8,
          "2026-07-19": 7,
          "2026-07-20": 10,
          "2026-07-21": 6,
          "2026-07-22": 10,
          "2026-07-23": 8,
          "2026-07-24": 9,
          "2026-07-25": 7,
          "2026-07-26": 9,
          "2026-07-27": 6,
          "2026-07-28": 10,
          "2026-07-29": 7,
          "2026-07-30": 9,
          "2026-07-31": 8,
          "2026-08-01": 6,
          "2026-08-02": 10,
          "2026-08-03": 10,
          "2026-08-04": 11,
          "2026-08-07": 11,
          "2026-08-17": 12,
          "2026-08-18": 9,
          "2026-08-19": 7,
          "2026-08-20": 7,
          "2026-08-21": 8,
          "2026-08-24": 9,
          "2026-08-25": 10,
          "2026-08-26": 5,
          "2026-08-27": 9,
          "2026-08-28": 11,
          "2026-08-29": 7,
          "2026-08-30": 7,
          "2026-08-31": 6,
          "2026-09-01": 5,
          "2026-09-02": 8,
          "2026-09-04": 6,
          "2026-09-05": 6,
          "2026-09-06": 11,
          "2026-09-07": 10,
          "2026-09-08": 10,
          "2026-09-09": 7,
          "2026-09-11": 8,
          "2026-09-12": 18,
          "2026-09-15": 7,
          "2026-09-17": 12,
          "2026-09-18": 10,
          "2026-09-19": 8,
          "2026-09-20": 9,
          "2026-09-21": 8,
          "2026-09-22": 8,
          "2026-09-23": 9,
          "2026-09-24": 10,
          "2026-09-25": 10
        },
        "2-10 employees": {
          "2026-02-26": 9,
          "2026-03-25": 12.9,
          "2026-03-26": 11,
          "2026-03-27": 12,
          "2026-03-31": 21,
          "2026-04-02": 14,
          "2026-04-03": 12,
          "2026-04-04": 17,
          "2026-04-07": 25.1,
          "2026-04-14": 9,
          "2026-04-15": 9,
          "2026-04-16": 5,
          "2026-04-17": 6,
          "2026-04-18": 7,
          "2026-04-19": 15,
          "2026-04-21": 11,
          "2026-04-22": 11,
          "2026-04-23": 11,
          "2026-04-24": 12,
          "2026-04-25": 9,
          "2026-04-26": 11,
          "2026-04-27": 10,
          "2026-04-28": 9,
          "2026-04-29": 10,
          "2026-04-30": 10,
          "2026-05-01": 9,
          "2026-05-02": 8,
          "2026-05-03": 6,
          "2026-05-04": 6,
          "2026-05-05": 10,
          "2026-05-06": 8,
          "2026-05-07": 9,
          "2026-05-08": 9,
          "2026-05-09": 7,
          "2026-05-11": 7,
          "2026-05-12": 5,
          "2026-05-13": 8,
          "2026-05-14": 6,
          "2026-05-16": 8,
          "2026-05-17": 5,
          "2026-05-18": 6,
          "2026-06-11": 10,
          "2026-06-12": 13,
          "2026-06-13": 14,
          "2026-06-16": 10,
          "2026-06-20": 13,
          "2026-06-21": 9,
          "2026-06-22": 10,
          "2026-06-23": 13,
          "2026-06-24": 14,
          "2026-06-25": 10,
          "2026-06-26": 14,
          "2026-06-27": 12,
          "2026-06-28": 13,
          "2026-06-29": 12,
          "2026-06-30": 9,
          "2026-07-01": 12,
          "2026-07-06": 10,
          "2026-07-07": 10,
          "2026-07-09": 9,
          "2026-07-11": 10,
          "2026-07-12": 13,
          "2026-07-13": 10,
          "2026-07-14": 12,
          "2026-07-15": 13,
          "2026-07-16": 14,
          "2026-07-17": 8,
          "2026-07-18": 9,
          "2026-07-19": 9,
          "2026-07-20": 8,
          "2026-07-21": 8,
          "2026-07-22": 8,
          "2026-07-23": 8,
          "2026-07-24": 6,
          "2026-07-25": 4,
          "2026-07-26": 5,
          "2026-07-27": 4,
          "2026-07-28": 2,
          "2026-07-29": 7,
          "2026-07-30": 3,
          "2026-08-01": 10,
          "2026-08-02": 6,
          "2026-08-03": 5,
          "2026-08-04": 7,
          "2026-08-05": 10,
          "2026-08-06": 9,
          "2026-08-07": 25,
          "2026-08-17": 12,
          "2026-08-18": 14,
          "2026-08-19": 10,
          "2026-08-20": 8,
          "2026-08-21": 11,
          "2026-08-22": 11,
          "2026-08-23": 9,
          "2026-08-24": 9,
          "2026-08-25": 7,
          "2026-08-26": 8,
          "2026-08-27": 9,
          "2026-08-28": 12,
          "2026-08-31": 8,
          "2026-09-01": 8,
          "2026-09-02": 9,
          "2026-09-03": 8,
          "2026-09-04": 10,
          "2026-09-05": 9,
          "2026-09-06": 10,
          "2026-09-07": 9,
          "2026-09-08": 14,
          "2026-09-09": 9,
          "2026-09-10": 14,
          "2026-09-11": 15,
          "2026-09-12": 11,
          "2026-09-15": 8,
          "2026-09-16": 16,
          "2026-09-17": 9,
          "2026-09-18": 7,
          "2026-09-19": 6,
          "2026-09-20": 5,
          "2026-09-21": 8,
          "2026-09-22": 6,
          "2026-09-23": 9,
          "2026-09-24": 9,
          "2026-09-25": 7
        },
        "11-50 employees": {
          "2026-02-26": 8,
          "2026-02-27": 10,
          "2026-03-26": 9,
          "2026-03-27": 11,
          "2026-04-02": 12,
          "2026-04-03": 9,
          "2026-04-14": 12,
          "2026-04-15": 9,
          "2026-04-16": 12,
          "2026-04-17": 13,
          "2026-04-18": 12,
          "2026-04-19": 12,
          "2026-04-21": 13,
          "2026-04-22": 12,
          "2026-04-23": 8,
          "2026-04-24": 10,
          "2026-04-25": 9,
          "2026-04-26": 10,
          "2026-04-27": 11,
          "2026-04-28": 11,
          "2026-04-29": 12,
          "2026-04-30": 10,
          "2026-05-01": 12,
          "2026-05-02": 8,
          "2026-05-03": 13,
          "2026-05-04": 10,
          "2026-05-05": 11,
          "2026-05-06": 8,
          "2026-05-07": 7,
          "2026-05-08": 10,
          "2026-05-09": 7,
          "2026-05-10": 7,
          "2026-05-11": 8,
          "2026-05-12": 10,
          "2026-05-13": 6,
          "2026-05-14": 10,
          "2026-05-15": 7,
          "2026-05-16": 4,
          "2026-05-17": 9,
          "2026-05-18": 13,
          "2026-05-19": 17,
          "2026-05-20": 13,
          "2026-05-25": 11,
          "2026-05-28": 19,
          "2026-05-29": 12,
          "2026-05-30": 14,
          "2026-06-11": 11,
          "2026-06-12": 9,
          "2026-06-14": 14,
          "2026-06-15": 11,
          "2026-06-16": 10,
          "2026-06-20": 12,
          "2026-06-21": 13,
          "2026-06-22": 14,
          "2026-06-23": 12,
          "2026-06-24": 15,
          "2026-06-25": 10,
          "2026-06-26": 6,
          "2026-06-27": 14,
          "2026-06-28": 9,
          "2026-06-29": 9,
          "2026-06-30": 10,
          "2026-07-01": 11,
          "2026-07-06": 10,
          "2026-07-07": 11,
          "2026-07-08": 21,
          "2026-07-09": 11,
          "2026-07-10": 10,
          "2026-07-12": 14,
          "2026-07-13": 14,
          "2026-07-14": 10,
          "2026-07-15": 9,
          "2026-07-16": 10,
          "2026-07-17": 13,
          "2026-07-18": 12,
          "2026-07-19": 11,
          "2026-07-20": 12,
          "2026-07-21": 10,
          "2026-07-22": 11,
          "2026-07-23": 12,
          "2026-07-24": 8,
          "2026-07-25": 6,
          "2026-07-26": 5,
          "2026-07-27": 8,
          "2026-07-28": 6,
          "2026-07-29": 4,
          "2026-07-30": 7,
          "2026-07-31": 10,
          "2026-08-02": 10,
          "2026-08-03": 10,
          "2026-08-04": 10,
          "2026-08-05": 12,
          "2026-08-06": 9,
          "2026-08-17": 12,
          "2026-08-18": 12,
          "2026-08-19": 11,
          "2026-08-20": 8,
          "2026-08-21": 10,
          "2026-08-24": 9,
          "2026-08-25": 9,
          "2026-08-26": 10,
          "2026-08-27": 10,
          "2026-08-28": 10,
          "2026-08-29": 11,
          "2026-08-30": 7,
          "2026-08-31": 9,
          "2026-09-01": 8,
          "2026-09-02": 15,
          "2026-09-03": 8,
          "2026-09-04": 11,
          "2026-09-05": 7,
          "2026-09-07": 9,
          "2026-09-08": 8,
          "2026-09-09": 14,
          "2026-09-10": 12,
          "2026-09-11": 13,
          "2026-09-15": 10,
          "2026-09-16": 16,
          "2026-09-17": 11,
          "2026-09-18": 10,
          "2026-09-19": 7,
          "2026-09-20": 8,
          "2026-09-21": 10,
          "2026-09-22": 11,
          "2026-09-23": 11,
          "2026-09-24": 10,
          "2026-09-25": 9
        },
        "501-1,000 employees": {
          "2026-02-26": 7,
          "2026-03-24": 13.1,
          "2026-03-26": 7,
          "2026-04-02": 5,
          "2026-04-03": 9,
          "2026-04-14": 5,
          "2026-04-15": 5,
          "2026-04-21": 6,
          "2026-04-23": 7,
          "2026-04-24": 6,
          "2026-04-25": 6,
          "2026-04-26": 6,
          "2026-04-27": 7,
          "2026-04-28": 5,
          "2026-04-29": 6,
          "2026-04-30": 6,
          "2026-05-01": 4,
          "2026-05-03": 7,
          "2026-05-04": 5,
          "2026-05-05": 6,
          "2026-05-06": 5,
          "2026-05-07": 6,
          "2026-05-08": 7,
          "2026-05-09": 7,
          "2026-05-11": 7,
          "2026-05-12": 7,
          "2026-05-13": 6,
          "2026-05-14": 8,
          "2026-05-15": 11,
          "2026-05-18": 10,
          "2026-05-22": 21.9,
          "2026-05-26": 17.9,
          "2026-06-11": 5,
          "2026-06-20": 7,
          "2026-06-21": 7,
          "2026-06-22": 5,
          "2026-06-25": 6,
          "2026-06-27": 6,
          "2026-06-28": 6,
          "2026-06-30": 9,
          "2026-07-06": 5,
          "2026-07-07": 6,
          "2026-07-09": 6,
          "2026-07-12": 5,
          "2026-07-13": 6,
          "2026-07-14": 7,
          "2026-07-16": 11,
          "2026-07-18": 8,
          "2026-07-19": 8,
          "2026-07-20": 6,
          "2026-07-21": 5,
          "2026-07-22": 7,
          "2026-07-23": 8,
          "2026-07-24": 6,
          "2026-07-25": 7,
          "2026-07-26": 7,
          "2026-07-27": 6,
          "2026-07-28": 6,
          "2026-07-29": 7,
          "2026-07-30": 8,
          "2026-07-31": 6,
          "2026-08-01": 6,
          "2026-08-03": 5,
          "2026-08-06": 7,
          "2026-08-13": 17,
          "2026-08-17": 6,
          "2026-08-18": 8,
          "2026-08-19": 5,
          "2026-08-21": 7,
          "2026-08-24": 3,
          "2026-08-25": 5,
          "2026-08-26": 5,
          "2026-08-27": 6,
          "2026-08-28": 4,
          "2026-08-29": 5,
          "2026-08-31": 6,
          "2026-09-01": 5,
          "2026-09-02": 3,
          "2026-09-04": 4,
          "2026-09-05": 6,
          "2026-09-07": 4,
          "2026-09-09": 6,
          "2026-09-11": 6,
          "2026-09-16": 10,
          "2026-09-17": 5,
          "2026-09-18": 6,
          "2026-09-19": 5,
          "2026-09-20": 7,
          "2026-09-21": 5,
          "2026-09-22": 6,
          "2026-09-23": 6,
          "2026-09-24": 6,
          "2026-09-25": 6
        },
        "201-500 employees": {
          "2026-02-26": 6,
          "2026-03-25": 15,
          "2026-03-26": 5,
          "2026-03-27": 9,
          "2026-03-30": 14,
          "2026-04-02": 10,
          "2026-04-03": 8,
          "2026-04-14": 6,
          "2026-04-15": 6,
          "2026-04-16": 12,
          "2026-04-18": 9,
          "2026-04-19": 16,
          "2026-04-21": 8,
          "2026-04-22": 5,
          "2026-04-23": 9,
          "2026-04-24": 7,
          "2026-04-25": 7,
          "2026-04-26": 6,
          "2026-04-27": 7,
          "2026-04-28": 8,
          "2026-04-29": 7,
          "2026-04-30": 8,
          "2026-05-01": 6,
          "2026-05-02": 6,
          "2026-05-04": 6,
          "2026-05-05": 8,
          "2026-05-06": 7,
          "2026-05-07": 8,
          "2026-05-08": 8,
          "2026-05-09": 8,
          "2026-05-10": 7,
          "2026-05-11": 7,
          "2026-05-12": 6,
          "2026-05-13": 8,
          "2026-05-14": 4,
          "2026-05-17": 6,
          "2026-05-18": 8,
          "2026-05-21": 14,
          "2026-05-29": 12,
          "2026-06-11": 6,
          "2026-06-12": 9,
          "2026-06-14": 14,
          "2026-06-20": 6,
          "2026-06-21": 7,
          "2026-06-22": 6,
          "2026-06-23": 6,
          "2026-06-24": 9,
          "2026-06-25": 7,
          "2026-06-27": 6,
          "2026-06-28": 8,
          "2026-06-30": 7,
          "2026-07-01": 9,
          "2026-07-06": 6,
          "2026-07-07": 6,
          "2026-07-09": 6,
          "2026-07-10": 9,
          "2026-07-11": 9,
          "2026-07-12": 6,
          "2026-07-13": 4,
          "2026-07-14": 7,
          "2026-07-17": 9,
          "2026-07-18": 8,
          "2026-07-19": 6,
          "2026-07-20": 7,
          "2026-07-21": 4,
          "2026-07-22": 7,
          "2026-07-23": 7,
          "2026-07-24": 7,
          "2026-07-25": 5,
          "2026-07-26": 7,
          "2026-07-27": 8,
          "2026-07-28": 7,
          "2026-07-29": 6,
          "2026-07-30": 6,
          "2026-08-02": 7,
          "2026-08-03": 8,
          "2026-08-04": 9,
          "2026-08-06": 9,
          "2026-08-17": 4,
          "2026-08-18": 9,
          "2026-08-19": 6,
          "2026-08-21": 4,
          "2026-08-23": 8,
          "2026-08-24": 6,
          "2026-08-25": 5,
          "2026-08-26": 9,
          "2026-08-27": 8,
          "2026-08-28": 6,
          "2026-08-30": 11,
          "2026-08-31": 6,
          "2026-09-01": 5,
          "2026-09-02": 4,
          "2026-09-04": 6,
          "2026-09-07": 6,
          "2026-09-11": 5,
          "2026-09-15": 7,
          "2026-09-17": 6,
          "2026-09-18": 8,
          "2026-09-19": 9,
          "2026-09-20": 8,
          "2026-09-21": 9,
          "2026-09-22": 8,
          "2026-09-23": 8,
          "2026-09-24": 5,
          "2026-09-25": 9
        },
        "5,001-10,000 employees": {
          "2026-02-26": 5,
          "2026-03-26": 6,
          "2026-04-03": 9,
          "2026-04-14": 5,
          "2026-04-15": 5,
          "2026-04-16": 8,
          "2026-04-21": 6,
          "2026-04-22": 5,
          "2026-04-23": 6,
          "2026-04-24": 5,
          "2026-04-25": 7,
          "2026-04-26": 5,
          "2026-04-27": 6,
          "2026-04-28": 6,
          "2026-04-29": 6,
          "2026-04-30": 8,
          "2026-05-01": 8,
          "2026-05-02": 5,
          "2026-05-04": 6,
          "2026-05-05": 6,
          "2026-05-06": 6,
          "2026-05-07": 7,
          "2026-05-08": 4,
          "2026-05-09": 5,
          "2026-05-10": 7,
          "2026-05-11": 8,
          "2026-05-12": 8,
          "2026-05-13": 9,
          "2026-05-14": 8,
          "2026-05-15": 10,
          "2026-05-16": 8,
          "2026-05-17": 8,
          "2026-05-18": 7,
          "2026-06-11": 5,
          "2026-06-15": 8,
          "2026-06-20": 6,
          "2026-06-21": 5,
          "2026-06-22": 5,
          "2026-06-23": 7,
          "2026-06-25": 5,
          "2026-06-27": 4,
          "2026-06-28": 6,
          "2026-06-29": 7,
          "2026-06-30": 5,
          "2026-07-01": 6,
          "2026-07-03": 16,
          "2026-07-06": 5,
          "2026-07-07": 4,
          "2026-07-12": 5,
          "2026-07-13": 4,
          "2026-07-14": 5,
          "2026-07-18": 5,
          "2026-07-19": 6,
          "2026-07-20": 4,
          "2026-07-21": 6,
          "2026-07-22": 6,
          "2026-07-23": 3,
          "2026-07-24": 6,
          "2026-07-25": 7,
          "2026-07-26": 7,
          "2026-07-27": 6,
          "2026-07-28": 6,
          "2026-07-29": 6,
          "2026-07-30": 5,
          "2026-07-31": 9,
          "2026-08-01": 6,
          "2026-08-03": 5,
          "2026-08-17": 3,
          "2026-08-18": 9,
          "2026-08-19": 6,
          "2026-08-20": 6,
          "2026-08-21": 9,
          "2026-08-24": 8,
          "2026-08-25": 5,
          "2026-08-26": 7,
          "2026-08-27": 6,
          "2026-08-28": 6,
          "2026-08-30": 7,
          "2026-08-31": 3,
          "2026-09-01": 8,
          "2026-09-02": 4,
          "2026-09-04": 4,
          "2026-09-07": 5,
          "2026-09-09": 6,
          "2026-09-11": 6,
          "2026-09-15": 6,
          "2026-09-17": 4,
          "2026-09-18": 6,
          "2026-09-19": 7,
          "2026-09-20": 7,
          "2026-09-21": 6,
          "2026-09-22": 6,
          "2026-09-23": 7,
          "2026-09-24": 6,
          "2026-09-25": 5
        }
      },
      "Job title": {
        Founder: {
          "2026-02-26": 5,
          "2026-03-26": 7,
          "2026-03-27": 9,
          "2026-04-02": 6,
          "2026-04-03": 8,
          "2026-04-14": 7,
          "2026-04-15": 6,
          "2026-04-16": 5,
          "2026-04-19": 8,
          "2026-04-21": 6,
          "2026-04-23": 10,
          "2026-04-24": 11,
          "2026-04-25": 6,
          "2026-04-26": 5,
          "2026-04-27": 8,
          "2026-04-28": 7,
          "2026-04-29": 7,
          "2026-04-30": 6,
          "2026-05-01": 5,
          "2026-05-03": 6,
          "2026-05-04": 5,
          "2026-05-05": 7,
          "2026-05-06": 5,
          "2026-05-07": 6,
          "2026-05-08": 6,
          "2026-05-09": 4,
          "2026-05-10": 5,
          "2026-05-11": 4,
          "2026-05-12": 4,
          "2026-05-13": 4,
          "2026-05-14": 6,
          "2026-05-16": 4,
          "2026-06-11": 5,
          "2026-06-13": 12,
          "2026-06-16": 8,
          "2026-06-20": 7,
          "2026-06-21": 6,
          "2026-06-22": 4,
          "2026-06-23": 11,
          "2026-06-24": 9,
          "2026-06-25": 6,
          "2026-06-26": 7,
          "2026-06-27": 8,
          "2026-06-28": 13,
          "2026-06-30": 6,
          "2026-07-01": 9,
          "2026-07-06": 5,
          "2026-07-07": 4,
          "2026-07-09": 7,
          "2026-07-12": 9,
          "2026-07-13": 6,
          "2026-07-14": 8,
          "2026-07-17": 6,
          "2026-07-18": 7,
          "2026-07-20": 5,
          "2026-07-21": 4,
          "2026-07-22": 5,
          "2026-07-23": 4,
          "2026-07-24": 4,
          "2026-07-25": 3,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-28": 2,
          "2026-07-29": 4,
          "2026-07-30": 2,
          "2026-08-17": 6,
          "2026-08-19": 6,
          "2026-08-21": 6,
          "2026-08-24": 5,
          "2026-08-25": 5,
          "2026-08-26": 6,
          "2026-08-27": 5,
          "2026-08-28": 8,
          "2026-08-31": 7,
          "2026-09-01": 6,
          "2026-09-02": 8,
          "2026-09-04": 8,
          "2026-09-06": 9,
          "2026-09-07": 5,
          "2026-09-08": 8,
          "2026-09-09": 8,
          "2026-09-11": 10,
          "2026-09-15": 6,
          "2026-09-17": 6,
          "2026-09-18": 5,
          "2026-09-19": 4,
          "2026-09-20": 3,
          "2026-09-21": 4,
          "2026-09-22": 5,
          "2026-09-23": 7,
          "2026-09-24": 5,
          "2026-09-25": 5
        },
        "Co-Founder": {
          "2026-02-26": 5,
          "2026-02-27": 9.1,
          "2026-03-26": 4,
          "2026-04-14": 4,
          "2026-04-15": 4,
          "2026-04-16": 5,
          "2026-04-21": 5,
          "2026-04-22": 7,
          "2026-04-23": 4,
          "2026-04-24": 4,
          "2026-04-25": 4,
          "2026-04-26": 4,
          "2026-04-27": 5,
          "2026-04-28": 5,
          "2026-04-29": 6,
          "2026-04-30": 4,
          "2026-05-01": 5,
          "2026-05-04": 4,
          "2026-05-05": 5,
          "2026-05-06": 4,
          "2026-05-07": 3,
          "2026-05-08": 3,
          "2026-05-11": 2,
          "2026-05-14": 4,
          "2026-05-16": 4,
          "2026-06-11": 4,
          "2026-06-20": 5,
          "2026-06-21": 4,
          "2026-06-22": 5,
          "2026-06-23": 4,
          "2026-06-25": 5,
          "2026-06-26": 6,
          "2026-06-27": 7,
          "2026-06-30": 5,
          "2026-07-06": 6,
          "2026-07-07": 4,
          "2026-07-12": 4,
          "2026-07-14": 4,
          "2026-07-18": 5,
          "2026-07-20": 3,
          "2026-07-22": 4,
          "2026-07-23": 5,
          "2026-07-24": 3,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-28": 2,
          "2026-07-29": 3,
          "2026-07-30": 2,
          "2026-08-17": 6,
          "2026-08-19": 4,
          "2026-08-21": 4,
          "2026-08-22": 10,
          "2026-08-24": 4,
          "2026-08-26": 5,
          "2026-08-27": 4,
          "2026-08-28": 5,
          "2026-09-04": 3,
          "2026-09-07": 4,
          "2026-09-09": 6,
          "2026-09-11": 6,
          "2026-09-15": 4,
          "2026-09-17": 4,
          "2026-09-18": 3,
          "2026-09-19": 3,
          "2026-09-20": 2,
          "2026-09-21": 4,
          "2026-09-22": 3,
          "2026-09-23": 4,
          "2026-09-24": 3,
          "2026-09-25": 3
        },
        "Sales Manager": {
          "2026-02-26": 3,
          "2026-03-26": 2,
          "2026-04-14": 1,
          "2026-04-15": 2,
          "2026-04-21": 1,
          "2026-04-23": 3,
          "2026-04-24": 1,
          "2026-04-25": 2,
          "2026-04-27": 2,
          "2026-04-28": 2,
          "2026-04-29": 2,
          "2026-04-30": 3,
          "2026-05-01": 2,
          "2026-05-05": 2,
          "2026-05-06": 3,
          "2026-05-07": 2,
          "2026-05-08": 1,
          "2026-05-11": 4,
          "2026-05-12": 4,
          "2026-05-14": 9,
          "2026-05-15": 10,
          "2026-05-17": 6,
          "2026-06-11": 2,
          "2026-06-20": 1,
          "2026-06-21": 2,
          "2026-06-23": 5,
          "2026-06-25": 1,
          "2026-06-30": 0.5,
          "2026-07-06": 2,
          "2026-07-12": 1,
          "2026-07-14": 1,
          "2026-07-20": 0.5,
          "2026-07-22": 2,
          "2026-07-23": 3,
          "2026-07-24": 1,
          "2026-07-25": 3,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-28": 3,
          "2026-07-29": 3,
          "2026-07-30": 3,
          "2026-08-19": 3,
          "2026-08-21": 3,
          "2026-08-24": 5,
          "2026-08-26": 3,
          "2026-08-27": 3,
          "2026-08-28": 3,
          "2026-09-01": 5,
          "2026-09-02": 5,
          "2026-09-04": 3,
          "2026-09-07": 4,
          "2026-09-09": 4,
          "2026-09-15": 4,
          "2026-09-17": 2,
          "2026-09-18": 2,
          "2026-09-19": 2,
          "2026-09-20": 3,
          "2026-09-21": 2,
          "2026-09-22": 2,
          "2026-09-23": 4,
          "2026-09-25": 2
        },
        "Product Manager": {
          "2026-02-26": 2,
          "2026-04-14": 2,
          "2026-04-15": 3,
          "2026-04-16": 4,
          "2026-04-21": 2,
          "2026-04-24": 3,
          "2026-04-25": 1,
          "2026-04-27": 2,
          "2026-04-28": 2,
          "2026-04-30": 0.5,
          "2026-05-01": 2,
          "2026-05-05": 2,
          "2026-05-06": 1,
          "2026-05-07": 2,
          "2026-05-08": 1,
          "2026-05-11": 1,
          "2026-06-11": 2,
          "2026-06-20": 1,
          "2026-06-21": 2,
          "2026-06-25": 2,
          "2026-06-30": 2,
          "2026-07-07": 3,
          "2026-07-12": 2,
          "2026-07-14": 4,
          "2026-07-18": 1,
          "2026-07-20": 1,
          "2026-07-22": 2,
          "2026-07-24": 3,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-07-28": 3,
          "2026-07-29": 4,
          "2026-07-30": 3,
          "2026-09-17": 1,
          "2026-09-18": 1,
          "2026-09-19": 1,
          "2026-09-20": 0.5,
          "2026-09-21": 2,
          "2026-09-22": 1
        },
        "Program Manager": {
          "2026-02-26": 2,
          "2026-06-20": 1,
          "2026-06-25": 0.5,
          "2026-06-30": 0.5,
          "2026-07-20": 0.5,
          "2026-07-22": 0.5,
          "2026-09-18": 0.5,
          "2026-09-19": 0.5,
          "2026-09-20": 0.5,
          "2026-09-21": 1,
          "2026-09-22": 1
        },
        "Software Engineer": {
          "2026-02-26": 1,
          "2026-04-14": 2,
          "2026-04-15": 4,
          "2026-04-21": 2,
          "2026-04-23": 2,
          "2026-04-24": 3,
          "2026-04-25": 2,
          "2026-04-26": 5,
          "2026-04-27": 0.5,
          "2026-04-30": 1,
          "2026-05-04": 2,
          "2026-05-06": 4,
          "2026-05-07": 5,
          "2026-05-08": 0.5,
          "2026-05-09": 3,
          "2026-05-11": 2,
          "2026-05-13": 4,
          "2026-05-17": 8,
          "2026-06-11": 2,
          "2026-06-20": 1,
          "2026-06-25": 3,
          "2026-06-30": 1,
          "2026-07-06": 2,
          "2026-07-07": 3,
          "2026-07-12": 1,
          "2026-07-18": 2,
          "2026-07-20": 1,
          "2026-07-23": 4,
          "2026-07-24": 4,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-08-02": 5,
          "2026-08-03": 5,
          "2026-08-17": 3,
          "2026-09-04": 3,
          "2026-09-17": 2,
          "2026-09-18": 3,
          "2026-09-19": 4,
          "2026-09-20": 4,
          "2026-09-21": 3,
          "2026-09-22": 3,
          "2026-09-23": 3,
          "2026-09-24": 3
        },
        "General Manager": {
          "2026-03-26": 2,
          "2026-04-14": 1,
          "2026-04-16": 4,
          "2026-04-21": 1,
          "2026-04-23": 2,
          "2026-04-27": 2,
          "2026-05-05": 1,
          "2026-05-08": 0.5,
          "2026-06-11": 1,
          "2026-06-25": 2,
          "2026-06-30": 0.5,
          "2026-07-06": 2,
          "2026-07-12": 0.5,
          "2026-07-22": 2,
          "2026-07-24": 1,
          "2026-07-26": 1,
          "2026-07-27": 1,
          "2026-09-11": 2,
          "2026-09-18": 1,
          "2026-09-19": 1,
          "2026-09-20": 1,
          "2026-09-21": 1,
          "2026-09-23": 1
        },
        "Growth Specialist": {
          "2026-03-26": 2
        },
        "Chief Executive Officer": {
          "2026-04-14": 0.5,
          "2026-04-21": 1,
          "2026-04-30": 1,
          "2026-05-05": 1,
          "2026-05-08": 0.5,
          "2026-06-11": 1,
          "2026-06-20": 1,
          "2026-06-21": 2,
          "2026-06-25": 1,
          "2026-06-30": 1,
          "2026-07-06": 2,
          "2026-07-14": 1,
          "2026-07-22": 1,
          "2026-07-24": 0.5,
          "2026-07-25": 0.5,
          "2026-07-28": 2,
          "2026-09-18": 0.5,
          "2026-09-20": 0.5,
          "2026-09-21": 0.5
        },
        "Managing Director": {
          "2026-04-14": 0.5,
          "2026-04-27": 0.5,
          "2026-04-28": 2,
          "2026-04-30": 0.5,
          "2026-05-05": 0.5,
          "2026-06-27": 3,
          "2026-07-12": 0.5,
          "2026-07-22": 0.5,
          "2026-08-28": 2,
          "2026-09-11": 2,
          "2026-09-18": 0.5
        },
        "Business Development Manager": {
          "2026-04-14": 0.5,
          "2026-07-12": 0.5
        },
        "Relationship Manager": {
          "2026-04-23": 2,
          "2026-04-27": 0.5,
          "2026-04-30": 1,
          "2026-05-05": 0.5,
          "2026-05-11": 1,
          "2026-07-26": 2,
          "2026-09-09": 3,
          "2026-09-23": 1
        },
        "Head of Sales": {
          "2026-04-26": 3,
          "2026-04-27": 1,
          "2026-04-30": 0.5,
          "2026-05-05": 1,
          "2026-05-08": 0.5,
          "2026-05-11": 0.5,
          "2026-06-30": 1,
          "2026-07-14": 1,
          "2026-07-22": 0.5,
          "2026-07-25": 0.5,
          "2026-07-27": 1
        },
        "Project Manager": {
          "2026-05-08": 0.5
        },
        "Credit Manager": {
          "2026-05-11": 2,
          "2026-05-12": 3,
          "2026-05-15": 6,
          "2026-07-24": 0.5,
          "2026-07-25": 2,
          "2026-07-26": 4,
          "2026-07-27": 2,
          "2026-07-28": 3,
          "2026-07-29": 3,
          "2026-07-30": 4,
          "2026-09-15": 3
        },
        "Technical Manager": {
          "2026-05-11": 1,
          "2026-07-25": 0.5,
          "2026-07-26": 0.5
        },
        Editor: {
          "2026-06-11": 0.5
        },
        "Human Resources Business Partner": {
          "2026-06-20": 0.5
        },
        "Business Specialist": {
          "2026-06-20": 0.5
        },
        "Chief Operating Officer": {
          "2026-06-25": 1
        },
        "Head of Marketing": {
          "2026-07-12": 0.5
        },
        "Professor of Mathematics": {
          "2026-07-20": 1
        },
        "Human Resources Executive": {
          "2026-07-20": 0.5
        },
        Lecturer: {
          "2026-07-20": 0.5
        },
        "Data Scientist": {
          "2026-07-24": 0.5
        },
        "Investment Specialist": {
          "2026-07-27": 1
        },
        "Operations Manager": {
          "2026-08-24": 2,
          "2026-09-21": 0.5,
          "2026-09-22": 1
        },
        Lawyer: {
          "2026-09-17": 2
        },
        "Legal Manager": {
          "2026-09-17": 1
        },
        "General Counsel": {
          "2026-09-17": 1
        },
        "Legal Counsel": {
          "2026-09-17": 1
        },
        "Product Designer": {
          "2026-09-19": 1
        },
        "Sales Executive": {
          "2026-09-19": 0.5
        },
        "Key Account Manager": {
          "2026-09-20": 0.5
        }
      },
      Industry: {
        "Financial Services": {
          "2026-02-26": 14,
          "2026-02-27": 19.1,
          "2026-03-02": 26.9,
          "2026-03-24": 11.9,
          "2026-03-25": 11,
          "2026-03-26": 15,
          "2026-03-27": 15,
          "2026-03-28": 14.1,
          "2026-04-01": 16,
          "2026-04-02": 15,
          "2026-04-03": 14,
          "2026-04-04": 13,
          "2026-04-14": 11,
          "2026-04-15": 12,
          "2026-04-16": 8,
          "2026-04-18": 11,
          "2026-04-19": 12,
          "2026-04-21": 12,
          "2026-04-22": 10,
          "2026-04-23": 12,
          "2026-04-24": 14,
          "2026-04-25": 16,
          "2026-04-26": 13,
          "2026-04-27": 15,
          "2026-04-28": 14,
          "2026-04-29": 15,
          "2026-04-30": 16,
          "2026-05-01": 14,
          "2026-05-02": 17,
          "2026-05-03": 16,
          "2026-05-04": 14,
          "2026-05-05": 18,
          "2026-05-06": 16,
          "2026-05-07": 16,
          "2026-05-08": 11,
          "2026-05-09": 13,
          "2026-05-10": 18,
          "2026-05-11": 23,
          "2026-05-12": 21,
          "2026-05-13": 26,
          "2026-05-14": 35,
          "2026-05-15": 28,
          "2026-05-16": 20,
          "2026-05-17": 21,
          "2026-05-18": 30,
          "2026-05-19": 18,
          "2026-05-21": 12,
          "2026-05-22": 16,
          "2026-05-25": 20,
          "2026-05-26": 21,
          "2026-05-28": 31,
          "2026-05-30": 12,
          "2026-05-31": 27,
          "2026-06-04": 35,
          "2026-06-11": 15,
          "2026-06-12": 14,
          "2026-06-13": 14,
          "2026-06-15": 15,
          "2026-06-16": 14,
          "2026-06-17": 20.9,
          "2026-06-18": 21,
          "2026-06-20": 10,
          "2026-06-21": 15,
          "2026-06-22": 12,
          "2026-06-23": 14,
          "2026-06-24": 10,
          "2026-06-25": 12,
          "2026-06-26": 14,
          "2026-06-27": 12,
          "2026-06-28": 15,
          "2026-06-29": 12,
          "2026-06-30": 13,
          "2026-07-01": 14,
          "2026-07-06": 11,
          "2026-07-07": 13,
          "2026-07-08": 24,
          "2026-07-09": 20,
          "2026-07-10": 15,
          "2026-07-11": 12,
          "2026-07-12": 11,
          "2026-07-13": 10,
          "2026-07-14": 12,
          "2026-07-15": 10,
          "2026-07-17": 8,
          "2026-07-18": 13,
          "2026-07-19": 17,
          "2026-07-20": 7,
          "2026-07-21": 15,
          "2026-07-22": 13,
          "2026-07-23": 16,
          "2026-07-24": 20,
          "2026-07-25": 30,
          "2026-07-26": 32,
          "2026-07-27": 32,
          "2026-07-28": 32,
          "2026-07-29": 30,
          "2026-07-30": 28,
          "2026-07-31": 13,
          "2026-08-01": 13,
          "2026-08-02": 19,
          "2026-08-03": 14,
          "2026-08-04": 16,
          "2026-08-05": 11,
          "2026-08-06": 10,
          "2026-08-07": 14,
          "2026-08-17": 10,
          "2026-08-18": 17,
          "2026-08-19": 14,
          "2026-08-20": 18,
          "2026-08-21": 16,
          "2026-08-22": 22,
          "2026-08-23": 13,
          "2026-08-24": 24,
          "2026-08-25": 33,
          "2026-08-26": 16,
          "2026-08-27": 21,
          "2026-08-28": 21,
          "2026-08-29": 31,
          "2026-08-30": 26,
          "2026-08-31": 23,
          "2026-09-01": 22,
          "2026-09-02": 16,
          "2026-09-03": 27,
          "2026-09-04": 20,
          "2026-09-05": 24,
          "2026-09-06": 27,
          "2026-09-07": 17,
          "2026-09-08": 21,
          "2026-09-09": 24,
          "2026-09-10": 15,
          "2026-09-11": 14,
          "2026-09-12": 18,
          "2026-09-13": 19,
          "2026-09-15": 28,
          "2026-09-16": 22,
          "2026-09-17": 10,
          "2026-09-18": 11,
          "2026-09-19": 12,
          "2026-09-20": 12,
          "2026-09-21": 12,
          "2026-09-22": 12,
          "2026-09-23": 12,
          "2026-09-24": 9,
          "2026-09-25": 19
        },
        "Technology, Information and Internet": {
          "2026-02-26": 8,
          "2026-02-27": 12.9,
          "2026-03-24": 11.9,
          "2026-03-26": 6,
          "2026-03-27": 15,
          "2026-04-02": 7,
          "2026-04-14": 8,
          "2026-04-15": 7,
          "2026-04-16": 11,
          "2026-04-21": 8,
          "2026-04-22": 6,
          "2026-04-23": 6,
          "2026-04-24": 8,
          "2026-04-25": 8,
          "2026-04-26": 6,
          "2026-04-27": 7,
          "2026-04-28": 7,
          "2026-04-29": 8,
          "2026-04-30": 9,
          "2026-05-01": 9,
          "2026-05-02": 8,
          "2026-05-03": 11,
          "2026-05-04": 9,
          "2026-05-05": 6,
          "2026-05-06": 8,
          "2026-05-07": 7,
          "2026-05-08": 5,
          "2026-05-09": 7,
          "2026-05-10": 6,
          "2026-05-11": 6,
          "2026-05-12": 5,
          "2026-05-13": 6,
          "2026-05-16": 10,
          "2026-05-17": 7,
          "2026-05-18": 5,
          "2026-06-11": 6,
          "2026-06-12": 8,
          "2026-06-20": 8,
          "2026-06-21": 9,
          "2026-06-22": 5,
          "2026-06-23": 4,
          "2026-06-24": 8,
          "2026-06-25": 9,
          "2026-06-26": 8,
          "2026-06-27": 10,
          "2026-06-28": 11,
          "2026-06-30": 8,
          "2026-07-05": 26.1,
          "2026-07-06": 10,
          "2026-07-07": 8,
          "2026-07-10": 14,
          "2026-07-11": 8,
          "2026-07-12": 7,
          "2026-07-13": 9,
          "2026-07-14": 10,
          "2026-07-15": 6,
          "2026-07-16": 11,
          "2026-07-17": 15,
          "2026-07-18": 8,
          "2026-07-19": 7,
          "2026-07-20": 6,
          "2026-07-21": 5,
          "2026-07-22": 8,
          "2026-07-23": 10,
          "2026-07-24": 8,
          "2026-07-25": 5,
          "2026-07-26": 5,
          "2026-07-27": 4,
          "2026-07-28": 5,
          "2026-07-30": 4,
          "2026-07-31": 6,
          "2026-08-01": 6,
          "2026-08-02": 8,
          "2026-08-03": 7,
          "2026-08-04": 8,
          "2026-08-05": 7,
          "2026-08-06": 7,
          "2026-08-17": 8,
          "2026-08-19": 4,
          "2026-08-21": 4,
          "2026-08-24": 3,
          "2026-08-25": 5,
          "2026-08-26": 7,
          "2026-08-27": 5,
          "2026-08-28": 5,
          "2026-08-31": 6,
          "2026-09-02": 6,
          "2026-09-04": 4,
          "2026-09-07": 5,
          "2026-09-09": 5,
          "2026-09-11": 7,
          "2026-09-15": 3,
          "2026-09-17": 8,
          "2026-09-18": 9,
          "2026-09-19": 7,
          "2026-09-20": 6,
          "2026-09-21": 9,
          "2026-09-22": 9,
          "2026-09-23": 7,
          "2026-09-24": 8,
          "2026-09-25": 6
        },
        "Education Administration Programs": {
          "2026-02-26": 5,
          "2026-03-26": 5,
          "2026-04-01": 17.9,
          "2026-04-02": 6,
          "2026-04-14": 4,
          "2026-04-15": 6,
          "2026-04-21": 5,
          "2026-04-23": 4,
          "2026-04-24": 5,
          "2026-04-25": 3,
          "2026-04-26": 5,
          "2026-04-27": 5,
          "2026-04-28": 4,
          "2026-04-29": 4,
          "2026-04-30": 4,
          "2026-05-01": 4,
          "2026-05-05": 4,
          "2026-05-06": 5,
          "2026-05-07": 4,
          "2026-05-08": 6,
          "2026-05-11": 4,
          "2026-05-17": 5,
          "2026-06-11": 3,
          "2026-06-12": 9,
          "2026-06-20": 6,
          "2026-06-21": 3,
          "2026-06-22": 6,
          "2026-06-24": 7,
          "2026-06-25": 4,
          "2026-06-27": 3,
          "2026-06-30": 4,
          "2026-07-06": 3,
          "2026-07-07": 4,
          "2026-07-09": 8,
          "2026-07-12": 4,
          "2026-07-14": 3,
          "2026-07-20": 7,
          "2026-07-22": 6,
          "2026-07-23": 4,
          "2026-07-24": 2,
          "2026-07-25": 1,
          "2026-07-30": 3,
          "2026-07-31": 5,
          "2026-08-01": 7,
          "2026-08-03": 7,
          "2026-08-19": 5,
          "2026-08-21": 3,
          "2026-08-26": 3,
          "2026-09-07": 4,
          "2026-09-11": 4,
          "2026-09-18": 2,
          "2026-09-24": 4
        },
        "Business Consulting and Services": {
          "2026-02-26": 5,
          "2026-03-26": 6,
          "2026-04-02": 6,
          "2026-04-14": 6,
          "2026-04-15": 7,
          "2026-04-16": 5,
          "2026-04-17": 9,
          "2026-04-18": 7,
          "2026-04-21": 5,
          "2026-04-22": 5,
          "2026-04-23": 6,
          "2026-04-24": 6,
          "2026-04-25": 5,
          "2026-04-26": 5,
          "2026-04-27": 5,
          "2026-04-28": 6,
          "2026-04-29": 2,
          "2026-04-30": 5,
          "2026-05-01": 6,
          "2026-05-02": 5,
          "2026-05-04": 5,
          "2026-05-05": 5,
          "2026-05-06": 4,
          "2026-05-07": 3,
          "2026-05-08": 6,
          "2026-05-09": 4,
          "2026-05-10": 8,
          "2026-05-11": 4,
          "2026-05-12": 7,
          "2026-05-13": 6,
          "2026-05-18": 5,
          "2026-06-11": 4,
          "2026-06-20": 6,
          "2026-06-21": 5,
          "2026-06-23": 6,
          "2026-06-25": 5,
          "2026-06-27": 3,
          "2026-06-30": 5,
          "2026-07-06": 6,
          "2026-07-07": 3,
          "2026-07-11": 8,
          "2026-07-12": 6,
          "2026-07-13": 4,
          "2026-07-14": 5,
          "2026-07-17": 6,
          "2026-07-18": 4,
          "2026-07-20": 4,
          "2026-07-22": 6,
          "2026-07-24": 4,
          "2026-07-25": 2,
          "2026-07-26": 4,
          "2026-07-27": 2,
          "2026-08-02": 5,
          "2026-08-05": 8,
          "2026-08-06": 7,
          "2026-08-19": 5,
          "2026-08-21": 3,
          "2026-08-24": 3,
          "2026-08-26": 5,
          "2026-08-27": 5,
          "2026-08-28": 5,
          "2026-09-02": 5,
          "2026-09-04": 4,
          "2026-09-07": 3,
          "2026-09-09": 4,
          "2026-09-11": 4,
          "2026-09-15": 4,
          "2026-09-17": 3,
          "2026-09-18": 5,
          "2026-09-19": 4,
          "2026-09-20": 3,
          "2026-09-21": 5,
          "2026-09-22": 3,
          "2026-09-23": 4,
          "2026-09-24": 4,
          "2026-09-25": 4
        },
        "IT Services and IT Consulting": {
          "2026-02-26": 5,
          "2026-03-24": 10,
          "2026-03-26": 6,
          "2026-04-02": 8,
          "2026-04-14": 8,
          "2026-04-15": 7,
          "2026-04-16": 9,
          "2026-04-17": 9,
          "2026-04-21": 7,
          "2026-04-22": 6,
          "2026-04-23": 6,
          "2026-04-24": 6,
          "2026-04-25": 6,
          "2026-04-26": 7,
          "2026-04-27": 6,
          "2026-04-28": 8,
          "2026-04-29": 6,
          "2026-04-30": 6,
          "2026-05-01": 3,
          "2026-05-02": 7,
          "2026-05-03": 5,
          "2026-05-04": 4,
          "2026-05-05": 5,
          "2026-05-06": 8,
          "2026-05-07": 7,
          "2026-05-08": 6,
          "2026-05-09": 5,
          "2026-05-10": 8,
          "2026-05-11": 5,
          "2026-05-12": 5,
          "2026-05-13": 8,
          "2026-05-16": 4,
          "2026-05-17": 5,
          "2026-05-18": 6,
          "2026-05-25": 11,
          "2026-05-30": 12,
          "2026-06-11": 6,
          "2026-06-12": 7,
          "2026-06-15": 11,
          "2026-06-16": 11,
          "2026-06-17": 12,
          "2026-06-20": 3,
          "2026-06-21": 7,
          "2026-06-22": 5,
          "2026-06-23": 9,
          "2026-06-24": 18,
          "2026-06-25": 7,
          "2026-06-26": 10,
          "2026-06-27": 4,
          "2026-06-28": 6,
          "2026-06-30": 7,
          "2026-07-01": 8,
          "2026-07-02": 14,
          "2026-07-03": 16,
          "2026-07-04": 20,
          "2026-07-06": 5,
          "2026-07-07": 11,
          "2026-07-09": 6,
          "2026-07-11": 9,
          "2026-07-12": 7,
          "2026-07-13": 9,
          "2026-07-14": 6,
          "2026-07-16": 11,
          "2026-07-17": 8,
          "2026-07-18": 5,
          "2026-07-19": 5,
          "2026-07-20": 8,
          "2026-07-21": 8,
          "2026-07-22": 7,
          "2026-07-23": 8,
          "2026-07-24": 8,
          "2026-07-25": 6,
          "2026-07-26": 5,
          "2026-07-27": 5,
          "2026-07-28": 6,
          "2026-07-29": 4,
          "2026-07-30": 4,
          "2026-08-01": 6,
          "2026-08-02": 9,
          "2026-08-03": 8,
          "2026-08-04": 7,
          "2026-08-17": 6,
          "2026-08-19": 6,
          "2026-08-20": 8,
          "2026-08-22": 10,
          "2026-08-24": 7,
          "2026-08-26": 2,
          "2026-08-27": 7,
          "2026-08-28": 7,
          "2026-08-31": 6,
          "2026-09-02": 8,
          "2026-09-03": 9,
          "2026-09-04": 5,
          "2026-09-05": 7,
          "2026-09-06": 10,
          "2026-09-07": 8,
          "2026-09-09": 7,
          "2026-09-11": 7,
          "2026-09-15": 5,
          "2026-09-17": 6,
          "2026-09-18": 9,
          "2026-09-19": 9,
          "2026-09-20": 10,
          "2026-09-21": 8,
          "2026-09-22": 9,
          "2026-09-23": 8,
          "2026-09-24": 10,
          "2026-09-25": 7
        },
        Banking: {
          "2026-02-26": 5,
          "2026-03-26": 8,
          "2026-04-02": 6,
          "2026-04-03": 10,
          "2026-04-14": 3,
          "2026-04-21": 4,
          "2026-04-22": 6,
          "2026-04-23": 5,
          "2026-04-24": 5,
          "2026-04-25": 7,
          "2026-04-26": 5,
          "2026-04-27": 4,
          "2026-04-28": 5,
          "2026-04-29": 7,
          "2026-04-30": 4,
          "2026-05-01": 7,
          "2026-05-03": 5,
          "2026-05-04": 4,
          "2026-05-05": 5,
          "2026-05-06": 5,
          "2026-05-07": 8,
          "2026-05-08": 3,
          "2026-05-09": 5,
          "2026-05-10": 9,
          "2026-05-11": 11,
          "2026-05-12": 11,
          "2026-05-13": 13,
          "2026-05-14": 14,
          "2026-05-15": 23,
          "2026-05-16": 12,
          "2026-05-17": 18,
          "2026-05-18": 10,
          "2026-05-23": 21,
          "2026-06-11": 5,
          "2026-06-12": 5,
          "2026-06-16": 14,
          "2026-06-20": 3,
          "2026-06-21": 5,
          "2026-06-22": 5,
          "2026-06-23": 5,
          "2026-06-24": 8,
          "2026-06-25": 5,
          "2026-06-27": 7,
          "2026-06-28": 6,
          "2026-06-30": 5,
          "2026-07-01": 11,
          "2026-07-06": 4,
          "2026-07-07": 6,
          "2026-07-09": 6,
          "2026-07-12": 3,
          "2026-07-14": 4,
          "2026-07-15": 9,
          "2026-07-17": 6,
          "2026-07-18": 5,
          "2026-07-19": 7,
          "2026-07-20": 3,
          "2026-07-21": 7,
          "2026-07-22": 7,
          "2026-07-23": 8,
          "2026-07-24": 10,
          "2026-07-25": 22,
          "2026-07-26": 21,
          "2026-07-27": 21,
          "2026-07-28": 21,
          "2026-07-29": 20,
          "2026-07-30": 22,
          "2026-07-31": 9,
          "2026-08-02": 8,
          "2026-08-03": 8,
          "2026-08-04": 7,
          "2026-08-09": 18.1,
          "2026-08-11": 15,
          "2026-08-17": 6,
          "2026-08-19": 8,
          "2026-08-20": 9,
          "2026-08-21": 10,
          "2026-08-22": 11,
          "2026-08-23": 25,
          "2026-08-24": 14,
          "2026-08-25": 15,
          "2026-08-26": 10,
          "2026-08-27": 10,
          "2026-08-28": 10,
          "2026-08-29": 14,
          "2026-08-30": 19,
          "2026-08-31": 10,
          "2026-09-01": 9,
          "2026-09-02": 10,
          "2026-09-03": 12,
          "2026-09-04": 13,
          "2026-09-05": 14,
          "2026-09-06": 14,
          "2026-09-07": 7,
          "2026-09-08": 8,
          "2026-09-09": 9,
          "2026-09-10": 12,
          "2026-09-11": 4,
          "2026-09-14": 18,
          "2026-09-15": 14,
          "2026-09-16": 11,
          "2026-09-17": 4,
          "2026-09-18": 3,
          "2026-09-19": 4,
          "2026-09-20": 4,
          "2026-09-21": 5,
          "2026-09-22": 4,
          "2026-09-23": 7,
          "2026-09-24": 4,
          "2026-09-25": 10
        },
        "Higher Education": {
          "2026-02-26": 4,
          "2026-03-26": 5,
          "2026-04-02": 6,
          "2026-04-14": 3,
          "2026-04-15": 3,
          "2026-04-21": 4,
          "2026-04-23": 5,
          "2026-04-24": 4,
          "2026-04-25": 3,
          "2026-04-26": 4,
          "2026-04-27": 3,
          "2026-04-28": 4,
          "2026-04-29": 4,
          "2026-04-30": 4,
          "2026-05-01": 4,
          "2026-05-03": 5,
          "2026-05-04": 5,
          "2026-05-05": 4,
          "2026-05-06": 4,
          "2026-05-07": 6,
          "2026-05-08": 6,
          "2026-05-09": 3,
          "2026-05-11": 4,
          "2026-05-15": 6,
          "2026-05-16": 5,
          "2026-06-11": 3,
          "2026-06-20": 4,
          "2026-06-21": 4,
          "2026-06-22": 5,
          "2026-06-23": 7,
          "2026-06-24": 10,
          "2026-06-25": 3,
          "2026-06-26": 7,
          "2026-07-06": 3,
          "2026-07-07": 3,
          "2026-07-10": 9,
          "2026-07-12": 2,
          "2026-07-14": 3,
          "2026-07-18": 5,
          "2026-07-20": 5,
          "2026-07-21": 4,
          "2026-07-22": 4,
          "2026-07-23": 4,
          "2026-07-28": 2,
          "2026-07-30": 3,
          "2026-07-31": 7,
          "2026-08-01": 9,
          "2026-08-04": 8,
          "2026-08-11": 20,
          "2026-08-17": 4,
          "2026-08-19": 3,
          "2026-08-21": 4,
          "2026-08-23": 9,
          "2026-08-26": 2,
          "2026-08-28": 3,
          "2026-08-31": 4,
          "2026-09-01": 5,
          "2026-09-02": 3,
          "2026-09-04": 4,
          "2026-09-05": 8,
          "2026-09-06": 9,
          "2026-09-07": 5,
          "2026-09-11": 6,
          "2026-09-15": 2,
          "2026-09-17": 2,
          "2026-09-24": 3
        },
        Manufacturing: {
          "2026-02-26": 4,
          "2026-04-14": 2,
          "2026-04-23": 3,
          "2026-04-24": 3,
          "2026-04-27": 3,
          "2026-04-28": 4,
          "2026-04-29": 3,
          "2026-04-30": 3,
          "2026-05-05": 3,
          "2026-05-07": 2,
          "2026-05-09": 4,
          "2026-06-11": 3,
          "2026-06-27": 4,
          "2026-06-29": 10,
          "2026-06-30": 4,
          "2026-07-13": 3,
          "2026-07-14": 3,
          "2026-07-17": 4,
          "2026-07-24": 2,
          "2026-08-17": 4,
          "2026-08-24": 3,
          "2026-08-27": 3,
          "2026-08-28": 2,
          "2026-09-18": 3,
          "2026-09-19": 3,
          "2026-09-20": 3,
          "2026-09-22": 3,
          "2026-09-24": 3,
          "2026-09-25": 3
        },
        "Advertising Services": {
          "2026-02-26": 3,
          "2026-04-14": 3,
          "2026-04-15": 2,
          "2026-04-21": 4,
          "2026-04-23": 4,
          "2026-04-24": 3,
          "2026-04-27": 3,
          "2026-04-29": 4,
          "2026-05-05": 3,
          "2026-05-06": 2,
          "2026-05-08": 2,
          "2026-05-09": 4,
          "2026-05-12": 3,
          "2026-06-25": 3,
          "2026-06-30": 3,
          "2026-07-07": 3,
          "2026-07-12": 5,
          "2026-07-13": 5,
          "2026-07-20": 3,
          "2026-07-21": 4,
          "2026-07-22": 3,
          "2026-07-23": 3,
          "2026-07-27": 2,
          "2026-07-30": 2,
          "2026-08-03": 5,
          "2026-08-17": 5,
          "2026-08-18": 8,
          "2026-08-19": 4,
          "2026-08-21": 4,
          "2026-08-28": 2,
          "2026-08-31": 3,
          "2026-09-02": 4,
          "2026-09-11": 4,
          "2026-09-17": 3
        },
        Education: {
          "2026-02-26": 3,
          "2026-03-26": 2,
          "2026-04-15": 3,
          "2026-04-19": 10,
          "2026-04-21": 4,
          "2026-04-28": 2,
          "2026-04-30": 3,
          "2026-05-01": 5,
          "2026-05-08": 4,
          "2026-07-07": 3,
          "2026-07-18": 3,
          "2026-07-20": 6,
          "2026-07-21": 5,
          "2026-07-22": 3,
          "2026-07-24": 2,
          "2026-07-26": 2,
          "2026-07-30": 2,
          "2026-08-04": 5,
          "2026-08-17": 3,
          "2026-08-20": 8,
          "2026-08-21": 3,
          "2026-08-26": 2,
          "2026-08-28": 2,
          "2026-09-07": 4,
          "2026-09-08": 8,
          "2026-09-11": 3,
          "2026-09-15": 2,
          "2026-09-21": 2,
          "2026-09-25": 2
        },
        "Food and Beverage Services": {
          "2026-03-26": 3,
          "2026-04-25": 2,
          "2026-04-26": 4,
          "2026-05-04": 2,
          "2026-05-07": 3,
          "2026-06-25": 3,
          "2026-07-14": 3,
          "2026-07-15": 6,
          "2026-07-18": 3,
          "2026-08-26": 2,
          "2026-09-11": 3,
          "2026-09-18": 3,
          "2026-09-19": 3,
          "2026-09-20": 4,
          "2026-09-21": 3,
          "2026-09-22": 5,
          "2026-09-23": 2
        },
        "Software Development": {
          "2026-03-26": 2,
          "2026-04-02": 5,
          "2026-04-14": 5,
          "2026-04-15": 8,
          "2026-04-16": 6,
          "2026-04-17": 12,
          "2026-04-21": 3,
          "2026-04-22": 6,
          "2026-04-24": 5,
          "2026-04-25": 5,
          "2026-04-26": 10,
          "2026-04-27": 4,
          "2026-04-28": 3,
          "2026-04-29": 3,
          "2026-04-30": 5,
          "2026-05-01": 3,
          "2026-05-03": 8,
          "2026-05-04": 4,
          "2026-05-05": 3,
          "2026-05-06": 5,
          "2026-05-07": 7,
          "2026-05-08": 3,
          "2026-05-09": 6,
          "2026-05-10": 5,
          "2026-05-11": 2,
          "2026-05-12": 4,
          "2026-05-14": 4,
          "2026-05-30": 12,
          "2026-06-20": 3,
          "2026-06-21": 5,
          "2026-06-23": 4,
          "2026-06-25": 6,
          "2026-06-27": 4,
          "2026-06-30": 4,
          "2026-07-06": 5,
          "2026-07-07": 6,
          "2026-07-10": 8,
          "2026-07-11": 9,
          "2026-07-12": 4,
          "2026-07-13": 4,
          "2026-07-18": 5,
          "2026-07-19": 7,
          "2026-07-20": 3,
          "2026-07-22": 3,
          "2026-07-23": 5,
          "2026-07-24": 6,
          "2026-07-25": 4,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-28": 3,
          "2026-07-29": 2,
          "2026-07-30": 3,
          "2026-08-01": 6,
          "2026-08-17": 3,
          "2026-08-19": 3,
          "2026-09-02": 3,
          "2026-09-04": 3,
          "2026-09-17": 3,
          "2026-09-18": 5,
          "2026-09-19": 5,
          "2026-09-20": 5,
          "2026-09-21": 6,
          "2026-09-22": 4,
          "2026-09-23": 3,
          "2026-09-24": 4,
          "2026-09-25": 4
        },
        "Real Estate": {
          "2026-04-02": 5,
          "2026-07-24": 2,
          "2026-07-25": 2,
          "2026-07-26": 1,
          "2026-07-28": 2,
          "2026-07-29": 3,
          "2026-09-15": 4,
          "2026-09-23": 3
        },
        "Transportation, Logistics, Supply Chain and Storage": {
          "2026-04-15": 2,
          "2026-09-18": 3,
          "2026-09-19": 3,
          "2026-09-20": 3,
          "2026-09-21": 4,
          "2026-09-22": 3,
          "2026-09-23": 2,
          "2026-09-25": 2
        },
        "Hospitals and Health Care": {
          "2026-04-16": 4,
          "2026-07-21": 3
        },
        "Motor Vehicle Manufacturing": {
          "2026-04-23": 3
        },
        Retail: {
          "2026-04-25": 2,
          "2026-05-04": 3,
          "2026-06-21": 2,
          "2026-06-30": 3,
          "2026-07-06": 3,
          "2026-08-27": 3,
          "2026-09-19": 2,
          "2026-09-20": 3,
          "2026-09-21": 2,
          "2026-09-23": 2,
          "2026-09-25": 3
        },
        Insurance: {
          "2026-05-01": 5,
          "2026-07-27": 2,
          "2026-08-31": 5
        },
        "Chemical Manufacturing": {
          "2026-05-04": 3,
          "2026-05-06": 2,
          "2026-05-09": 3,
          "2026-06-11": 2
        },
        Accounting: {
          "2026-05-11": 2,
          "2026-05-12": 4,
          "2026-07-29": 3,
          "2026-08-31": 3,
          "2026-09-15": 4
        },
        "Public Relations and Communications Services": {
          "2026-06-11": 2
        },
        "Law Practice": {
          "2026-06-20": 4,
          "2026-06-21": 2,
          "2026-09-17": 6
        },
        "Legal Services": {
          "2026-06-20": 3,
          "2026-06-27": 5,
          "2026-08-31": 3,
          "2026-09-17": 7
        },
        "Oil and Gas": {
          "2026-06-27": 3,
          "2026-07-06": 3,
          "2026-08-21": 3,
          "2026-08-24": 4
        },
        "Marketing Services": {
          "2026-07-12": 3,
          "2026-08-21": 3,
          "2026-09-07": 3
        },
        "Market Research": {
          "2026-07-13": 3
        },
        "Venture Capital and Private Equity Principals": {
          "2026-07-14": 3,
          "2026-08-28": 3
        },
        "Pharmaceutical Manufacturing": {
          "2026-07-18": 3,
          "2026-07-19": 5
        },
        "Human Resources Services": {
          "2026-07-21": 3
        },
        "Investment Management": {
          "2026-07-25": 1,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-29": 2
        },
        "Investment Banking": {
          "2026-07-25": 1,
          "2026-07-26": 1,
          "2026-07-27": 2,
          "2026-07-28": 2
        },
        "Broadcast Media Production and Distribution": {
          "2026-07-28": 2,
          "2026-08-19": 3
        },
        "Capital Markets": {
          "2026-07-30": 2
        },
        "Staffing and Recruiting": {
          "2026-09-15": 2
        }
      },
      Company: {
        Amazon: {
          "2026-04-14": 1,
          "2026-04-25": 1,
          "2026-04-28": 2,
          "2026-05-05": 0.5,
          "2026-05-08": 0.5,
          "2026-06-11": 1,
          "2026-06-25": 2,
          "2026-06-30": 0.5,
          "2026-07-20": 0.5,
          "2026-07-22": 1,
          "2026-07-24": 0.5,
          "2026-07-25": 0.5,
          "2026-09-17": 0.5,
          "2026-09-18": 0.5,
          "2026-09-19": 1,
          "2026-09-20": 1,
          "2026-09-21": 1
        },
        Google: {
          "2026-04-14": 0.5,
          "2026-04-25": 0.5,
          "2026-04-27": 0.5,
          "2026-05-06": 1,
          "2026-05-11": 0.5
        },
        Deloitte: {
          "2026-04-14": 0.5,
          "2026-05-08": 0.5,
          "2026-06-25": 1,
          "2026-07-14": 1,
          "2026-07-22": 0.5,
          "2026-07-26": 1,
          "2026-09-17": 0.5,
          "2026-09-18": 0.5
        },
        "Wipro Linecraft AI": {
          "2026-04-14": 0.5
        },
        Accenture: {
          "2026-04-14": 0.5
        },
        Intel: {
          "2026-04-14": 0.5
        },
        Microsoft: {
          "2026-04-14": 0.5,
          "2026-07-24": 0.5
        },
        "ICICI Bank": {
          "2026-04-14": 0.5,
          "2026-04-27": 0.5,
          "2026-05-11": 0.5,
          "2026-07-22": 1,
          "2026-07-24": 1,
          "2026-07-25": 3,
          "2026-07-26": 2,
          "2026-07-27": 3,
          "2026-08-19": 2,
          "2026-08-21": 3,
          "2026-09-25": 2
        },
        EY: {
          "2026-04-14": 0.5,
          "2026-04-15": 1,
          "2026-05-08": 0.5,
          "2026-06-11": 1,
          "2026-07-14": 1,
          "2026-07-22": 0.5,
          "2026-09-18": 0.5,
          "2026-09-19": 0.5
        },
        Tesla: {
          "2026-04-15": 1
        },
        PhonePe: {
          "2026-04-21": 1
        },
        "IDFC FIRST Bank": {
          "2026-04-25": 1,
          "2026-05-08": 0.5,
          "2026-05-11": 0.5,
          "2026-06-25": 0.5,
          "2026-06-30": 0.5,
          "2026-07-20": 0.5,
          "2026-07-22": 0.5,
          "2026-07-24": 0.5,
          "2026-07-25": 1,
          "2026-07-27": 1,
          "2026-09-20": 0.5,
          "2026-09-24": 2
        },
        "Poonawalla Fincorp": {
          "2026-04-25": 0.5,
          "2026-04-27": 0.5,
          "2026-04-30": 0.5,
          "2026-05-05": 0.5,
          "2026-05-07": 2,
          "2026-05-08": 0.5,
          "2026-05-11": 0.5,
          "2026-09-01": 5,
          "2026-09-23": 1
        },
        "Avanse Financial Services Ltd.": {
          "2026-04-27": 0.5
        },
        Castrol: {
          "2026-04-30": 1,
          "2026-06-11": 1
        },
        "Credila Financial Services Limited": {
          "2026-05-05": 0.5,
          "2026-05-06": 1,
          "2026-07-22": 0.5,
          "2026-09-19": 0.5
        },
        NVIDIA: {
          "2026-05-06": 2
        },
        Unilever: {
          "2026-05-08": 0.5
        },
        "Nomad Credit": {
          "2026-05-08": 0.5
        },
        "Tata Capital": {
          "2026-05-11": 1,
          "2026-07-25": 1,
          "2026-07-26": 0.5
        },
        "Bajaj Housing Finance Limited": {
          "2026-05-11": 0.5
        },
        "Aavas Financiers Ltd": {
          "2026-05-11": 0.5
        },
        "Piramal Finance": {
          "2026-05-11": 0.5,
          "2026-07-26": 1
        },
        "Axis Bank": {
          "2026-05-11": 0.5,
          "2026-07-22": 0.5,
          "2026-07-24": 0.5,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-28": 2,
          "2026-07-30": 2
        },
        "Aakash Educational Services Limited": {
          "2026-07-20": 1
        },
        "PW (PhysicsWallah)": {
          "2026-07-20": 0.5
        },
        JioStar: {
          "2026-07-20": 0.5,
          "2026-09-17": 0.5
        },
        BharatPe: {
          "2026-07-22": 0.5
        },
        "HDFC Bank": {
          "2026-07-22": 0.5,
          "2026-07-24": 0.5,
          "2026-07-25": 2,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-29": 2,
          "2026-07-30": 2
        },
        "Kotak Mahindra Bank": {
          "2026-07-24": 0.5,
          "2026-07-25": 1,
          "2026-07-26": 1,
          "2026-07-28": 2,
          "2026-07-29": 2,
          "2026-07-30": 2
        },
        "Aditya Birla Capital": {
          "2026-07-24": 0.5
        },
        "YES BANK": {
          "2026-07-24": 0.5,
          "2026-07-27": 1
        },
        HSBC: {
          "2026-07-25": 0.5
        },
        "IndusInd Bank": {
          "2026-07-25": 0.5,
          "2026-07-26": 2,
          "2026-07-27": 2,
          "2026-07-28": 2
        },
        "Bandhan Bank": {
          "2026-07-26": 1
        },
        "Bajaj Finserv": {
          "2026-07-27": 2,
          "2026-07-28": 2,
          "2026-07-30": 2,
          "2026-08-28": 2
        },
        Citi: {
          "2026-07-27": 1
        },
        "Standard Chartered": {
          "2026-07-27": 1
        },
        Dr\u00E4ger: {
          "2026-09-17": 0.5
        },
        Trilegal: {
          "2026-09-17": 0.5
        },
        Snabbit: {
          "2026-09-18": 1,
          "2026-09-19": 0.5,
          "2026-09-20": 2,
          "2026-09-21": 1,
          "2026-09-22": 2,
          "2026-09-23": 1,
          "2026-09-25": 2
        },
        "Urban Company": {
          "2026-09-18": 0.5,
          "2026-09-19": 0.5,
          "2026-09-20": 0.5,
          "2026-09-21": 1,
          "2026-09-22": 1
        },
        PepsiCo: {
          "2026-09-18": 0.5,
          "2026-09-19": 0.5,
          "2026-09-20": 0.5
        },
        Flipkart: {
          "2026-09-18": 0.5,
          "2026-09-19": 0.5
        },
        Zepto: {
          "2026-09-18": 0.5,
          "2026-09-20": 0.5,
          "2026-09-21": 0.5
        },
        "Pidilite Industries Limited": {
          "2026-09-18": 0.5,
          "2026-09-19": 1,
          "2026-09-20": 1
        },
        "EY-Parthenon": {
          "2026-09-19": 0.5
        },
        "Mondel\u0113z International": {
          "2026-09-20": 1
        },
        Cars24: {
          "2026-09-20": 0.5
        },
        Swiggy: {
          "2026-09-21": 0.5
        }
      }
    }
  },
  insights: {
    groups: {
      cat: {
        rows: [
          {
            g: "Bank & industry critique",
            n: 7,
            tg: 347,
            tgsum: 2641,
            sh: 47,
            out: 55.5,
            er: 2.5,
            com: 2
          },
          {
            g: "Home-loan explainer",
            n: 11,
            tg: 282,
            tgsum: 2056,
            sh: 46,
            out: 25,
            er: 1.7,
            com: 1
          },
          {
            g: "Founder journey & milestones",
            n: 12,
            tg: 810.5,
            tgsum: 17015,
            sh: 46.5,
            out: 34,
            er: 1.7,
            com: 2
          },
          {
            g: "Hiring & team",
            n: 5,
            tg: 820,
            tgsum: 4617,
            sh: 40,
            out: 50,
            er: 1.2,
            com: 3
          },
          {
            g: "Opinion & life lessons",
            n: 9,
            tg: 242,
            tgsum: 2391,
            sh: 46.5,
            out: 28.5,
            er: 1.7,
            com: 1
          },
          {
            g: "Client story",
            n: 10,
            tg: 288,
            tgsum: 9415,
            sh: 45,
            out: 38.5,
            er: 1.6,
            com: 0.5
          }
        ],
        p: {
          tg: 3e-3,
          sh: 0.158,
          outnet: 0.275,
          er: 0.651
        }
      },
      fmt: {
        rows: [
          {
            g: "Text/share",
            n: 38,
            tg: 387,
            tgsum: 32210,
            sh: 45.5,
            out: 40,
            er: 2.2,
            com: 2
          },
          {
            g: "Media (ugcPost)",
            n: 16,
            tg: 484.5,
            tgsum: 5925,
            sh: 47,
            out: 21.5,
            er: 1.6,
            com: 1
          }
        ],
        p: {
          tg: 0.31,
          sh: 0.373,
          outnet: 0.01,
          er: 0.062
        }
      },
      era: {
        rows: [
          {
            g: "Before",
            n: 37,
            tg: 588,
            tgsum: 24030,
            sh: 46,
            out: 29,
            er: 1.5,
            com: 1
          },
          {
            g: "Creator Chart Era",
            n: 17,
            tg: 280,
            tgsum: 14105,
            sh: 45,
            out: 47,
            er: 2.6,
            com: 2
          }
        ],
        p: {
          tg: 0.038,
          sh: 0.642,
          outnet: 2e-3,
          er: 1e-3
        }
      },
      dow: {
        rows: [
          {
            g: "Thu",
            n: 9,
            tg: 641,
            tgsum: 6501,
            sh: 46,
            out: 28,
            er: 1.7,
            com: 2
          },
          {
            g: "Tue",
            n: 9,
            tg: 388,
            tgsum: 4767,
            sh: 46,
            out: 25,
            er: 1.5,
            com: 1
          },
          {
            g: "Fri",
            n: 11,
            tg: 460.5,
            tgsum: 15722,
            sh: 47,
            out: 60.5,
            er: 2.1,
            com: 4
          },
          {
            g: "Sat",
            n: 4,
            tg: 519,
            tgsum: 2334,
            sh: 49,
            out: 33,
            er: 1.5,
            com: 0.5
          },
          {
            g: "Mon",
            n: 11,
            tg: 317.5,
            tgsum: 4816,
            sh: 43,
            out: 43,
            er: 2.3,
            com: 1
          },
          {
            g: "Wed",
            n: 9,
            tg: 242,
            tgsum: 3303,
            sh: 48.5,
            out: 29,
            er: 1.9,
            com: 1
          },
          {
            g: "Sun",
            n: 1,
            tg: 692,
            tgsum: 692,
            sh: 40,
            out: 50,
            er: 2.1,
            com: 3
          }
        ],
        p: {
          tg: 0.37,
          sh: 0.252,
          outnet: 0.049,
          er: 0.908
        }
      }
    },
    corr: {
      out_vs_share: {
        rho: -0.45,
        p: 18e-4,
        n: 46
      },
      out_vs_tg: {
        rho: 0.15,
        p: 0.3267,
        n: 46
      },
      comments_vs_out: {
        rho: 0.52,
        p: 1e-4,
        n: 52
      },
      reposts_vs_out: {
        rho: 0.52,
        p: 1e-4,
        n: 52
      },
      er_vs_share: {
        rho: -0.1,
        p: 0.5166,
        n: 48
      },
      hour_vs_share: {
        rho: 0.08,
        p: 0.5884,
        n: 48
      }
    },
    fit: {
      slope10: -1.23,
      r2: 0.23,
      p: 9e-4,
      a: 49.83246422637869,
      b: -0.12301570287796779
    }
  }
};

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
var TG_SESSION_SECRET = "peaceful-loans-creator-chart-tg-dashboard-secure-salt-2026";
var TG_DEFAULT_TEAM_PASSWORD = "creatorchart2026";
var TG_DEFAULT_ADMIN_PASSWORD = "PeacefulLoansAdmin2026";
var tgRateLimitMap = /* @__PURE__ */ new Map();
function checkTgRateLimit(key, limit = 5, windowMs = 15 * 60 * 1e3) {
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
async function getTgSigningKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(TG_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
async function createTgToken(user) {
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
async function verifyTgToken(request) {
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
    if (Date.now() - data.authenticatedAt > 7 * 24 * 60 * 60 * 1e3) return null;
    return { email: data.email, role: data.role };
  } catch {
    return null;
  }
}
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
async function sendAnswerAlertEmail(borrowerEmail, username, question, id, env) {
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
async function sendDailyCsvEmail(env) {
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
    questions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const csvRows = [];
    const headers = ["ID", "Username", "Email", "Category", "Status", "Created At", "Question", "Answer", "IP Address", "Referrer", "li_fat_id", "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content"];
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));
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
      const escapedRow = row.map((val) => {
        const stringVal = String(val).replace(/\r?\n/g, " ").replace(/"/g, '""');
        return `"${stringVal}"`;
      });
      csvRows.push(escapedRow.join(","));
    }
    const csvString = csvRows.join("\r\n");
    const utf8Encoder = new TextEncoder();
    const u8arr = utf8Encoder.encode(csvString);
    let binary = "";
    for (let i = 0; i < u8arr.byteLength; i++) {
      binary += String.fromCharCode(u8arr[i]);
    }
    const base64Csv = btoa(binary);
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
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
            <p><strong>Export Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
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
      const { username, question, email, tag, utm_params, referrer, li_fat_id } = await request.json();
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
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        utm_params: utm_params || null,
        ip: clientIp,
        referrer: referrer || "Direct",
        li_fat_id: li_fat_id || null
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
      if (data.email) {
        if (ctx && typeof ctx.waitUntil === "function") {
          ctx.waitUntil(sendAnswerAlertEmail(data.email, data.username, data.question, id, env));
        } else {
          sendAnswerAlertEmail(data.email, data.username, data.question, id, env).catch(console.error);
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
  if (cleanPath === "/api/admin/send-report" && request.method === "POST") {
    try {
      const { secret } = await request.json();
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
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
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
        const body = await request.json();
        if (body.action === "logout") {
          const resHeaders2 = new Headers(headers);
          resHeaders2.set("Set-Cookie", "tg_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: resHeaders2 });
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
        let role = null;
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
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
    }
  }
  if (cleanPath === "/api/linkedin-analytics/data" || cleanPath === "/api/data") {
    if (request.method === "GET") {
      let sanitizeData = function(obj) {
        if (Array.isArray(obj)) return obj.map(sanitizeData);
        if (obj !== null && typeof obj === "object") {
          const clean = {};
          for (const [k, v] of Object.entries(obj)) {
            if (!forbidden.includes(k.toLowerCase())) {
              clean[k] = sanitizeData(v);
            }
          }
          return clean;
        }
        return obj;
      };
      const user = await verifyTgToken(request);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }
      let payload = creator_chart_dashboard_data_default;
      const kv = env.QUESTIONS_KV;
      if (kv) {
        try {
          const liveStr = await kv.get("linkedin_data:live");
          if (liveStr) {
            payload = JSON.parse(liveStr);
          }
        } catch {
        }
      }
      const forbidden = ["impressions", "imp", "members_reached", "sv"];
      const resHeaders = new Headers(headers);
      resHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      resHeaders.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(JSON.stringify(sanitizeData(payload)), { status: 200, headers: resHeaders });
    }
  }
  if (cleanPath === "/api/linkedin-analytics/upload") {
    const user = await verifyTgToken(request);
    const uploadToken = request.headers.get("x-upload-token");
    const validToken = env.ADMIN_UPLOAD_TOKEN || "PeacefulLoansAdminUpload2026";
    const isAuthorized = user && user.role === "admin" || uploadToken && uploadToken === validToken;
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const kv = env.QUESTIONS_KV;
    if (request.method === "GET") {
      let versions = [];
      if (kv) {
        const vStr = await kv.get("linkedin_data:versions");
        if (vStr) versions = JSON.parse(vStr);
      }
      return new Response(JSON.stringify({ versions }), { status: 200, headers });
    }
    if (request.method === "POST") {
      try {
        let checkForbiddenKeys = function(obj) {
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
        };
        const body = await request.json();
        if (body.action === "rollback") {
          if (!kv) {
            return new Response(JSON.stringify({ error: "Storage not configured for rollback" }), { status: 500, headers });
          }
          const vStr = await kv.get("linkedin_data:versions");
          const versions = vStr ? JSON.parse(vStr) : [];
          const target = versions.find((v) => v.id === body.id);
          if (!target || !target.data) {
            return new Response(JSON.stringify({ error: "Version not found" }), { status: 404, headers });
          }
          await kv.put("linkedin_data:live", JSON.stringify(target.data));
          return new Response(JSON.stringify({ success: true, message: `Rolled back to ${target.data_to}` }), { status: 200, headers });
        }
        const payload = body.data || body;
        const requiredSections = ["meta", "daily", "weekly", "monthly", "posts", "viewer_mix", "insights"];
        for (const sec of requiredSections) {
          if (!payload[sec]) {
            return new Response(JSON.stringify({ error: `Validation failed: missing section '${sec}'.` }), { status: 400, headers });
          }
        }
        const forbidden = ["impressions", "imp", "members_reached", "sv"];
        const forbiddenKey = checkForbiddenKeys(payload);
        if (forbiddenKey) {
          return new Response(
            JSON.stringify({ error: `Validation failed: forbidden total impressions key '${forbiddenKey}' found.` }),
            { status: 400, headers }
          );
        }
        if (payload.meta?.data_to && creator_chart_dashboard_data_default.meta?.data_to) {
          if (payload.meta.data_to < creator_chart_dashboard_data_default.meta.data_to) {
            return new Response(
              JSON.stringify({ error: `Validation failed: data_to (${payload.meta.data_to}) is older than live data_to (${creator_chart_dashboard_data_default.meta.data_to}).` }),
              { status: 400, headers }
            );
          }
        }
        if (kv) {
          const vStr = await kv.get("linkedin_data:versions");
          const versions = vStr ? JSON.parse(vStr) : [];
          const currentLive = await kv.get("linkedin_data:live");
          const currentObj = currentLive ? JSON.parse(currentLive) : creator_chart_dashboard_data_default;
          versions.unshift({
            id: `v_${Date.now()}`,
            data_to: currentObj.meta?.data_to || "unknown",
            built: currentObj.meta?.built || "unknown",
            data: currentObj
          });
          const trimmed = versions.slice(0, 5);
          await kv.put("linkedin_data:versions", JSON.stringify(trimmed));
          await kv.put("linkedin_data:live", JSON.stringify(payload));
        }
        return new Response(
          JSON.stringify({ success: true, message: "Data uploaded successfully.", data_to: payload.meta?.data_to, built: payload.meta?.built }),
          { status: 200, headers }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
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
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyCsvEmail(env));
  }
};
export {
  worker_src_default as default
};
