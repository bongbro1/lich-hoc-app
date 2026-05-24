import uuid from 'react-native-uuid';
import { createCall } from '../services/callService';
import { conversationRepo } from '../repositories/conversationRepo';
import { messageRepo } from '../repositories/messageRepo';
import * as RootNavigation from '../navigation/RootNavigation';
import { ChatParticipant } from '../types/chat.types';
import { UserModel } from '../models/user';

import { NotificationService } from '../services/notificationService';

type StartCallParams = {
    currentUser: UserModel | ChatParticipant;
    partnerUser: ChatParticipant;
    callType: 'audio' | 'video';
    conversationId?: string | null;
    returnScreen?: string;
    returnParams?: any;
};

export const useCallAction = () => {
    const startCall = async ({
        currentUser,
        partnerUser,
        callType,
        conversationId,
        returnScreen,
        returnParams,
    }: StartCallParams) => {
        if (!currentUser?.studentId || !partnerUser?.studentId) return;

        const callId = uuid.v4() as string;

        let finalConversationId = conversationId;

        if (!finalConversationId) {
            finalConversationId = await conversationRepo.findOrCreateConversation({
                currentUser: {
                    studentId: currentUser.studentId,
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                },
                partnerUser,
            });
        }

        await createCall(
            callId,
            currentUser.studentId,
            partnerUser.studentId,
            finalConversationId || '',
            callType
        );

        await messageRepo.sendMessage({
            conversationId: finalConversationId,
            senderId: currentUser.studentId,
            receiverId: partnerUser.studentId,
            text: '',
            messageType: 'call',
            callType,
            callId,
        });

        // 🔔 Bắn Push Notification cho cuộc gọi
        NotificationService.sendPushToBackend({
            receiverId: partnerUser.studentId,
            title: `Cuộc gọi ${callType === 'video' ? 'video' : 'audio'} đến`,
            body: `${currentUser.name} đang gọi cho bạn...`,
            type: 'call',
            data: {
                screen: 'IncomingCall',
                callId,
                callerId: currentUser.studentId,
                calleeId: partnerUser.studentId,
                conversationId: finalConversationId,
                callType,
                type: 'call'
            }
        }).catch(err => console.log("Call push failed:", err));

        RootNavigation.navigate('Call', {
            screen: 'OutgoingCall',
            params: {
                callId,
                partnerUser,
                callType,
                conversationId: finalConversationId,
                returnTo: returnScreen
                    ? { name: returnScreen, params: returnParams }
                    : {
                        name: 'ChatDetailScreen',
                        params: {
                            user: partnerUser,
                            currentUser,
                        },
                    },
            },
        });
    };

    return { startCall };
};
