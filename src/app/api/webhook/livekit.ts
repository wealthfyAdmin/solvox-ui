import { WebhookReceiver } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// Tracks active assistant sessions in memory
const activeSessions = new Map<
  string,
  { sessionId: string; roomName: string; assistantId: string }
>();

// Mock cleanup function (replace with your actual implementation)
async function cleanupAssistantSession(assistantId: string, roomName: string) {
  console.log(`Cleaning up assistant ${assistantId} for room ${roomName}`);
  // Add your actual cleanup logic here
}

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headerAuth = request.headers.get("authorization");

    // Await the promise to get the actual event
    const event = await receiver.receive(body, headerAuth!);

    console.log("LiveKit webhook event:", event);

    // Handle different event types
    switch (event.event) {
      case "room_started":
        console.log(`Room started: ${event.room?.name}`);
        break;

      case "room_finished":
        console.log(`Room finished: ${event.room?.name}`);
        const roomName = event.room?.name;
        if (roomName) {
          const session = Array.from(activeSessions.values()).find(
            (s) => s.roomName === roomName
          );
          if (session) {
            await cleanupAssistantSession(session.assistantId, roomName);
            activeSessions.delete(session.sessionId);
          }
        }
        break;

      case "participant_joined":
        console.log(
          `Participant joined: ${event.participant?.identity} in room ${event.room?.name}`
        );
        break;

      case "participant_left":
        console.log(
          `Participant left: ${event.participant?.identity} from room ${event.room?.name}`
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error handling LiveKit webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
