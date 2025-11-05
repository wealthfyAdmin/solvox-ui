import { NextResponse, type NextRequest } from "next/server"

// Routes that don't require authentication
const publicRoutes = ["/signin", "/signup", "/reset-password", "/api/auth/signin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  // ====== AUTH CHECK ======
  if (!publicRoutes.some((route) => pathname.startsWith(route))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/signin", request.url))
    }
  }

  // ====== GENERATE NONCE (Edge safe) ======
  const nonceArray = new Uint8Array(16)
  crypto.getRandomValues(nonceArray)
  const nonce = btoa(String.fromCharCode(...nonceArray))

  const isDev = process.env.NODE_ENV === "development"

  // ====== BUILD CSP ======
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'nonce-${nonce}'` // Allow eval only in dev
    : `'self' 'nonce-${nonce}'`

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' ws: wss: https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
  ].join("; ")

  // ====== ATTACH HEADERS ======
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("x-nonce", nonce)

  return response
}

export const config = {
  matcher: [
    // Match all paths except internal/static files
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
