import { NextRequest, NextResponse } from "next/server"
import { AccessToken, SipClient } from "livekit-server-sdk"

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, participantName } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: "LiveKit configuration missing." },
        { status: 500 }
      )
    }

    const roomName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const participantIdentity = `caller-${Date.now()}`
    
    console.log('🚀 Creating outbound call with corrected SDK usage:', {
      phoneNumber,
      roomName,
      participantIdentity,
      sipTrunkId: process.env.LIVEKIT_SIP_TRUNK_ID
    })

    try {
      // **CORRECTED: Use proper LiveKit Server SDK method signature**
      const sipClient = new SipClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!
      )

      // The correct method signature from LiveKit docs:
      // createSipParticipant(trunkId, phoneNumber, roomName, options)
      const sipParticipant = await sipClient.createSipParticipant(
        process.env.LIVEKIT_SIP_TRUNK_ID!,  // trunkId (first parameter)
        phoneNumber,                         // phoneNumber (second parameter)
        roomName,                           // roomName (third parameter)
        {
          // Options object (fourth parameter)
          participantIdentity: `sip-${participantIdentity}`,
          participantName: participantName || "Web Caller",
          dtmf: "",
          playDialtone: false,
          hidePhoneNumber: false,
          krispEnabled: true,
          waitUntilAnswered: false,
          ringingTimeout: 30000,  // 30 seconds in milliseconds
          maxCallDuration: 300000 // 5 minutes in milliseconds
        }
      )

      console.log('✅ SIP participant created with corrected SDK:', sipParticipant)

      // Generate room token for the web client
      const userToken = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        {
          identity: participantIdentity,
          name: participantName || "Web Caller",
        }
      )

      userToken.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      })

      const jwt = await userToken.toJwt()

      const result = {
        success: true,
        roomName,
        token: jwt,
        participantIdentity,
        sipParticipantId: sipParticipant.sipParticipantId,
        livekitUrl: process.env.LIVEKIT_URL!,
        callStatus: 'initiated',
        phoneNumber: phoneNumber,
        sipData: sipParticipant
      }

      console.log('🎉 SDK call setup completed successfully:', result)
      return NextResponse.json(result)

    } catch (sipError) {
      console.error('❌ SIP SDK Error:', sipError)
      
      // Provide more specific error messages
      let errorMessage = "Failed to create SIP call"
      if (sipError instanceof Error) {
        if (sipError.message.includes('trunk')) {
          errorMessage = "SIP trunk configuration error. Please verify your trunk ID and settings."
        } else if (sipError.message.includes('permission') || sipError.message.includes('unauthorized')) {
          errorMessage = "Permission denied. Please check your API key has SIP permissions."
        } else if (sipError.message.includes('number') || sipError.message.includes('invalid')) {
          errorMessage = "Invalid phone number format. Please check the number."
        } else if (sipError.message.includes('encode')) {
          errorMessage = "API parameter error. Please check SIP configuration."
        } else {
          errorMessage = sipError.message
        }
      }

      console.error('Detailed SIP error:', {
        name: sipError instanceof Error ? sipError.name : 'Unknown',
        message: sipError instanceof Error ? sipError.message : String(sipError),
        stack: sipError instanceof Error ? sipError.stack : undefined
      })

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: sipError instanceof Error ? sipError.message : String(sipError),
          sipTrunkId: process.env.LIVEKIT_SIP_TRUNK_ID
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Error creating outbound call:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create outbound call"
      },
      { status: 500 }
    )
  }
}
