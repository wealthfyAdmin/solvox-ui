import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

async function getAuthHeaders(req: NextRequest) {
  // Try multiple ways to get the token
  const authHeader = req.headers.get('authorization')
  const cookieToken = req.cookies.get('access_token')?.value
  
  let token = null
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
  } else if (cookieToken) {
    token = `Bearer ${cookieToken}`
  }

  console.log('Auth token found:', token ? 'Yes' : 'No')
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token }),
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching user from backend...')
    
    const headers = await getAuthHeaders(req)
    console.log('Request headers:', headers)
    
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers,
    })
    
    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await response.json()
    console.log('User data received:', userData)
    
    return NextResponse.json({ user: userData })
    
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
