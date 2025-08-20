"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RoomEvent, Track, type RemoteParticipant, type AudioTrack, createLocalAudioTrack, LocalAudioTrack } from "livekit-client"
import { LiveKitRoom, useRoomContext, useLocalParticipant } from "@livekit/components-react"
import useChatAndTranscription from "@/hooks/useChatAndTranscription"
import OutboundCallButton from "../header/NotificationDropdown"
import WaveAnimation from "../waveanimation/wave-animation"
import AgentJoiningAnimation from "../agentjoininganimation/agent-joining-animation"

interface ChatWindowProps {
  assistantName: string
  assistantRole: string
  livekitUrl: string
  roomName: string
  participantToken: string
  onConnectionStatusChange?: (status: "connected" | "connecting" | "disconnected" | "error") => void
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
}: Omit<ChatWindowProps, "livekitUrl" | "roomName" | "participantToken">) {
  const [mode, setMode] = useState<"text" | "voice">("text")
  const [inputText, setInputText] = useState("")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)
  const [agentConnected, setAgentConnected] = useState(false)
  const [agentConnecting, setAgentConnecting] = useState(false)
  const [showOutboundCall, setShowOutboundCall] = useState(false)
  const [hasFirstAssistantMessage, setHasFirstAssistantMessage] = useState(false)
  const [showOutbound, setShowOutbound] = useState(true)

  const handleMakeCallClick = () => {
    setShowOutbound(true)
  }

  const { messages, send } = useChatAndTranscription()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const processedMessages: Message[] = messages.map((msg) => {
      const isUser = msg.from?.isLocal === true || msg.from?.identity === localParticipant?.identity

      console.log("[v0] Processing message:", {
        text: msg.message?.substring(0, 50) + "...",
        fromIdentity: msg.from?.identity,
        fromIsLocal: msg.from?.isLocal,
        localParticipantIdentity: localParticipant?.identity,
        isUser: isUser,
        sender: isUser ? "user" : "agent",
      })

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
    }

    setOrderedMessages(processedMessages)
  }, [messages, hasFirstAssistantMessage])

  const [orderedMessages, setOrderedMessages] = useState<Message[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [orderedMessages.length])

  useEffect(() => {
    if (!room) return

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log(`👤 Participant connected: ${participant.identity}`)

      if (participant.identity.includes("agent") || participant.identity.includes("assistant")) {
        setAgentConnecting(false)
        setAgentConnected(true)
        onConnectionStatusChange?.("connected")
      }
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      console.log(`👋 Participant disconnected: ${participant.identity}`)

      if (participant.identity.includes("assistant")) {
        setAgentConnected(false)
        setAgentConnecting(false)
        onConnectionStatusChange?.("disconnected")
      }
    }

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [room, onConnectionStatusChange])

  useEffect(() => {
    if (!room) return

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (
        track.kind === "audio" &&
        (participant.identity.includes("agent") || participant.identity.includes("assistant"))
      ) {
        console.log("[v0] Setting up agent audio track")

        if (!audioElementRef.current) {
          audioElementRef.current = new Audio()
          audioElementRef.current.autoplay = false // don’t autoplay
          audioElementRef.current.volume = 1.0
        }

        const mediaStream = new MediaStream([track.mediaStreamTrack])
        audioElementRef.current.srcObject = mediaStream

        if (mode === "voice") {
          audioElementRef.current.muted = false
          audioElementRef.current.play().catch((error) => {
            console.error("[v0] Failed to play agent audio:", error)
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
  }, [room, mode])

  useEffect(() => {
    if (!audioElementRef.current) return

    if (mode === "voice" && audioElementRef.current.srcObject) {
      console.log("[v0] Enabling agent audio for voice mode")
      audioElementRef.current.muted = false
      audioElementRef.current.play().catch((error) => {
        console.error("[v0] Failed to play agent audio:", error)
      })
    } else if (mode === "text") {
      console.log("[v0] Disabling agent audio for text mode")
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

      console.log("📤 Sending message:", text)
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
    } catch (error) {
      console.error("❌ Failed to stop voice:", error)
    }
  }, [audioTrack, localParticipant, isVoiceActive])

  const toggleVoiceConversation = useCallback(() => {
    if (isVoiceActive) {
      stopVoiceConversation()
    } else {
      startVoiceConversation()
    }
  }, [isVoiceActive, startVoiceConversation, stopVoiceConversation])

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
            <div
              className={`w-2 h-2 rounded-full ${agentConnecting ? "bg-yellow-500 animate-pulse" : agentConnected ? "bg-green-500" : "bg-gray-400"
                }`}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {agentConnecting ? "Connecting..." : agentConnected ? "Connected" : "Disconnected"}
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
          {(agentConnecting || (!hasFirstAssistantMessage && agentConnected)) && <AgentJoiningAnimation />}

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
          </div>
        </div>
      ) : (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center space-y-4">
            {isVoiceActive && (
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Listening...</p>
                <WaveAnimation isActive={isVoiceActive} className="h-12" />
              </div>
            )}

            <button
              onClick={toggleVoiceConversation}
              disabled={!agentConnected}
              className={`px-8 py-4 w-100 rounded font-medium transition-all transform hover:scale-105 ${isVoiceActive
                  ? "bg-blue-500 hover:bg-red-600 text-white shadow-lg"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isVoiceActive ? " End Voice Chat" : "Start Voice Chat"}
            </button>

            {!agentConnected && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for agent connection...</p>
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
      />
    </LiveKitRoom>
  )
}
