import { SipClient } from "livekit-server-sdk"

export const sipClient = new SipClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
)

export interface OutboundCallOptions {
  phoneNumber: string
  participantName?: string
  dtmfEnabled?: boolean
  krisp?: boolean
  waitUntilAnswered?: boolean
}

export interface CallSession {
  roomName: string
  sipParticipantId: string
  participantIdentity: string
  token: string
}

export class LiveKitSIPManager {
  private sipClient: SipClient

  constructor() {
    this.sipClient = new SipClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    )
  }

  async createOutboundCall(options: OutboundCallOptions): Promise<CallSession> {
    const { phoneNumber, participantName = "Web Caller", dtmfEnabled = true, krisp = true, waitUntilAnswered = false } = options
    
    const roomName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const participantIdentity = `caller-${Date.now()}`

    // Create SIP participant
    const sipParticipant = await this.sipClient.createSipParticipant(
      process.env.LIVEKIT_SIP_TRUNK_ID!,
      phoneNumber,
      roomName,
      {
        participantIdentity: `sip-${participantIdentity}`,
        participantName,
        dtmfEnabled,
        krisp,
        waitUntilAnswered,
      }
    )

    // Generate room token
    const { AccessToken } = await import("livekit-server-sdk")
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: participantIdentity,
        name: participantName,
      }
    )

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    return {
      roomName,
      sipParticipantId: sipParticipant.sipParticipantId,
      participantIdentity,
      token: token.toJwt(),
    }
  }

  async endCall(sipParticipantId: string): Promise<void> {
    await this.sipClient.deleteSipParticipant(sipParticipantId)
  }

  async getSipParticipants(): Promise<any[]> {
    const participants = await this.sipClient.listSipParticipant()
    return participants
  }
}

export const livekitSIP = new LiveKitSIPManager()
