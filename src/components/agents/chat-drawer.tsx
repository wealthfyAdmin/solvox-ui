"use client"

import { useState, useEffect, useRef } from "react"
import { Room, RoomEvent, RemoteParticipant, Track } from "livekit-client"
import { agentService } from "@/lib/agent-service"

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
  agentName: string
  assistantId: string
}

export default function ChatDrawer({ open, onClose, agentName, assistantId }: ChatDrawerProps) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const roomRef = useRef(null)

  // Start agent when drawer opens
  useEffect(() => {
    if (open && assistantId) {
      initializeAgent()
    }
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
    }
  }, [open, assistantId])

  const initializeAgent = async () => {
    try {
      setError(null)
      const roomName = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('🚀 Starting chat agent...')
      
      // Start backend agent
      const agentResponse = await agentService.startAgent({
        assistantId,
        roomName,
        sessionType: 'chat'
      })

      console.log('✅ Agent started:', agentResponse)

      // Connect to LiveKit room
      const liveKitRoom = new Room()
      roomRef.current = liveKitRoom
      
      // Set up room events
      liveKitRoom.on(RoomEvent.Connected, () => {
        console.log('🔗 Connected to room')
        setIsConnected(true)
        
        // Add welcome message from agent
        setMessages([{
          id: '1',
          text: agentResponse.agentName ? `Hello! I'm ${agentResponse.agentName}. How can I help you today?` : "Hello! How can I help you today?",
          isUser: false,
          timestamp: new Date(),
        }])
      })

      liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connected:', participant.identity)
        if (participant.identity.includes('agent')) {
          console.log('🤖 Agent joined the chat')
        }
      })

      // Handle agent messages via data channel
      liveKitRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        if (participant?.identity.includes('agent')) {
          const data = JSON.parse(new TextDecoder().decode(payload))
          if (data.type === 'message') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: data.text,
              isUser: false,
              timestamp: new Date(),
            }])
            setIsAgentTyping(false)
          } else if (data.type === 'typing') {
            setIsAgentTyping(data.isTyping)
          }
        }
      })

      liveKitRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false)
      })

      // Connect to room
      await liveKitRoom.connect(agentResponse.livekitUrl, agentResponse.token)
      setRoom(liveKitRoom)

    } catch (error) {
      console.error('❌ Failed to start agent:', error)
      setError(error.message)
    }
  }

  const handleSendMessage = async (text) => {
    if (!text.trim() || !room || !isConnected) return

    const userMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsAgentTyping(true)

    // Send message to agent via data channel
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify({
      type: 'message',
      text: text,
      timestamp: new Date().toISOString()
    }))

    await room.localParticipant.publishData(data, "reliable")
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-all duration-300 ease-out translate-x-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white shadow-lg">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                  💬
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isConnected ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <h2 className="text-xl font-bold">{agentName}</h2>
                <p className="text-sm opacity-90">
                  {isConnected ? (isAgentTyping ? "Typing..." : "Online") : "Connecting..."}
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2 text-red-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isAgentTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white dark:bg-gray-800 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500"
                disabled={!isConnected}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || !isConnected}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
