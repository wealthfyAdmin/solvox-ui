import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, assistantName } = await request.json();
    
    // Call Python backend with lk dispatch
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL;
    
    const response = await fetch(`${pythonBackendUrl}/api/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        assistantName: assistantName || "outbound-caller"
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        phoneNumber: result.phone_number,
        agentName: result.agent_name
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.detail },
        { status: 500 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
