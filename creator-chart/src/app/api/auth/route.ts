import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  checkRateLimit,
  createSessionToken,
  getServerSession,
  setSessionCookie,
  clearSessionCookie,
  resetRateLimit,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getServerSession(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      clearSessionCookie(response);
      return response;
    }

    // Default action: login
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown-ip";
    const rateLimitKey = `${clientIp}:${email || "no-email"}`;

    const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many failed sign-in attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = authenticateUser(email || "", password || "");
    if (!user) {
      return NextResponse.json(
        { error: "Email or password is incorrect" },
        { status: 401 }
      );
    }

    // Successful login: reset rate limiter
    resetRateLimit(rateLimitKey);

    const token = await createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      user: { email: user.email, role: user.role },
    });
    setSessionCookie(response, token);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
