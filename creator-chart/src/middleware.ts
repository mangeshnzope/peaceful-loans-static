import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next requests pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt")
  ) {
    return NextResponse.next();
  }

  // Security headers according to Spec §3
  const securityHeaders = new Headers();
  securityHeaders.set("X-Robots-Tag", "noindex, nofollow");
  securityHeaders.set("X-Frame-Options", "DENY");
  securityHeaders.set("X-Content-Type-Options", "nosniff");
  securityHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  securityHeaders.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
  );

  // Allow login page and auth API without a session
  if (pathname === "/login" || pathname === "/api/auth") {
    const response = NextResponse.next({ headers: securityHeaders });
    return response;
  }

  const token = request.cookies.get("tg_dashboard_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route check
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next({ headers: securityHeaders });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
