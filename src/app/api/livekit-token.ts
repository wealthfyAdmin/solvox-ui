import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, participantName, assistantId, assistantName } = body;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '2h', // Token expires in 2 hours
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Log session creation
    console.log(`Created token for assistant session:`, {
      assistantId,
      assistantName,
      roomName,
      participantName,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      token: token.toJwt(),
      roomName,
      participantName,
      assistantId,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    });

  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}+
1

