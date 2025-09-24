"use client"

import { useState, useEffect, useCallback } from "react"
import AssistantList from "../assistantlist/assistantlist"
import ChatWindow from "../chatwindow/chatWindow"

interface Assistant {
  id: number
  name: string
  display_name: string
  role: string
  description?: string
  is_active?: boolean
}

interface AssistantSession {
  assistantId: string
  roomName: string
  token: string
  livekitUrl: string
}

export default function MainAssistantInterface() {
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [currentSession, setCurrentSession] = useState<AssistantSession | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, "connected" | "connecting" | "disconnected" | "error">
  >({})
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [error, setError] = useState<string>("")
  
  // New states for backend integration
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>("")



// In MainAssistantInterface.tsx, update the fetchAssistants function:

// In MainAssistantInterface.tsx, update the fetchAssistants function:

const fetchAssistants = useCallback(async () => {
  setLoading(true)
  setLoadError("")
  
  try {
    console.log('🔍 Fetching agents from Next.js API...')
    
    // You can hardcode organization_id or get it from user context
    const organizationId = 1; // Replace with actual organization ID or get from context
    
    // Call your Next.js API route with organization filter
    const response = await fetch(`/api/agents/available?organization_id=${organizationId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📨 Agents API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('❌ Agents API error:', errorData)
      
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.')
      }
      throw new Error(errorData.error || `Failed to fetch assistants: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Received agents data:', data)
    
    // Transform backend data to match frontend interface
    const transformedAssistants: Assistant[] = data.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      display_name: agent.display_name,
      role: agent.description || "AI Assistant", 
      description: agent.description,
      is_active: agent.is_active
    }))

    console.log('✅ Transformed assistants:', transformedAssistants)
    setAssistants(transformedAssistants)
    setLoadError("")
    
  } catch (err) {
    console.error('❌ Error fetching assistants:', err)
    setLoadError(err instanceof Error ? err.message : 'Failed to load assistants')
    
    // Fallback to empty array or show error
    setAssistants([])
  } finally {
    setLoading(false)
  }
}, [])




  // Load assistants on component mount
  useEffect(() => {
    fetchAssistants()
  }, [fetchAssistants])

// In MainAssistantInterface.tsx, update the createAssistantSession function:

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

      console.log("Fetching LiveKit token...")

      // Call your Next.js API route (no need to pass auth headers)
      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
          // No Authorization header needed - Next.js API route handles it
        },
        body: JSON.stringify({
          roomName,
          participantName,
          assistantId: assistant.name, // Use name (this is what backend expects)
          assistantName: assistant.display_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      const tokenData = await response.json()
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

      console.log(`✅ Successfully connected to ${assistant.display_name}`)
      if (tokenData.assistantStarted) {
        console.log(`🤖 Agent ${tokenData.assistantName} is now ready for chat`)
      }

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
          [selectedAssistant.name]: status, // Use name
        }))
      }
    },
    [selectedAssistant],
  )

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
    <div className="flex h-screen">
      <AssistantList
        assistants={assistants}
        selectedId={selectedAssistant?.name ?? ""} // Use name for selection
        onSelect={handleAssistantSelect}
        connectionStatuses={connectionStatuses}
        loading={loading}
        error={loadError}
        onRetry={fetchAssistants}
      />
      <div className="flex-1">
        {selectedAssistant && currentSession ? (
          <ChatWindow
            assistantName={selectedAssistant.display_name}
            assistantRole={selectedAssistant.role}
            livekitUrl={currentSession.livekitUrl}
            roomName={currentSession.roomName}
            participantToken={currentSession.token}
            onConnectionStatusChange={handleConnectionStatusChange}
          />
        ) : selectedAssistant && isCreatingSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to {selectedAssistant.display_name}...</p>
              <p className="text-sm text-gray-500 mt-2">Starting AI agent and setting up voice chat...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
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
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="mb-2">Select an assistant to start chatting</p>
              {loadError && (
                <p className="text-sm text-red-500">
                  Backend connection issue. Using fallback data.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
