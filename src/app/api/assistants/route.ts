import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const backendResponse = await fetch(`${backendUrl}/api/agent/?organization_id=1&is_active=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    })

    if (!backendResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch assistants" }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Assistants API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
