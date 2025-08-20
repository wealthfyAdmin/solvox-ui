"use client"

import { useMemo, useRef } from "react"
import {
  type ReceivedChatMessage,
  useChat,
  useRoomContext,
  useTranscriptions,
  useLocalParticipant,
} from "@livekit/components-react"

type TranscriptionWithTimestamp = {
  text?: string
  participant?: {
    identity: string
    isLocal: boolean
  }
  participantIdentity?: string
  timestamp?: number
}

export default function useChatAndTranscription() {
  const transcriptions = useTranscriptions()
  const chat = useChat()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  const transcriptionTimestamps = useRef<Map<string, number>>(new Map())

  const mergedMessages = useMemo(() => {
    const transcriptionMessages: ReceivedChatMessage[] = transcriptions.map(
      (t, index) => {
        const transcription = t as TranscriptionWithTimestamp
        const transcriptionKey = `${transcription.text}-${index}`

        let timestamp: number
        if (transcription.timestamp) {
          timestamp = transcription.timestamp
        } else if (transcriptionTimestamps.current.has(transcriptionKey)) {
          timestamp = transcriptionTimestamps.current.get(transcriptionKey)!
        } else {
          // create synthetic stable timestamp
          timestamp = Date.now() - (transcriptions.length - index) * 1000
          transcriptionTimestamps.current.set(transcriptionKey, timestamp)
        }

        let fromParticipant: { identity: string; isLocal: boolean }
        if (transcription.participant) {
          fromParticipant = transcription.participant
        } else {
          const isUser =
            localParticipant &&
            transcription.participantIdentity === localParticipant.identity
          fromParticipant = {
            identity: isUser ? localParticipant.identity : "agent",
            isLocal: !!isUser,
          }
        }

        return {
          id: `transcription-${index}`,
          timestamp,
          message: transcription.text || "",
          from: fromParticipant,
        } as ReceivedChatMessage
      }
    )

    const allMessages = [...chat.chatMessages, ...transcriptionMessages]

    return allMessages.sort((a, b) => {
      const timestampA = typeof a.timestamp === "number" ? a.timestamp : 0
      const timestampB = typeof b.timestamp === "number" ? b.timestamp : 0
      return timestampA - timestampB
    })
  }, [transcriptions, chat.chatMessages, localParticipant])

  return { messages: mergedMessages, send: chat.send }
}
