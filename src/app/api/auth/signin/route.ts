import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const LOGIN_API_URL = "http://api.solvox.ai/api/login"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Call the external login API
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
        { status: loginResponse.status },
      )
    }

    const loginData = await loginResponse.json()
    const { access_token, token_type } = loginData

    if (!access_token) {
      return NextResponse.json({ error: "No access token received" }, { status: 500 })
    }

    // Store the access token securely in httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Also store token type if needed
    if (token_type) {
      cookieStore.set("token_type", token_type, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })
    }

    // Keep the session cookie for middleware compatibility
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
