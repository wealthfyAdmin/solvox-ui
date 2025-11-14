import { type NextRequest, NextResponse } from "next/server"

// ✅ Define all routes that do NOT require authentication
const publicRoutes = [
  "/signin",
  "/signup",
  "/reset-password",
  "/api/auth", // allow login & user fetch
  "/api/connection-details",
  "/api/connection-details-one",
  "/embed.js",
  "/embed_1.js",
  "/widget/test",
  "/widget/test1",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  console.log("🔍 Middleware checking path:", pathname, " | Token present:", !!accessToken)

  // ✅ 1️⃣ Allow Next.js internal and public asset routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/videos")
  ) {
    return NextResponse.next()
  }

  // ✅ 2️⃣ Allow all explicitly public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // ✅ 3️⃣ Redirect unauthenticated users to signin
  if (!accessToken) {
    const loginUrl = new URL("/signin", request.url)
    loginUrl.searchParams.set("redirect", pathname) // optional: store intended URL
    return NextResponse.redirect(loginUrl)
  }

  // ✅ 4️⃣ Allow authenticated users to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply middleware to all paths except static and explicitly excluded ones
    "/((?!_next/static|_next/image|favicon.ico|images|videos|embed.js|embed_1.js|widget/test|widget/test1).*)",
  ],
}
