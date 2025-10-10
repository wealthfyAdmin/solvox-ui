"use client"

import type React from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>
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
      <Section  title="Agent Welcome Message">
        <input
          disabled={disabled}
          value={agent?.welcomeMessage ?? ""}
          onChange={(e) => onUpdate({ welcomeMessage: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Hello from Bolna"
        />
        <Help>
          This will be the initial message from the agent. You can use variables here using {"{variable_name}"}.
        </Help>
      </Section>

      {/* Hide Agent Prompt when no agent selected */}
      {agent && (
        <Section title="Agent Prompt">
          <div className="flex flex-col gap-2">
            <textarea
              disabled={disabled}
              value={agent?.prompt ?? ""}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              rows={6}
              className="w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <Help>You can define variables in the prompt using {"{variable_name}"}</Help>
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
