import {
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue,
    off,
    query,
    limitToLast,
    orderByChild,
} from "firebase/database";
import { rtdb } from "../configs/firebase";
import { imgbbService } from "./imgbbService";
import { CallType, MessageType } from "types/chat.types";

const now = () => new Date().toISOString();

const inferFileName = (uri: string, index: number) => {
    const cleanUri = uri.split("?")[0];
    const rawName = cleanUri.split("/").pop() || `image_${Date.now()}_${index}.jpg`;
    return rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const uploadChatImageAsync = async (
    conversationId: string,
    uri: string,
    index: number
) => {
    if (/^https?:\/\//i.test(uri)) {
        return uri;
    }

    const fileName = `${conversationId}_${Date.now()}_${index}_${inferFileName(uri, index)}`;
    return imgbbService.uploadImage(uri, fileName);
};

export const firebaseChatService = {
    async getConversations(studentId: string) {
        const conversationsRef = ref(rtdb, "conversations");
        const snapshot = await get(conversationsRef);

        if (!snapshot.exists()) return [];

        const data = snapshot.val();

        return Object.entries(data)
            .map(([id, value]) => ({
                id,
                ...(value as any),
            }))
            .filter((item: any) =>
                Array.isArray(item.memberIds) && item.memberIds.includes(studentId)
            );
    },

    subscribeConversations(studentId: string, callback: (items: any[]) => void) {
        const conversationsRef = ref(rtdb, "conversations");

        const handler = onValue(conversationsRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            const data = snapshot.val();

            const items = Object.entries(data)
                .map(([id, value]) => ({
                    id,
                    ...(value as any),
                }))
                .filter((item: any) =>
                    Array.isArray(item.memberIds) && item.memberIds.includes(studentId)
                )
                .sort((a: any, b: any) => {
                    const aTime = new Date(a.timestamp || 0).getTime();
                    const bTime = new Date(b.timestamp || 0).getTime();
                    return bTime - aTime;
                });

            callback(items);
        });

        return () => off(conversationsRef, "value", handler);
    },

    async markConversationRead(conversationId: string, studentId: string) {
        const conversationRef = ref(rtdb, `conversations/${conversationId}`);

        await update(conversationRef, {
            [`unreadCounts/${studentId}`]: 0,
            updatedAt: now(),
        });
    },

    async markConversationUnread(conversationId: string, studentId: string) {
        const conversationRef = ref(rtdb, `conversations/${conversationId}`);

        await update(conversationRef, {
            [`unreadCounts/${studentId}`]: 1,
            updatedAt: now(),
        });
    },

    async removeConversation(conversationId: string) {
        const conversationRef = ref(rtdb, `conversations/${conversationId}`);
        await remove(conversationRef);
    },

    subscribeMessages(conversationId: string, callback: (items: any[]) => void, limitCount: number = 20) {
        const messagesRef = ref(rtdb, `conversations/${conversationId}/messages`);

        // 🚀 Chỉ lấy số lượng tin nhắn giới hạn để tránh đơ app
        const messagesQuery = query(messagesRef, limitToLast(limitCount));

        const handler = onValue(messagesQuery, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            const data = snapshot.val();

            const items = Object.entries(data)
                .map(([id, value]) => ({
                    id,
                    ...(value as any),
                }))
                .sort((a: any, b: any) => {
                    const aTime = new Date(a.timestamp || 0).getTime();
                    const bTime = new Date(b.timestamp || 0).getTime();
                    return aTime - bTime;
                });

            callback(items);
        });

        return () => off(messagesQuery, "value", handler);
    },

    async sendMessage(payload: {
        conversationId: string;
        senderId: string;
        receiverId: string;
        text?: string;
        images?: string[];
        messageType: MessageType;
        callType?: CallType;
        callId?: string;
        duration?: number;
    }) {
        const {
            conversationId,
            senderId,
            receiverId,
            text,
            images,
            messageType,
            callType,
            callId,
            duration,
        } = payload;

        const uploadedImages = Array.isArray(images)
            ? await Promise.all(
                images.map((uri, index) =>
                    uploadChatImageAsync(conversationId, uri, index)
                )
            )
            : [];

        const messagesRef = ref(rtdb, `conversations/${conversationId}/messages`);
        const newMessageRef = push(messagesRef);

        const messageData = {
            senderId,
            receiverId,
            text: text ?? "",
            images: uploadedImages,
            messageType,
            callType: callType ?? null,
            callId: callId ?? null,
            duration: duration ?? null,
            timestamp: now(),
            seen: false,
            seenBy: [senderId],
        };

        await set(newMessageRef, messageData);

        const conversationRef = ref(rtdb, `conversations/${conversationId}`);
        const conversationSnap = await get(conversationRef);
        const conversationData = conversationSnap.exists() ? conversationSnap.val() : {};

        let lastMessage = "Tin nhắn";

        if (messageType === "image") {
            lastMessage = text?.trim() || "Đã gửi ảnh";
        } else if (messageType === "call") {
            lastMessage =
                callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại";
        } else if (text?.trim()) {
            lastMessage = text.trim();
        }

        await update(conversationRef, {
            lastMessage,
            lastMessageType: messageType,
            lastMessageSenderId: senderId,
            timestamp: now(),
            [`unreadCounts/${receiverId}`]: 1,
            updatedAt: now(),
        });

        return {
            id: newMessageRef.key!,
            ...messageData,
        };
    },

    async updateCallDuration(
        conversationId: string,
        callId: string,
        duration: number
    ) {
        const messagesRef = ref(rtdb, `conversations/${conversationId}/messages`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) {
            return false;
        }

        const data = snapshot.val();
        const entry = Object.entries(data).find(([_, value]) => {
            const item = value as any;
            return item?.callId === callId;
        });

        if (!entry) {
            return false;
        }

        const [messageId] = entry;
        await update(
            ref(rtdb, `conversations/${conversationId}/messages/${messageId}`),
            {
                duration,
            }
        );

        return true;
    },

    async findConversationByMembers(memberIds: string[]) {
        const conversationsRef = ref(rtdb, "conversations");
        const snapshot = await get(conversationsRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.val();

        const foundEntry = Object.entries(data).find(([_, value]) => {
            const item = value as any;
            const ids = Array.isArray(item.memberIds) ? item.memberIds : [];

            return (
                ids.length === memberIds.length &&
                memberIds.every((id) => ids.includes(id))
            );
        });

        if (!foundEntry) return null;

        const [id, value] = foundEntry;
        return {
            id,
            ...(value as any),
        };
    },

    async createConversation(payload: {
        memberIds: string[];
        members: any[];
    }) {
        const conversationsRef = ref(rtdb, "conversations");
        const newConversationRef = push(conversationsRef);

        const conversationData = {
            memberIds: payload.memberIds,
            members: payload.members,
            lastMessage: "",
            lastMessageType: "text",
            lastMessageSenderId: "",
            unreadCounts: Object.fromEntries(
                payload.memberIds.map((id) => [id, 0])
            ),
            timestamp: now(),
            createdAt: now(),
            updatedAt: now(),
        };

        await set(newConversationRef, conversationData);

        return {
            id: newConversationRef.key!,
            ...conversationData,
        };
    },
};
