import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const LOGIN_API_URL = `${BACKEND_URL}/api/login`
const USER_API_URL = `${BACKEND_URL}/api/user` // Adjust if your backend user info endpoint differs

// -------------------------------
// 🔐 POST /api/auth  →  Login
// -------------------------------
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Call external backend login API
    const loginResponse = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Invalid email or password" },
        { status: loginResponse.status }
      )
    }

    const loginData = await loginResponse.json()
    const { access_token, token_type } = loginData

    if (!access_token) {
      return NextResponse.json({ error: "No access token received" }, { status: 500 })
    }

    // Store tokens securely in cookies
    const cookieStore = await cookies()
    cookieStore.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    if (token_type) {
      cookieStore.set("token_type", token_type, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    }

    // Compatibility cookie for middleware (optional)
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}

// -------------------------------
// 👤 GET /api/auth  →  Get current user (for AgentSetupPage)
// -------------------------------
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value
    const tokenType = cookieStore.get("token_type")?.value || "Bearer"

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    // 🔍 Call external backend to get user info
    const userResponse = await fetch(USER_API_URL, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      // If token expired or invalid, clear cookies
      const res = NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      res.cookies.delete("access_token")
      res.cookies.delete("token_type")
      res.cookies.delete("session")
      return res
    }

    const userData = await userResponse.json()
    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
