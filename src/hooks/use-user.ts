"use client"

import { useEffect, useState } from "react"

interface User {
  id?: string
  name?: string
  email?: string
  role?: string
  avatar?: string
  [key: string]: any
}

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: string | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user data from the secure endpoint
        const response = await fetch("/api/auth/user", {
          credentials: "include", // Include cookies for authentication
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const data = await response.json()

        // Store user data safely in component state (not localStorage for sensitive data)
        setUser(data.user || data)
      } catch (err) {
        console.error("Error fetching user:", err)
        setError(err instanceof Error ? err.message : "Failed to load user")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, error }
}
