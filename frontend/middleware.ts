import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ["/dashboard", "/profile", "/settings", "/courses", "/upload"];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Paths only accessible to guests (unauthenticated users)
  const guestPaths = ["/login", "/register"];
  const isGuest = guestPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !token) {
    // Redirect to login if trying to access a protected page without a token
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Keep target path for redirect after login
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isGuest && token) {
    // Redirect to dashboard if logged-in user tries to access login/register
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Limit the middleware to run only on app routes, excluding static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg, globe.svg, etc. (public static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
};
