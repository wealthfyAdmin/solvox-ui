"use client"

import { useState } from "react"
import { Dropdown } from "../ui/dropdown/Dropdown"
import { DropdownItem } from "../ui/dropdown/DropdownItem"

interface Assistant {
  id: number // Changed to number to match backend
  name: string
  display_name: string // Added from backend
  role: string
  status?: "online" | "offline" | "error"
  description?: string
  is_active?: boolean // Added from backend
}

interface AssistantListProps {
  assistants: Assistant[]
  selectedId: string
  onSelect: (assistant: Assistant) => void
  connectionStatuses?: Record<string, "connected" | "connecting" | "disconnected" | "error">
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export default function AssistantList({
  assistants,
  selectedId,
  onSelect,
  connectionStatuses = {},
  loading = false,
  error,
  onRetry,
}: AssistantListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedAssistant = assistants.find((a) => a.name === selectedId) || assistants[0] // Changed to use name

  const getStatusColor = (assistantId: string) => {
    const status = connectionStatuses[assistantId]
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500 animate-pulse"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (assistantId: string) => {
    const status = connectionStatuses[assistantId]
    switch (status) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "error":
        return "Connection failed"
      default:
        return "Not connected"
    }
  }

  // Show loading state
  if (loading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Desktop Loading */}
        <div className="hidden md:block w-80 min-h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white text-lg">Assistants</h2>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // Show error state
  if (error) {
    return (
      <>
        {/* Mobile Error */}
        <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-red-600 text-sm">
            <p>Failed to load assistants</p>
            {onRetry && (
              <button onClick={onRetry} className="mt-2 text-xs underline hover:no-underline">
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Desktop Error */}
        <div className="hidden md:block w-80 min-h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white text-lg">Assistants</h2>
          </div>
          <div className="p-6">
            <div className="text-red-600 text-sm">
              <p className="mb-2">Failed to load assistants</p>
              <p className="text-xs text-gray-500 mb-4">{error}</p>
              {onRetry && (
                <button onClick={onRetry} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ---------- Mobile Dropdown ---------- */}
      <div className="md:hidden relative border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          className="dropdown-toggle w-full flex items-center justify-between px-4 py-3 text-gray-800 dark:text-white text-sm font-medium"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2 truncate">
            <span>{selectedAssistant?.display_name || selectedAssistant?.name}</span>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(selectedAssistant?.name || "")}`} />
          </span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </button>

        <Dropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
          {assistants.map((assistant) => (
            <DropdownItem
              key={assistant.id}
              onClick={() => {
                onSelect(assistant)
                setIsDropdownOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <span>{assistant.display_name}</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(assistant.name)}`} />
              </div>
              <div className="text-xs text-gray-500">{assistant.description}</div>
            </DropdownItem>
          ))}
        </Dropdown>
      </div>

      {/* ---------- Desktop Sidebar ---------- */}
      <div className="hidden md:block w-80 min-h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-white text-lg">Assistants</h2>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {assistants.map((assistant) => (
            <div
              key={assistant.id}
              onClick={() => onSelect(assistant)}
              className={`px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedId === assistant.name ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" : ""
              } ${!assistant.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-medium truncate ${
                        selectedId === assistant.name
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {assistant.display_name}
                    </h3>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(assistant.name)}`}
                      title={getStatusText(assistant.name)}
                    />
                    {assistant.is_active && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{assistant.description}</p>

                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">{assistant.name}</p>

                  {selectedId === assistant.name && (
                    <div className="mt-2">
                      <span
                        className={`text-xs font-medium ${
                          connectionStatuses[assistant.name] === "connected"
                            ? "text-green-600 dark:text-green-400"
                            : connectionStatuses[assistant.name] === "error"
                              ? "text-red-600 dark:text-red-400"
                              : connectionStatuses[assistant.name] === "connecting"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-500"
                        }`}
                      >
                        {getStatusText(assistant.name)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
