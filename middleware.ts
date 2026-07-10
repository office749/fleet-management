import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge middleware using the DB-free auth config. It gates every page by login
// and role. Fine-grained data scoping still happens in the server data layer.
const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/login", "/invite", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // Not logged in -> send to login (except public routes).
  if (!isLoggedIn) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but visiting /login -> send to their home.
  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/dashboard" : "/home", req.nextUrl.origin),
    );
  }

  // Drivers may not access admin sections.
  const adminOnly = ["/dashboard", "/vehicles", "/service", "/team", "/export"];
  if (
    role !== "admin" &&
    adminOnly.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js).*)"],
};
