import { CallType, Message, MessageType } from "types/chat.types";
import { firebaseChatService } from "../services/firebaseChatService";

const toIsoString = (value: any) => {
    if (!value) return "";
    if (typeof value?.toDate === "function") {
        return value.toDate().toISOString();
    }
    return String(value);
};

const mapMessage = (raw: any, conversationId: string): Message => {
    return {
        id: String(raw.id),
        conversationId,
        senderId: raw?.senderId ?? "",
        receiverId: raw?.receiverId ?? "",
        text: raw?.text ?? "",
        images: Array.isArray(raw?.images) ? raw.images : [],
        timestamp: toIsoString(raw?.timestamp),
        pending: false,
        messageType: (raw?.messageType ?? "text") as MessageType,
        callType: raw?.callType,
        callId: raw?.callId,
        duration: raw?.duration,
        seen: raw?.seen,
        seenBy: Array.isArray(raw?.seenBy) ? raw.seenBy : [],
    };
};

export const messageRepo = {
    subscribeMessages(
        conversationId: string,
        callback: (items: Message[]) => void,
        limit?: number
    ) {
        return firebaseChatService.subscribeMessages(conversationId, (rawItems) => {
            const mapped = rawItems.map((item: any) =>
                mapMessage(item, conversationId)
            );
            callback(mapped);
        }, limit);
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
    }): Promise<Message> {
        const saved = await firebaseChatService.sendMessage(payload);
        return mapMessage(saved, payload.conversationId);
    },
};