"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import NewAgentModal from "@/components/agents/new-agent-modal"
import Button from "@/components/ui/button/Button"
import AgentTabs from "@/components/agents/agent-tabs"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import DeleteAgentModal from "@/components/agents/delete-agent-modal"
import ChatDrawer from "@/components/agents/chat-drawer"
import CreateOrganizationModal from "@/components/agents/create-organization-modal"
import DeleteOrganizationModal from "@/components/agents/delete-organization-modal"
import VoiceCallModal from "@/components/agents/voice-call-modal"
import OutboundCallButton from "@/components/header/NotificationDropdown"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

type CostBreakdown = {
  transcriber: number
  llm: number
  voice: number
  telephony: number
  platform: number
}

export type AgentRecord = {
  id: string
  name: string
  display_name?: string
  description?: string
  welcomeMessage?: string
  instructions?: string
  llmProvider?: string
  llmModel?: string
  llmTokens?: number
  llmTemperature?: number
  knowledgeBaseId?: string
  language?: string
  asrProvider?: string
  asrModel?: string
  asrKeywords?: string
  ttsProvider?: string
  ttsModel?: string
  ttsVoice?: string
  bufferSize?: number
  speedRate?: number
  orgId?: string
}

type Organization = {
  id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

type User = {
  id: number
  email: string
  role: "superadmin" | "admin" | "user"
  organization_id?: number
}

const STORAGE_KEY = "v0-agents"

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null
      if (raw) setValue(JSON.parse(raw))
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch {
      // no-op
    }
  }, [key, value])

  return [value, setValue] as const
}

