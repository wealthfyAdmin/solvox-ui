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

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>
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
  return (
    <div className="space-y-8 dark:text-white">
      <div className="grid gap-6">
        <Section title="Select language and transcriber">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-1">
              <Label>Language</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.language ?? "English (India)"}
                onChange={(e) => onUpdate({ language: e.target.value })}
              >
                <option className="dark:text-black">English (India)</option>
                <option className="dark:text-black">English (US)</option>
                <option className="dark:text-black">Hindi (India)</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Provider</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.asrProvider ?? "Deepgram"}
                onChange={(e) => onUpdate({ asrProvider: e.target.value })}
              >
                <option className="dark:text-black">Deepgram</option>
                <option className="dark:text-black">Whisper</option>
                <option className="dark:text-black">RevAI</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Model</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.asrModel ?? "nova-2"}
                onChange={(e) => onUpdate({ asrModel: e.target.value })}
              >
                <option className="dark:text-black">nova-2</option>
                <option className="dark:text-black">whisper-large-v3</option>
                <option className="dark:text-black">dg-standard</option>
              </select>
            </div>
          </div>

        
        </Section>

        <Section title="Select voice">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-1">
              <Label>Provider</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.ttsProvider ?? "Elevenlabs"}
                onChange={(e) => onUpdate({ ttsProvider: e.target.value })}
              >
                <option className="dark:text-black">Elevenlabs</option>
                <option className="dark:text-black">PlayHT</option>
                <option className="dark:text-black">Google TTS</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Model</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.ttsModel ?? "eleven_turbo_v2_5"}
                onChange={(e) => onUpdate({ ttsModel: e.target.value })}
              >
                <option className="dark:text-black">eleven_turbo_v2_5</option>
                <option className="dark:text-black">eleven_multilingual_v2</option>
                <option className="dark:text-black">playht-fast</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Voice</Label>
              <select
                disabled={disabled}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={agent?.ttsVoice ?? "Wendy"}
                onChange={(e) => onUpdate({ ttsVoice: e.target.value })}
              >
                <option className="dark:text-black">Wendy</option>
                <option className="dark:text-black">Adam</option>
                <option className="dark:text-black">Olivia</option>
              </select>
            </div>
          </div>

          
         
        </Section>
      </div>
    </div>
  )
}
