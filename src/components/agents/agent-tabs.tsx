"use client"

import { useState } from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"
import Button from "@/components/ui/button/Button"
import AgentTab from "./tabs/agent-tab"
import LLMTab from "./tabs/llm-tab"
import AudioTab from "./tabs/audio-tab"
import WidgetTab from "./tabs/widget-tab"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

type TabType = "agent" | "llm" | "audio" | "widget"

export default function AgentTabs({
  agent,
  onUpdate,
  onSaveSection,
  disabled,
}: {
  agent: AgentRecord | null
  onUpdate: (patch: Partial<AgentRecord>) => void
  onSaveSection: (section: "Agent" | "LLM" | "Audio" | "Tools") => void
  disabled?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabType>("agent")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveChanges = async () => {
    if (!agent?.id) return

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      const payload = {
        name: agent.name,
        display_name: agent.display_name,
        description: agent.description,
        instructions: agent.instructions,
        greeting_message: agent.welcomeMessage,
        llm_provider: agent.llmProvider,
        llm_model: agent.llmModel,
        temperature: agent.llmTemperature ?? 0.7,
        token_limit: agent.llmTokens ?? 450,
        stt_provider: agent.asrProvider,
        stt_model: agent.asrModel,
        stt_language: agent.language,
        tts_provider: agent.ttsProvider,
        tts_model: agent.ttsModel,
        tts_voice: agent.ttsVoice,
        knowledgebase_id: agent.knowledgeBaseId ? Number(agent.knowledgeBaseId) : 0,
        tools: {},
        is_active: true,
      }

      const res = await fetch(`${BACKEND_URL}/api/agent/${encodeURIComponent(agent.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.message || errData?.error || "Failed to save agent")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setSaveError(error?.message || "Failed to save changes")
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "agent", label: "Agent" },
    { id: "llm", label: "LLM" },
    { id: "audio", label: "Audio" },
    { id: "widget", label: "Widget" },
  ]

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-white dark:bg-gray-800">
        {activeTab === "agent" && <AgentTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {activeTab === "llm" && <LLMTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {activeTab === "audio" && <AudioTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {activeTab === "widget" && <WidgetTab agent={agent} disabled={disabled} />}

        {/* Save Section - shown for all tabs except widget */}
        {activeTab !== "widget" && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
            {/* Status Messages */}
            {saveError && (
              <div className="flex-1 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="flex-1 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                Changes saved successfully
              </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSaveChanges} disabled={disabled || isSaving} className="min-w-32">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
