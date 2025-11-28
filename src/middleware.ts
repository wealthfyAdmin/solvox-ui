import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

// Public routes (no authentication required)
const publicRoutes = [
  "/signin",
  "/signup",
  "/reset-password",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth",
  "/api/connection-details",
  "/api/connection-details-one",
  "/embed.js",
  "/embed_1.js",
  "/widget/test",
  "/widget/test1",
];

// Admin-only protected routes
const adminOnlyRoutes = ["/users"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  console.log("🔍 Middleware checking path:", pathname, " | Token present:", !!accessToken);

  // 1️⃣ Allow Next.js internal static files & assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/videos")
  ) {
    return NextResponse.next();
  }

  // 2️⃣ Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3️⃣ No token → redirect to signin
  if (!accessToken) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4️⃣ Validate token & fetch user from backend
  let userRole = null;

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    console.log("Backend response status:", response.status);

    if (response.status === 401 || response.status === 403) {
      console.log("❌ Token invalid or expired, redirecting to signin...");

      const redirectResponse = NextResponse.redirect(new URL("/signin", request.url));
      redirectResponse.cookies.set("access_token", "", { expires: new Date(0) });
      return redirectResponse;
    }

    const data = await response.json();
    userRole = data?.user?.role || data?.role || null; // supports multiple backend shapes
    console.log("👤 User role from backend:", userRole);

  } catch (error) {
    console.error("🔥 Middleware token validation failed:", error);
  }

  // 5️⃣ Role-based route protection
  if (userRole === "user" && adminOnlyRoutes.includes(pathname)) {
    console.log("⛔ User blocked from accessing admin-only route:", pathname);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 6️⃣ Allow authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|videos|embed.js|embed_1.js|widget/test|widget/test1).*)",
  ],
};
