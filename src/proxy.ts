/**
 * Next.js 16 Route Proxy (replaces deprecated middleware.ts)
 *
 * Protects all /dashboard/* routes. If the user does not have a valid
 * access_token cookie, they are redirected to /login.
 *
 * NOTE: Proxy runs on the Edge Runtime (server-side) so it cannot access
 * localStorage. We rely on the "access_token" cookie which is set alongside
 * localStorage at login time by auth.utils.ts → setSession().
 */
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard"];
const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Read token from cookie (set during login via setSession)
  const token = request.cookies.get("access_token")?.value;

  // --- Redirect unauthenticated users from protected routes ---
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Redirect authenticated users away from login/register ---
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard/documents", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run proxy on all routes except Next.js internals, static files, and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
