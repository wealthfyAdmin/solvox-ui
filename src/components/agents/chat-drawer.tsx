"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent, VideoPresets } from "livekit-client";
import { RoomContext } from "@livekit/components-react";
import ChatState from "@/components/embed-widget/chat-state";
import { useConnectionDetails } from "@/hooks/useConnectionDetails";
import { Loader2, AlertCircle, X } from "lucide-react";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  agentName: string;
  agentId: string;
  display_name?: string;
}

export default function ChatDrawer({ open, onClose, agentName, agentId ,display_name}: ChatDrawerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
      })
  );

  const { fetchConnectionDetails } = useConnectionDetails();
  const roomRef = useRef<Room | null>(null);

  const connectToAgent = useCallback(async () => {
    if (!agentId) return;
    setIsConnecting(true);
    setError(null);

    try {
      console.log("[ChatDrawer] Connecting to agent:", agentId);
      const details = await fetchConnectionDetails(agentId);
      if (!details) throw new Error("Failed to get connection details");

      await room.connect(details.serverUrl, details.participantToken);
      console.log("[ChatDrawer] ✅ Connected to LiveKit chat room");

      setIsConnected(true);
      roomRef.current = room;
    } catch (err) {
      console.error("[ChatDrawer] ❌ Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to chat");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, room, fetchConnectionDetails]);

  useEffect(() => {
    if (!open) return;
    connectToAgent();

    const handleDisconnect = () => {
      console.log("[ChatDrawer] 🔌 Disconnected from room");
      setIsConnected(false);
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
      if (roomRef.current) {
        roomRef.current.disconnect();
        setIsConnected(false);
      }
    };
  }, [open, connectToAgent, room]);

  const handleClose = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      setIsConnected(false);
    }
    onClose();
  }, [onClose]);

  if (!open) return null;

  const overlayClasses =
    "fixed inset-0 h-full w-full bg-gray-400/50 dark:bg-gray-900/60 backdrop-blur-[32px] transition-colors duration-300";

  const contentClasses = `
    fixed right-0 top-0 h-full w-96 
    bg-white dark:bg-gray-900 shadow-xl 
    rounded-l-3xl transition-all duration-300 ease-out 
    ${open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"} 
    flex flex-col overflow-hidden z-[99999]
  `;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      <div className={overlayClasses} onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-5 text-white shadow-lg">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-800 shadow-md transition-colors duration-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg font-bold">{display_name}</h2>
              <p className="text-sm opacity-90">
                {isConnecting ? "Connecting..." : isConnected ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                Connecting to {agentName}...
              </p>
            </div>
          )}

          {!isConnecting && isConnected && (
            <RoomContext.Provider value={room}>
              <ChatState
                agentName={agentName}
                room={room}
                onStartVoice={handleClose}
                onEndCall={handleClose}
                display_name={display_name}
              />
            </RoomContext.Provider>
          )}
        </div>
      </div>
    </div>
  );
}
