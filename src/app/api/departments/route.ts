import { NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${BACKEND_URL}/api/department`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to fetch departments")
    }

    const departments = await response.json()
    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}
