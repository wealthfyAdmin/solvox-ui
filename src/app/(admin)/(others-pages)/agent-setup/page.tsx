"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import NewAgentModal from "@/components/agents/new-agent-modal"
import Button from "@/components/ui/button/Button"
import AgentTabs from "@/components/agents/agent-tabs"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import DeleteAgentModal from "@/components/agents/delete-agent-modal"
import ChatDrawer from "@/components/agents/chat-drawer"
import WebCallModal from "@/components/agents/web-call-modal"
import CreateOrganizationModal from "@/components/agents/create-organization-modal"
import DeleteOrganizationModal from "@/components/agents/delete-organization-modal"

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
    description?: string
    // Agent Tab
    welcomeMessage?: string
    prompt?: string
    // LLM Tab
    llmProvider?: string
    llmModel?: string
    llmTokens?: number
    llmTemperature?: number
    knowledgeBaseId?: string
    // Audio Tab
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

type Organization = { id: string; name: string; description?: string }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default function AgentSetupPage() {
    const [agents, setAgents] = useLocalStorage<AgentRecord[]>(STORAGE_KEY, [])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState<AgentRecord | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string | "">("")
    const [orgCreateOpen, setOrgCreateOpen] = useState(false)
    const [orgDeleteOpen, setOrgDeleteOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [webCallOpen, setWebCallOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [orgMenuOpen, setOrgMenuOpen] = useState(false)
    const orgMenuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!selectedId && agents.length > 0) {
            setSelectedId(agents[0].id)
        }
    }, [agents, selectedId])

    useEffect(() => {
        ; (async () => {
            try {
                const res = await fetch("/api/organizations")
                const data = await res.json()
                setOrganizations(data.organizations ?? [])
                if (!selectedOrgId && (data.organizations?.length ?? 0) > 0) {
                    setSelectedOrgId(data.organizations[0].id)
                }
            } catch { }
        })()
    }, [])

    const selected = useMemo(() => agents.find((a) => a.id === selectedId) || null, [agents, selectedId])

    async function createAgentRemote(agent: AgentRecord) {
        try {
            await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", agent }),
            })
        } catch { }
    }

    async function updateAgentRemote(agent: AgentRecord, section?: string) {
        try {
            await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", agent, section }),
            })
        } catch { }
    }

    async function deleteAgentRemote(id: string) {
        try {
            await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id }),
            })
        } catch { }
    }

    async function handleCreateOrg(name: string, description?: string) {
        try {
            const res = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            })
            const data = await res.json()
            const org = data.organization as Organization
            setOrganizations((prev) => [org, ...prev])
            setSelectedOrgId(org.id)
            setOrgCreateOpen(false)
        } catch { }
    }

    async function handleDeleteOrg() {
        try {
            if (!selectedOrgId) return
            await fetch("/api/organizations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedOrgId }),
            })
            setOrganizations((prev) => prev.filter((o) => o.id !== selectedOrgId))
            setAgents((prev) => prev.filter((a) => (a as any).orgId !== selectedOrgId))
            setSelectedOrgId("")
            setOrgDeleteOpen(false)
            setSelectedId(null)
        } catch { }
    }

    function handleCreateAgent(name: string, description?: string) {
        const id = crypto.randomUUID()
        const newAgent: AgentRecord = {
            id,
            name: name.trim() || "Untitled Agent",
            description: description?.trim(),
            welcomeMessage: "Hello from Bolna",
            prompt:
                "You are a helpful agent. You will help the customer with their queries and doubts. You will never speak more than 2 sentences. Keep your responses concise",
            llmProvider: "OpenAI",
            llmModel: "gpt-4.1-mini",
            llmTokens: 450,
            llmTemperature: 0.2,
            language: "English (India)",
            asrProvider: "Deepgram",
            asrModel: "nova-2",
            asrKeywords: "Bruce:100",
            ttsProvider: "Elevenlabs",
            ttsModel: "eleven_turbo_v2_5",
            ttsVoice: "Wendy",
            bufferSize: 200,
            speedRate: 1,
            ...(selectedOrgId ? { orgId: selectedOrgId } : {}),
        }
        setAgents((prev) => [newAgent, ...prev])
        setSelectedId(id)
        setModalOpen(false)
        createAgentRemote(newAgent)
    }

    function handleUpdateAgent(patch: Partial<AgentRecord>) {
        if (!selected) return
        const next = { ...selected, ...patch }
        setAgents((prev) => prev.map((a) => (a.id === selected.id ? next : a)))
    }

    async function handleSaveSection(section: "Agent" | "LLM" | "Audio" | "Tools") {
        if (!selected) return
        await updateAgentRemote(selected, section)
    }

    function handleDeleteAgentConfirmed() {
        if (!agentToDelete) return
        setAgents((prev) => {
            const remaining = prev.filter((a) => a.id !== agentToDelete.id)
            if (selectedId === agentToDelete.id) {
                const nextId = remaining[0]?.id ?? null
                setSelectedId(nextId)
            }
            return remaining
        })
        deleteAgentRemote(agentToDelete.id)
        setAgentToDelete(null)
        setDeleteOpen(false)
    }

    const costs: CostBreakdown = {
        transcriber: 10,
        llm: 45,
        voice: 25,
        telephony: 5,
        platform: 15,
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSelectedOrgId("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageBreadcrumb pageTitle="Agent Setup" />
            <div className="min-h-screen space-y-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    {/* Sidebar */}
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

                        {/* Custom Dropdown */}
                        <div className="mb-3" ref={orgMenuRef}>
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-haspopup="listbox"
                                    aria-expanded={orgMenuOpen}
                                    onClick={() => setOrgMenuOpen((v) => !v)}
                                    className="flex w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <span className="truncate">
                                        {selectedOrgId
                                            ? organizations.find((o) => o.id === selectedOrgId)?.name || "Select organization"
                                            : "Select organization"}
                                    </span>
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
                                                                {/* bin icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                    width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="10" fill="#E02424" />
                                                                    <path d="M15 9L9 15M9 9L15 15"
                                                                        stroke="white"
                                                                        stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">No organizations</li>
                                            )}
                                        </ul>

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
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button size="sm" className="w-full" onClick={() => setModalOpen(true)} disabled={!selectedOrgId}>
                                + New Assistant
                            </Button>
                        </div>
                        {/* End Custom Dropdown */}
                        {/* ... existing code ... */}
                        <ul className="mt-4 space-y-1">
                            {agents
                                .filter((a) => !selectedOrgId || (a as any).orgId === selectedOrgId)
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
                                                <span className="truncate">{a.name}</span>
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
                                                    {/* bin icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                        width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                        <circle cx="12" cy="12" r="10" fill="#E02424" />
                                                        <path d="M15 9L9 15M9 9L15 15"
                                                            stroke="white"
                                                            stroke-width="2"
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            {agents.filter((a) => !selectedOrgId || (a as any).orgId === selectedOrgId).length === 0 && (
                                <li className="text-sm text-muted-foreground text-center dark:text-gray-300">No agents yet</li>
                            )}
                        </ul>
                    </aside>

                    {/* Main Content */}
                     {agents.length > 0 && (
                    <section className="space-y-4">
                        {agents.length > 0 && (
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
                        )}

                        {/* Title + Actions */}
                        <div className="rounded-xl border bg-card p-4 md:p-5">
                            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                                <input
                                    className="w-full max-w-xl rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selected?.name ?? ""}
                                    placeholder="Agent name"
                                    onChange={(e) => handleUpdateAgent({ name: e.target.value })}
                                    disabled={!selected}
                                />

                                <div className="flex items-center gap-2">
                                    <Button size="sm" className="min-w-24" onClick={() => setChatOpen(true)} disabled={!selected}>
                                        Chat with Assistant
                                    </Button>
                                    <Button size="sm" className="min-w-20" onClick={() => setWebCallOpen(true)} disabled={!selected}>
                                        Web Call
                                    </Button>
                                </div>
                            </div>

                            {/* Cost per min segmented bar */}
                            <div className="mt-4">
                                <div className="mb-2 text-xs font-medium text-muted-foreground dark:text-white">Cost per min: ~ $0.094</div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary ">
                                    <div className="bg-emerald-500" style={{ width: `${costs.transcriber}%` }} aria-label="Transcriber" />
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
                        <div className="rounded-xl border bg-card">
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

                {/* Modals */}
                <DeleteAgentModal
                    isOpen={deleteOpen}
                    onCancel={() => {
                        setDeleteOpen(false)
                        setAgentToDelete(null)
                    }}
                    onConfirm={handleDeleteAgentConfirmed}
                    agentName={agentToDelete?.name ?? ""}
                />
                <NewAgentModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateAgent} />

                <CreateOrganizationModal
                    open={orgCreateOpen}
                    onClose={() => setOrgCreateOpen(false)}
                    onCreate={handleCreateOrg}
                />
                <DeleteOrganizationModal
                    open={orgDeleteOpen}
                    onCancel={() => setOrgDeleteOpen(false)}
                    onConfirm={handleDeleteOrg}
                />

                <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} agentName={selected?.name ?? "Assistant"} />
                <WebCallModal open={webCallOpen} onClose={() => setWebCallOpen(false)} />
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
