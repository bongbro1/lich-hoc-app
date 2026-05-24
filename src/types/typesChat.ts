// types.ts

import { Conversation } from "./chat.types";


export type CallUser = {
  studentId: string;
  name: string;
  avatar: string;
};


export interface AgoraTokenResponse {
  token: string;
  channel: string;
  uid: number;
  expireAt: number;
}

export type Friend_Near = {
  studentId: string;
  name: string;
  className: string;
  distance: string;
  avatar: string;
  online: boolean;
  onlineStatus?: string;
};

export const sortConversations = (list: Conversation[]): Conversation[] => {
  return [...list].sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    return tB - tA;
  });
};


export const increaseUnread = (conv: Conversation): Conversation => {
  const unread = (conv.unreadCount ?? 0) + 1;
  return {
    ...conv,
    unreadCount: unread,
    hasUnread: unread > 0,
  };
};