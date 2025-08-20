"use client"

import * as React from "react"
import type { MessageFormatter, ReceivedChatMessage } from "@livekit/components-react"
import { cn } from "@/lib/utils"

// Custom hook for message processing
const useChatMessage = (entry: ReceivedChatMessage, messageFormatter?: MessageFormatter) => {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message
  }, [entry.message, messageFormatter])

  const hasBeenEdited = !!entry.editTimestamp
  const time = new Date(entry.timestamp)
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US"
  const name = entry.from?.name && entry.from.name !== "" ? entry.from.name : entry.from?.identity

  return { message: formattedMessage, hasBeenEdited, time, locale, name }
}

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  entry: ReceivedChatMessage
  hideName?: boolean
  hideTimestamp?: boolean
  messageFormatter?: MessageFormatter
}

export const ChatEntry = ({
  entry,
  messageFormatter,
  hideName,
  hideTimestamp,
  className,
  ...props
}: ChatEntryProps) => {
  const { message, hasBeenEdited, time, locale, name } = useChatMessage(entry, messageFormatter)

  const isUser = Boolean(entry.from?.isLocal)
  const isSystem = entry.from?.identity === "system"
  const isAgent = !isUser && !isSystem

  // Determine message origin for styling
  const messageOrigin = isUser ? "user" : isSystem ? "system" : "agent"

  // Debug logging for troubleshooting
  React.useEffect(() => {
    console.log("[v0] ChatEntry classification:", {
      id: entry.id,
      fromIdentity: entry.from?.identity,
      isLocal: entry.from?.isLocal,
      isUser,
      isSystem,
      isAgent,
      messageOrigin,
      messagePreview: String(message).substring(0, 30),
    })
  }, [entry.id, entry.from?.identity, entry.from?.isLocal, isUser, isSystem, isAgent, messageOrigin, message])

  return (
    <li
      data-message-origin={messageOrigin}
      title={time.toLocaleTimeString(locale, { timeStyle: "full" })}
      className={cn("group flex flex-col gap-1 mb-4", className)}
      {...props}
    >
      {/* Header with name and timestamp */}
      {(!hideTimestamp || !hideName || hasBeenEdited) && (
        <div
          className={cn(
            "flex text-xs text-gray-500 dark:text-gray-400",
            isUser && "flex-row-reverse",
            isSystem && "justify-center",
          )}
        >
          {!hideName && (
            <span
              className={cn(
                "font-medium",
                isSystem && "text-yellow-600 dark:text-yellow-400",
                isUser && "text-blue-600 dark:text-blue-400",
                isAgent && "text-green-600 dark:text-green-400",
              )}
            >
              {isSystem ? "System" : isUser ? "You" : name || "Assistant"}
            </span>
          )}

          {!hideTimestamp && (
            <span
              className={cn(
                "font-mono opacity-60 group-hover:opacity-100 transition-opacity",
                isUser ? "mr-auto" : isSystem ? "mx-2" : "ml-auto",
              )}
            >
              {hasBeenEdited && "*"}
              {time.toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div className={cn("flex", isUser && "justify-end", isSystem && "justify-center", isAgent && "justify-start")}>
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words",
            // User messages - blue, right-aligned
            isUser && ["bg-blue-500 text-white", "rounded-br-sm", "shadow-sm"],
            // Agent messages - gray, left-aligned
            isAgent && [
              "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "rounded-bl-sm",
              "border border-gray-200 dark:border-gray-700",
            ],
            // System messages - yellow, center-aligned
            isSystem && [
              "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
              "border border-yellow-200 dark:border-yellow-700",
              "text-center text-sm",
              "rounded-lg",
            ],
          )}
        >
          {message}
        </div>
      </div>
    </li>
  )
}
