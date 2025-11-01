import { NextResponse } from "next/server"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

// ✅ GET — Fetch agents by organization_id
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get("organization_id")

    if (!organizationId) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/agent?organization_id=${organizationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[GET /api/agents] Backend error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("[GET /api/agents] Error:", err)
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 })
  }
}

// ✅ POST — Create new agent
export async function POST(request: Request) {
  try {
    const incoming = await request.json().catch(() => ({}))
    const { name, display_name, description, organization_id } = incoming || {}

    if (!name || !organization_id) {
      return NextResponse.json(
        { error: "name and organization_id are required" },
        { status: 400 }
      )
    }

    const payload = {
      name,
      display_name,
      description,
      organization_id,
    }

    const upstream = await fetch(`${BACKEND_URL}/api/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    if (!upstream.ok) {
      console.error("[POST /api/agents] Backend error:", data)
      return NextResponse.json(
        { error: data?.error || "Failed to create agent" },
        { status: upstream.status }
      )
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error("[POST /api/agents] Error:", err)
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 })
  }
}
