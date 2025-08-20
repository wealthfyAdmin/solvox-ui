import { NextRequest, NextResponse } from 'next/server';

// In-memory session storage (use Redis or database in production)
const activeSessions = new Map<string, {
  sessionId: string;
  assistantId: string;
  participantName: string;
  roomName: string;
  createdAt: Date;
  lastActivity: Date;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assistantId, roomName, participantName, sessionId } = body;

    if (!assistantId || !roomName || !participantName || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = {
      sessionId,
      assistantId,
      participantName,
      roomName,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    activeSessions.set(sessionId, session);

    console.log(`Started assistant session:`, session);

    // Initialize the AI assistant for this room
    await initializeAssistantForRoom(assistantId, roomName);

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        roomName,
        assistantId,
        createdAt: session.createdAt,
      },
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
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    activeSessions.delete(sessionId);

    // Clean up AI assistant resources
    await cleanupAssistantSession(session.assistantId, session.roomName);

    console.log(`Ended assistant session:`, sessionId);

    return NextResponse.json({ success: true });

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
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (sessionId) {
      const session = activeSessions.get(sessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    // Return all active sessions
    const sessions = Array.from(activeSessions.values());
    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Helper functions for AI assistant integration
async function initializeAssistantForRoom(assistantId: string, roomName: string) {
  try {
    const assistantConfig = getAssistantConfig(assistantId);
    console.log(`Initialized assistant ${assistantId} for room ${roomName}`, assistantConfig);
    
    // Here you would start your AI assistant connection
    // For now, we'll just log it
    
  } catch (error) {
    console.error(`Failed to initialize assistant ${assistantId}:`, error);
    // Don't throw - we want the session to be created even if AI init fails
  }
}

async function cleanupAssistantSession(assistantId: string, roomName: string) {
  try {
    console.log(`Cleaned up assistant ${assistantId} from room ${roomName}`);
  } catch (error) {
    console.error(`Failed to cleanup assistant ${assistantId}:`, error);
  }
}

function getAssistantConfig(assistantId: string) {
  const configs = {
    'lumiverse-whistleblower': {
      systemPrompt: 'You are a confidential whistleblower platform assistant. Help users report workplace concerns safely and anonymously.',
      model: 'gpt-4',
      temperature: 0.7,
      features: ['anonymous-reporting', 'document-upload', 'secure-communication']
    }
  };

  return configs[assistantId as keyof typeof configs] || configs["lumiverse-whistleblower"];

}