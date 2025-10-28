"use client"

import { X } from "@phosphor-icons/react"

interface VideoStateProps {
  agentName: string
  onStartChat: () => void
  onClose: () => void
  videoUrl?: string
}

export default function VideoState({ agentName, onStartChat, onClose, videoUrl }: VideoStateProps) {
  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center">
      {/* Video Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src={videoUrl || "/placeholder-video.mp4"} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-white" weight="bold" />
      </button>

      {/* Content */}
      <div className="relative z-5 flex flex-col items-center justify-center h-full space-y-6 px-4">
        {/* Agent Name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{agentName}</h2>
          <p className="text-sm text-gray-200">Ready to assist you</p>
        </div>

        {/* Start Chat Button */}
        <button
          onClick={onStartChat}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg"
        >
          Talk to {agentName}
        </button>
      </div>
    </div>
  )
}
