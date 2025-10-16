"use client"

import { useMemo, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

type WidgetCfg = {
  assistantId?: string
  name?: string
  welcomeMessage?: string
  prompt?: string
  llm?: {
    provider?: string
    model?: string
    temperature?: number
    tokens?: number
  }
  audio?: {
    language?: string
    asrProvider?: string
    asrModel?: string
    ttsProvider?: string
    ttsModel?: string
    ttsVoice?: string
    bufferSize?: number
    speedRate?: number
  }
  tools?: string[]
  orgId?: string
}

function decodeConfigParam(raw?: string): WidgetCfg | null {
  if (!raw) return null
  // Try URL-encoded JSON first (this is what your WidgetTab generates)
  try {
    const json = decodeURIComponent(raw)
    return JSON.parse(json)
  } catch {}
  // Try plain JSON
  try {
    return JSON.parse(raw)
  } catch {}
  // Try base64 → UTF-8 JSON (fallback if changed in the future)
  try {
    // atob may throw in some browsers if unicode; wrap in try
    const json = decodeURIComponent(escape(atob(raw)))
    return JSON.parse(json)
  } catch {}
  return null
}

export default function EmbedPage() {
  const [ChatWindow, setChatWindow] = useState<any>(null)
  const searchParams = useSearchParams()
  const configParam = useMemo(() => searchParams.get("config"), [searchParams])
  const assistantId = searchParams.get("assistantId") || searchParams.get("id") || "ASSISTANT_ID"
  const orgId = searchParams.get("orgId") || undefined

  // Attempt to load a ChatWindow component if your project has one.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import("@/components/chat-window")
        if (mounted && mod?.default) {
          setChatWindow(() => mod.default)
        }
      } catch {
        // Fallback UI shown below if not found
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const cfg: WidgetCfg | null = useMemo(() => decodeConfigParam(configParam || undefined), [configParam])

  const agentName = cfg?.name || "Assistant"
  const welcome = cfg?.welcomeMessage || "Hello! How can I help you today?"

  useEffect(() => {
    // Inject the same launcher code used in the embed snippet (new-tab behavior)
    const d = document
    const ROOT_ID = "solvox-widget-root"
    let root = d.getElementById(ROOT_ID)
    if (!root) {
      root = d.createElement("div")
      root.id = ROOT_ID
      d.body.appendChild(root)
    }

    const b = d.createElement("button")
    b.type = "button"
    b.setAttribute("aria-label", "Open AI Assistant")
    b.style.position = "fixed"
    b.style.bottom = "16px"
    b.style.right = "16px"
    b.style.zIndex = "2147483001"
    b.style.width = "56px"
    b.style.height = "56px"
    b.style.borderRadius = "50%"
    b.style.border = "none"
    b.style.cursor = "pointer"
    b.style.background = "#2563eb"
    b.style.color = "#fff"
    b.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)"
    b.style.display = "flex"
    b.style.alignItems = "center"
    b.style.justifyContent = "center"
    b.style.fontSize = "20px"
    b.style.lineHeight = "1"
    b.innerHTML = "💬"

    const origin = window.location.origin.replace(/\/$/, "")
    const qp = new URLSearchParams()
    qp.set("assistantId", assistantId)
    if (orgId) qp.set("orgId", orgId)

    const target = `${origin}/widget?${qp.toString()}`
    const onClick = () => {
      try {
        window.open(target, "_blank", "noopener,noreferrer")
      } catch {
        // ignore
      }
    }
    b.addEventListener("click", onClick)
    root.appendChild(b)

    return () => {
      b.removeEventListener("click", onClick)
      try {
        root?.removeChild(b)
      } catch {}
    }
  }, [assistantId, orgId])

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Blank page for testing the widget launcher */}
      <div className="sr-only">
        Assistant: {assistantId} {orgId ? `(org: ${orgId})` : ""}
      </div>
    </main>
  )
}
