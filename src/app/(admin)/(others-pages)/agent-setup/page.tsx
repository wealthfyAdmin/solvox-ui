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
import VoiceCallModal from "@/components/agents/voice-call-modal"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

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
    welcomeMessage?: string
    prompt?: string
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

export default function AgentSetupPage() {
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

    // [Include all your useEffect hooks and functions from the previous code]
    // For brevity, I'm focusing on the JSX layout changes
    
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                setUserLoading(true)
                const res = await fetch('/api/auth/me', { credentials: 'include' })
                if (res.ok) {
                    const userData = await res.json()
                    setCurrentUser(userData.user || userData)
                    setError(null)
                } else {
                    setCurrentUser(null)
                    setError('Authentication required. Please login.')
                }
            } catch (error) {
                console.error('Failed to load user:', error)
                setCurrentUser(null)
                setError('Failed to connect to server')
            } finally {
                setUserLoading(false)
            }
        }
        loadCurrentUser()
    }, [])

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
                try {
                    setLoading(true)
                    setError(null)
                    const res = await fetch('/api/organizations', { credentials: 'include' })
                    if (!res.ok) throw new Error('Failed to fetch organizations')
                    const data = await res.json()
                    const organizations = data.organizations || []
                    setOrganizations(organizations)
                    if (!selectedOrgId && organizations.length > 0) {
                        setSelectedOrgId(organizations[0].id)
                    }
                } catch (error) {
                    console.error('Failed to load organizations:', error)
                    setError('Failed to load organizations')
                    setOrganizations([])
                } finally {
                    setLoading(false)
                }
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
                const res = await fetch(`/api/agents?orgId=${selectedOrgId}`, { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    if (data.agents) {
                        setAgents(data.agents)
                        if (!selectedId && data.agents.length > 0) {
                            setSelectedId(data.agents[0].id)
                        }
                    } else {
                        setAgents([])
                    }
                } else {
                    setAgents([])
                }
            } catch (error) {
                console.error('Error loading agents:', error)
                setError('Failed to load agents')
                setAgents([])
            } finally {
                setLoading(false)
            }
        }
        loadAgents()
    }, [selectedOrgId])

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
            return organizations.find(o => o.id === selectedOrgId)?.name || "Select Organization"
        }
        return "Select Organization"
    }, [currentUser, selectedOrgId, organizations])

    // [Include all your handler functions here]
    const handleCreateAgent = (name: string, description?: string) => {
        const id = crypto.randomUUID()
        const newAgent: AgentRecord = {
            id,
            name: name.trim() || "Untitled Agent",
            description: description?.trim(),
            welcomeMessage: "Hello from Solvox",
            prompt: "You are a helpful AI assistant.",
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

    const handleDeleteAgentConfirmed = () => {
        if (!agentToDelete) return
        setAgents((prev) => {
            const remaining = prev.filter((a) => a.id !== agentToDelete.id)
            if (selectedId === agentToDelete.id) {
                const nextId = remaining[0]?.id ?? null
                setSelectedId(nextId)
            }
            return remaining
        })
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
                            onClick={() => window.location.href = '/login'}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageBreadcrumb pageTitle="Agent Setup" />
            
            {/* Error Banner */}
            {error && (
                <div className="mx-6 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

            {/* Loading Banner */}
            {loading && (
                <div className="mx-6 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-3"></div>
                        <span className="text-blue-800 text-sm">Loading...</span>
                    </div>
                </div>
            )}
            
            <div className="px-6 pb-8">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Sidebar - Clean & Organized */}
                        <div className={cn(
                            "col-span-12 lg:col-span-3",
                            agents.length === 0 ? "block" : "hidden lg:block"
                        )}>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                                {/* User Header */}
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {currentUser.email.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">Your Agents</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {currentUser.email} • {currentUser.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Organization Selector */}
                                {showOrganizationSelector && (
                                    <div className="mb-6" ref={orgMenuRef}>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <span className="truncate">{currentOrganizationName}</span>
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {orgMenuOpen && (
                                                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {organizations.map((o) => (
                                                            <button
                                                                key={o.id}
                                                                onClick={() => {
                                                                    setSelectedOrgId(o.id)
                                                                    setOrgMenuOpen(false)
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                            >
                                                                {o.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {canCreateOrganization && (
                                                        <>
                                                            <div className="border-t border-gray-200 dark:border-gray-700"></div>
                                                            <button
                                                                onClick={() => {
                                                                    setOrgMenuOpen(false)
                                                                    setOrgCreateOpen(true)
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            >
                                                                + Create Organization
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* New Agent Button */}
                                <button
                                    onClick={() => setModalOpen(true)}
                                    disabled={!selectedOrgId}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-6"
                                >
                                    + New Assistant
                                </button>

                                {/* Agents List */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                        AGENTS ({agents.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {agents.map((agent) => (
                                            <div
                                                key={agent.id}
                                                onClick={() => setSelectedId(agent.id)}
                                                className={cn(
                                                    "group relative p-3 rounded-lg cursor-pointer border transition-all",
                                                    selectedId === agent.id
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                                            selectedId === agent.id
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                        )}>
                                                            🤖
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {agent.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {agent.llmProvider} • {agent.language}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setAgentToDelete(agent)
                                                            setDeleteOpen(true)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {agents.length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {selectedOrgId ? 'No agents yet' : 'Select organization'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area - Clean Layout */}
                        <div className="col-span-12 lg:col-span-9">
                            {agents.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Mobile Agent Selector */}
                                    <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select Agent
                                        </label>
                                        <select
                                            value={selectedId || ""}
                                            onChange={(e) => setSelectedId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Choose agent</option>
                                            {agents.map((agent) => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Agent Header Card */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="p-6">
                                            {/* Agent Info & Actions */}
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                                {/* Agent Info */}
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                        <span className="text-2xl">🤖</span>
                                                    </div>
                                                    <div>
                                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {selected?.name || 'AI Assistant'}
                                                        </h1>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            {selected?.llmProvider} {selected?.llmModel}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => setChatOpen(true)}
                                                        disabled={!selected}
                                                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        Chat with Assistant
                                                    </button>
                                                    <button
                                                        onClick={() => setVoiceCallOpen(true)}
                                                        disabled={!selected}
                                                        className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                        </svg>
                                                        Voice Call with Agent
                                                    </button>
                                                    <button
                                                        onClick={() => setWebCallOpen(true)}
                                                        disabled={!selected}
                                                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        Make a Call
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost Analysis */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost Analysis</h3>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">$0.094</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">per minute</div>
                                                </div>
                                            </div>
                                            
                                            {/* Cost Breakdown Bar */}
                                            <div className="mb-4">
                                                <div className="flex h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500" style={{ width: `${costs.transcriber}%` }}></div>
                                                    <div className="bg-red-500" style={{ width: `${costs.llm}%` }}></div>
                                                    <div className="bg-blue-500" style={{ width: `${costs.voice}%` }}></div>
                                                    <div className="bg-amber-500" style={{ width: `${costs.telephony}%` }}></div>
                                                    <div className="bg-gray-500" style={{ width: `${costs.platform}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Cost Legend */}
                                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                                                <CostLegendItem color="bg-emerald-500" label="Transcriber" percentage={costs.transcriber} />
                                                <CostLegendItem color="bg-red-500" label="LLM" percentage={costs.llm} />
                                                <CostLegendItem color="bg-blue-500" label="Voice" percentage={costs.voice} />
                                                <CostLegendItem color="bg-amber-500" label="Telephony" percentage={costs.telephony} />
                                                <CostLegendItem color="bg-gray-500" label="Platform" percentage={costs.platform} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Configuration Tabs */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <AgentTabs
                                            agent={selected}
                                            onUpdate={handleUpdateAgent}
                                            onSaveSection={handleSaveSection}
                                            disabled={!selected}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                                    <div className="text-center max-w-md mx-auto">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No agents yet</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            Create your first AI assistant to start building intelligent conversations.
                                        </p>
                                        <button
                                            onClick={() => setModalOpen(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                                        >
                                            Create Your First Agent
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* All Modals */}
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
            {canCreateOrganization && (
                <CreateOrganizationModal
                    open={orgCreateOpen}
                    onClose={() => setOrgCreateOpen(false)}
                    onCreate={() => {}}
                />
            )}
            <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} agentName={selected?.name ?? "Assistant"} />
            <WebCallModal open={webCallOpen} onClose={() => setWebCallOpen(false)} />
            <VoiceCallModal 
                open={voiceCallOpen} 
                onClose={() => setVoiceCallOpen(false)} 
                agentName={selected?.name ?? "Assistant"}
                agentId={selected?.id ?? ""}
            />
        </div>
    )
}

function CostLegendItem({ color, label, percentage }: { color: string; label: string; percentage: number }) {
    return (
        <div className="flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full", color)}></div>
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{percentage}%</span>
        </div>
    )
}
