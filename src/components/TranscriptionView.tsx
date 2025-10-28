"use client"

import { useVoiceAssistant } from "@livekit/components-react"

export default function TranscriptionView() {
  const { transcript } = useVoiceAssistant()

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript && transcript.length > 0 ? (
          transcript.map((entry, index) => (
            <div key={index} className="space-y-2">
              {/* User Message */}
              {entry.userQuery && (
                <div className="flex justify-end">
                  <div className="max-w-xs bg-blue-600 text-white rounded-lg px-4 py-2">
                    <p className="text-sm">{entry.userQuery}</p>
                  </div>
                </div>
              )}

              {/* Agent Response */}
              {entry.agentResponse && (
                <div className="flex justify-start">
                  <div className="max-w-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm">{entry.agentResponse}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">No messages yet. Start speaking to begin the conversation.</p>
          </div>
        )}
      </div>

      {/* Input Area - Optional for future chat input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Use the microphone button to speak</p>
      </div>
    </div>
  )
}
