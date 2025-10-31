"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RoomEvent, Track, type RemoteParticipant, createLocalAudioTrack, LocalAudioTrack } from "livekit-client"
import { LiveKitRoom, useRoomContext, useLocalParticipant } from "@livekit/components-react"
import { Mic, MicOff, X, PhoneOff } from "lucide-react"
import {useChatAndTranscription} from "@/hooks/useChatAndTranscription"
import OutboundCallButton from "../header/NotificationDropdown"
import WaveAnimation from "../waveanimation/wave-animation"
import AgentJoiningAnimation from "../agentjoininganimation/agent-joining-animation"

interface ChatWindowProps {
  assistantName: "3-sales-agent-1761888217157"
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

const isUserMessage = (msg: Message) => msg.sender === "user"

function ChatMessage({ message, assistantName }: { message: Message; assistantName: string }) {
  const isOwn = isUserMessage(message)

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
          className={`px-4 py-2 rounded-2xl shadow-sm ${isOwn
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
  const [agentConnected, setAgentConnected] = useState(false)
  const [agentConnecting, setAgentConnecting] = useState(false)
  const [hasFirstAssistantMessage, setHasFirstAssistantMessage] = useState(false)
  const [showOutbound, setShowOutbound] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [roomConnected, setRoomConnected] = useState(false)

  const { messages, send } = useChatAndTranscription()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const [orderedMessages, setOrderedMessages] = useState<Message[]>([])

  // ✅ Improved status logic
  const getConnectionStatus = () => {
    if (!roomConnected) {
      return {
        text: "Disconnected",
        color: "bg-gray-400"
      }
    }
    
    // If we have messages or agent is connected, show as connected
    if (agentConnected || orderedMessages.length > 0) {
      return {
        text: "Connected",
        color: "bg-green-500"
      }
    }
    
    // Only show connecting if room is connected but no agent yet AND no messages
    if (agentConnecting && orderedMessages.length === 0) {
      return {
        text: "Connecting...",
        color: "bg-yellow-500 animate-pulse"
      }
    }
    
    return {
      text: "Connected",
      color: "bg-green-500"
    }
  }

  const detectSender = (participantIdentity: string | null | undefined): boolean => {
    if (!participantIdentity) {
      return false // undefined → agent
    }
    const id = participantIdentity.toLowerCase()
    if (id.includes("agent") || id.includes("assistant") || id.includes("bot")) {
      return false // agent
    }
    if (id.includes("user")) {
      return true // user
    }
    return false // default to agent
  }

  useEffect(() => {
    const processedMessages: Message[] = messages.map((msg) => {
      // console.log("Processing message:", msg)
      const isUser = msg.from?.isLocal === true || 
                     msg.from?.identity === localParticipant?.identity ||
                     detectSender(msg.from?.identity)

      return {
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        text: msg.message,
        timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
        sender: isUser ? "user" : "agent",
        isLocal: isUser,
      }
    })

    const hasAssistantMessage = processedMessages.some((msg) => msg.sender === "agent")
    if (hasAssistantMessage && !hasFirstAssistantMessage) {
      setHasFirstAssistantMessage(true)
      // If we have agent messages, consider agent as connected
      if (!agentConnected) {
        setAgentConnected(true)
        setAgentConnecting(false)
      }
    }

    setOrderedMessages(processedMessages)
  }, [messages, hasFirstAssistantMessage, localParticipant?.identity, agentConnected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [orderedMessages.length])

  // Track room connection state
  useEffect(() => {
    if (!room) return

    const handleConnected = () => {
      // console.log("🔗 Room connected")
      setRoomConnected(true)
      // Only set connecting if we don't have messages yet
      if (orderedMessages.length === 0) {
        setAgentConnecting(true)
      }
    }

    const handleDisconnected = () => {
      // console.log("❌ Room disconnected")
      setRoomConnected(false)
      setAgentConnected(false)
      setAgentConnecting(false)
      onConnectionStatusChange?.("disconnected")
    }

    const handleReconnecting = () => {
      // console.log("🔄 Room reconnecting...")
      onConnectionStatusChange?.("connecting")
    }

    room.on(RoomEvent.Connected, handleConnected)
    room.on(RoomEvent.Disconnected, handleDisconnected)
    room.on(RoomEvent.Reconnecting, handleReconnecting)

    // Check if room is already connected
    if (room.state === "connected") {
      setRoomConnected(true)
    }

    return () => {
      room.off(RoomEvent.Connected, handleConnected)
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
    }
  }, [room, onConnectionStatusChange, orderedMessages.length])

  // Agent detection with timeout
  useEffect(() => {
    if (!room) return

    let agentTimeout: NodeJS.Timeout

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      // console.log(`👤 Participant connected: ${participant.identity}`)

      if (participant.identity !== localParticipant?.identity) {
        // console.log("🤖 Remote participant detected - treating as agent")
        clearTimeout(agentTimeout)
        setAgentConnecting(false)
        setAgentConnected(true)
        onConnectionStatusChange?.("connected")
      }
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      // console.log(`👋 Participant disconnected: ${participant.identity}`)
      
      if (participant.identity !== localParticipant?.identity) {
        // Give agent 5 seconds to reconnect, but don't show disconnected if we have active conversation
        agentTimeout = setTimeout(() => {
          if ((room as any).participants.size === 0 && orderedMessages.length === 0) {
            setAgentConnected(false)
            setAgentConnecting(false)
            onConnectionStatusChange?.("disconnected")
          }
        }, 5000)
      }
    }

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

    return () => {
      clearTimeout(agentTimeout)
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [room, localParticipant, onConnectionStatusChange, orderedMessages.length])

  // Accept audio from ANY remote participant
  useEffect(() => {
    if (!room) return

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (track.kind === "audio" && participant.identity !== localParticipant?.identity) {
        // console.log("[v0] Setting up remote audio track from:", participant.identity)

        if (!audioElementRef.current) {
          audioElementRef.current = new Audio()
          audioElementRef.current.autoplay = false
          audioElementRef.current.volume = 1.0
        }

        const mediaStream = new MediaStream([track.mediaStreamTrack])
        audioElementRef.current.srcObject = mediaStream

        if (mode === "voice") {
          audioElementRef.current.muted = false
          audioElementRef.current.play().catch((error) => {
            console.error("[v0] Failed to play remote audio:", error)
          })
        } else {
          audioElementRef.current.muted = true
          audioElementRef.current.pause()
        }
      }
    }

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    }
  }, [room, mode, localParticipant])

  useEffect(() => {
    if (!audioElementRef.current) return

    if (mode === "voice" && audioElementRef.current.srcObject) {
      // console.log("[v0] Enabling agent audio for voice mode")
      audioElementRef.current.muted = false
      audioElementRef.current.play().catch((error) => {
        console.error("[v0] Failed to play agent audio:", error)
      })
    } else if (mode === "text") {
      // console.log("[v0] Disabling agent audio for text mode")
      audioElementRef.current.muted = true
      audioElementRef.current.pause()
    }
  }, [mode])

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null
      }
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      // console.log("📤 Sending message:", text)
      await send(text)
      setInputText("")
    },
    [send],
  )

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
      // console.log("✅ Voice conversation started")
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
      // console.log("✅ Voice conversation stopped")
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

  const exitVoiceChat = useCallback(async () => {
    setIsDisconnecting(true)
    try {
      await handleDisconnect()
    } finally {
      setIsDisconnecting(false)
    }
    onEndSession?.()
  }, [handleDisconnect, onEndSession])

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
    }
  }, [mode, isVoiceActive, roomConnected, startVoiceConversation])

  // Auto-stop voice when switching to text mode
  useEffect(() => {
    if (mode === "text" && isVoiceActive) {
      stopVoiceConversation()
    }
  }, [mode, isVoiceActive, stopVoiceConversation])

  const connectionStatus = getConnectionStatus()

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
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "text"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Text Chat
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "voice"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Voice Chat
          </button>
        </div>
        {showOutbound && <OutboundCallButton />}
      </div>

      {/* Messages Area - WhatsApp Style */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          {(agentConnecting && orderedMessages.length === 0) && <AgentJoiningAnimation />}
          {orderedMessages.map((message) => (
            <ChatMessage key={message.id} message={message} assistantName={assistantName} />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
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
            {/* Voice Status Indicator */}
            <div className="flex flex-col items-center space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isVoiceActive 
                  ? (isMuted ? "Microphone muted" : "Listening...") 
                  : "Connecting to voice..."
                }
              </p>
              {isVoiceActive && (
                <WaveAnimation isActive={!isMuted} className="h-8" />
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-3">
              {/* Mute/Unmute Button */}
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

              {/* End Session Button */}
              <button
                onClick={exitVoiceChat}
                disabled={isDisconnecting}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="End Session"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {!roomConnected && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Connecting to room...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatWindow({
  assistantName,
  assistantRole,
  livekitUrl,
  roomName,
  participantToken,
  onConnectionStatusChange,
  onEndSession,
}: ChatWindowProps) {
  return (
    <LiveKitRoom
      token={participantToken}
      serverUrl={livekitUrl}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <ChatWindowInner
        assistantName={assistantName}
        assistantRole={assistantRole}
        onConnectionStatusChange={onConnectionStatusChange}
        onEndSession={onEndSession}
      />
    </LiveKitRoom>
  )
}