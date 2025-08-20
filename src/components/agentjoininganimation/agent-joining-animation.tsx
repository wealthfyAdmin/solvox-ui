"use client"

export default function AgentJoiningAnimation() {
  return (
    <div className="flex flex-col margin-auto h-100 items-center justify-center py-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">AI</span>
        </div>

        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"></div>
        <div
          className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-50"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">Agent is joining...</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we connect you</p>
      </div>

      {/* Loading dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      </div>
    </div>
  )
}
