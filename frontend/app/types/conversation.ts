import type { ChatMessage } from "./chat";

export type Conversation = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
};

