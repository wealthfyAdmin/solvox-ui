"use client"
import { useState, useEffect, useCallback } from "react"
import AssistantList from "@/components/assistantlist/assistantlist"
import ChatWindow from "@/components/chatwindow/chatWindow"

interface Assistant {
  id: number
  name: string
  display_name: string
  description: string
  is_active: boolean
  role?: string
}

interface AssistantSession {
  assistantId: string
  roomName: string
  token: string
  livekitUrl: string
}

export default function Home() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [currentSession, setCurrentSession] = useState<AssistantSession | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, "connected" | "connecting" | "disconnected" | "error">
  >({})
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/assistants", {
          credentials: 'include', // Include cookies in the request
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Handle authentication error - redirect to login
            window.location.href = '/login'
            return
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setAssistants(data)
      } catch (err) {
        console.error("Failed to fetch assistants:", err)
        setError(`Failed to load assistants: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAssistants()
  }, [])

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
        [assistant.name]: "connecting",
      }))

      try {
        const roomName = `${assistant.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        const participantName = `user-${Date.now()}`

        console.log("Starting agent...")
        const startResponse = await fetch("/api/start-agent", {
          method: "POST",
          credentials: 'include', // Include cookies for authentication
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            participantName,
            assistantId: assistant.name,
            assistantName: assistant.name,
          }),
        })

        if (!startResponse.ok) {
          if (startResponse.status === 401) {
            // Handle authentication error - redirect to login
            window.location.href = '/login'
            return
          }
          const errorData = await startResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${startResponse.status}: ${startResponse.statusText}`)
        }

        const startData = await startResponse.json()
        console.log("Agent started:", startData)

        console.log("Fetching LiveKit token...")
        const tokenResponse = await fetch("/api/livekit-token", {
          method: "POST",
          credentials: 'include', // Include cookies for authentication
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            roomName,
            participantName,
            assistantId: assistant.name,
            assistantName: assistant.name,
          }),
        })

        if (!tokenResponse.ok) {
          if (tokenResponse.status === 401) {
            // Handle authentication error - redirect to login
            window.location.href = '/login'
            return
          }
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`)
        }

        const tokenData = await tokenResponse.json()
        console.log("Token data received:", tokenData)

        const session: AssistantSession = {
          assistantId: assistant.name,
          roomName,
          token: tokenData.token,
          livekitUrl: tokenData.url || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-server.com",
        }

        setCurrentSession(session)
        setConnectionStatuses((prev) => ({
          ...prev,
          [assistant.name]: "connected",
        }))
      } catch (err) {
        console.error("Failed to create assistant session:", err)
        setError(`Failed to create session: ${err instanceof Error ? err.message : "Unknown error occurred"}`)
        setConnectionStatuses((prev) => ({
          ...prev,
          [assistant.name]: "error",
        }))
        setCurrentSession(null)
      } finally {
        setIsCreatingSession(false)
      }
    },
    [isCreatingSession],
  )

  const handleAssistantSelect = async (assistant: Assistant) => {
    console.log("Assistant selected:", assistant.name)
    setSelectedAssistant(assistant)
    await createAssistantSession(assistant)
  }

  const handleConnectionStatusChange = useCallback(
    (status: "connected" | "connecting" | "disconnected" | "error") => {
      if (selectedAssistant) {
        setConnectionStatuses((prev) => ({
          ...prev,
          [selectedAssistant.name]: status,
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
          credentials: 'include', // Include cookies for authentication
          headers: { 
            "Content-Type": "application/json" 
          },
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

  const retryFetchAssistants = useCallback(() => {
    setError("")
    setLoading(true)
    // Trigger useEffect to refetch
    window.location.reload()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-2rem)]">
        {/* Sidebar (Assistant List) */}
        <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r">
          <AssistantList
            assistants={assistants}
            selectedId={selectedAssistant?.name ?? ""}
            onSelect={handleAssistantSelect}
            connectionStatuses={connectionStatuses}
            loading={loading}
            error={error}
            onRetry={retryFetchAssistants}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedAssistant && currentSession ? (
            <ChatWindow
              assistantName={selectedAssistant.display_name || selectedAssistant.name}
              assistantRole={selectedAssistant.description || "AI Assistant"}
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
                <p className="text-gray-600">
                  Connecting to {selectedAssistant.display_name || selectedAssistant.name}...
                </p>
              </div>
            </div>
          ) : error && !loading ? (
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
              {loading ? "Loading assistants..." : "Select an assistant to start chatting"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
