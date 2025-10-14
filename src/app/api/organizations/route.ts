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

  console.log('Organizations API - Auth token found:', token ? 'Yes' : 'No')
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token }),
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching organizations from backend...')
    
    const headers = await getAuthHeaders(req)
    
    // Use trailing slash to avoid redirect
    const response = await fetch(`${BACKEND_URL}/api/organization/`, {
      headers,
    })
    
    console.log('Organizations backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Organizations backend error:', errorText)
      return NextResponse.json({ organizations: [] })
    }

    const backendOrganizations = await response.json()
    console.log('Organizations data received:', backendOrganizations)
    
    // Map backend response to frontend format
    const organizations = backendOrganizations.map((org: any) => ({
      id: org.id.toString(),
      name: org.name,
      description: org.description,
      created_at: org.created_at,
      updated_at: org.updated_at
    }))
    
    return NextResponse.json({ organizations })
    
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ organizations: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating organization:', body)
    
    const headers = await getAuthHeaders(req)
    
    const organizationData = {
      name: body.name,
      description: body.description || null
    }
    
    // Use trailing slash to avoid redirect
    const response = await fetch(`${BACKEND_URL}/api/organization/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(organizationData),
    })

    console.log('Create organization response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create organization backend error:', errorText)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: response.status })
    }

    const createdOrganization = await response.json()
    console.log('Organization created:', createdOrganization)
    
    const organization = {
      id: createdOrganization.id.toString(),
      name: createdOrganization.name,
      description: createdOrganization.description,
      created_at: createdOrganization.created_at,
      updated_at: createdOrganization.updated_at
    }
    
    return NextResponse.json({ organization })
    
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    
    console.log('Deleting organization:', id)
    
    const headers = await getAuthHeaders(req)
    
    const response = await fetch(`${BACKEND_URL}/api/organization/${id}`, {
      method: 'DELETE',
      headers,
    })

    console.log('Delete organization response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Delete organization backend error:', errorText)
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: response.status })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
