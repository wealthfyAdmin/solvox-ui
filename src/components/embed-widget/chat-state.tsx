"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room } from "livekit-client";
import { RoomAudioRenderer, useLocalParticipant } from "@livekit/components-react";
import { Mic, Send } from "lucide-react";
import { useChatAndTranscription } from "@/hooks/useChatAndTranscription";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  sender: "user" | "agent";
  isLocal: boolean;
}

interface ChatStateProps {
  agentName: string;
  room: Room;
  onStartVoice: () => void;
  onEndCall: () => void;
  display_name?: string;
}

const isUserMessage = (msg: Message) => msg.sender === "user";

function ChatMessage({
  message,
  display_name
}: {
  message: Message;
  display_name?: string;
}) {
  const isOwn = isUserMessage(message);

  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isOwn ? "order-2" : "order-1"}`}>
        {!isOwn && (
          <div className="flex items-center gap-1 mb-0.5 pl-1">
            <span className="text-[10px] text-gray-600">{display_name}</span>
          </div>
        )}

        <div
          className={`px-3 py-1.5 rounded-xl shadow-sm text-xs leading-relaxed ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 rounded-bl-sm"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>

        <div
          className={`text-[9px] text-gray-500 mt-0.5 ${
            isOwn ? "text-right pr-1" : "text-left pl-1"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatState({ agentName, room, onStartVoice }: ChatStateProps) {
  const [inputText, setInputText] = useState("");
  const [orderedMessages, setOrderedMessages] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, send } = useChatAndTranscription();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    room.localParticipant.setMicrophoneEnabled(false).catch(console.error);
  }, [room]);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const processed: Message[] = messages.map((msg) => {
      const isUser =
        msg.from?.isLocal === true ||
        msg.from?.identity === localParticipant?.identity ||
        msg.from?.identity?.toLowerCase().includes("user");

      return {
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        text: msg.message,
        timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
        sender: isUser ? "user" : "agent",
        isLocal: isUser
      };
    });

    setOrderedMessages(processed);
  }, [messages, localParticipant?.identity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orderedMessages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await send(text);
      setInputText("");
    },
    [send]
  );

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="loader mb-3"></div>
        <p className="text-gray-600 text-xs">Connecting to {agentName}...</p>

        <style jsx>{`
          .loader {
            width: 30px;
            height: 30px;
            border: 3px solid #cbd5e1;
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
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <RoomAudioRenderer />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
        {orderedMessages.map((m) => (
          <ChatMessage key={m.id} message={m} display_name={agentName} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            onClick={onStartVoice}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <Mic className="w-4 h-4 text-gray-700" />
          </button>

          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-indigo-600 disabled:bg-gray-300 flex items-center justify-center hover:bg-indigo-700"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
