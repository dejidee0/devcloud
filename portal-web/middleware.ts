import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/projects",
  "/team",
  "/environments",
  "/terminal",
  "/deployments",
  "/audit",
  "/settings",
  "/time-tracking",
  "/secrets",
  "/client"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes never redirect.
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasTokenCookie = Boolean(request.cookies.get("devcloud_token")?.value);
  const hasAuthHeader = request.headers.get("authorization")?.startsWith("Bearer ") ?? false;

  if (!hasTokenCookie && !hasAuthHeader) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/team/:path*",
    "/environments/:path*",
    "/terminal/:path*",
    "/deployments/:path*",
    "/audit/:path*",
    "/settings/:path*",
    "/time-tracking/:path*",
    "/secrets/:path*",
    "/client/:path*"
  ]
};
