import { useCallback, useEffect, useMemo, useState } from "react";
import { conversationRepo } from "repositories/conversationRepo";
import { UserPresence, userRepo } from "repositories/userRepo";
import { Conversation } from "types/chat.types";

export const useConversationVM = (studentId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  const loadConversations = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const items = await conversationRepo.getConversations(studentId);
      setConversations(items);
    } catch (err) {
      console.log("loadConversations error:", err);
      setError("Không tải được danh sách cuộc trò chuyện");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    conversations.forEach((conversation) => {
      const studentId = conversation.user.studentId;
      if (!studentId) return;

      const unsub = userRepo.listenUserPresence(studentId, (presence) => {
        setPresenceMap((prev) => ({
          ...prev,
          [studentId]: presence,
        }));
      });

      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, [conversations]);

  const conversationsWithPresence = useMemo(() => {
    return conversations.map((item) => ({
      ...item,
      user: {
        ...item.user,
        online: presenceMap[item.user.studentId]?.online ?? false,
      },
    }));
  }, [conversations, presenceMap]);

  const markConversationSeen = useCallback(
    async (conversationId: string) => {
      if (!studentId) return;

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId
            ? { ...item, unreadCount: 0, hasUnread: false }
            : item
        )
      );

      try {
        await conversationRepo.markConversationSeen(
          conversationId,
          studentId
        );
      } catch (err) {
        console.log("markConversationSeen error:", err);
      }
    },
    [studentId]
  );

  const markConversationAsUnread = useCallback(
    async (conversationId: string) => {
      if (!studentId) return;

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId
            ? { ...item, unreadCount: 1, hasUnread: true }
            : item
        )
      );

      try {
        await conversationRepo.markConversationAsUnread(
          conversationId,
          studentId
        );
      } catch (err) {
        console.log("markConversationAsUnread error:", err);
      }
    },
    [studentId]
  );

  const removeConversation = useCallback(async (conversationId: string) => {
    setConversations((prev) =>
      prev.filter((item) => item.id !== conversationId)
    );

    try {
      await conversationRepo.removeConversation(conversationId);
      return true;
    } catch (err) {
      console.log("removeConversation error:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!studentId) return;

    const unsubscribe = conversationRepo.subscribeConversations(
      studentId,
      (items) => {
        setConversations(items);
      }
    );

    return unsubscribe;
  }, [studentId]);

  return {
    conversations: conversationsWithPresence,
    loading,
    error,
    loadConversations,
    markConversationSeen,
    markConversationAsUnread,
    removeConversation,
  };
};