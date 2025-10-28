"use client"

import { useState, useCallback } from "react"

export type ConnectionDetails = {
  serverUrl: string
  roomName: string
  participantName: string
  participantToken: string
}

export function useConnectionDetails() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConnectionDetails = useCallback(async (agentId: string) => {
    if (!agentId) {
      setError("No agent ID provided")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/connection-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get connection details: ${response.statusText}`)
      }

      const data = await response.json()
      setConnectionDetails(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setConnectionDetails(null)
    setError(null)
  }, [])

  return {
    connectionDetails,
    isLoading,
    error,
    fetchConnectionDetails,
    reset,
  }
}
