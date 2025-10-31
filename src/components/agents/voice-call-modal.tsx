"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent, VideoPresets } from "livekit-client";
import { RoomContext } from "@livekit/components-react";
import { useConnectionDetails } from "@/hooks/useConnectionDetails";
import { Loader2, AlertCircle, X } from "lucide-react";
import VoiceState from "@/components/embed-widget/voice-state";

interface VoiceCallModalProps {
  open: boolean;
  onClose: () => void;
  agentname: string;
  agentID: string;
  display_name?: string;
}

export default function VoiceCallModal({ open, onClose, agentname, agentID, display_name }: VoiceCallModalProps) {
  const agentName = agentname;
  const agentId = agentID;

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

  /** 🔹 Connect to agent */
  const connectToAgent = useCallback(async () => {
    if (!agentId) return;
    setIsConnecting(true);
    setError(null);
    try {
      console.log("[VoiceCallModal] Connecting to:", agentId);

      let details = await fetchConnectionDetails(agentId);
      if (!details) {
        console.warn("[VoiceCallModal] Fallback to agent name");
        details = await fetchConnectionDetails(agentName);
      }
      if (!details) throw new Error("Failed to get connection details");

      await room.connect(details.serverUrl, details.participantToken);
      setIsConnected(true);
      roomRef.current = room;
      console.log("[VoiceCallModal] ✅ Connected to LiveKit voice room");
    } catch (err) {
      console.error("[VoiceCallModal] ❌ Error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to voice chat");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, agentName, room, fetchConnectionDetails]);

  /** 🔹 Lifecycle */
  useEffect(() => {
    if (!open) return;
    connectToAgent();

    const handleDisconnect = () => {
      console.log("[VoiceCallModal] Disconnected");
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

  // 💠 Match ChatDrawer Theme
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
      {/* Overlay */}
      <div className={overlayClasses} onClick={handleClose} />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — same as chat */}
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
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10v4m-6-4v4m-3 5h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-200 ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                  }`}
              ></div>
            </div>
            <div>
              <h2 className="text-lg font-bold">{display_name}</h2>
              <p className="text-sm opacity-90">
                {isConnecting ? "Connecting..." : isConnected ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Connecting */}
        {isConnecting && (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">Connecting to {display_name}...</p>
            </div>
          </div>
        )}

        {/* Connected Voice */}
        {!isConnecting && isConnected && (
          <RoomContext.Provider value={room}>
            <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
              <VoiceState room={room} agentName={agentName} onEndCall={handleClose} display_name={display_name} />
            </div>
          </RoomContext.Provider>
        )}
      </div>
    </div>
  );
}
