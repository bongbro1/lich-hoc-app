export interface AIMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date | string;
    image?: string;
    file?: {
        name: string;
        uri: string;
        size?: number;
    };
    isThinking?: boolean;
}

export interface AIChatSession {
    messages: AIMessage[];
    updatedAt: string;
}
