import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

async function buildAuthHeaders(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cookieToken = req.cookies.get("access_token")?.value
  let token: string | null = null
  if (authHeader) token = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`
  else if (cookieToken) token = `Bearer ${cookieToken}`
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: token }),
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await buildAuthHeaders(req)
    const response = await fetch(`${BACKEND_URL}/api/agent/${encodeURIComponent(params.id)}`, {
      method: "DELETE",
      headers,
    })

    const text = await response.text().catch(() => "")
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
