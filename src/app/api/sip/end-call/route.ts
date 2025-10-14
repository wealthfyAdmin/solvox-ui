import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export async function POST(req: NextRequest) {
  try {
    const { sipParticipantId, roomName, duration, transcription } = await req.json()

    if (!sipParticipantId) {
      return NextResponse.json(
        { error: "SIP participant ID is required" },
        { status: 400 }
      )
    }

    console.log('📞 Ending call:', { sipParticipantId, roomName, duration, transcriptionLength: transcription?.length || 0 })

    // Validate environment variables
    if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      )
    }

    // **NEW: Save transcription if provided**
    if (transcription && transcription.length > 0) {
      try {
        // Here you could save transcription to database
        console.log('💾 Saving call transcription:', transcription)
        
        // Example: Save to database
        // await saveCallTranscription({
        //   sipParticipantId,
        //   roomName,
        //   duration,
        //   transcription,
        //   timestamp: new Date()
        // })
      } catch (transcriptionError) {
        console.warn('⚠️ Failed to save transcription:', transcriptionError)
      }
    }

    // End the SIP participant
    try {
      const adminToken = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        { identity: 'sip-end-call-' + Date.now() }
      )
      
      adminToken.addGrant({
        roomAdmin: true,
        call: true,
      })

      const apiUrl = process.env.LIVEKIT_URL
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')

      const response = await fetch(`${apiUrl}/twirp/livekit.SIP/DeleteSIPParticipant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await adminToken.toJwt()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sip_participant_id: sipParticipantId
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error ending SIP call:', errorText)
      } else {
        console.log('✅ SIP call ended successfully')
      }
    } catch (endCallError) {
      console.warn('⚠️ Failed to end SIP call (might already be ended):', endCallError)
    }

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
      duration,
      transcriptionSaved: !!transcription?.length
    })

  } catch (error) {
    console.error('💥 Error ending call:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to end call" 
      },
      { status: 500 }
    )
  }
}
