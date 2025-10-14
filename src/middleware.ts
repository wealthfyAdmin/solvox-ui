import { type NextRequest, NextResponse } from "next/server"

const authRoutes = ["/signin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")
  const isAuthenticated = !!sessionCookie?.value

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = !isAuthRoute // all non-auth pages are protected

  // if (isProtectedRoute && !isAuthenticated) {
  //   const signInUrl = new URL("/signin", request.url)
  //   signInUrl.searchParams.set("callbackUrl", pathname)
  //   return NextResponse.redirect(signInUrl)
  // }

  // if (isAuthRoute && isAuthenticated) {
  //   return NextResponse.redirect(new URL("/", request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}

