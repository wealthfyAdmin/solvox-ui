import { NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function PUT(request: Request) {
  try {
    const incoming = await request.json().catch(() => ({}))

    if (!incoming || Object.keys(incoming).length === 0) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      )
    }

    const upstream = await fetch(`${BACKEND_URL}/api/update-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
      credentials: "include",
      body: JSON.stringify(incoming),
    })

    const text = await upstream.text()
    let data: any = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    if (!upstream.ok) {
      console.error("[PUT /api/update-profile] Backend error:", data)
      return NextResponse.json(
        { error: data?.error || "Failed to update profile" },
        { status: upstream.status }
      )
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error("[PUT /api/update-profile] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
