"use client"

import type React from "react"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page";


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-foreground">{children}</label>
}

export default function LLMTab({
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
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Choose LLM model">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <Label>Provider</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm "
                value={agent?.llmProvider ?? "OpenAI"}
                onChange={(e) => onUpdate({ llmProvider: e.target.value })}
              >
                <option className="dark:text-black">OpenAI</option>
                <option className="dark:text-black">Anthropic</option>
                <option className="dark:text-black">Google</option>
                <option className="dark:text-black">Fireworks</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.llmModel ?? "gpt-4.1-mini"}
                onChange={(e) => onUpdate({ llmModel: e.target.value })}
              >
                <option className="dark:text-black">gpt-4.1-mini</option>
                <option className="dark:text-black">gpt-4o-mini</option>
                <option className="dark:text-black">claude-3.5-sonnet</option>
                <option className="dark:text-black">gemini-1.5-pro</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Temperature">
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              disabled={disabled}
              value={agent?.llmTemperature ?? 0.2}
              onChange={(e) => onUpdate({ llmTemperature: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{agent?.llmTemperature?.toFixed(2) ?? "0.20"}</span>
              <span>1</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Increasing temperature enables heightened creativity, but increases chance of deviation from prompt
            </p>
          </div>
        </Section>
      </div>

      <Section title="Tokens generated on each LLM output">
        <div className="space-y-2">
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            disabled={disabled}
            value={agent?.llmTokens ?? 450}
            onChange={(e) => onUpdate({ llmTokens: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>50</span>
            <span>{agent?.llmTokens ?? 450}</span>
            <span>1000</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Increasing tokens enables longer responses to be queued for speech generation but increases latency
          </p>
        </div>
      </Section>

      <Section title="Add knowledge base">
        <div className="space-y-1">
          <select
            disabled={disabled}
            value={agent?.knowledgeBaseId ?? ""}
            onChange={(e) => onUpdate({ knowledgeBaseId: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option className="dark:text-black" value="">Select Knowledge base</option>
            <option className="dark:text-black" value="kb_docs">Docs</option>
            <option className="dark:text-black" value="kb_faq">FAQ</option>
          </select>
        </div>
      </Section>

     
    </div>
  )
}
