import { NextResponse } from "next/server"
import { AccessToken, type AccessTokenOptions, type VideoGrant } from "livekit-server-sdk"
import { RoomConfiguration } from "@livekit/protocol"

const API_KEY = process.env.LIVEKIT_API_KEY
const API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.LIVEKIT_URL

export const revalidate = 0

export type ConnectionDetails = {
  serverUrl: string
  roomName: string
  participantName: string
  participantToken: string
}

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL is not defined")
    }
    if (!API_KEY) {
      throw new Error("LIVEKIT_API_KEY is not defined")
    }
    if (!API_SECRET) {
      throw new Error("LIVEKIT_API_SECRET is not defined")
    }

    const body = await req.json()
    const agentId = body?.agentId

    if (!agentId) {
      throw new Error("agentId is required")
    }

    // Generate unique identifiers
    const participantName = "user"
    const participantIdentity = `user_${Math.floor(Math.random() * 10_000)}`
    const roomName = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentId,
    )

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken,
      participantName,
    }

    const headers = new Headers({
      "Cache-Control": "no-store",
    })

    return NextResponse.json(data, { headers })
  } catch (error) {
    console.error("Connection details error:", error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 })
    }
    return new NextResponse("Internal server error", { status: 500 })
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string, agentId: string): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  })

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  }

  at.addGrant(grant)

  // Add agent configuration to room config
  if (agentId) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName: agentId }],
    })
  }

  return at.toJwt()
}
