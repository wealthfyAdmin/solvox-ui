import type { ReceivedChatMessage } from '@livekit/components-react';

export interface ProcessedMessage {
  id: string;
  message: string;
  timestamp: number;
  from: {
    identity: string;
    name?: string;
    isLocal: boolean;
  };
  editTimestamp?: number;
}

/**
 * Process messages in arrival order (DO NOT SORT for live chat)
 */
export function processMessages(
  rawMessages: ReceivedChatMessage[], 
  systemMessages: ReceivedChatMessage[] = []
): ProcessedMessage[] {
  console.log('Processing messages:', { raw: rawMessages.length, system: systemMessages.length });
  
  // Combine all messages in arrival order
  const allRawMessages = [...rawMessages, ...systemMessages];
  
  const seenMessages = new Set<string>();
  const processedMessages: ProcessedMessage[] = [];
  
  allRawMessages.forEach((msg, index) => {
    if (!msg || !msg.message) {
      console.warn(`Skipping invalid message at index ${index}:`, msg);
      return;
    }
    
    // Ensure unique ID
    let uniqueId = msg.id;
    if (!uniqueId || seenMessages.has(uniqueId)) {
      uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    seenMessages.add(uniqueId);
    
    // Process timestamp
    let timestamp: number;
    if (typeof msg.timestamp === 'number') {
      timestamp = msg.timestamp;
    } else if (typeof msg.timestamp === 'string') {
      const parsed = parseInt(msg.timestamp);
      if (!isNaN(parsed)) {
        timestamp = parsed;
      } else {
        const dateTimestamp = new Date(msg.timestamp).getTime();
        timestamp = !isNaN(dateTimestamp) ? dateTimestamp : Date.now();
      }
    } else {
      timestamp = Date.now();
    }
    
    if (timestamp < 1000000000000) {
      timestamp = timestamp * 1000;
    }
    
    const processed: ProcessedMessage = {
      id: uniqueId,
      message: String(msg.message),
      timestamp,
      from: {
        identity: msg.from?.identity || 'unknown',
        name: msg.from?.name,
        isLocal: Boolean(msg.from?.isLocal),
      },
      editTimestamp: msg.editTimestamp,
    };
    
    processedMessages.push(processed);
  });
  
  // DO NOT SORT - return in arrival order for proper conversation flow
  console.log('Processed messages (no sorting):', processedMessages.length);
  return processedMessages;
}

/**
 * Create a system message
 */
export function createSystemMessage(text: string): ReceivedChatMessage {
  const timestamp = Date.now();
  return {
    id: `system-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    message: text,
    timestamp,
    from: {
      identity: 'system',
      name: 'System',
      isLocal: false,
    },
  } as ReceivedChatMessage;
}
