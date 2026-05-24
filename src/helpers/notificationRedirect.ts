// notificationRedirect.ts
import * as RootNavigation from "../navigation/RootNavigation";
import storageService, { STORAGE_KEYS } from "../services/storageService";
import { UserModel } from "../models/user";
import { Friend_Near } from "../types/typesChat";
import { userRepo } from "repositories/userRepo";

export async function handleNotificationRedirect(data: any) {
    const { screen, senderId } = data;

    if (!screen) return;

    // 🔹 Chat notification
    if (screen === "ChatDetail" && senderId) {
        const { conversationId } = data;

        if (!conversationId) return;

        const currentUser: UserModel | null = await storageService.get({
            key: STORAGE_KEYS.USER,
        });
        if (!currentUser) return;

        const profile = await userRepo.getUserById(senderId);
        const user: Friend_Near | null = profile
            ? {
                studentId: profile.studentId,
                name: profile.name,
                avatar: profile.avatar ?? '',
                className: profile.className ?? '',
                distance: '',
                online: profile.online,
                onlineStatus: profile.onlineStatus,
            }
            : null;
        if (!user) return;
        RootNavigation.navigate("Chats", {
            screen: "ChatDetailScreen",
            params: {
                user,
                currentUser,
                conversationId: String(conversationId),
                __from: "notification",
            },
        });
    }

    // 🔔 CALL (NEW)
    if (data.screen === "IncomingCall") {
        const { callId, callerId, conversationId } = data;
        if (!callId || !callerId) return;

        RootNavigation.navigate("Call", {
            screen: "IncomingCall",
            params: {
                callId,
                callerId,
                conversationId: conversationId ? String(conversationId) : null,
                callType: data.callType || 'audio',
                __from: "notification",
            },
        });
    }

    // 🔔 NOTIFICATION
    if (screen === "Notifications") {
        RootNavigation.navigate("Notifications");
        return;
    }

    // 🔹 Sau này thêm:
    // if (screen === "Profile") { ... }
    // if (screen === "PostDetail") { ... }
}
