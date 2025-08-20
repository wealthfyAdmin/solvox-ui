import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Static credentials for demo
const DEMO_CREDENTIALS = {
  email: "admin@solvoxai.com",
  password: "admin123",
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      // Create a simple session token (in production, use proper JWT or session management)
      const sessionToken = "demo-session-" + Date.now()

      // Set session cookie
      const cookieStore = await cookies()
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
