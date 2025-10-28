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

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "groq", label: "Groq" },
]

const LLM_MODELS = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  google: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  ],
  groq: [
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
  ],
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
  const currentProvider = agent?.llmProvider?.toLowerCase() || "openai"
  const availableModels = LLM_MODELS[currentProvider as keyof typeof LLM_MODELS] || LLM_MODELS.openai

  return (
    <div className="space-y-6 dark:text-white">
      {/* LLM Model Selection */}
      <Section title="Choose LLM model">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Provider</label>
            <select
              disabled={disabled}
              value={agent?.llmProvider?.toLowerCase() || "openai"}
              onChange={(e) => {
                const provider = e.target.value
                const providerLabel = LLM_PROVIDERS.find((p) => p.value === provider)?.label || "OpenAI"
                const defaultModel = LLM_MODELS[provider as keyof typeof LLM_MODELS]?.[0]?.value || "gpt-4o-mini"
                onUpdate({
                  llmProvider: providerLabel,
                  llmModel: defaultModel,
                })
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LLM_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Model</label>
            <select
              disabled={disabled}
              value={agent?.llmModel || "gpt-4o-mini"}
              onChange={(e) => onUpdate({ llmModel: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Temperature Control */}
      <Section title="Temperature">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              disabled={disabled}
              value={agent?.llmTemperature ?? 0.7}
              onChange={(e) => onUpdate({ llmTemperature: Number.parseFloat(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span>0</span>
              <span className="font-medium min-w-[3rem] text-center bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {agent?.llmTemperature?.toFixed(1) ?? "0.7"}
              </span>
              <span>1</span>
            </div>
          </div>
          <Help>
            Increasing temperature enables heightened creativity, but increases chance of deviation from prompt
          </Help>
        </div>
      </Section>

      {/* Token Limit */}
      <Section title="Tokens generated on each LLM output">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              disabled={disabled}
              value={agent?.llmTokens ?? 450}
              onChange={(e) => onUpdate({ llmTokens: Number.parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span>50</span>
              <span className="font-medium min-w-[4rem] text-center bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {agent?.llmTokens ?? 450}
              </span>
              <span>2000</span>
            </div>
          </div>
          <Help>
            Increasing tokens enables longer responses to be queued for speech generation but increases latency
          </Help>
        </div>
      </Section>

      {/* Knowledge Base */}
      <Section title="Knowledge Base">
        <div className="space-y-3">
          <select
            disabled={disabled}
            value={agent?.knowledgeBaseId || ""}
            onChange={(e) => onUpdate({ knowledgeBaseId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No knowledge base</option>
            <option value="kb_1">Company Knowledge Base</option>
            <option value="kb_2">Product Documentation</option>
            <option value="kb_3">FAQ Database</option>
          </select>
          <Help>Select a knowledge base to give your agent access to specific information</Help>
        </div>
      </Section>
    </div>
  )
}
