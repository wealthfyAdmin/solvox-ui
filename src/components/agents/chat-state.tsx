"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { type Room, RoomEvent } from "livekit-client"

interface ChatStateProps {
  agentName: string
  room: Room
  onStartVoice: () => void
  onEndCall: () => void
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatState({ agentName, room, onStartVoice, onEndCall }: ChatStateProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!room) return

    const handleConnected = () => {
      console.log("[v0] Connected to chat room")
      setIsConnected(true)
      setMessages([
        {
          id: "Sales",
          text: `Hello! I'm ${agentName}. How can I help you today?`,
          isUser: false,
          timestamp: new Date(),
        },
      ])
    }

    const handleDataReceived = (payload: Uint8Array, participant) => {
      if (participant?.identity.includes("agent")) {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload))
          if (data.type === "message") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                text: data.text,
                isUser: false,
                timestamp: new Date(),
              },
            ])
            setIsAgentTyping(false)
          } else if (data.type === "typing") {
            setIsAgentTyping(data.isTyping)
          }
        } catch (error) {
          console.error("[v0] Failed to parse message:", error)
        }
      }
    }

    const handleDisconnected = () => {
      setIsConnected(false)
    }

    room.on(RoomEvent.Connected, handleConnected)
    room.on(RoomEvent.DataReceived, handleDataReceived)
    room.on(RoomEvent.Disconnected, handleDisconnected)

    return () => {
      room.off(RoomEvent.Connected, handleConnected)
      room.off(RoomEvent.DataReceived, handleDataReceived)
      room.off(RoomEvent.Disconnected, handleDisconnected)
    }
  }, [room, agentName])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !room || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsAgentTyping(true)

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(
        JSON.stringify({
          type: "message",
          text: text,
          timestamp: new Date().toISOString(),
        }),
      )
      await room.localParticipant.publishData(data, "reliable")
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      setIsAgentTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isUser
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isAgentTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={!isConnected}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || !isConnected}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <button
          onClick={onStartVoice}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-sm font-medium"
        >
          Switch to Voice Call
        </button>
      </div>
    </div>
  )
}
