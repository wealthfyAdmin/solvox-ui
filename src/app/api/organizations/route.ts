import { type NextRequest, NextResponse } from "next/server"

type Organization = { id: string; name: string; description?: string }

// module-scope memory (dev only)
let ORGS: Organization[] = []

export async function GET() {
  return NextResponse.json({ organizations: ORGS })
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json()
  const org: Organization = { id: crypto.randomUUID(), name, description }
  ORGS = [org, ...ORGS]
  return NextResponse.json({ organization: org })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  ORGS = ORGS.filter((o) => o.id !== id)
  return NextResponse.json({ ok: true })
}
