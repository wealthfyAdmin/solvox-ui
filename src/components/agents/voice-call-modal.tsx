"use client"

import { useState, useEffect, useRef } from "react"
import { Room, RoomEvent, RemoteParticipant, Track, ConnectionState } from "livekit-client"

interface VoiceCallModalProps {
  open: boolean
  onClose: () => void
  agentName: string
  agentId: string
}

type CallState = "idle" | "connecting" | "connected" | "speaking" | "listening" | "ended"

interface AgentService {
  startAgent: (request: {
    assistantId: string
    roomName: string
    sessionType: string
  }) => Promise<{
    success: boolean
    message: string
    agentId: string
    agentName: string
    roomName: string
    processId: number
    token: string
    livekitUrl: string
  }>
  stopAgent: (roomName: string, agentId: string) => Promise<void>
}

// Agent service singleton
const agentService: AgentService = {
  async startAgent(request) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/agent/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to start agent')
    }

    return response.json()
  },

  async stopAgent(roomName, agentId) {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/agents/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      credentials: 'include',
      body: JSON.stringify({ roomName, agentId })
    })
  }
}

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
  
  // LiveKit integration
  const [room, setRoom] = useState<Room | null>(null)
  const [roomName, setRoomName] = useState<string>("")
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const roomRef = useRef<Room | null>(null)

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
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

 const startCall = async () => {
  try {
    setCallState("connecting")
    setError(null)
    
    console.log('🚀 Starting voice call with backend agent...')
    console.log('🎯 Agent ID:', agentId)
    console.log('🏷️ Agent Name:', agentName)

    // Generate unique room name
    const newRoomName = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setRoomName(newRoomName)
    console.log('🏠 Room Name:', newRoomName)

    // **STEP 1: Start backend agent first**
    console.log('🤖 Starting backend agent...')
    
    const agentRequest = {
      assistantId: agentId,           // This should match an agent name in your database
      roomName: newRoomName,
      sessionType: 'voice' as const
    }
    
    console.log('📋 Agent Request:', agentRequest)
    
    try {
      const agentResponse = await agentService.startAgent(agentRequest)
      console.log('✅ Backend agent started:', agentResponse)
      
      // **STEP 2: Check if we got LiveKit credentials**
      if (!agentResponse.token || !agentResponse.livekitUrl) {
        console.warn('⚠️ No LiveKit credentials returned, using legacy token creation...')
        
        // Fallback: create token manually (you might need this)
        const tokenResponse = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: newRoomName,
            participantName: `user-${Date.now()}`,
            assistantId: agentId
          })
        })
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          agentResponse.token = tokenData.token
          agentResponse.livekitUrl = tokenData.url
        }
      }

      console.log('🔗 Connecting to LiveKit with:', {
        url: agentResponse.livekitUrl,
        hasToken: !!agentResponse.token,
        roomName: newRoomName
      })

      // **STEP 3: Request microphone access**
      console.log('🎤 Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      })
      
      audioStreamRef.current = stream
      console.log('✅ Microphone access granted')
      
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

      // **STEP 4: Connect to LiveKit room**
      console.log('🔗 Connecting to LiveKit room...')
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

      // Room events (your existing event handlers)
      liveKitRoom.on(RoomEvent.Connected, () => {
        console.log('🔗 Connected to LiveKit room')
        setIsConnected(true)
        setCallState("connected")
        callStartTimeRef.current = Date.now()
      })

      liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connected:', participant.identity)
        
        if (participant.identity.includes('agent')) {
          console.log('🤖 AI Agent joined the voice call!')
          setAgentConnected(true)
          
          setTimeout(() => {
            setTranscript(`${agentName}: Hello! I'm ready to talk with you. How can I help you today?`)
          }, 1000)
        }
      })

      // Add more event handlers as needed...

      // **STEP 5: Connect to room**
      if (!agentResponse.livekitUrl || !agentResponse.token) {
        throw new Error('Missing LiveKit credentials from backend')
      }

      await liveKitRoom.connect(agentResponse.livekitUrl, agentResponse.token)
      console.log('✅ Successfully connected to LiveKit room')

      // Enable local audio
      try {
        await liveKitRoom.localParticipant.enableCameraAndMicrophone(false, true)
        console.log('🎤 Local microphone enabled')
      } catch (micError) {
        console.warn('⚠️ Microphone setup failed:', micError)
        setError("Microphone setup failed, but connection established")
      }

      setCallState("listening")

    } catch (agentError) {
      console.error('❌ Agent start failed:', agentError)
      throw agentError
    }

  } catch (error) {
    console.error('❌ Voice call error:', error)
    setError(error instanceof Error ? error.message : 'Failed to start voice call')
    setCallState("idle")
    
    // Cleanup on error
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }
}

  const stopCall = async () => {
    console.log('🛑 Stopping voice call...')
    setCallState("ended")
    
    try {
      // Stop backend agent
      if (roomName && agentId) {
        console.log('🤖 Stopping backend agent...')
        await agentService.stopAgent(roomName, agentId)
      }
    } catch (error) {
      console.warn('⚠️ Failed to stop backend agent:', error)
    }
    
    // Disconnect from LiveKit room
    if (roomRef.current) {
      console.log('🔌 Disconnecting from LiveKit room...')
      roomRef.current.disconnect()
      roomRef.current = null
    }
    
    // Stop media streams
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
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
          console.log('🔊 Microphone unmuted')
        } else {
          audioTrack.mute()
          console.log('🔇 Microphone muted')
        }
      }
    }
  }

  // **ENHANCED: Dynamic call state based on voice activity**
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
      {/* Backdrop with Blur */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Right Side Drawer */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
        open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* **ENHANCED: Header with connection status** */}
          <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white shadow-lg">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
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
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  agentConnected && isConnected 
                    ? 'bg-green-400 animate-pulse' 
                    : isConnected
                    ? 'bg-yellow-400 animate-pulse' 
                    : callState === "connecting" 
                    ? 'bg-orange-400 animate-pulse' 
                    : 'bg-gray-400'
                } transition-colors duration-200`}></div>
              </div>
              <div>
                <h2 className="text-xl font-bold truncate">{agentName}</h2>
                <p className="text-sm opacity-90">
                  {callState === "idle" && "Ready to call"}
                  {callState === "connecting" && "Connecting..."}
                  {callState === "connected" && (agentConnected ? "Connected with AI" : "Waiting for AI...")}
                  {callState === "speaking" && "You're speaking"}
                  {callState === "listening" && "AI is speaking"}
                  {callState === "ended" && "Call ended"}
                </p>
              </div>
            </div>
            
            {(callState === "connected" || callState === "speaking" || callState === "listening") && (
              <div className="text-right">
                <div className="text-lg font-mono">{formatDuration(callDuration)}</div>
                <div className="text-xs opacity-75">
                  Room: {roomName.split('-')[1]}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {/* **ENHANCED: Error Display** */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* **ENHANCED: Connection Status** */}
            {(callState === "connecting" || (isConnected && !agentConnected)) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-blue-700 dark:text-blue-300 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>
                    {!isConnected ? "Connecting to voice service..." : "Waiting for AI agent to join..."}
                  </span>
                </div>
              </div>
            )}

            {/* Voice Visualization */}
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                {/* Agent Avatar */}
                <div className={`w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-5xl transition-all duration-500 shadow-lg ${
                  isAgentSpeaking ? 'scale-110 shadow-2xl' : ''
                }`}>
                  🤖
                </div>
                
                {/* Speaking Animation Rings */}
                {isAgentSpeaking && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-75"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                  </>
                )}
                
                {/* **ENHANCED: Connection indicator** */}
                {agentConnected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    AI
                  </div>
                )}
                
                {/* Volume Indicator */}
                {(callState === "speaking" || callState === "listening") && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex space-x-1">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 bg-gradient-to-t from-green-400 to-green-500 rounded-full transition-all duration-150 ${
                            volume > (i * 15) ? `h-${Math.min(8, Math.floor(volume / 15) + 2)}` : 'h-1'
                          }`}
                          style={{
                            height: volume > (i * 15) ? `${Math.min(32, Math.floor(volume / 4) + 8)}px` : '4px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* **ENHANCED: Status Indicators** */}
            <div className="flex justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  isUserSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'
                }`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">You</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  isAgentSpeaking ? 'bg-blue-500 animate-pulse' : agentConnected ? 'bg-blue-300' : 'bg-gray-300 dark:bg-gray-600'
                }`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Agent</span>
              </div>
            </div>

            {/* **ENHANCED: Transcript** */}
            {transcript && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Live Transcript</h4>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </div>
              </div>
            )}

            {/* **ENHANCED: Call Controls** */}
            <div className="space-y-4">
              {callState === "idle" && (
                <button
                  onClick={startCall}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Start AI Voice Call</span>
                </button>
              )}

              {callState === "connecting" && (
                <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-300 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                  <span className="font-medium">Starting AI agent...</span>
                </div>
              )}

              {(callState === "connected" || callState === "speaking" || callState === "listening") && (
                <div className="flex space-x-3">
                  <button
                    onClick={toggleMute}
                    className={`flex-1 p-4 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                      room?.localParticipant.getTrackBySource(Track.Source.Microphone)?.isMuted
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Toggle Mute"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        room?.localParticipant.getTrackBySource(Track.Source.Microphone)?.isMuted
                          ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      } />
                    </svg>
                    <span>{room?.localParticipant.getTrackBySource(Track.Source.Microphone)?.isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                  <button
                    onClick={stopCall}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
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

          {/* **ENHANCED: Footer with LiveKit branding** */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-2">
                <span>🚀</span>
                <span>Powered by LiveKit AI Agent</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
