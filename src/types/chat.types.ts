export type MessageType = "text" | "image" | "call";
export type CallType = "audio" | "video";

export type ConversationId = string;
export type UserId = string;
export type MessageId = string;

export type ChatParticipant = {
  studentId: string;
  name: string;
  avatar?: string | null;
  className?: string;
  distance?: number;
  online?: boolean;
};

export type Message = {
  id: MessageId;
  conversationId: ConversationId;

  senderId: UserId;
  receiverId?: UserId;

  messageType: MessageType;

  text?: string;
  images?: string[];

  timestamp: string;

  pending?: boolean;
  seen?: boolean;
  seenBy?: UserId[];

  callType?: CallType;
  callId?: string;
  duration?: number;
};

export type Conversation = {
  id: ConversationId;

  memberIds: UserId[];
  members: ChatParticipant[];

  user: ChatParticipant; // user còn lại để UI render nhanh

  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageSenderId?: UserId;

  timestamp: string;

  unreadCount: number;
  hasUnread: boolean;
};

export type ConversationDoc = {
  id: string;
  memberIds: UserId[];
  members: ChatParticipant[];

  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageSenderId?: UserId;

  timestamp: string;

  unreadCounts?: Record<UserId, number>;
};

export type SendMessagePayload = {
  conversationId: ConversationId;
  senderId: UserId;
  receiverId?: UserId;

  messageType: MessageType;
  text?: string;
  images?: string[];

  callType?: CallType;
  callId?: string;
  duration?: number;
};

export type CreateConversationPayload = {
  memberIds: UserId[];
  members: ChatParticipant[];
};