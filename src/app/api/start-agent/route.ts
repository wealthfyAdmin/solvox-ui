import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const backendResponse = await fetch(`${backendUrl}/api/agent/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.error || "Failed to start agent" }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Agent start API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
