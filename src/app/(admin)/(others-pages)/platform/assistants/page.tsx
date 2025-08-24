"use client"
import { useState, useEffect, useCallback } from "react"
import AssistantList from "@/components/assistantlist/assistantlist"
import ChatWindow from "@/components/chatwindow/chatWindow"

interface Assistant {
  id: string
  name: string
  role: string
  description?: string
}

interface AssistantSession {
  assistantId: string
  roomName: string
  token: string
  livekitUrl: string
}

const SAMPLE_ASSISTANTS: Assistant[] = [
  {
    id: "lumiverse-whistleblower",
    name: "Syndrome Support",
    role: "Confidential platform for reporting workplace concerns",
    description: "Secure and anonymous reporting system",
  },

 
]

export default function Home() {
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [currentSession, setCurrentSession] = useState<AssistantSession | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, "connected" | "connecting" | "disconnected" | "error">
  >({})
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [error, setError] = useState<string>("")

  const createAssistantSession = useCallback(
    async (assistant: Assistant) => {
      if (!assistant) return
      console.log("Creating assistant session for:", assistant)

      if (isCreatingSession) {
        console.warn("Session creation already in progress...")
        return
      }

      setIsCreatingSession(true)
      setError("")
      setConnectionStatuses((prev) => ({
        ...prev,
        [assistant.id]: "connecting",
      }))

      try {
        const roomName = `${assistant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        const participantName = `user-${Date.now()}`

        console.log("Fetching LiveKit token...")
        const response = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            participantName,
            assistantId: assistant.id,
            assistantName: assistant.name,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const tokenData = await response.json()
        console.log("Token data received:", tokenData)

        const session: AssistantSession = {
          assistantId: assistant.id,
          roomName,
          token: tokenData.token,
          livekitUrl: tokenData.url || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-server.com",
        }

        setCurrentSession(session)
        setConnectionStatuses((prev) => ({
          ...prev,
          [assistant.id]: "connected",
        }))

        // Notify backend about session start
        try {
          await fetch("/api/assistant-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assistantId: assistant.id,
              roomName,
              participantName,
              sessionId: session.roomName,
            }),
          })
        } catch (sessionError) {
          console.warn("Failed to notify backend about session start:", sessionError)
        }
      } catch (err) {
        console.error("Failed to create assistant session:", err)
        setError(`Failed to create session: ${err instanceof Error ? err.message : "Unknown error occurred"}`)
        setConnectionStatuses((prev) => ({
          ...prev,
          [assistant.id]: "error",
        }))
        setCurrentSession(null)
      } finally {
        setIsCreatingSession(false)
      }
    },
    [isCreatingSession],
  )

  const handleAssistantSelect = async (assistant: Assistant) => {
    console.log("Assistant selected:", assistant.id)
    setSelectedAssistant(assistant)
    await createAssistantSession(assistant)
  }

  const handleConnectionStatusChange = useCallback(
    (status: "connected" | "connecting" | "disconnected" | "error") => {
      if (selectedAssistant) {
        setConnectionStatuses((prev) => ({
          ...prev,
          [selectedAssistant.id]: status,
        }))
      }
    },
    [selectedAssistant],
  )

  const handleEndSession = useCallback(async () => {
    console.log("Ending session...")
    
    // Notify backend about session end
    if (currentSession) {
      try {
        await fetch("/api/assistant-session", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: currentSession.roomName }),
        })
        console.log("Session ended on backend:", currentSession.roomName)
      } catch (error) {
        console.error("Failed to notify backend about session end:", error)
      }
    }

    // Reset all states to show assistant selection again
    setCurrentSession(null)
    setSelectedAssistant(null)
    setError("")
    setIsCreatingSession(false)
    
    // Reset connection statuses
    setConnectionStatuses({})
    
    console.log("Session cleanup completed")
  }, [currentSession])

  useEffect(() => {
    return () => {
      if (currentSession) {
        fetch("/api/assistant-session", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: currentSession.roomName }),
        }).catch(console.error)
        console.log("Cleaning up session:", currentSession.roomName)
      }
    }
  }, [currentSession])

  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-2rem)]">
    {/* Sidebar (Assistant List) */}
    <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r">
      <AssistantList
        assistants={SAMPLE_ASSISTANTS}
        selectedId={selectedAssistant?.id ?? ""}
        onSelect={handleAssistantSelect}
        connectionStatuses={connectionStatuses}
      />
    </div>

    {/* Main Content */}
    <div className="flex-1 overflow-y-auto">
      {selectedAssistant && currentSession ? (
        <ChatWindow
          assistantName={selectedAssistant.name}
          assistantRole={selectedAssistant.role}
          livekitUrl={currentSession.livekitUrl}
          roomName={currentSession.roomName}
          participantToken={currentSession.token}
          onConnectionStatusChange={handleConnectionStatusChange}
          onEndSession={handleEndSession}
        />
      ) : selectedAssistant && isCreatingSession ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to {selectedAssistant.name}...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center text-red-600">
            <p className="mb-2">Connection Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => selectedAssistant && handleAssistantSelect(selectedAssistant)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-100 text-gray-500">
          Select an assistant to start chatting
        </div>
      )}
    </div>
  </div>
</div>

  )
}