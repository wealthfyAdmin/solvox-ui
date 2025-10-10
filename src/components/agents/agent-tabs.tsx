"use client"
import { useState } from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"
import UnderConstruction from "./under-construction"
import AgentTab from "./tabs/agent-tab"
import LLMTab from "./tabs/llm-tab"
import AudioTab from "./tabs/audio-tab"

const TABS = ["Agent", "LLM", "Audio", "Tools"] as const
type TabKey = (typeof TABS)[number]

export default function AgentTabs({
  agent,
  onUpdate,
  disabled,
}: { agent: AgentRecord | null; onUpdate: (patch: Partial<AgentRecord>) => void; disabled?: boolean }) {
  const [active, setActive] = useState<TabKey>("Agent")

  return (
    <>
      {/* Tab bar styled like ChatWindow toggle */}
      <div className="border-b px-3 py-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = active === tab
            return (
              <button
                key={tab}
                type="button"
                disabled={disabled}
                onClick={() => setActive(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {active === "Agent" && <AgentTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {active === "LLM" && <LLMTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {active === "Audio" && <AudioTab agent={agent} onUpdate={onUpdate} disabled={disabled} />}
        {active === "Tools" && <UnderConstruction />}
      </div>
    </>
  )
}
