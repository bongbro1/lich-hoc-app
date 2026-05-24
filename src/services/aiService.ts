import { AIMessage } from "../types/ai.types";
import { getApiBaseUrl } from "../configs/config";

export const aiService = {
    /**
     * Gửi tin nhắn tới AI Backend và nhận phản hồi thực tế
     */
    async generateResponse(
        prompt: string,
        history: AIMessage[],
        context?: { subjectName?: string; scheduleContext?: string }
    ): Promise<string> {
        try {
            const formattedHistory = history
                .filter(msg => !msg.isThinking && msg.id !== '1') // Loại bỏ tin nhắn chào mừng và tin nhắn đang load
                .map(msg => ({
                    role: msg.isUser ? "user" : "assistant",
                    content: msg.text
                }));

            const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: prompt,
                    subjectName: context?.subjectName || "Không xác định",
                    scheduleContext: context?.scheduleContext || "Không có thông tin",
                    history: formattedHistory
                }),
            });
            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (e) {
                return "Lỗi phản hồi từ hệ thống (không phải JSON).";
            }

            if (response.ok && result.success) {
                return result.reply;
            }

            return result.error || "Trợ lý học tập hiện chưa sẵn sàng. Vui lòng thử lại sau.";
        } catch (error: any) {
            console.error("[AI SERVICE ERROR]", error);
            return "Trợ lý học tập hiện chưa sẵn sàng. Vui lòng thử lại sau.";
        }
    }
};
