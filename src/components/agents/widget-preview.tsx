"use client"

import { useState } from "react"

type WidgetMode = "text" | "voice"

export default function WidgetPreview({
  mode,
  previewUrl,
  agentName,
}: {
  mode: WidgetMode
  previewUrl: string
  agentName: string
}) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {mode === "text" ? "Text Chat Preview" : "Voice Chat Preview"}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          This is how your {mode === "text" ? "chat" : "voice"} widget will appear on your website.
        </p>
      </div>

      {/* Preview Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        {/* Simulated Widget Preview */}
        <div className="h-96 flex flex-col items-center justify-center relative">
          {/* Floating Button Simulation */}
          <div className="absolute bottom-4 right-4 z-10">
            <button
              className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-2xl"
              title={`Open ${agentName}`}
            >
              {mode === "text" ? "💬" : "🎤"}
            </button>
          </div>

          {/* Preview Message */}
          <div className="text-center px-4">
            <div className="text-4xl mb-3">{mode === "text" ? "💬" : "🎤"}</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{agentName}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {mode === "text"
                ? "Click the chat button to start a conversation"
                : "Click the microphone button to start a voice conversation"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {mode === "text"
                ? "Users can type messages and get instant responses"
                : "Users can speak naturally and get voice responses"}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview URL Info */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <span className="font-semibold">Preview URL:</span> {previewUrl || "Configure host URL to see preview"}
        </p>
      </div>

      {/* Test Instructions */}
      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold">To test:</span> Open the preview URL in a new tab to see the full widget in
          action.
        </p>
      </div>
    </div>
  )
}
