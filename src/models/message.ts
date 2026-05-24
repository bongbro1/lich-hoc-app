export type MessageType = 'text' | 'image' | 'call' | 'system';
export type CallType = 'audio' | 'video' | null;

export interface MessageModel {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId?: string;
  text?: string | null;
  images?: string[] | null;
  messageType: MessageType;
  callType?: CallType;
  callId?: string | null;
  callDuration?: number | null;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}