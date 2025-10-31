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

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "it-IT", label: "Italian (Italy)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
  { value: "ko-KR", label: "Korean (South Korea)" },
]

const ASR_PROVIDERS = [
  { value: "deepgram", label: "Deepgram" },
  { value: "openai", label: "OpenAI Whisper" },
  { value: "google", label: "Google Speech-to-Text" },
  { value: "azure", label: "Azure Speech" },
]

const ASR_MODELS = {
  deepgram: [
    { value: "nova-2", label: "Nova 2" },
    { value: "enhanced", label: "Enhanced" },
    { value: "base", label: "Base" },
  ],
  openai: [{ value: "whisper-1", label: "Whisper v1" }],
  google: [
    { value: "latest_long", label: "Latest Long" },
    { value: "latest_short", label: "Latest Short" },
  ],
  azure: [
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
  ],
}

const TTS_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "azure", label: "Azure Speech" },
  { value: "google", label: "Google Text-to-Speech" },
]

const TTS_VOICES = {
  openai: [
    { value: "alloy", label: "Alloy" },
    { value: "echo", label: "Echo" },
    { value: "fable", label: "Fable" },
    { value: "onyx", label: "Onyx" },
    { value: "nova", label: "Nova" },
    { value: "shimmer", label: "Shimmer" },
  ],
  elevenlabs: [
    { value: "rachel", label: "Rachel" },
    { value: "domi", label: "Domi" },
    { value: "bella", label: "Bella" },
    { value: "antoni", label: "Antoni" },
    { value: "elli", label: "Elli" },
    { value: "josh", label: "Josh" },
    { value: "arnold", label: "Arnold" },
    { value: "adam", label: "Adam" },
    { value: "sam", label: "Sam" },
  ],
  azure: [
    { value: "jenny", label: "Jenny" },
    { value: "guy", label: "Guy" },
    { value: "aria", label: "Aria" },
    { value: "davis", label: "Davis" },
    { value: "jane", label: "Jane" },
  ],
  google: [
    { value: "en-US-Wavenet-D", label: "Wavenet D" },
    { value: "en-US-Wavenet-F", label: "Wavenet F" },
    { value: "en-US-Neural2-C", label: "Neural2 C" },
    { value: "en-US-Neural2-D", label: "Neural2 D" },
    { value: "en-IN-Chirp3-HD-Achernar", label: "Achernar HD" },
  ],
}

export default function AudioTab({
  agent,
  onUpdate,
  disabled,
}: {
  agent: AgentRecord | null
  onUpdate: (patch: Partial<AgentRecord>) => void
  disabled?: boolean
}) {
  const currentAsrProvider = agent?.asrProvider?.toLowerCase() || "deepgram"
  const currentTtsProvider = agent?.ttsProvider?.toLowerCase() || "openai"

  const availableAsrModels = ASR_MODELS[currentAsrProvider as keyof typeof ASR_MODELS] || ASR_MODELS.deepgram
  const availableTtsVoices = TTS_VOICES[currentTtsProvider as keyof typeof TTS_VOICES] || TTS_VOICES.openai

  return (
    <div className="space-y-6 dark:text-white">
      {/* Language Selection */}
      <Section title="Language">
        <select
          disabled={disabled}
          value={agent?.language?.includes("India") ? "en-IN" : "en-US"}
          onChange={(e) => {
            const selectedLang = LANGUAGES.find((lang) => lang.value === e.target.value)
            onUpdate({ language: selectedLang?.label || "English (US)" })
          }}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LANGUAGES.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
        <Help>Select the primary language for speech recognition and synthesis</Help>
      </Section>

      {/* Speech-to-Text Configuration */}
      <Section title="Speech-to-Text (ASR)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ASR Provider */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Provider</label>
            <select
              disabled={disabled}
              value={agent?.asrProvider?.toLowerCase() || "deepgram"}
              onChange={(e) => {
                const provider = e.target.value
                const providerLabel = ASR_PROVIDERS.find((p) => p.value === provider)?.label || "Deepgram"
                const defaultModel = ASR_MODELS[provider as keyof typeof ASR_MODELS]?.[0]?.value || "nova-2"
                onUpdate({
                  asrProvider: providerLabel,
                  asrModel: defaultModel,
                })
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ASR_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* ASR Model */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Model</label>
            <select
              disabled={disabled}
              value={agent?.asrModel || "nova-2"}
              onChange={(e) => onUpdate({ asrModel: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableAsrModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Text-to-Speech Configuration */}
      <Section title="Text-to-Speech (TTS)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TTS Provider */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Provider</label>
            <select
              disabled={disabled}
              value={agent?.ttsProvider?.toLowerCase() || "openai"}
              onChange={(e) => {
                const provider = e.target.value
                const providerLabel = TTS_PROVIDERS.find((p) => p.value === provider)?.label || "OpenAI"
                const defaultVoice = TTS_VOICES[provider as keyof typeof TTS_VOICES]?.[0]?.value || "alloy"
                onUpdate({
                  ttsProvider: providerLabel,
                  ttsVoice: defaultVoice,
                })
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TTS_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* TTS Voice */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Voice</label>
            <select
              disabled={disabled}
              value={agent?.ttsVoice || "alloy"}
              onChange={(e) => onUpdate({ ttsVoice: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableTtsVoices.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TTS Model (for providers that support it) */}
        {currentTtsProvider === "elevenlabs" && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Model</label>
            <select
              disabled={disabled}
              value={agent?.ttsModel || "eleven_turbo_v2_5"}
              onChange={(e) => onUpdate({ ttsModel: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="eleven_turbo_v2_5">Turbo v2.5</option>
              <option value="eleven_multilingual_v2">Multilingual v2</option>
              <option value="eleven_monolingual_v1">Monolingual v1</option>
            </select>
          </div>
        )}
      </Section>

      {/* Audio Processing Settings */}
      <Section title="Audio Processing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buffer Size */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Buffer Size (ms)</label>
            <div className="space-y-2">
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                disabled={disabled}
                value={agent?.bufferSize ?? 200}
                onChange={(e) => onUpdate({ bufferSize: Number.parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>100ms</span>
                <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{agent?.bufferSize ?? 200}ms</span>
                <span>1000ms</span>
              </div>
            </div>
            <Help>Audio buffer size affects latency vs quality trade-off</Help>
          </div>

          {/* Speed Rate */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Speed Rate</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                disabled={disabled}
                value={agent?.speedRate ?? 1.0}
                onChange={(e) => onUpdate({ speedRate: Number.parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5x</span>
                <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  {agent?.speedRate?.toFixed(1) ?? "1.0"}x
                </span>
                <span>2.0x</span>
              </div>
            </div>
            <Help>Speech playback speed multiplier</Help>
          </div>
        </div>
      </Section>
    </div>
  )
}
