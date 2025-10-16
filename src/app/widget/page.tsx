"use client"

import { useSearchParams } from "next/navigation"

export default function WidgetHostPage() {
  const searchParams = useSearchParams()
  const assistantId = searchParams.get("assistantId") || "ASSISTANT_ID"
  const orgId = searchParams.get("orgId") || undefined

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center rounded-xl border bg-white dark:bg-gray-800 shadow p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Chatbot</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Assistant ID: <strong>{assistantId}</strong>
          {orgId ? ` • Org: ${orgId}` : ""}
        </p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          This is a placeholder full‑page host for your chatbot. Connect your chat and voice UI here to talk with this
          agent. The widget launcher always links to this page, so updates to the agent will reflect automatically.
        </p>
      </div>
    </main>
  )
}
