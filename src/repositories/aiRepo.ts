import { ref, get, set, remove, query, orderByKey, limitToLast, endBefore, update } from 'firebase/database';
import { rtdb } from '../configs/firebase';
import { AIMessage } from '../types/ai.types';
import { aiService } from '../services/aiService';

export const aiRepo = {
    async saveMessages(studentId: string, messages: AIMessage[]): Promise<void> {
        try {
            const chatRef = ref(rtdb, `ai_assistant/${studentId}/messages`);
            const cleanMessages: Record<string, AIMessage> = {};

            messages.forEach(msg => {
                cleanMessages[msg.id] = JSON.parse(JSON.stringify(msg));
            });

            await update(chatRef, cleanMessages);
        } catch (e) {
            console.error('Error saving AI history to Firebase:', e);
        }
    },

    /**
     * Tải danh sách tin nhắn phân trang
     * @param limit Số lượng tin nhắn cần lấy
     * @param beforeId Lấy các tin nhắn trước ID này (phân trang ngược)
     */
    async loadMessagesPaged(studentId: string, limit: number, beforeId?: string): Promise<AIMessage[]> {
        try {
            const chatRef = ref(rtdb, `ai_assistant/${studentId}/messages`);
            let chatQuery;

            if (beforeId) {
                chatQuery = query(chatRef, orderByKey(), endBefore(beforeId), limitToLast(limit));
            } else {
                chatQuery = query(chatRef, orderByKey(), limitToLast(limit));
            }

            const snapshot = await get(chatQuery);
            if (snapshot.exists()) {
                const data = snapshot.val() as Record<string, AIMessage>;
                // Chuyển object về mảng và sắp xếp theo ID (thời gian)
                return Object.values(data).sort((a, b) => a.id.localeCompare(b.id));
            }
            return [];
        } catch (e) {
            console.error('Error loading AI history paged:', e);
            return [];
        }
    },

    /**
     * Xóa toàn bộ lịch sử chat AI của người dùng
     */
    async clearHistory(studentId: string): Promise<void> {
        try {
            const chatRef = ref(rtdb, `ai_assistant/${studentId}/messages`);
            await remove(chatRef);
        } catch (e) {
            console.error('Error clearing AI history from Firebase:', e);
        }
    },

    /**
     * Gửi tin nhắn tới AI thông qua Service và quản lý ngữ cảnh
     */
    async sendMessage(
        prompt: string,
        history: AIMessage[],
        context?: { subjectName?: string; scheduleContext?: string }
    ): Promise<string> {
        return aiService.generateResponse(prompt, history, context);
    }
};
