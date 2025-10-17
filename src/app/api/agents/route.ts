import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const incoming = await request.json().catch(() => ({}))
    const name = typeof incoming?.name === "string" ? incoming.name : ""
    const description = typeof incoming?.description === "string" ? incoming.description : undefined
    let organization_id = typeof incoming?.organization_id === "number" ? incoming.organization_id : undefined

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

    // Try to infer organization_id from authenticated user if not provided
    if (organization_id == null) {
      try {
        const meRes = await fetch(`${backend}/auth/me`, {
          method: "GET",
          headers: {
            // forward auth headers/cookies
            cookie: request.headers.get("cookie") || "",
            authorization: request.headers.get("authorization") || "",
          },
        })
        if (meRes.ok) {
          const me = await meRes.json().catch(() => ({}))
          const inferred =
            typeof me?.user?.organization_id === "number"
              ? me.user.organization_id
              : typeof me?.organization_id === "number"
                ? me.organization_id
                : undefined
          if (typeof inferred === "number") {
            organization_id = inferred
          }
        }
      } catch {
        // ignore inference failure, we'll proceed without it
      }
    }

    const payload = {
      name,
      description,
      organization_id,
    }

    const upstream = await fetch(`${backend}/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 })
  }
}
