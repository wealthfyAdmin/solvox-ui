import { type NextRequest, NextResponse } from "next/server"

type AgentRecord = Record<string, any>
let AGENTS: AgentRecord[] = []

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")
  const list = orgId ? AGENTS.filter((a) => a.orgId === orgId) : AGENTS
  return NextResponse.json({ agents: list })
}

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { action } = payload as { action: "create" | "update" | "delete" }
  if (action === "create") {
    const { agent } = payload as { agent: AgentRecord }
    AGENTS = [agent, ...AGENTS]
    return NextResponse.json({ agent })
  }
  if (action === "delete") {
    const { id } = payload as { id: string }
    AGENTS = AGENTS.filter((a) => a.id !== id)
    return NextResponse.json({ ok: true })
  }
  if (action === "update") {
    const { agent, section } = payload as { agent: AgentRecord; section?: string }
    AGENTS = AGENTS.map((a) => (a.id === agent.id ? { ...a, ...agent } : a))
    return NextResponse.json({ agent, section })
  }
  return NextResponse.json({ ok: true })
}
