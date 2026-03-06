import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (pathname.startsWith("/test/") || pathname.startsWith("/api/test/") || pathname.startsWith("/api/submissions")) {
    return NextResponse.next();
  }

  if ((pathname === "/login" || pathname === "/signup") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const protectedPages = ["/dashboard", "/assessment"];
  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/api/assessments") && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assessment/:path*",
    "/api/assessments/:path*",
    "/login",
    "/signup",
    "/api/test/:path*",
    "/api/submissions/:path*",
  ],
};
