import { useCallback, useEffect, useRef, useState } from "react";
import { conversationRepo } from "repositories/conversationRepo";
import { messageRepo } from "repositories/messageRepo";
import { CallType, ChatParticipant, Message, MessageType } from "types/chat.types";
import { NotificationService } from "../services/notificationService";

type UseChatDetailVMParams = {
    conversationId?: string;
    currentUserId?: string;
    currentUserInfo?: ChatParticipant;
    partnerUser: ChatParticipant;
    initialSelectedImages?: string[];
    onConversationCreated?: (conversationId: string) => void;
};

type SendMessageParams = {
    text?: string;
    images?: string[];
    messageType?: MessageType;
    callType?: CallType;
    callId?: string;
    duration?: number;
};

export const useChatDetailVM = ({
    conversationId,
    currentUserId,
    currentUserInfo,
    partnerUser,
    initialSelectedImages = [],
    onConversationCreated,
}: UseChatDetailVMParams) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [limit, setLimit] = useState(15); // Tải 15 tin ban đầu cho nhanh
    const [hasMore, setHasMore] = useState(true);
    const [text, setText] = useState("");
    const [selectedImages, setSelectedImages] =
        useState<string[]>(initialSelectedImages);
    const [loading, setLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
    const didSearchRef = useRef(false);

    useEffect(() => {
        if (conversationId && conversationId !== currentConversationId) {
            console.log("DEBUG [useChatDetailVM]: Prop conversationId changed:", conversationId);
            setCurrentConversationId(conversationId);
        }
    }, [conversationId]);

    // Tìm conversation hiện có nếu chưa có ID
    useEffect(() => {
        if (currentConversationId || didSearchRef.current) return;
        if (!currentUserId || !partnerUser?.studentId || !currentUserInfo) return;

        didSearchRef.current = true;
        const findExisting = async () => {
            try {
                console.log("DEBUG [useChatDetailVM]: Searching existing chat with:", partnerUser.studentId);
                const foundId = await conversationRepo.findConversation([
                    currentUserId,
                    partnerUser.studentId
                ]);

                if (foundId) {
                    console.log("DEBUG [useChatDetailVM]: Found existing conversation:", foundId);
                    setCurrentConversationId(foundId);
                    if (onConversationCreated) {
                        onConversationCreated(foundId);
                    }
                } else {
                    console.log("DEBUG [useChatDetailVM]: No existing conversation found.");
                }
            } catch (err) {
                console.log("Error finding existing conversation:", err);
            }
        };

        void findExisting();
    }, [currentConversationId, currentUserId, partnerUser?.studentId, currentUserInfo, onConversationCreated]);

    useEffect(() => {
        setSelectedImages(initialSelectedImages);
    }, [initialSelectedImages]);

    useEffect(() => {
        if (!currentConversationId) return;

        setLoading(true);

        const unsubscribe = messageRepo.subscribeMessages(
            currentConversationId,
            (items) => {
                setMessages(items);
                setLoading(false);
                // Nếu số lượng tin nhắn lấy về ít hơn limit thì có nghĩa là đã hết tin nhắn để load
                if (items.length < limit) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            },
            limit
        );

        return unsubscribe;
    }, [currentConversationId, limit]);

    const loadMoreMessages = useCallback(() => {
        if (!loading && hasMore) {
            setLimit((prev) => prev + 15);
        }
    }, [loading, hasMore]);

    const markConversationSeen = useCallback(async () => {
        if (!currentConversationId || !currentUserId) return;

        try {
            await conversationRepo.markConversationSeen(
                currentConversationId,
                currentUserId
            );
        } catch (err) {
            console.log("markConversationSeen error:", err);
        }
    }, [currentConversationId, currentUserId]);

    const sendMessage = useCallback(async (params?: SendMessageParams) => {
        if (!currentUserId || !partnerUser?.studentId || !currentUserInfo) {
            return;
        }

        const {
            text: inputText,
            images: inputImages,
            messageType,
            callType,
            callId,
            duration,
        } = params || {};

        const finalText = inputText ?? text;
        const finalImages = inputImages ?? selectedImages;

        const finalMessageType: MessageType =
            messageType ??
            (finalImages.length > 0 ? "image" : "text");

        if (!finalText?.trim() && finalImages.length === 0 && finalMessageType !== "call") {
            return;
        }

        let finalConversationId = currentConversationId;

        try {
            if (!finalConversationId) {
                finalConversationId =
                    await conversationRepo.findOrCreateConversation({
                        currentUser: currentUserInfo,
                        partnerUser: partnerUser,
                    });

                if (onConversationCreated) {
                    onConversationCreated(finalConversationId);
                }
                setCurrentConversationId(finalConversationId);
            }
        } catch (err) {
            console.error("create conversation error:", err);
            return;
        }

        const tempId = `temp-${Date.now()}`;

        const tempMessage: Message = {
            id: tempId,
            conversationId: finalConversationId!,
            senderId: currentUserId,
            receiverId: partnerUser.studentId,
            text: finalText?.trim() ?? "",
            images: finalImages,
            timestamp: new Date().toISOString(),
            messageType: finalMessageType,
            callType,
            callId,
            duration,
            pending: true,
            seen: false,
            seenBy: [currentUserId],
        };

        setMessages((prev) => [...prev, tempMessage]);

        if (!params) {
            setText("");
            setSelectedImages([]);
        }

        try {
            const saved = await messageRepo.sendMessage({
                conversationId: finalConversationId!,
                senderId: currentUserId,
                receiverId: partnerUser.studentId,
                text: tempMessage.text,
                images: tempMessage.images,
                messageType: tempMessage.messageType,
                callType,
                callId,
                duration,
            });

            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? saved : msg))
            );

            // 🔔 Gửi Push Notification cho người nhận
            NotificationService.sendPushToBackend({
                receiverId: partnerUser.studentId,
                title: currentUserInfo.name, // Tên người gửi
                body: finalMessageType === 'text' ? finalText : (finalMessageType === 'image' ? 'Đã gửi một hình ảnh' : 'Cuộc gọi mới'),
                type: 'chat',
                data: {
                    screen: 'ChatDetail',
                    senderId: currentUserId,
                    conversationId: finalConversationId,
                    type: 'chat'
                }
            }).catch(err => console.log("Chat push failed:", err));

        } catch (err) {
            console.error("sendMessage error:", err);

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId ? { ...msg, pending: false } : msg
                )
            );
        }
    }, [
        conversationId,
        currentUserId,
        currentUserInfo,
        partnerUser,
        selectedImages,
        text,
        onConversationCreated,
    ]);

    return {
        messages,
        text,
        setText,
        selectedImages,
        setSelectedImages,
        loading,
        hasMore,
        loadMoreMessages,
        sendMessage,
        markConversationSeen,
    };
};
