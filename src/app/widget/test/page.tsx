"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Room, RoomEvent, VideoPresets } from "livekit-client"
import { RoomContext } from "@livekit/components-react"
import ChatState from "@/components/embed-widget/chat-state"
import VoiceState from "@/components/embed-widget/voice-state"
import { Loader2 } from "lucide-react"
import { useConnectionDetails } from "@/hooks/useConnectionDetails"

type WidgetState = "chat" | "voice"

function EmbedWidgetContent() {
  const searchParams = useSearchParams()
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentName, setAgentName] = useState("Anamika")
  const [widgetState, setWidgetState] = useState<WidgetState>("chat")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [room] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
  }))

  const { fetchConnectionDetails } = useConnectionDetails()

  useEffect(() => {
    const displayName = searchParams.get("agentId") || "Sales";
    setAgentId(displayName); // used for backend connection
    setAgentName(displayName); // shown in UI
  }, [searchParams]);

  const connectToAgent = useCallback(async () => {
    if (!agentId) return
    setIsConnecting(true)
    try {
      const details = await fetchConnectionDetails(agentId)
      if (!details) throw new Error("Failed to get connection details")
      await room.connect(details.serverUrl, details.participantToken)
      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
    } finally {
      setIsConnecting(false)
    }
  }, [agentId, room, fetchConnectionDetails])

  const endSession = useCallback(() => {
    room.disconnect()
    setIsConnected(false)
    window.parent.postMessage({ type: "VOICE_AGENT_END_SESSION" }, "*")
  }, [room])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === "VOICE_AGENT_OPENED") connectToAgent()
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [connectToAgent])

  if (isConnecting)
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <p className="text-red-600 mb-3">{error}</p>
        <button onClick={connectToAgent} className="px-6 py-2 bg-indigo-600 text-white rounded">
          Retry
        </button>
      </div>
    )

  return (
    <div className="flex flex-col h-screen bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3">
        <p className="font-semibold text-sm">Sales Support AI Agent</p>
        <p className="text-xs opacity-90">{agentName}</p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        {isConnected && (
          <RoomContext.Provider value={room}>
            {widgetState === "chat" && (
              <ChatState
                agentName={agentName}
                room={room}
                onStartVoice={() => setWidgetState("voice")}
                onEndCall={endSession}
              />
            )}
            {widgetState === "voice" && (
              <VoiceState
                room={room}
                agentName={agentName}
                onEndCall={() => setWidgetState("chat")}
              />
            )}
          </RoomContext.Provider>
        )}
      </div>
    </div>
  )
}

export default function EmbedWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full bg-white">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <EmbedWidgetContent />
    </Suspense>
  )
}
