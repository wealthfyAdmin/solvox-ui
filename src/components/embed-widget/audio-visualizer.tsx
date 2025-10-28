"use client"

import { useEffect, useRef } from "react"
import { useVoiceAssistant } from "@livekit/components-react"

interface AudioVisualizerProps {
  barCount?: number
}

export default function AudioVisualizer({ barCount = 7 }: AudioVisualizerProps) {
  const { state, audioTrack } = useVoiceAssistant()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioTrack || !canvasRef.current) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = "rgb(249, 250, 251)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = canvas.width / barCount
      const barGap = 4

      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * bufferLength)
        const value = dataArray[index]
        const barHeight = (value / 255) * canvas.height

        // Scale animation based on voice level
        const scale = 1 + (value / 255) * 0.5

        const x = i * barWidth + barGap / 2
        const y = (canvas.height - barHeight) / 2

        ctx.fillStyle = "#2563eb"
        ctx.fillRect(x, y, barWidth - barGap, barHeight)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      source.disconnect()
      analyser.disconnect()
    }
  }, [audioTrack, barCount])

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <canvas ref={canvasRef} width={200} height={100} className="rounded-lg bg-gray-50 dark:bg-gray-800" />
      <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
        <div
          className={`w-2 h-2 rounded-full ${
            state === "listening"
              ? "bg-green-500 animate-pulse"
              : state === "thinking"
                ? "bg-yellow-500 animate-pulse"
                : state === "speaking"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-gray-400"
          }`}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {state === "idle" ? "Ready" : state}
        </span>
      </div>
    </div>
  )
}
