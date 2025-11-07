import { type NextRequest, NextResponse } from "next/server"

const publicRoutes = [
  "/signin",
  "/signup",
  "/reset-password",
  "/api/auth/signin",
  "/api/connection-details",
  "/embed.js",
  "/widget/test"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  console.log("Middleware check for path:", accessToken)

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
      "/((?!_next/static|_next/image|favicon.ico|images|videos|embed.js|widget/test).*)",
  ],
}