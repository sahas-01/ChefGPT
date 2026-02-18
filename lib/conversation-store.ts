// Shared conversation memory for Telegram (and optionally WhatsApp)
// Uses a global singleton so all routes share the same Map instance.

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

declare global {
    // eslint-disable-next-line no-var
    var __conversationStore: Map<number, { messages: ChatMessage[]; lastActive: number }> | undefined;
}

if (!global.__conversationStore) {
    global.__conversationStore = new Map();
}

export const conversationStore = global.__conversationStore;

// Keep last N messages per user to avoid token bloat
const MAX_MESSAGES = 20;
// Clear conversations inactive for more than 2 hours
const TTL_MS = 2 * 60 * 60 * 1000;

export function getHistory(chatId: number): ChatMessage[] {
    const entry = conversationStore.get(chatId);
    if (!entry) return [];
    // Expire stale conversations
    if (Date.now() - entry.lastActive > TTL_MS) {
        conversationStore.delete(chatId);
        return [];
    }
    return entry.messages;
}

export function addMessage(chatId: number, role: "user" | "assistant", content: string) {
    const existing = conversationStore.get(chatId);
    const messages = existing ? existing.messages : [];
    messages.push({ role, content });

    // Trim to last MAX_MESSAGES to keep context window manageable
    if (messages.length > MAX_MESSAGES) {
        messages.splice(0, messages.length - MAX_MESSAGES);
    }

    conversationStore.set(chatId, { messages, lastActive: Date.now() });
}

export function clearHistory(chatId: number) {
    conversationStore.delete(chatId);
}
