"use client"

import { useState, useEffect, useRef } from "react"
import { type Room, Track } from "livekit-client"

interface VoiceStateProps {
  room: Room
  agentName: string
  onEndCall: () => void
}

type CallState = "connecting" | "connected" | "speaking" | "listening"

export default function VoiceState({ room, agentName, onEndCall }: VoiceStateProps) {
  const [callState, setCallState] = useState<CallState>("connecting")
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [volume, setVolume] = useState(0)
  const [transcript, setTranscript] = useState("")

  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializeAudio = async () => {
      try {
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

        // Enable microphone in room
        if (room && room.localParticipant) {
          await room.localParticipant.enableCameraAndMicrophone(false, true)
        }

        // Set up audio context for volume monitoring
        audioContextRef.current = new AudioContext()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateVolume = () => {
          if (audioContextRef.current) {
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

        setCallState("connected")
        callStartTimeRef.current = Date.now()
      } catch (error) {
        console.error("[v0] Failed to initialize audio:", error)
      }
    }

    initializeAudio()

    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [room])

  // Update call duration
  useEffect(() => {
    if (callState === "connected" || callState === "speaking" || callState === "listening") {
      intervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callState])

  useEffect(() => {
    if (isUserSpeaking && !isAgentSpeaking) {
      setCallState("speaking")
    } else if (!isUserSpeaking && isAgentSpeaking) {
      setCallState("listening")
    } else if (!isUserSpeaking && !isAgentSpeaking) {
      setCallState("connected")
    }
  }, [isUserSpeaking, isAgentSpeaking])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleMute = () => {
    if (room && room.localParticipant) {
      const audioTrack = room.localParticipant.getTrackBySource(Track.Source.Microphone)
      if (audioTrack) {
        if (audioTrack.isMuted) {
          audioTrack.unmute()
        } else {
          audioTrack.mute()
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Voice Visualization */}
      <div className="flex-1 flex items-center justify-center py-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          {/* Agent Avatar */}
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-5xl transition-all duration-500 shadow-lg ${
              isAgentSpeaking ? "scale-110 shadow-2xl" : ""
            }`}
          >
            🤖
          </div>

          {/* Speaking Animation Rings */}
          {isAgentSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-75"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </>
          )}

          {/* Volume Indicator */}
          {(callState === "speaking" || callState === "listening") && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-green-400 to-green-500 rounded-full transition-all duration-150"
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

      {/* Status and Transcript */}
      <div className="px-4 py-4 space-y-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {/* Call Info */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{agentName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {callState === "connecting" && "Connecting..."}
              {callState === "connected" && "Connected"}
              {callState === "speaking" && "You're speaking"}
              {callState === "listening" && "AI is speaking"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
              {formatDuration(callDuration)}
            </div>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-24 overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-300">{transcript}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex space-x-3">
          <button
            onClick={toggleMute}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors text-sm font-medium"
          >
            {room?.localParticipant.getTrackBySource(Track.Source.Microphone)?.isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={onEndCall}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}
