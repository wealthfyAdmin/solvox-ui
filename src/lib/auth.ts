import { cookies } from "next/headers"

/**
 * Get the authorization headers for API requests
 * This function should be used in server components and API routes
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  const tokenType = cookieStore.get("token_type")?.value || "Bearer"

  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `${tokenType} ${accessToken}`,
    "Content-Type": "application/json",
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  return !!accessToken
}

/**
 * Get access token (for server-side use only)
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value || null
}
