import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔍 Login attempt:', { email, password: '***' })

    // Call your FastAPI backend authentication
    const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const backendResponse = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      console.log('❌ Backend auth failed:', errorData)
      return NextResponse.json({ error: errorData.detail || "Invalid email or password" }, { status: 401 })
    }

    // Backend authentication successful
    const responseData = await backendResponse.json()
    const { access_token, token_type } = responseData
    console.log(responseData)
    console.log('✅ Backend auth successful')

    if (!access_token) {
      return NextResponse.json({ error: 'Invalid response from authentication server' }, { status: 500 })
    }

    // Create response first
    const response = NextResponse.json({ success: true })

    // Set the JWT token in httpOnly cookie
    response.cookies.set("session", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Optionally also store token_type if needed
    response.cookies.set("token_type", token_type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response

  } catch (error) {
    console.error('Authentication error:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({ error: 'Unable to connect to authentication server' }, { status: 503 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
