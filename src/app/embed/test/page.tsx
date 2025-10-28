"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function WidgetTestPage() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get("agentId")

  useEffect(() => {
    if (agentId) {
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.async = true
      script.src = `${window.location.origin}/embed.js`
      script.setAttribute("data-agent-id", agentId)
      script.setAttribute("crossorigin", "*")
      document.body.appendChild(script)
    }
  }, [agentId])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden z-0">
      {/* --- Logo Section --- */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <img
          src="/images/logo/light-logo.png"
          alt="Lumiverse Solutions Logo"
          className="w-28 h-auto mx-auto drop-shadow-md sm:w-36"
        />
<p className="text-white/70 text-sm italic mt-1">Voice Agent Widget Demo</p>
      </div>

      {/* --- Centered Instruction and Fancy Arrow --- */}
      <div className="relative flex flex-col items-center justify-center text-center animate-zoomIn">
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-gray-200 max-w-md">
          <p className="text-2xl sm:text-3xl font-semibold text-gray-800 italic mb-2">
            Talk to <span className="text-indigo-600">Anamika</span>
          </p>
          <p className="text-sm sm:text-base text-gray-600">
            Click the chat bubble below to start the conversation 👇
          </p>
        </div>

        {/* --- Curved Fancy Arrow pointing to bottom-right --- */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 300 200"
          className="w-72 h-60 sm:w-96 sm:h-72 mt-6 text-indigo-500 animate-float"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          {/* curved line */}
          <path
            d="M10 10 C 150 150, 220 170, 290 190"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* arrowhead */}
          <path
            d="M270 175 L290 190 L270 200"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style jsx global>{`
        /* Ensure widget stays on top */
        #voice-agent-widget,
        #voice-agent-button,
        #voice-agent-toggle-button {
          z-index: 999999 !important;
          position: fixed !important;
        }

        /* Animation: zoom in from far */
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(50px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-zoomIn {
          animation: zoomIn 1.2s ease-out forwards;
        }

        /* Smooth float for arrow */
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(5px);
          }
        }
        .animate-float {
          animation: float 2s infinite ease-in-out;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .max-w-md {
            max-width: 90%;
          }
          svg {
            width: 80% !important;
            height: auto !important;
          }
        }

        @media (max-width: 480px) {
          p.text-2xl {
            font-size: 1.25rem;
          }
          .w-72 {
            width: 200px !important;
          }
        }
      `}</style>
    </div>
  )
}
