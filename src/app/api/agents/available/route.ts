import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from "session" cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('session')?.value;

    console.log('🔍 Fetching agents, auth token present:', !!authToken);

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user info first to determine organization
    const backendUrl = process.env.NEXT_PUBLIC_PYTHON_NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
    
    // Get current user info to get organization_id
    let organizationId = null;
    try {
      console.log('🔍 Getting user info for organization...');
      const userResponse = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        organizationId = userData.organization_id;
        console.log('✅ User organization ID:', organizationId);
      } else {
        console.log('⚠️ Could not get user info, proceeding without organization filter');
      }
    } catch (userError) {
      console.log('⚠️ Error getting user info:', userError);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (organizationId) {
      queryParams.append('organization_id', organizationId.toString());
    }
    queryParams.append('is_active', 'true'); // Only active agents

    const agentsUrl = `${backendUrl}/api/agent/?${queryParams.toString()}`;
    console.log('🔍 Calling backend:', agentsUrl);

    const backendResponse = await fetch(agentsUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.log('❌ Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch agents' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('✅ Agents fetched:', data.length, 'agents for organization:', organizationId);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
