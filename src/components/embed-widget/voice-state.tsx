"use client"

import { useEffect, useState } from "react"
import { Room } from "livekit-client"
import { useVoiceAssistant, RoomAudioRenderer } from "@livekit/components-react"
import { PhoneOff, Mic, MicOff } from "lucide-react"

interface VoiceStateProps {
  room: Room
  agentName: string
  onEndCall: () => void
  display_name?: string
}

export default function VoiceState({ room, agentName, onEndCall, display_name }: VoiceStateProps) {
  const { state } = useVoiceAssistant()
  const [isMuted, setIsMuted] = useState(false)

  // Enable mic automatically on entering voice mode
  useEffect(() => {
    const enableMic = async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        console.log("[VoiceState] Microphone enabled.")
        setIsMuted(false)
      } catch (err) {
        console.error("[VoiceState] Failed to enable microphone:", err)
      }
    }
    enableMic()
  }, [room])

  // Toggle Mute / Unmute
  const toggleMute = async () => {
    try {
      const newMuteState = !isMuted
      await room.localParticipant.setMicrophoneEnabled(!newMuteState)
      setIsMuted(newMuteState)
      console.log(`[VoiceState] Microphone ${newMuteState ? "muted" : "unmuted"}.`)
    } catch (err) {
      console.error("[VoiceState] Error toggling mute:", err)
    }
  }

  // End call & notify parent
  const handleEndCall = () => {
    console.log("[VoiceState] Ending voice session and collapsing.")
    room.disconnect()
    window.parent.postMessage({ type: "VOICE_AGENT_END_SESSION" }, "*")
    onEndCall()
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-white text-gray-900 overflow-hidden">
      {/* Audio Renderer */}
      <RoomAudioRenderer />

      {/* Agent Info */}
      <div className="absolute top-8 text-center">
        <h2 className="text-lg font-semibold">{display_name}</h2>
        <p className="text-xs text-gray-500">Voice Session Active</p>
      </div>

      {/* Animated Bars */}
      <div className="flex-1 flex items-center justify-center">
        <div className="voice-wave">
          {[...Array(7)].map((_, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${i * 0.15}s`,
                height:
                  state === "speaking"
                    ? "80px"
                    : state === "listening"
                    ? "60px"
                    : "40px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-10 flex items-center gap-3">
        {/* Mute / Unmute */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 hover:scale-105 ${
            isMuted ? "bg-gray-300 hover:bg-gray-400" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isMuted ? (
            <MicOff className="w-7 h-7 text-white" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-transform duration-200 hover:scale-105"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>
      </div>

      <p className="absolute bottom-3 text-xs text-gray-500">Tap red to end call • Green to mute/unmute</p>

      {/* Styles */}
      <style jsx global>{`
        .voice-wave {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 15px;
          height: 120px;
        }
        .voice-wave span {
          display: block;
          width: 10px;
          background: linear-gradient(180deg, #6366f1, #8b5cf6);
          border-radius: 9999px;
          animation: wavePulse 1.3s ease-in-out infinite;
        }
        @keyframes wavePulse {
          0%, 100% {
            transform: scaleY(0.4);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
