import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionUser {
  email: string;
  role: "viewer" | "admin";
  authenticatedAt: number;
}

const COOKIE_NAME = "tg_dashboard_session";
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

// Fallback secrets if not provided in environment
const DEFAULT_SECRET = process.env.SESSION_SECRET || "peaceful-loans-creator-chart-tg-dashboard-secure-salt-2026";
const DEFAULT_TEAM_PASSWORD = process.env.TEAM_PASSWORD || "creatorchart2026";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PeacefulLoansAdmin2026";

// Rate limiting state: key -> { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Simple signed token using Web Crypto (compatible across Edge & Node)
async function getSigningKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(DEFAULT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = JSON.stringify(user);
  const enc = new TextEncoder();
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sigBase64 = Buffer.from(signature).toString("base64url");
  const payloadBase64 = Buffer.from(payload).toString("base64url");
  return `${payloadBase64}.${sigBase64}`;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, sigBase64] = parts;
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const sigBuffer = Buffer.from(sigBase64, "base64url");

    const enc = new TextEncoder();
    const key = await getSigningKey();
    const valid = await crypto.subtle.verify("HMAC", key, sigBuffer, enc.encode(payloadStr));

    if (!valid) return null;

    const user = JSON.parse(payloadStr) as SessionUser;
    const now = Date.now();
    if (now - user.authenticatedAt > SESSION_MAX_AGE_SEC * 1000) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function getServerSession(request?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;
  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Validates credentials against allowed emails and passwords.
 */
export function authenticateUser(emailInput: string, passwordInput: string): SessionUser | null {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // Admin credentials check
  if (password === DEFAULT_ADMIN_PASSWORD || (process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.toLowerCase().includes(email))) {
    if (password === DEFAULT_ADMIN_PASSWORD) {
      return {
        email: email || "admin@peaceful-loans.com",
        role: "admin",
        authenticatedAt: Date.now(),
      };
    }
  }

  // Allowed emails check if configured
  const allowedEmailsEnv = process.env.ALLOWED_EMAILS;
  if (allowedEmailsEnv) {
    const list = allowedEmailsEnv.split(",").map((s) => s.trim().toLowerCase());
    const matched = list.find((item) => {
      const [allowedEmail] = item.split(":");
      return allowedEmail === email;
    });

    if (!matched) return null;

    const [, role] = matched.split(":");
    if (password === DEFAULT_TEAM_PASSWORD || password === DEFAULT_ADMIN_PASSWORD) {
      return {
        email,
        role: role === "admin" ? "admin" : "viewer",
        authenticatedAt: Date.now(),
      };
    }
    return null;
  }

  // Shared team password check
  if (password === DEFAULT_TEAM_PASSWORD) {
    return {
      email: email || "team@creatorchart.com",
      role: "viewer",
      authenticatedAt: Date.now(),
    };
  }

  return null;
}
