// MainApp.tsx
import { useEffect } from "react";
import { useUser } from "./src/contexts/UserContext";
import * as RootNavigation from './src/navigation/RootNavigation';
import MainTabs from "./src/navigation/MainTabs";
import { listenIncomingCall } from "./src/services/callService";
import { NotificationService } from "./src/services/notificationService";
export default function MainApp() {
    const { user: currentUser } = useUser();

    useEffect(() => {
        if (!currentUser) return;

        // console.log("👂 Incoming call listener ACTIVE for", currentUser.studentId);

        const unsubCall = listenIncomingCall(
            currentUser.studentId,
            (call) => {
                // 🚀 Chỉ điều hướng nếu đang KHÔNG ở màn hình cuộc gọi
                const currentRoute = RootNavigation.getCurrentRoute();
                if (currentRoute?.name === "IncomingCall" || currentRoute?.name === "OutgoingCall" || currentRoute?.name === "InCall") {
                    return;
                }

                RootNavigation.navigate("Call", {
                    screen: "IncomingCall",
                    params: {
                        callId: call.callId,
                        callerId: call.callerId,
                        calleeId: call.calleeId,
                        conversationId: call.conversationId,
                        callType: call.callType || 'audio',
                        __from: "notification",
                    },
                });
            }
        );

        const unsubNotif = NotificationService.listenToNewNotifications(
            currentUser.studentId
        );

        return () => {
            unsubCall();
            unsubNotif();
        };
    }, [currentUser]);

    return <MainTabs />;
}
