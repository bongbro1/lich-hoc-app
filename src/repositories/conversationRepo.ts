
import { ChatParticipant, Conversation } from "types/chat.types";
import { firebaseChatService } from "../services/firebaseChatService";
import { Friend_Near } from "types/typesChat";

const sortConversations = (items: Conversation[]) => {
    return [...items].sort((a, b) => {
        const aTime = new Date(a.timestamp || 0).getTime();
        const bTime = new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
    });
};

const toIsoString = (value: any) => {
    if (!value) return "";
    if (typeof value?.toDate === "function") {
        return value.toDate().toISOString();
    }
    return String(value);
};
const mapConversation = (
    raw: any,
    currentStudentId: string
): Conversation => {
    const unread = Number(raw?.unreadCounts?.[currentStudentId] ?? 0);

    const members: ChatParticipant[] = Array.isArray(raw?.members)
        ? raw.members.map((m: any) => ({
            studentId: m.studentId ?? "",
            name: m.name ?? "",
            avatar: m.avatar ?? null,
            className: m.className,
            distance: m.distance,
            online: false,
        }))
        : [];

    const user =
        members.find((m) => m.studentId !== currentStudentId) ??
        members[0] ?? {
            studentId: "",
            name: "",
            avatar: null,
            className: undefined,
            distance: undefined,
            online: false,
        };

    return {
        id: String(raw.id),
        memberIds: Array.isArray(raw?.memberIds) ? raw.memberIds : [],
        members,
        user,
        lastMessage: raw?.lastMessage ?? "",
        lastMessageType: raw?.lastMessageType,
        lastMessageSenderId: raw?.lastMessageSenderId ?? "",
        timestamp: toIsoString(raw?.timestamp),
        unreadCount: unread,
        hasUnread: unread > 0,
    };
};

export const conversationRepo = {
    async getConversations(studentId: string): Promise<Conversation[]> {
        const raw = await firebaseChatService.getConversations(studentId);
        return sortConversations(raw.map((item) => mapConversation(item, studentId)));
    },

    subscribeConversations(
        studentId: string,
        callback: (items: Conversation[]) => void
    ) {
        return firebaseChatService.subscribeConversations(studentId, (rawItems) => {
            const mapped = rawItems.map((item) => mapConversation(item, studentId));
            callback(sortConversations(mapped));
        });
    },

    async markConversationSeen(conversationId: string, studentId: string) {
        await firebaseChatService.markConversationRead(conversationId, studentId);
    },

    async markConversationAsUnread(conversationId: string, studentId: string) {
        await firebaseChatService.markConversationUnread(conversationId, studentId);
    },

    async removeConversation(conversationId: string) {
        await firebaseChatService.removeConversation(conversationId);
        return true;
    },

    async findConversation(memberIds: string[]): Promise<string | null> {
        const existing = await firebaseChatService.findConversationByMembers(memberIds);
        return existing?.id ? String(existing.id) : null;
    },

    async findOrCreateConversation(params: {
        currentUser: ChatParticipant;
        partnerUser: ChatParticipant;
    }): Promise<string> {
        const { currentUser, partnerUser } = params;

        const foundId = await this.findConversation([
            currentUser.studentId,
            partnerUser.studentId,
        ]);

        if (foundId) {
            return foundId;
        }

        const created = await firebaseChatService.createConversation({
            memberIds: [currentUser.studentId, partnerUser.studentId],
            members: [currentUser, partnerUser],
        });

        return String(created.id);
    },
};