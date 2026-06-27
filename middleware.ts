import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register"];

// API routes yang boleh diakses tanpa login
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/register"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith("/api");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public");

  if (isStatic) return res;

  // API routes: blokir jika belum login (kecuali public API)
  if (isApi) {
    if (!session.isLoggedIn && !isPublicApi) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    return res;
  }

  if (!session.isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session.isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
