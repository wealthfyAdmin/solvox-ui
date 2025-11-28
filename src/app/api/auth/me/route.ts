import { type NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function GET(request: Request) {
  try {
    const headers = await getAuthHeaders()


    const url = new URL(request.url)

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend error response:", errorText)
      throw new Error(`Backend returned ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      const text = await response.text()
      console.error("Non-JSON response received:", text)
      throw new Error(`Expected JSON response but received: ${text}`)
    }

    const user = await response.json()
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch user"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
