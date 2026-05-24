import { useState, useEffect, useCallback } from 'react';
import { AIMessage } from '../types/ai.types';
import { aiRepo } from '../repositories/aiRepo';
import { useUser } from '../contexts/UserContext';
import { fileUploadService } from '../services/fileUploadService';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { DaySchedule } from '../models/schedule';

export const useAIAssistantVM = () => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ name: string, uri: string, size?: number } | null>(null);

    const { user } = useUser();

    // Tải lịch sử chat khi khởi tạo hoặc khi user thay đổi
    useEffect(() => {
        if (!user?.studentId) return;

        const init = async () => {
            const history = await aiRepo.loadMessagesPaged(user.studentId, 15);
            if (history.length > 0) {
                // Inverted list: Tin mới nhất ở đầu mảng (index 0)
                setMessages([...history].reverse());
                if (history.length < 15) setHasMore(false);
            } else {
                setHasMore(false);
                // Tin nhắn chào mừng mặc định nếu chưa có lịch sử
                setMessages([
                    {
                        id: '1',
                        text: 'Chào bạn! Mình là trợ lý học tập AI. Hôm nay mình có thể giúp gì cho việc học của bạn?',
                        isUser: false,
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
        };
        init();
    }, [user?.studentId]);

    const loadMore = useCallback(async () => {
        if (isFetchingMore || !hasMore || !user?.studentId || messages.length === 0) return;

        setIsFetchingMore(true);
        try {
            // Lấy tin nhắn cũ nhất hiện tại (ở cuối mảng khi dùng inverted)
            const firstMessage = messages[messages.length - 1];
            if (!firstMessage || firstMessage.id === '1') {
                setHasMore(false);
                return;
            }
            const olderMessages = await aiRepo.loadMessagesPaged(user.studentId, 15, firstMessage.id);

            if (olderMessages.length < 15) {
                setHasMore(false);
            }

            if (olderMessages.length > 0) {
                setMessages(prev => {
                    const newMsgs = olderMessages.filter(om => !prev.some(pm => pm.id === om.id));
                    return [...prev, ...[...newMsgs].reverse()];
                });
            }
        } catch (error) {
            console.error('Error in loadMore:', error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, hasMore, user?.studentId, messages]);

    // Lưu lịch sử mỗi khi có tin nhắn mới
    useEffect(() => {
        if (user?.studentId && messages.length > 0) {
            // Chỉ lưu những tin nhắn đã có URL thật (không phải đường dẫn local file://)
            const isLocal = (uri?: string) => uri?.startsWith('file://') || uri?.startsWith('content://');
            const hasLocal = (msg: AIMessage) => isLocal(msg.image) || isLocal(msg.file?.uri);

            if (!messages.some(hasLocal)) {
                aiRepo.saveMessages(user.studentId, messages);
            }
        }
    }, [messages, user?.studentId]);

    const handleSendMessage = useCallback(async (text?: string) => {
        const messageText = text?.trim() || inputText.trim();
        if (!messageText && !selectedImage && !selectedFile) return;

        const tempId = Date.now().toString();
        const userMsg: AIMessage = {
            id: tempId,
            text: messageText,
            isUser: true,
            timestamp: new Date().toISOString(),
            image: selectedImage || undefined,
            file: selectedFile || undefined,
        };

        setMessages(prev => [userMsg, ...prev]);
        const currentSelectedImage = selectedImage;
        const currentSelectedFile = selectedFile;

        setInputText('');
        setSelectedImage(null);
        setSelectedFile(null);
        setIsLoading(true);

        // 2. Thêm tin nhắn "đang chờ" từ AI
        const thinkingId = (Date.now() + 1).toString();
        const thinkingMsg: AIMessage = {
            id: thinkingId,
            text: '',
            isUser: false,
            timestamp: new Date().toISOString(),
            isThinking: true,
        };
        setMessages(prev => [thinkingMsg, ...prev]);

        try {
            // 3. Upload tệp tin lên server
            let remoteImageUrl = currentSelectedImage;
            let remoteFileUrl = currentSelectedFile?.uri;

            if (currentSelectedImage) {
                remoteImageUrl = await fileUploadService.uploadImage(currentSelectedImage);
            }
            if (currentSelectedFile) {
                remoteFileUrl = await fileUploadService.uploadFile(currentSelectedFile.uri, currentSelectedFile.name);
            }

            // Cập nhật lại tin nhắn người dùng với URL thật
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? {
                        ...msg,
                        image: remoteImageUrl || undefined,
                        file: msg.file ? { ...msg.file, uri: remoteFileUrl! } : undefined
                    }
                    : msg
            ));

            // 4. Lấy ngữ cảnh lịch học từ storage
            const cachedSchedule = await storageService.get({ key: STORAGE_KEYS.THREE_DAYS_SCHEDULES });
            let scheduleContext = "Không có thông tin lịch học 3 ngày tới.";

            if (cachedSchedule) {
                try {
                    const schedules: DaySchedule[] = typeof cachedSchedule === 'string' ? JSON.parse(cachedSchedule) : cachedSchedule;
                    scheduleContext = schedules.map(day => {
                        const dateStr = new Date(day.date).toLocaleDateString('vi-VN');
                        const lessonsStr = day.lessons.map(l =>
                            `- ${l.title} (${l.startPeriod}-${l.endPeriod}): ${l.location || 'N/A'}${l.isExam ? ' [LỊCH THI]' : ''}`
                        ).join('\n');
                        return `Ngày ${dateStr}:\n${lessonsStr}`;
                    }).join('\n\n');
                } catch (e) {
                    console.error("Error parsing schedule for AI context", e);
                }
            }

            // 5. Gọi AI thông qua Repository với đầy đủ ngữ cảnh
            const responseText = await aiRepo.sendMessage(messageText, messages, {
                scheduleContext,
                subjectName: "Tự động phát hiện qua lịch học"
            });

            // 4. Cập nhật tin nhắn AI thực tế
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === thinkingId
                        ? { ...msg, text: responseText, isThinking: false }
                        : msg
                )
            );
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === thinkingId
                        ? { ...msg, text: 'Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.', isThinking: false }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [inputText, selectedImage, selectedFile, messages]);

    const clearChat = useCallback(async () => {
        if (user?.studentId) {
            await aiRepo.clearHistory(user.studentId);
        }
        setMessages([
            {
                id: '1',
                text: 'Chào bạn! Mình là trợ lý học tập AI. Hôm nay mình có thể giúp gì cho việc học của bạn?',
                isUser: false,
                timestamp: new Date().toISOString(),
            },
        ]);
    }, [user?.studentId]);

    return {
        messages,
        inputText,
        setInputText,
        isLoading,
        isFetchingMore,
        loadMore,
        hasMore,
        handleSendMessage,
        clearChat,
        selectedImage,
        setSelectedImage,
        selectedFile,
        setSelectedFile,
    };
};
