// app/api/livekit-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, assistantId, assistantName } = await request.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      );
    }

    // Get environment variables
    const livekitUrl = process.env.LIVEKIT_URL;
    const livekitApiKey = process.env.LIVEKIT_API_KEY;
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      console.error('Missing LiveKit environment variables');
      return NextResponse.json(
        { error: 'LiveKit configuration is missing' },
        { status: 500 }
      );
    }

    // Create access token
    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantName,
      name: participantName,
    });

    // Grant permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    console.log(`Created token for participant ${participantName} in room ${roomName}`);

    return NextResponse.json({
      token: await token.toJwt(),
      url: livekitUrl,
      roomName,
      participantName,
    });

  } catch (error) {
    console.error('Error creating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to create access token' },
      { status: 500 }
    );
  }
}