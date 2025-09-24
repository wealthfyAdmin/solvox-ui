"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RoomEvent, Track, type RemoteParticipant, createLocalAudioTrack, type LocalAudioTrack } from "livekit-client"
import { LiveKitRoom, useRoomContext, useLocalParticipant, useDataChannel } from "@livekit/components-react"
import { Mic, MicOff, PhoneOff } from "lucide-react"
import OutboundCallButton from "../header/NotificationDropdown"
import WaveAnimation from "../waveanimation/wave-animation"

interface ChatWindowProps {
  assistantName: string
  assistantRole: string
  livekitUrl: string
  roomName: string
  participantToken: string
  onConnectionStatusChange?: (status: "connected" | "connecting" | "disconnected" | "error") => void
  onEndSession?: () => void
}

interface Message {
  id: string
  text: string
  timestamp: number
  sender: "user" | "agent"
  isLocal: boolean
}

function ChatMessageComponent({ message, assistantName }: { message: Message; assistantName: string }) {
  const isOwn = message.sender === "user"

  return (
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{assistantName}</span>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
          }`}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
        </div>

        <div className={`text-xs text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}

function ChatWindowInner({
  assistantName,
  assistantRole,
  onConnectionStatusChange,
  onEndSession,
}: Omit<ChatWindowProps, "livekitUrl" | "roomName" | "participantToken">) {
  const [mode, setMode] = useState<"text" | "voice">("text")
  const [inputText, setInputText] = useState("")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)
  const [roomConnected, setRoomConnected] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)
  const [agentConnecting, setAgentConnecting] = useState(true)
  const [displayMessages, setDisplayMessages] = useState<Message[]>([])

  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Update the useDataChannel callback in your ChatWindow component
