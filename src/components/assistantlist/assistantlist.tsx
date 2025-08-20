"use client"

import { useState } from "react"
import { Dropdown } from "../ui/dropdown/Dropdown"
import { DropdownItem } from "../ui/dropdown/DropdownItem"

interface Assistant {
  id: string
  name: string
  role: string
  status?: "online" | "offline" | "error"
  description?: string
}

interface AssistantListProps {
  assistants: Assistant[]
  selectedId: string
  onSelect: (assistant: Assistant) => void
  connectionStatuses?: Record<
    string,
    "connected" | "connecting" | "disconnected" | "error"
  >
}

export default function AssistantList({
  assistants,
  selectedId,
  onSelect,
  connectionStatuses = {},
}: AssistantListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedAssistant =
    assistants.find((a) => a.id === selectedId) || assistants[0]

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

  return (
    <>
      {/* ---------- Mobile Dropdown ---------- */}
      <div className="md:hidden relative border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          className="dropdown-toggle w-full flex items-center justify-between px-4 py-3 text-gray-800 dark:text-white text-sm font-medium"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2 truncate">
            <span>{selectedAssistant?.name}</span>
            <span className="w-2 h-2 rounded-full flex-shrink-0 {getStatusColor(selectedAssistant?.id)}" />
          </span>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
                <span>{assistant.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    assistant.id
                  )}`}
                />
              </div>
              <div className="text-xs text-gray-500">{assistant.role}</div>
            </DropdownItem>
          ))}
        </Dropdown>
      </div>

      {/* ---------- Desktop Sidebar ---------- */}
      <div className="hidden md:block w-80 min-h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-white text-lg">
            Assistants
          </h2>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {assistants.map((assistant) => (
            <div
              key={assistant.id}
              onClick={() => onSelect(assistant)}
              className={`px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedId === assistant.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-medium truncate ${
                        selectedId === assistant.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {assistant.name}
                    </h3>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(
                        assistant.id
                      )}`}
                      title={getStatusText(assistant.id)}
                    />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                    {assistant.role}
                  </p>

                  {assistant.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                      {assistant.description}
                    </p>
                  )}

                  {selectedId === assistant.id && (
                    <div className="mt-2">
                      {/* <span
                        className={`text-xs font-medium ${
                          connectionStatuses[assistant.id] === "connected"
                            ? "text-green-600 dark:text-green-400"
                            : connectionStatuses[assistant.id] === "error"
                            ? "text-red-600 dark:text-red-400"
                            : connectionStatuses[assistant.id] === "connecting"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {getStatusText(assistant.id)}
                      </span> */}
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
