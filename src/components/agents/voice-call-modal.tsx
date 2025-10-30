"use client"

import { useState, useEffect, useRef } from "react"
import { Room, RoomEvent, Track, VideoPresets } from "livekit-client"
import { agentService } from "@/lib/agent-service"
import { Phone, PhoneOff, Mic, MicOff, Loader2, AlertCircle, Volume2 } from "lucide-react"
import { useConnectionDetails } from "@/hooks/useConnectionDetails"

interface VoiceCallModalProps {
  open: boolean
  onClose: () => void
  agentName: string
  agentId: string
}

type CallState = "idle" | "connecting" | "connected" | "speaking" | "listening" | "ended"

export default function VoiceCallModal({ open, onClose, agentName, agentId }: VoiceCallModalProps) {
  const [callState, setCallState] = useState<CallState>("idle")
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [volume, setVolume] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false) // Declare setIsConnecting variable

  // LiveKit integration
  const [room, setRoom] = useState<Room | null>(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h540.resolution },
      }),
  )
  const [roomName, setRoomName] = useState<string>("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const roomRef = useRef<Room | null>(null)

  const { fetchConnectionDetails } = useConnectionDetails()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopCall()
    }
  }, [])

  // Update call duration
  useEffect(() => {
    if (callState === "connected" || callState === "speaking" || callState === "listening") {
      intervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callState])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && callState === "idle") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose, callState])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!open || !agentId) return

    const connectToAgent = async () => {
      try {
        setIsConnecting(true)
        setError(null)
        console.log("[v0] Connecting to voice agent:", agentId)

        const details = await fetchConnectionDetails(agentId)
        if (!details) throw new Error("Failed to get connection details")

        await room.connect(details.serverUrl, details.participantToken)
        setIsConnected(true)
        roomRef.current = room
      } catch (err) {
        console.error("[v0] Voice connection error:", err)
        setError(err instanceof Error ? err.message : "Failed to connect to voice call")
        setIsConnected(false)
      } finally {
        setIsConnecting(false)
      }
    }

    connectToAgent()

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        setIsConnected(false)
      }
    }
  }, [open, agentId, room, fetchConnectionDetails])

  const handleEndCall = () => {
    if (roomRef.current) {
      roomRef.current.disconnect()
      setIsConnected(false)
    }
    onClose()
  }

  const startCall = async () => {
    try {
      setCallState("connecting")
      setError(null)

      console.log("🚀 Starting voice call...")

      // Generate unique room name
      const newRoomName = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setRoomName(newRoomName)

      // Start backend agent
      console.log("🤖 Starting backend agent...")

      const agentRequest = {
        assistantId: agentId,
        roomName: newRoomName,
        sessionType: "voice" as const,
      }

      const agentResponse = await agentService.startAgent(agentRequest)
      console.log("✅ Backend agent started:", agentResponse)

      // Request microphone access
      console.log("🎤 Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      })

      audioStreamRef.current = stream
      console.log("✅ Microphone access granted")

      // Set up audio context for volume monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateVolume = () => {
        if (callState !== "ended" && audioContextRef.current) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setVolume(average)

          if (average > 15) {
            setIsUserSpeaking(true)
          } else {
            setIsUserSpeaking(false)
          }

          requestAnimationFrame(updateVolume)
        }
      }
      updateVolume()

      // Connect to LiveKit room
      console.log("🔗 Connecting to LiveKit room...")
      const liveKitRoom = new Room({
        publishDefaults: {
          audioPreset: {
            maxBitrate: 64000,
          },
        },
        audioSettings: {
          autoGainControl: true,
          noiseSuppression: true,
          echoCancellation: true,
        },
      })

      roomRef.current = liveKitRoom
      setRoom(liveKitRoom)

      // Room events
      liveKitRoom.on(RoomEvent.Connected, () => {
        console.log("🔗 Connected to LiveKit room")
        setIsConnected(true)
        setCallState("connected")
        callStartTimeRef.current = Date.now()
      })

      liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("👤 Participant connected:", participant.identity)

        if (participant.identity.includes("agent")) {
          console.log("🤖 AI Agent joined the voice call!")
          setAgentConnected(true)

          setTimeout(() => {
            setTranscript(`${agentName}: Hello! I'm ready to talk with you. How can I help you today?`)
          }, 1000)
        }
      })

      // Connect to room
      if (!agentResponse.livekitUrl || !agentResponse.token) {
        throw new Error("Missing LiveKit credentials from backend")
      }

      await liveKitRoom.connect(agentResponse.livekitUrl, agentResponse.token)
      console.log("✅ Successfully connected to LiveKit room")

      // Enable local audio
      try {
        await liveKitRoom.localParticipant.enableCameraAndMicrophone(false, true)
        console.log("🎤 Local microphone enabled")
      } catch (micError) {
        console.warn("⚠️ Microphone setup failed:", micError)
        setError("Microphone setup failed, but connection established")
      }

      setCallState("listening")
    } catch (error) {
      console.error("❌ Voice call error:", error)
      setError(error instanceof Error ? error.message : "Failed to start voice call")
      setCallState("idle")

      // Cleanup on error
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }

  const stopCall = async () => {
    console.log("🛑 Stopping voice call...")
    setCallState("ended")

    try {
      // Stop backend agent
      if (roomName && agentId) {
        console.log("🤖 Stopping backend agent...")
        await agentService.stopAgent(roomName, agentId)
      }
    } catch (error) {
      console.warn("⚠️ Failed to stop backend agent:", error)
    }

    // Disconnect from LiveKit room
    if (roomRef.current) {
      console.log("🔌 Disconnecting from LiveKit room...")
      roomRef.current.disconnect()
      roomRef.current = null
    }

    // Stop media streams
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setRoom(null)
    setIsConnected(false)
    setAgentConnected(false)
    setIsAgentSpeaking(false)
    setIsUserSpeaking(false)
    setVolume(0)

    // Close modal after 2 seconds
    setTimeout(() => {
      setCallState("idle")
      setCallDuration(0)
      setTranscript("")
      setError(null)
      setRoomName("")
      onClose()
    }, 2000)
  }

  const toggleMute = () => {
    if (room && room.localParticipant) {
      const audioTrack = room.localParticipant.getTrackBySource(Track.Source.Microphone)
      if (audioTrack) {
        if (audioTrack.isMuted) {
          audioTrack.unmute()
          setIsMuted(false)
          console.log("🔊 Microphone unmuted")
        } else {
          audioTrack.mute()
          setIsMuted(true)
          console.log("🔇 Microphone muted")
        }
      }
    }
  }

  // Dynamic call state based on voice activity
  useEffect(() => {
    if (isConnected && agentConnected) {
      if (isUserSpeaking && !isAgentSpeaking) {
        setCallState("speaking")
      } else if (!isUserSpeaking && isAgentSpeaking) {
        setCallState("listening")
      } else if (!isUserSpeaking && !isAgentSpeaking) {
        setCallState("connected")
      }
    }
  }, [isUserSpeaking, isAgentSpeaking, isConnected, agentConnected])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-all duration-300"
        onClick={() => callState === "idle" && onClose()}
      />

      {/* Modal */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 p-6 text-white shadow-lg">
          <button
            onClick={onClose}
            disabled={callState !== "idle" && callState !== "ended"}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                🎤
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-200 ${
                  agentConnected && isConnected
                    ? "bg-green-400 animate-pulse"
                    : isConnected
                      ? "bg-yellow-400 animate-pulse"
                      : callState === "connecting"
                        ? "bg-orange-400 animate-pulse"
                        : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div>
              <h2 className="text-lg font-bold truncate">{agentName}</h2>
              <p className="text-sm opacity-90">
                {callState === "idle" && "Ready to call"}
                {callState === "connecting" && "Connecting..."}
                {callState === "connected" && (agentConnected ? "Connected" : "Waiting for AI...")}
                {callState === "speaking" && "You're speaking"}
                {callState === "listening" && "AI is speaking"}
                {callState === "ended" && "Call ended"}
              </p>
            </div>
          </div>

          {(callState === "connected" || callState === "speaking" || callState === "listening") && (
            <div className="text-right">
              <div className="text-lg font-mono font-semibold">{formatDuration(callDuration)}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-purple-50 to-white dark:from-slate-800 dark:to-slate-900">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {(callState === "connecting" || (isConnected && !agentConnected)) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-blue-700 dark:text-blue-300 text-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{!isConnected ? "Connecting to voice service..." : "Waiting for AI agent to join..."}</span>
              </div>
            </div>
          )}

          {/* Voice Visualization */}
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              {/* Agent Avatar */}
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center text-5xl transition-all duration-500 shadow-lg ${
                  isAgentSpeaking ? "scale-110 shadow-2xl" : ""
                }`}
              >
                🤖
              </div>

              {/* Speaking Animation Rings */}
              {isAgentSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400 dark:border-purple-500 animate-ping opacity-75"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-blue-400 dark:border-blue-500 animate-ping opacity-50"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </>
              )}

              {/* Connection indicator */}
              {agentConnected && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  ✓
                </div>
              )}

              {/* Volume Indicator */}
              {(callState === "speaking" || callState === "listening") && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-green-400 to-green-500 dark:from-green-500 dark:to-green-400 rounded-full transition-all duration-150"
                        style={{
                          height: volume > i * 15 ? `${Math.min(32, Math.floor(volume / 4) + 8)}px` : "4px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  isUserSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">You</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  isAgentSpeaking
                    ? "bg-blue-500 animate-pulse"
                    : agentConnected
                      ? "bg-blue-300 dark:bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Agent</span>
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Live Transcript</span>
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="space-y-4">
            {callState === "idle" && (
              <button
                onClick={startCall}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Phone className="w-6 h-6" />
                <span>Start Voice Call</span>
              </button>
            )}

            {callState === "connecting" && (
              <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-300 py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Starting AI agent...</span>
              </div>
            )}

            {(callState === "connected" || callState === "speaking" || callState === "listening") && (
              <div className="flex space-x-3">
                <button
                  onClick={toggleMute}
                  className={`flex-1 p-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
                    isMuted
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      : "bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                  }`}
                  title="Toggle Mute"
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Unmute</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Mute</span>
                    </>
                  )}
                </button>
                <button
                  onClick={stopCall}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl font-medium"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>End Call</span>
                </button>
              </div>
            )}

            {callState === "ended" && (
              <div className="text-center py-4">
                <div className="text-gray-600 dark:text-gray-300 mb-2 font-medium">Call ended</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Duration: {formatDuration(callDuration)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
          <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-2">
              <span>Powered by LiveKit</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
