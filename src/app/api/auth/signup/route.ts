import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
const REGISTER_API_URL = `${BACKEND_URL}/api/register`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, organizationId, departmentId } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "First Name, Last Name, Email, and Password are required" }, { status: 400 })
    }

    // Prepare the registration payload
    const registrationPayload = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      ...(organizationId && { organization_id: organizationId }),
      ...(departmentId && { department_id: departmentId }),
    }

    // Call the external registration API
    const registerResponse = await fetch(REGISTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationPayload),
    })

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Registration failed" },
        { status: registerResponse.status },
      )
    }

    const registerData = await registerResponse.json()

    // Store user data and token if provided
    const cookieStore = await cookies()

    if (registerData.access_token) {
      cookieStore.set("access_token", registerData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      if (registerData.token_type) {
        cookieStore.set("token_type", registerData.token_type, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })
      }
    }

    // Set session cookie for middleware compatibility
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: registerData,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
