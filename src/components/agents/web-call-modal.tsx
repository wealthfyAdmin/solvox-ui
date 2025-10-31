"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent, Track, VideoPresets } from "livekit-client";
import { useConnectionDetails } from "@/hooks/useConnectionDetails";
import { Loader2, Phone, PhoneOff, Mic, MicOff, AlertCircle, X } from "lucide-react";

export default function WebCallModal({
  open,
  onClose,
  agentId,
  agentName,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const { fetchConnectionDetails } = useConnectionDetails();

  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
      })
  );

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const connectToAgent = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      console.log("[WebCallModal] Connecting to:", agentId);

      const details = await fetchConnectionDetails(agentId);
      if (!details) throw new Error("Failed to get connection details");

      await room.connect(details.serverUrl, details.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = room;
      setIsConnected(true);

      // Start duration timer
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);

      console.log("[WebCallModal] ✅ Connected");
    } catch (err) {
      console.error("[WebCallModal] ❌", err);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, room, fetchConnectionDetails]);

  useEffect(() => {
    if (!open) return;
    connectToAgent();

    const handleDisconnect = () => {
      console.log("[WebCallModal] Disconnected");
      setIsConnected(false);
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setIsConnected(false);
    };
  }, [open, connectToAgent, room]);

  const handleClose = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      setIsConnected(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }, [onClose]);

  const toggleMute = () => {
    if (!roomRef.current) return;
    const track = roomRef.current.localParticipant.getTrackBySource(Track.Source.Microphone);
    if (!track) return;
    if (track.isMuted) {
      track.unmute();
      setIsMuted(false);
    } else {
      track.mute();
      setIsMuted(true);
    }
  };

  if (!open) return null;

  const overlayClasses =
    "fixed inset-0 h-full w-full bg-gray-400/50 dark:bg-gray-900/60 backdrop-blur-[32px] transition-colors duration-300";
  const contentClasses = `
    fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl 
    rounded-l-3xl transition-all duration-300 ease-out 
    ${open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"} 
    flex flex-col overflow-hidden z-[99999]
  `;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      <div className={overlayClasses} onClick={handleClose} />

      <div className={contentClasses} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-5 text-white shadow-lg">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-800 shadow-md hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Phone className="w-6 h-6" />
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div>
              <h2 className="text-lg font-bold">{agentName}</h2>
              <p className="text-sm opacity-90">
                {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {isConnecting && (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-300">Connecting to {agentName}...</p>
            </div>
          )}

          {isConnected && (
            <>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{formatTime(callDuration)}</p>

              <div className="flex w-full space-x-4">
                <button
                  onClick={toggleMute}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isMuted
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-5 h-5 inline mr-2" /> Unmute
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 inline mr-2" /> Mute
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>End</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
