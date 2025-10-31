"use client"

import type React from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </section>
  )
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{children}</p>
}

export default function AgentTab({
  agent,
  onUpdate,
  disabled,
}: {
  agent: AgentRecord | null
  onUpdate: (patch: Partial<AgentRecord>) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-6 dark:text-white">
      {/* Agent Name Section */}
      <Section title="Agent Display Name">
        <input
          disabled={disabled}
          value={agent?.display_name ?? ""}
          onChange={(e) => onUpdate({ display_name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My AI Assistant"
        />
        <Help>This is the display name for your AI agent.</Help>
      </Section>

      {/* Agent Description Section */}
      <Section title="Agent Description">
        <textarea
          disabled={disabled}
          value={agent?.description ?? ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          className="w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="A helpful AI assistant that can..."
        />
        <Help>Brief description of what this agent does.</Help>
      </Section>

      {/* Agent Welcome Message Section */}
      <Section title="Agent Welcome Message">
        <input
          disabled={disabled}
          value={agent?.welcomeMessage ?? ""}
          onChange={(e) => onUpdate({ welcomeMessage: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Hello from Solvox"
        />
        <Help>
          This will be the initial message from the agent. You can use variables here using {"{variable_name}"}.
        </Help>
      </Section>

      {/* Agent Prompt Section */}
      {agent && (
        <Section title="Agent Prompt">
          <div className="flex flex-col gap-2">
            <textarea
              disabled={disabled}
              value={agent?.prompt ?? ""}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              rows={8}
              className="w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="You are a helpful AI assistant. You will help customers with their queries and provide accurate, concise responses. Keep your responses professional and helpful."
            />
            <div className="flex items-center justify-between">
              <Help>
                Define the AI agent's behavior and personality. You can use variables with {"{variable_name}"}
              </Help>
              <span className="text-xs text-gray-500">{agent?.prompt?.length || 0} characters</span>
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