const { send } = useDataChannel("1k-chat-topic", (message) => {
  console.log("📨 RAW Message received:", {
    payload: new TextDecoder().decode(message.payload),
    fromIdentity: message.from?.identity,
    fromSid: message.from?.sid,
    timestamp: message.timestamp,
    localIdentity: localParticipant?.identity
  })

  const messageText = new TextDecoder().decode(message.payload)
  const senderIdentity = message.from?.identity || ''
  
  // Skip empty messages
  if (!messageText.trim()) {
    console.log("⚠️ Skipping empty message")
    return
  }
  
  // Determine if message is from current user
  const isUser = senderIdentity === localParticipant?.identity
  
  // **CRITICAL FIX**: Better agent detection logic
  const isAgent = !isUser && (
    senderIdentity.includes('agent') || 
    senderIdentity.includes('support') ||
    senderIdentity.includes('sales') ||
    senderIdentity.includes('hr') ||
    senderIdentity.includes('technical') ||
    senderIdentity === 'main_agent' ||  // Your agent name from CLI
    senderIdentity === 'database_driven_agent' ||
    // Fallback: any participant that's not the user is considered agent
    (senderIdentity && senderIdentity !== localParticipant?.identity)
  )

  console.log("🔍 Message analysis:", {
    messageText: messageText.substring(0, 50) + "...",
    senderIdentity,
    localIdentity: localParticipant?.identity,
    isUser,
    isAgent,
    willProcess: isUser || isAgent
  })

  // Skip only if we can't determine sender
  if (!isUser && !isAgent) {
    console.log("⚠️ Skipping message from unrecognized sender:", senderIdentity)
    return
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    text: messageText,
    timestamp: message.timestamp || Date.now(),
    sender: isUser ? "user" : "agent",
    isLocal: isUser,
  }

  setDisplayMessages(prev => {
    // **IMPROVED**: More lenient duplicate detection
    const isDuplicate = prev.some(m => 
      m.text.trim() === newMessage.text.trim() && 
      m.sender === newMessage.sender &&
      Math.abs(m.timestamp - newMessage.timestamp) < 2000 // Increased window
    )
    
    if (isDuplicate) {
      console.log("⚠️ Skipping duplicate message:", messageText.substring(0, 30))
      return prev
    }
    
    console.log("✅ Adding message to chat:", {
      sender: newMessage.sender,
      text: newMessage.text.substring(0, 50) + "...",
      timestamp: new Date(newMessage.timestamp).toLocaleTimeString()
    })
    
    return [...prev, newMessage]
  })
})


  // Connection status
  const connectionStatus = useCallback(() => {
    if (!roomConnected) {
      return { text: "Disconnected", color: "bg-gray-400" }
    }

    const hasAgentMessage = displayMessages.some(msg => msg.sender === "agent")
    if (agentConnected || hasAgentMessage) {
      return { text: "Connected", color: "bg-green-500" }
    }

    if (agentConnecting) {
      return { text: "Connecting...", color: "bg-yellow-500 animate-pulse" }
    }

    return { text: "Connected", color: "bg-green-500" }
  }, [roomConnected, displayMessages.length, agentConnected, agentConnecting])()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayMessages.length])

  // Room connection tracking
  useEffect(() => {
    if (!room) return

    const handleConnected = () => {
      console.log("🔗 Room connected")
      setRoomConnected(true)
      setAgentConnecting(true)
      onConnectionStatusChange?.("connecting")
    }

    const handleDisconnected = () => {
      console.log("❌ Room disconnected")
      setRoomConnected(false)
      setAgentConnected(false)
      setAgentConnecting(false)
      onConnectionStatusChange?.("disconnected")
    }

    room.on(RoomEvent.Connected, handleConnected)
    room.on(RoomEvent.Disconnected, handleDisconnected)

    if (room.state === "connected") {
      setRoomConnected(true)
    }

    return () => {
      room.off(RoomEvent.Connected, handleConnected)
      room.off(RoomEvent.Disconnected, handleDisconnected)
    }
  }, [room, onConnectionStatusChange])

  // Agent message detection
  useEffect(() => {
    const hasAgentMessage = displayMessages.some(msg => msg.sender === "agent")
    
    console.log("🎯 Agent message detection:", {
      hasAgentMessage,
      agentConnecting,
      messageCount: displayMessages.length
    })
    
    if (hasAgentMessage && agentConnecting) {
      console.log("🎉 Agent message detected - marking as connected")
      setAgentConnecting(false)
      setAgentConnected(true)
      onConnectionStatusChange?.("connected")
    }
  }, [displayMessages.length, agentConnecting, onConnectionStatusChange])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    
    console.log("📤 Sending message via data channel:", text)
    
    // Add user message to display immediately
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      text: text,
      timestamp: Date.now(),
      sender: "user",
      isLocal: true,
    }
    
    setDisplayMessages(prev => [...prev, userMessage])
    
    // Send via data channel
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    await send(data)
    
    setInputText("")
  }, [send])

  const startVoiceConversation = useCallback(async () => {
    if (isVoiceActive || !room || !localParticipant) return

    try {
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })

      await localParticipant.publishTrack(track, {
        name: "microphone",
        source: Track.Source.Microphone,
      })

      setAudioTrack(track)
      setIsVoiceActive(true)
      setIsMuted(false)
      console.log("✅ Voice conversation started")
    } catch (error) {
      console.error("❌ Failed to start voice:", error)
    }
  }, [room, localParticipant, isVoiceActive])

  const stopVoiceConversation = useCallback(async () => {
    if (!isVoiceActive || !audioTrack || !localParticipant) return

    try {
      await localParticipant.unpublishTrack(audioTrack)
      audioTrack.stop()
      setAudioTrack(null)
      setIsVoiceActive(false)
      setIsMuted(false)
      console.log("✅ Voice conversation stopped")
    } catch (error) {
      console.error("❌ Failed to stop voice:", error)
    }
  }, [audioTrack, localParticipant, isVoiceActive])

  const toggleMute = useCallback(() => {
    if (!audioTrack) return

    if (isMuted) {
      audioTrack.unmute()
      setIsMuted(false)
    } else {
      audioTrack.mute()
      setIsMuted(true)
    }
  }, [audioTrack, isMuted])

  const handleDisconnect = useCallback(async () => {
    if (room) {
      await room.disconnect()
    }
  }, [room])

  const endSession = useCallback(async () => {
    setIsDisconnecting(true)
    try {
      await stopVoiceConversation()
      await handleDisconnect()
    } finally {
      setIsDisconnecting(false)
    }
    onEndSession?.()
  }, [stopVoiceConversation, handleDisconnect, onEndSession])

  // Auto-start voice when switching to voice mode
  useEffect(() => {
    if (mode === "voice" && !isVoiceActive && roomConnected) {
      startVoiceConversation()
    } else if (mode === "text" && isVoiceActive) {
      stopVoiceConversation()
    }
  }, [mode, isVoiceActive, roomConnected, startVoiceConversation, stopVoiceConversation])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{assistantName}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{assistantRole}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{connectionStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Text Chat
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "voice"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Voice Chat
          </button>
        </div>
        <OutboundCallButton />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-gray-500 mb-2">
            Debug: {displayMessages.length} messages | Connecting: {agentConnecting ? 'Yes' : 'No'} | Connected: {agentConnected ? 'Yes' : 'No'}
          </div>
          
          {displayMessages.length === 0 && agentConnecting && (
            <div className="text-center text-gray-500 py-8">
              <p>Waiting for agent to connect...</p>
            </div>
          )}
          
          {displayMessages.length === 0 && !agentConnecting && (
            <div className="text-center text-gray-500 py-8">
              <p>Start a conversation!</p>
            </div>
          )}
          
          {displayMessages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} assistantName={assistantName} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {mode === "text" ? (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(inputText)
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            <button
              onClick={endSession}
              disabled={isDisconnecting}
              className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title="End Session"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex flex-col items-center space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isVoiceActive ? (isMuted ? "Microphone muted" : "Listening...") : "Connecting to voice..."}
              </p>
              {isVoiceActive && <WaveAnimation isActive={!isMuted} className="h-8" />}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                disabled={!isVoiceActive}
                className={`p-3 rounded-full transition-all transform hover:scale-105 ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                    : "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endSession}
                disabled={isDisconnecting}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="End Session"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {!roomConnected && <p className="text-xs text-gray-500 dark:text-gray-400">Connecting to room...</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatWindow(props: ChatWindowProps) {
  return (
    <LiveKitRoom
      token={props.participantToken}
      serverUrl={props.livekitUrl}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <ChatWindowInner
        assistantName={props.assistantName}
        assistantRole={props.assistantRole}
        onConnectionStatusChange={props.onConnectionStatusChange}
        onEndSession={props.onEndSession}
      />
    </LiveKitRoom>
  )
}
