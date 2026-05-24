export interface ChatRoomItemModel {
  conversationId: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string | null;

  lastMessageText?: string | null;
  lastMessageType?: string | null;
  lastMessageAt: string;

  unreadCount: number;
  isOnline?: boolean;
}