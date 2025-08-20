"use client"

import { useEffect, useState, useRef } from "react"

interface WaveAnimationProps {
  isActive: boolean
  className?: string
}

export default function WaveAnimation({ isActive, className = "" }: WaveAnimationProps) {
  const [bars, setBars] = useState<number[]>(Array(5).fill(0))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) {
      setBars(Array(5).fill(0))
      // Clean up audio resources
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      return
    }

    // Initialize audio context and microphone
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateBars = () => {
          if (!analyserRef.current || !isActive) return

          analyserRef.current.getByteFrequencyData(dataArray)

          // Get average volume levels for different frequency ranges
          const chunkSize = Math.floor(dataArray.length / 5)
          const newBars = Array(5)
            .fill(0)
            .map((_, index) => {
              const start = index * chunkSize
              const end = start + chunkSize
              const chunk = dataArray.slice(start, end)
              const average = chunk.reduce((sum, value) => sum + value, 0) / chunk.length

              // Convert to percentage (0-100) with minimum height
              return Math.max(20, (average / 255) * 100)
            })

          setBars(newBars)
          animationFrameRef.current = requestAnimationFrame(updateBars)
        }

        updateBars()
      } catch (error) {
        console.error("Error accessing microphone:", error)
        // Fallback to random animation if microphone access fails
        const interval = setInterval(() => {
          setBars((prev) => prev.map(() => Math.random() * 100 + 20))
        }, 150)

        return () => clearInterval(interval)
      }
    }

    initAudio()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isActive])

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className="bg-blue-500 rounded-full transition-all duration-100 ease-out"
          style={{
            width: "4px",
            height: isActive ? `${height}%` : "20%",
            maxHeight: "40px",
            minHeight: "8px",
          }}
        />
      ))}
    </div>
  )
}
