import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

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

export async function GET(req: NextRequest) {
  try {
    const headers = await getAuthHeaders(req)
    // trailing slash to avoid backend redirects
    const response = await fetch(`${BACKEND_URL}/api/organization/`, { headers })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[v0] Organizations backend error:", response.status, errorText)
      return NextResponse.json({ organizations: [] }, { status: 200 })
    }

    const backendOrganizations = await response.json()
    const organizations = (backendOrganizations || []).map((org: any) => ({
      id: String(org.id),
      name: org.name,
      description: org.description,
      created_at: org.created_at,
      updated_at: org.updated_at,
    }))

    return NextResponse.json({ organizations })
  } catch (err) {
    console.error("[v0] Error fetching organizations:", err)
    return NextResponse.json({ organizations: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const headers = await getAuthHeaders(req)

    // Only send what backend expects
    const organizationData = {
      name: body?.name,
      description: body?.description ?? null,
    }

    const response = await fetch(`${BACKEND_URL}/api/organization/`, {
      method: "POST",
      headers,
      body: JSON.stringify(organizationData),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[v0] Create organization backend error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to create organization" }, { status: response.status || 500 })
    }

    const created = await response.json()
    const organization = {
      id: String(created.id),
      name: created.name,
      description: created.description,
      created_at: created.created_at,
      updated_at: created.updated_at,
    }

    return NextResponse.json({ organization })
  } catch (err) {
    console.error("[v0] Error creating organization:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
