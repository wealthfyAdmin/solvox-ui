// hooks/useChatAndTranscription.ts
"use client"

import { useChat } from "@livekit/components-react"

export const useChatAndTranscription = () => {
  const { chatMessages, send, isSending } = useChat()
  
  console.log("🔍 Chat messages:", chatMessages)
  
  return { 
    messages: chatMessages.map(msg => ({
      id: msg.id || `msg-${Date.now()}`,
      message: msg.message,
      timestamp: msg.timestamp,
      from: {
        identity: msg.from?.identity,
        isLocal: msg.from?.isLocal
      }
    })),
    send: async (text: string) => {
      if (!isSending) {
        console.log("📤 Sending via useChat:", text)
        await send(text)
      }
    }
  }
}
