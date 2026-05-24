import { MessageModel } from './message';
import { UserProfileModel } from './user';

export interface ConversationModel {
  id: string;
  user1Id: string;
  user2Id: string;

  lastMessageId?: string | null;
  lastMessageSenderId?: string | null;
  updatedAt: string;

  unreadCountUser1: number;
  unreadCountUser2: number;

  user1?: UserProfileModel;
  user2?: UserProfileModel;
  lastMessage?: MessageModel | null;
}

export interface ConversationItemModel {
  id: string;
  peerUser: UserProfileModel;
  lastMessageText?: string | null;
  lastMessageType?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  isLastMessageFromMe: boolean;
}