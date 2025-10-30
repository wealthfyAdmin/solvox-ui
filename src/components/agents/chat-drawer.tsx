"use client"

import { useState, useEffect, useRef } from "react"
import { Room, VideoPresets } from "livekit-client"
import { RoomContext } from "@livekit/components-react"
import ChatState from "./chat-state"
import { useConnectionDetails } from "@/hooks/useConnectionDetails"
import { Loader2, AlertCircle } from "lucide-react"

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
  agentName: string
  agentId: string
}

export default function ChatDrawer({ open, onClose, agentName, agentId }: ChatDrawerProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
      }),
  )

  const { fetchConnectionDetails } = useConnectionDetails()
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    if (!open || !agentId) return

    const connectToAgent = async () => {
      try {
        setIsConnecting(true)
        setError(null)
        console.log("[v0] Connecting to chat agent:", agentId)

        const details = await fetchConnectionDetails(agentId)
        if (!details) throw new Error("Failed to get connection details")

        await room.connect(details.serverUrl, details.participantToken)
        setIsConnected(true)
        roomRef.current = room
      } catch (err) {
        console.error("[v0] Chat connection error:", err)
        setError(err instanceof Error ? err.message : "Failed to connect to chat")
        setIsConnected(false)
      } finally {
        setIsConnecting(false)
      }
    }

    connectToAgent()

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        setIsConnected(false)
      }
    }
  }, [open, agentId, room, fetchConnectionDetails])

  const handleEndCall = () => {
    if (roomRef.current) {
      roomRef.current.disconnect()
      setIsConnected(false)
    }
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-all duration-300 ease-out translate-x-0 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white shadow-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                💬
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-200 ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div>
              <h2 className="text-lg font-bold">{agentName}</h2>
              <p className="text-sm opacity-90">
                {isConnecting ? "Connecting..." : isConnected ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isConnecting && (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="flex flex-col items-center space-x-3">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">Initializing chat...</p>
            </div>
          </div>
        )}

        {/* Chat Content */}
        {!isConnecting && isConnected && (
          <RoomContext.Provider value={room}>
            <ChatState
              agentName={agentName}
              room={room}
              onStartVoice={() => {
                handleEndCall()
              }}
              onEndCall={handleEndCall}
            />
          </RoomContext.Provider>
        )}
      </div>
    </>
  )
}
