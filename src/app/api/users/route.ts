import { type NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${BACKEND_URL}/api/user`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to fetch users")
    }

    const users = await response.json()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = await getAuthHeaders()
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/user`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create user")
    }

    const user = await response.json()
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
