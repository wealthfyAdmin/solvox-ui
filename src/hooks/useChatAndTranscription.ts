"use client";

import { useMemo, useRef } from "react";
import {
  useChat,
  useTranscriptions,
  useLocalParticipant,
} from "@livekit/components-react";

export function useChatAndTranscription() {
  const { chatMessages, send } = useChat();
  const transcriptions = useTranscriptions();
  const { localParticipant } = useLocalParticipant();

  // For stable timestamps on transcriptions
  const transcriptionTimestamps = useRef<Map<string, number>>(new Map());

  const messages = useMemo(() => {
    const processed: any[] = [];

    // ---- Process text chat messages ----
    chatMessages.forEach((msg) => {
      processed.push({
        id: msg.id,
        from: msg.from,
        message: msg.message,
        timestamp:
          typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
        isUser: msg.from?.isLocal === true,
        isAgent: msg.from?.isLocal === false && !!msg.from?.identity,
        isSystem: msg.from === undefined,
      });
    });

    // ---- Process transcription messages ----
    transcriptions.forEach((t, index) => {
      const key = `${t.text}-${t.participantInfo?.identity || "unknown"}-${index}`;
      let timestamp: number;

      if (transcriptionTimestamps.current.has(key)) {
        timestamp = transcriptionTimestamps.current.get(key)!;
      } else {
        timestamp = Date.now() - (transcriptions.length - index) * 1000;
        transcriptionTimestamps.current.set(key, timestamp);
      }

      const identity = t.participantInfo?.identity;
      const isUser =
        !!identity && identity === localParticipant?.identity; // ✅ check against local participant

      processed.push({
        id: `transcript-${timestamp}-${index}`,
        from: {
          identity,
          isLocal: isUser,
        },
        message: t.text,
        timestamp,
        isUser, // ✅ user speech → right
        isAgent: !isUser, // ✅ remote speech → left
        isSystem: false,
      });
    });

    // ---- Sort all messages by timestamp ----
    return processed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [chatMessages, transcriptions, localParticipant?.identity]);

  return {
    messages,
    send,
  };
}
