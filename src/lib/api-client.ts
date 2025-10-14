import { getAuthHeaders } from "./auth"

/**
 * Authenticated fetch wrapper for server-side API calls
 * Automatically includes authorization headers
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  }

  return fetch(url, mergedOptions)
}

/**
 * Client-side authenticated fetch
 * Use this in client components by calling your own API routes
 */
export async function clientAuthenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // For client-side, we'll create API routes that handle authentication
  // The cookies will be automatically sent with the request
  return fetch(url, {
    ...options,
    credentials: "include", // Ensure cookies are sent
  })
}