export default function AgentSetupPage(disabled?: boolean) {
  const [agents, setAgents] = useLocalStorage<AgentRecord[]>(STORAGE_KEY, [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<AgentRecord | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [orgCreateOpen, setOrgCreateOpen] = useState(false)
  const [orgDeleteOpen, setOrgDeleteOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [webCallOpen, setWebCallOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [voiceCallOpen, setVoiceCallOpen] = useState(false)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const orgMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOrgMenuOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setUserLoading(true)
        const res = await fetch("/api/auth/user", { credentials: "include" })
        if (res.ok) {
          const userData = await res.json()
          setCurrentUser(userData.user || userData)
          setError(null)
        } else {
          setCurrentUser(null)
          setError("Authentication required. Please login.")
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        setCurrentUser(null)
        setError("Failed to connect to server")
      } finally {
        setUserLoading(false)
      }
    }
    loadCurrentUser()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/organizations`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch organizations")
      const data = await res.json()
      const list = data.organizations || []
      setOrganizations(list)
      if (!selectedOrgId && list.length > 0) {
        setSelectedOrgId(list[0].id)
      }
    } catch (error) {
      console.error("Failed to load organizations:", error)
      setError("Failed to load organizations")
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadOrganizations = async () => {
      if (!currentUser) return

      if (currentUser.role === "admin") {
        if (currentUser.organization_id) {
          setSelectedOrgId(currentUser.organization_id.toString())
        }
        return
      }

      if (currentUser.role === "superadmin") {
        await fetchOrganizations() // use internal API proxy
      }
    }

    if (currentUser && !userLoading) {
      loadOrganizations()
    }
  }, [currentUser, userLoading])

  useEffect(() => {
    const loadAgents = async () => {
      if (!selectedOrgId) {
        setAgents([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/agents?organization_id=${selectedOrgId}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          console.log("Fetched agents:", data)

          // data is an array, not an object
          const agentsArray = Array.isArray(data) ? data : data.agents || []
          setAgents(agentsArray)

          if (!selectedId && agentsArray.length > 0) {
            setSelectedId(agentsArray[0].id)
          }
        } else {
          setAgents([])
        }
      } catch (error) {
        console.error("Error loading agents:", error)
        setError("Failed to load agents")
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [selectedOrgId])

  console.log("Agents:", agents, selectedOrgId)

  useEffect(() => {
    if (!selectedId && agents.length > 0) {
      setSelectedId(agents[0].id)
    }
  }, [agents, selectedId])

  const canCreateOrganization = currentUser?.role === "superadmin"
  const canDeleteOrganization = currentUser?.role === "superadmin"
  const showOrganizationSelector = currentUser?.role === "superadmin"
  const selected = useMemo(() => agents.find((a) => a.id === selectedId) || null, [agents, selectedId])

  const currentOrganizationName = useMemo(() => {
    if (currentUser?.role === "admin") return "Default Organization"
    if (currentUser?.role === "superadmin" && selectedOrgId) {
      return organizations.find((o) => o.id === selectedOrgId)?.name || "Select Organization"
    }
    return "Select Organization"
  }, [currentUser, selectedOrgId, organizations])

  const handleCreateAgent = (name: string, description?: string) => {
    const id = crypto.randomUUID()
    const newAgent: AgentRecord = {
      id,
      name: name.trim() || "Untitled Agent",
      display_name: name.trim() || "Untitled Agent",
      description: description?.trim(),
      welcomeMessage: "Hello from Solvox",
      instructions: "You are a helpful AI assistant.",
      llmProvider: "OpenAI",
      llmModel: "gpt-4o-mini",
      llmTokens: 450,
      llmTemperature: 0.2,
      language: "English (India)",
      asrProvider: "Deepgram",
      asrModel: "nova-2",
      ttsProvider: "OpenAI",
      ttsModel: "tts-1",
      ttsVoice: "alloy",
      bufferSize: 200,
      speedRate: 1,
      orgId: selectedOrgId,
    }
    setAgents((prev) => [newAgent, ...prev])
    setSelectedId(id)
    setModalOpen(false)
  }

  const handleUpdateAgent = (patch: Partial<AgentRecord>) => {
    if (!selected) return
    const next = { ...selected, ...patch }
    setAgents((prev) => prev.map((a) => (a.id === selected.id ? next : a)))
  }

  const handleSaveSection = async (section: "Agent" | "LLM" | "Audio" | "Tools") => {
    if (!selected) return
    // Save logic here
  }

  const handleDeleteAgentConfirmed = async () => {
    if (!agentToDelete) return
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/agents/${encodeURIComponent(agentToDelete.id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        // try to read error, but proceed to show message
        const errText = await res.text().catch(() => "")
        throw new Error(errText || "Failed to delete assistant")
      }

      setAgents((prev) => {
        const remaining = prev.filter((a) => a.id !== agentToDelete.id)
        if (selectedId === agentToDelete.id) {
          const nextId = remaining[0]?.id ?? null
          setSelectedId(nextId)
        }
        return remaining
      })
    } catch (e: any) {
      setError(e?.message || "Failed to delete assistant")
    } finally {
      setLoading(false)
      setAgentToDelete(null)
      setDeleteOpen(false)
    }
  }

  const costs: CostBreakdown = {
    transcriber: 10,
    llm: 45,
    voice: 25,
    telephony: 5,
    platform: 15,
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to access your workspace.</p>
            <button
              onClick={() => (window.location.href = "/signin")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  console.log("Rendering AgentSetupPage with agents:", agents)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Agent Setup" />

      {/* Error Banner - preserved functionality */}
      {error && (
        <div className="mx-6 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading Banner - preserved functionality */}
      {loading && (
        <div className="mx-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-3"></div>
            <span className="text-blue-800 text-sm">Loading...</span>
          </div>
        </div>
      )}

      <div className="min-h-screen space-y-8 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols:[280px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar - mirrors Agents page styling */}
            <aside
              className={cn(
                "rounded-xl bg-card p-4 md:p-5 dark:bg-gray-800 bg-blue-50 min-h-[calc(80vh-2rem)]",
                agents.length === 0 ? "block" : "hidden lg:block",
              )}
              ref={dropdownRef}
            >
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground dark:text-gray-200">Your Agents</h2>
              </div>

              {/* Organization selector - shown for superadmin to preserve existing role-based behavior */}
              {showOrganizationSelector && (
                <div className="mb-3" ref={orgMenuRef}>
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={orgMenuOpen}
                      onClick={() => setOrgMenuOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="truncate">{currentOrganizationName}</span>
                      <svg
                        className="ml-2 h-4 w-4 text-gray-500 dark:text-gray-300"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {orgMenuOpen && (
                      <div
                        role="listbox"
                        tabIndex={-1}
                        className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md"
                      >
                        <ul className="max-h-72 overflow-auto py-1">
                          {organizations.length > 0 ? (
                            organizations.map((o) => (
                              <li key={o.id}>
                                <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <button
                                    type="button"
                                    className="flex-1 text-left text-sm text-gray-900 dark:text-gray-100"
                                    onClick={() => {
                                      setSelectedOrgId(o.id)
                                      setOrgMenuOpen(false)
                                    }}
                                  >
                                    {o.name}
                                  </button>
                                  {canDeleteOrganization && (
                                    <button
                                      type="button"
                                      title="Delete organization"
                                      aria-label={`Delete ${o.name}`}
                                      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500"
                                      onClick={() => {
                                        setSelectedOrgId(o.id)
                                        setOrgDeleteOpen(true)
                                        setOrgMenuOpen(false)
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                      >
                                        <circle cx="12" cy="12" r="10" fill="#E02424" />
                                        <path
                                          d="M15 9L9 15M9 9L15 15"
                                          stroke="white"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">No organizations</li>
                          )}
                        </ul>

                        {canCreateOrganization && (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700" />
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              onClick={() => {
                                setOrgMenuOpen(false)
                                setOrgCreateOpen(true)
                              }}
                            >
                              <span className="text-base leading-none">+</span>
                              <span>Create organization</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* New Agent button - mirrors Agents UI, keeps disabled behavior when no org selected */}
              <div className="flex items-center gap-2">
                <Button size="sm" className="w-full" onClick={() => setModalOpen(true)} disabled={!selectedOrgId}>
                  + New Assistant
                </Button>
              </div>

              
              {/* Agents list */}
              <ul className="mt-4 space-y-1">
                {agents
                  .filter(
                    (a) =>
                      !selectedOrgId ||
                      String((a as any).orgId) === String(selectedOrgId) ||
                      String((a as any).organization_id) === String(selectedOrgId),
                  )
                  .map((a) => (
                    <li key={a.id}>
                      <button
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition border",
                          selectedId === a.id
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-500 ring-1 ring-blue-500"
                            : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent",
                        )}
                        onClick={() => setSelectedId(a.id)}
                        aria-current={selectedId === a.id ? "true" : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{a.display_name}</span>
                          <button
                            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAgentToDelete(a)
                              setDeleteOpen(true)
                            }}
                            aria-label="Delete agent"
                            title="Delete agent"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle cx="12" cy="12" r="10" fill="#E02424" />
                              <path
                                d="M15 9L9 15M9 9L15 15"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </button>
                    </li>
                  ))}

                {agents.filter(
                  (a) =>
                    !selectedOrgId ||
                    String((a as any).orgId) === String(selectedOrgId) ||
                    String((a as any).organization_id) === String(selectedOrgId),
                ).length === 0 && (
                    <li className="text-sm text-muted-foreground text-center dark:text-gray-300">
                      {selectedOrgId ? "No agents yet" : "Select organization"}
                    </li>
                  )}
              </ul>
            </aside>

            {/* Main Content - mirrors Agents page */}
            {agents.length > 0 && (
              <section className="space-y-4">
                {/* Mobile selector */}
                <div className="lg:hidden">
                  <div className="mb-2 text-xs font-medium text-muted-foreground dark:text-gray-300">Select Agent</div>
                  <div className="rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
                    <select
                      value={selectedId ?? ""}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose agent</option>
                      {agents
                        .filter((a) => !selectedOrgId || (a as any).orgId === selectedOrgId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Title + Actions */}
                <div className="rounded-xl border bg-card p-4 md:p-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Input */}
                    <input
                      className="w-full max-w-xl rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                      value={selected?.display_name ?? ""}
                      placeholder="Agent name"
                      onChange={(e) => handleUpdateAgent({ display_name: e.target.value })}
                      disabled={disabled}
                    />

                    {/* Button Wrapper (uses full flex row) */}
                    <div className="flex w-full md:w-auto items-center gap-2">
                      <div className="div ">
                        <div className="flex items-center gap-2 mb-2">
                          <Button size="sm" className="min-w-24" onClick={() => setChatOpen(true)} disabled={!selected}>
                            Chat
                          </Button>

                          <Button
                            size="sm"
                            className="min-w-28"
                            onClick={() => setVoiceCallOpen(true)}
                            disabled={!selected}
                          >
                            Voice Call
                          </Button>
                        </div>

                        {/* Web Call (not inside inner flex) */}
                        <Button size="sm" className="w-full" onClick={() => setWebCallOpen(true)} disabled={!selected}>
                          Web Call
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cost per min segmented bar */}
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-muted-foreground dark:text-white">
                      Cost per min: ~ $0.094
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary ">
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${costs.transcriber}%` }}
                        aria-label="Transcriber"
                      />
                      <div className="bg-rose-500" style={{ width: `${costs.llm}%` }} />
                      <div className="bg-blue-500" style={{ width: `${costs.voice}%` }} />
                      <div className="bg-amber-500" style={{ width: `${costs.telephony}%` }} />
                      <div className="bg-slate-500" style={{ width: `${costs.platform}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground dark:text-white">
                      <LegendDot color="bg-emerald-500" label="Transcriber" />
                      <LegendDot color="bg-rose-500" label="LLM" />
                      <LegendDot color="bg-blue-500" label="Voice" />
                      <LegendDot color="bg-amber-500" label="Telephony" />
                      <LegendDot color="bg-slate-500" label="Platform" />
                    </div>
                  </div>
                </div>

                {/* Tabs and content */}
                <div className="rounded-xl  bg-card">
                  <AgentTabs
                    agent={selected}
                    onUpdate={handleUpdateAgent}
                    onSaveSection={handleSaveSection}
                    disabled={!selected}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Modals - preserved functionality */}
          <DeleteAgentModal
            isOpen={deleteOpen}
            onCancel={() => {
              setDeleteOpen(false)
              setAgentToDelete(null)
            }}
            onConfirm={handleDeleteAgentConfirmed}
            agentName={agentToDelete?.name ?? ""}
          />
          <NewAgentModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreate={handleCreateAgent}
            organizationId={selectedOrgId} // pass org id so Create button enables and payload includes it
          />
          {canCreateOrganization && (
            <CreateOrganizationModal
              open={orgCreateOpen}
              onClose={() => setOrgCreateOpen(false)}
              onCreate={async () => {
                await fetchOrganizations()
              }}
            />
          )}
          <DeleteOrganizationModal
            open={orgDeleteOpen}
            onCancel={() => setOrgDeleteOpen(false)}
            onConfirm={async () => {
              try {
                if (!selectedOrgId) {
                  setOrgDeleteOpen(false)
                  return
                }
                setLoading(true)
                setError(null)
                const res = await fetch(`/api/organizations/${encodeURIComponent(selectedOrgId)}`, {
                  method: "DELETE",
                  credentials: "include",
                })
                if (!res.ok) {
                  const text = await res.text().catch(() => "")
                  throw new Error(text || "Failed to delete organization")
                }
                setOrganizations((prev) => prev.filter((o) => o.id !== selectedOrgId))
                // reset selection if needed
                const remaining = organizations.filter((o) => o.id !== selectedOrgId)
                setSelectedOrgId(remaining[0]?.id ?? "")
                setAgents([]) // clear agents for deleted org
              } catch (e: any) {
                setError(e?.message || "Failed to delete organization")
              } finally {
                setLoading(false)
                setOrgDeleteOpen(false)
              }
            }}
          />
          <ChatDrawer
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            agentName={selected?.name ?? "Assistant"}
            agentId={selected?.name ?? ""}
            display_name={selected?.display_name ?? ""}
          />


          {webCallOpen && (
            <OutboundCallButton
              open={webCallOpen}
              onClose={() => setWebCallOpen(false)}
              name={selected?.display_name ?? selected?.name ?? "AI Agent"}
            />
          )}
          <VoiceCallModal
            open={voiceCallOpen}
            onClose={() => setVoiceCallOpen(false)}
            agentname={selected?.name ?? "Assistant"}
            agentID={selected?.name ?? ""}
            display_name={selected?.display_name ?? ""}
          />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
      <span className="text-xs">{label}</span>
    </span>
  )
}
