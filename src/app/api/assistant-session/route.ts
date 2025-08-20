// app/api/assistant-session/route.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory store for active sessions (use Redis or database in production)
const activeSessions = new Map<string, {
  assistantId: string;
  roomName: string;
  participantName: string;
  createdAt: Date;
  status: 'active' | 'ended';
}>();

export async function POST(request: NextRequest) {
  try {
    const { assistantId, roomName, participantName, sessionId } = await request.json();

    if (!assistantId || !roomName || !participantName || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store session information
    activeSessions.set(sessionId, {
      assistantId,
      roomName,
      participantName,
      createdAt: new Date(),
      status: 'active',
    });

    console.log(`Started session ${sessionId} for assistant ${assistantId} in room ${roomName}`);

    // Here you can also trigger your Python LiveKit agent to join the room
    // This could be done via:
    // 1. HTTP request to your Python backend
    // 2. Message queue (Redis pub/sub, RabbitMQ, etc.)
    // 3. Database trigger
    // 4. WebSocket notification
    
    try {
      // Example: Notify Python backend to start agent
      const agentResponse = await fetch(`${process.env.PYTHON_BACKEND_URL}/start-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PYTHON_BACKEND_TOKEN}`, // Optional auth
        },
        body: JSON.stringify({
          roomName,
          assistantId,
          participantName,
          sessionId,
        }),
      });

      if (!agentResponse.ok) {
        console.warn('Failed to notify Python backend about new session');
      } else {
        console.log('Successfully notified Python backend to start agent');
      }
    } catch (agentError) {
      console.warn('Error notifying Python backend:', agentError);
      // Don't fail the session creation if agent notification fails
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session created successfully',
    });

  } catch (error) {
    console.error('Error creating assistant session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = activeSessions.get(sessionId);
    if (session) {
      // Mark session as ended
      session.status = 'ended';
      activeSessions.set(sessionId, session);

      console.log(`Ended session ${sessionId}`);

      // Notify Python backend to stop agent
      try {
        const agentResponse = await fetch(`${process.env.PYTHON_BACKEND_URL}/stop-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PYTHON_BACKEND_TOKEN}`,
          },
          body: JSON.stringify({
            sessionId,
            roomName: session.roomName,
          }),
        });

        if (!agentResponse.ok) {
          console.warn('Failed to notify Python backend about session end');
        }
      } catch (agentError) {
        console.warn('Error notifying Python backend about session end:', agentError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
    });

  } catch (error) {
    console.error('Error ending assistant session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get active sessions (for admin/monitoring purposes)
    const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      ...session,
    }));

    return NextResponse.json({
      sessions: sessions.filter(s => s.status === 'active'),
      total: sessions.length,
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}