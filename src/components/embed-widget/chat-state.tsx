"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Room } from "livekit-client"
import { RoomAudioRenderer, useLocalParticipant } from "@livekit/components-react"
import { Mic, Send, PhoneOff } from "lucide-react"
import { useChatAndTranscription } from "@/hooks/useChatAndTranscription"

interface Message {
  id: string
  text: string
  timestamp: number
  sender: "user" | "agent"
  isLocal: boolean
}

interface ChatStateProps {
  agentName: string
  room: Room
  onStartVoice: () => void
  onEndCall: () => void
  display_name?: string
}

const isUserMessage = (msg: Message) => msg.sender === "user"

function ChatMessage({ message, agentName, display_name }: { message: Message; agentName: string; display_name?: string }) {
  const isOwn = isUserMessage(message)

  return (
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isOwn ? "order-2" : "order-1"}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="text-xs font-medium text-gray-600">{display_name}</span>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 rounded-bl-sm"
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

export default function ChatState({ agentName, room, onStartVoice, onEndCall }: ChatStateProps) {
  const [inputText, setInputText] = useState("")
  const [orderedMessages, setOrderedMessages] = useState<Message[]>([])
  const [isConnecting, setIsConnecting] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, send } = useChatAndTranscription()
  const { localParticipant } = useLocalParticipant()

  // Disable mic while in chat mode
  useEffect(() => {
    const disableMic = async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(false)
        console.log("[ChatState] Microphone disabled during chat.")
      } catch (err) {
        console.error("[ChatState] Failed to disable mic:", err)
      }
    }
    disableMic()
  }, [room])

  // Simulate connecting animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  // Process messages
  useEffect(() => {
    const processedMessages: Message[] = messages.map((msg) => {
      const isUser =
        msg.from?.isLocal === true ||
        msg.from?.identity === localParticipant?.identity ||
        (msg.from?.identity?.toLowerCase().includes("user") ?? false)

      return {
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        text: msg.message,
        timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
        sender: isUser ? "user" : "agent",
        isLocal: isUser,
      }
    })
    setOrderedMessages(processedMessages)
  }, [messages, localParticipant?.identity])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [orderedMessages.length])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      await send(text)
      setInputText("")
    },
    [send]
  )

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }

  // If connecting, show loader animation
  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center">
          <div className="loader mb-4"></div>
          <p className="text-gray-600 font-medium text-sm">Connecting to {agentName}...</p>
        </div>
        <style jsx>{`
          .loader {
            width: 40px;
            height: 40px;
            border: 4px solid #cbd5e1;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* No voice in chat mode */}
      <RoomAudioRenderer />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-1">
          {orderedMessages.map((message) => (
            <ChatMessage key={message.id} message={message} agentName={agentName} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {/* <button
              onClick={onStartVoice}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="Switch to voice chat"
            >
              <Mic className="w-5 h-5 text-gray-700" />
            </button> */}
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-indigo-600 disabled:bg-gray-300 flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* End Session */}
          {/* <div className="mt-3 flex justify-center">
            <button
              onClick={onEndCall}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Session</span>
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
