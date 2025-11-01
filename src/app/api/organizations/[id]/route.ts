import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cookieToken = req.cookies.get("access_token")?.value

  let token: string | null = null
  if (authHeader) {
    token = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`
  } else if (cookieToken) {
    token = `Bearer ${cookieToken}`
  }

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: token }),
  }
}

// ✅ GET single organization by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders(req)
    const { id } = params

    const response = await fetch(`${BACKEND_URL}/api/organization/${id}`, { headers })
    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[v0] GET organization error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch organization" }, { status: response.status })
    }

    const org = await response.json()
    return NextResponse.json(org)
  } catch (err) {
    console.error("[v0] Error fetching organization:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ✅ DELETE organization by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders(req)
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/organization/${id}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[v0] Delete organization backend error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to delete organization" },
        { status: response.status || 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Organization deleted successfully" })
  } catch (err) {
    console.error("[v0] Error deleting organization:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ✅ PATCH — Update organization
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders(req)
    const { id } = params
    const body = await req.json().catch(() => ({}))

    const response = await fetch(`${BACKEND_URL}/api/organization/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[v0] Update organization backend error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: response.status || 500 }
      )
    }

    const updated = await response.json()
    return NextResponse.json(updated)
  } catch (err) {
    console.error("[v0] Error updating organization:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
