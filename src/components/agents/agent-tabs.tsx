"use client"
import { useState } from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"
import UnderConstruction from "./under-construction"
import AgentTab from "./tabs/agent-tab"
import LLMTab from "./tabs/llm-tab"
import AudioTab from "./tabs/audio-tab"
import WidgetTab from "./tabs/widget-tab"
import Button from "../ui/button/Button"
import UnsavedChangesModal from "./unsaved-changes-modal"

const TABS = ["Agent", "LLM", "Audio", "Tools", "Widget"] as const
type TabKey = (typeof TABS)[number]

export default function AgentTabs({
  agent,
  onUpdate,
  onSaveSection,
  disabled,
}: {
  agent: AgentRecord | null
  onUpdate: (patch: Partial<AgentRecord>) => void
  onSaveSection: (section: Exclude<TabKey, "Widget">) => void
  disabled?: boolean
}) {
  const [active, setActive] = useState<TabKey>("Agent")
  const [dirty, setDirty] = useState<Record<Exclude<TabKey, "Widget">, boolean>>({
    Agent: false,
    LLM: false,
    Audio: false,
    Tools: false,
  } as any)
  const [showGuard, setShowGuard] = useState(false)
  const [nextTab, setNextTab] = useState<TabKey | null>(null)

  const markDirty = (tab: Exclude<TabKey, "Widget">) => setDirty((d) => ({ ...d, [tab]: true }))

  function handleTabClick(tab: TabKey) {
    const activeDirty = active !== "Widget" && dirty[active as Exclude<TabKey, "Widget">]
    if (activeDirty) {
      setNextTab(tab)
      setShowGuard(true)
      return
    }
    setActive(tab)
  }

  function discardAndSwitch() {
    if (active !== "Widget") {
      setDirty((d) => ({ ...d, [active as Exclude<TabKey, "Widget">]: false }))
    }
    if (nextTab) setActive(nextTab)
    setNextTab(null)
    setShowGuard(false)
  }

  function handleSave() {
    if (active === "Widget") return
    onSaveSection(active as Exclude<TabKey, "Widget">)
    setDirty((d) => ({ ...d, [active as Exclude<TabKey, "Widget">]: false }))
  }

  const isActiveDirty = active !== "Widget" && dirty[active as Exclude<TabKey, "Widget">]

  return (
    <>
      <div className="border-b px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto w-[202px] sm:w-auto"
          >
            {TABS.map((tab) => {
              const isActive = active === tab
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleTabClick(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isActive
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>


         
            <Button
              size="sm"
              onClick={handleSave}
              disabled={disabled || !isActiveDirty}
              className="text-xs sm:text-sm" // 👈 extra small on mobile, normal on larger screens
            >
              Save changes
            </Button>
        
        </div>
      </div>

      <div className="p-4 md:p-6">
        {active === "Agent" && (
          <AgentTab
            agent={agent}
            onUpdate={(p) => {
              markDirty("Agent")
              onUpdate(p)
            }}
            disabled={disabled}
          />
        )}
        {active === "LLM" && (
          <LLMTab
            agent={agent}
            onUpdate={(p) => {
              markDirty("LLM")
              onUpdate(p)
            }}
            disabled={disabled}
          />
        )}
        {active === "Audio" && (
          <AudioTab
            agent={agent}
            onUpdate={(p) => {
              markDirty("Audio")
              onUpdate(p)
            }}
            disabled={disabled}
          />
        )}
        {active === "Tools" && <UnderConstruction />}
        {active === "Widget" && <WidgetTab agentId={agent?.id || ""} />}
      </div>

      <UnsavedChangesModal isOpen={showGuard} onCancel={() => setShowGuard(false)} onConfirm={discardAndSwitch} />
    </>
  )
}
