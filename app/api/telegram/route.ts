
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, chatWithHistory, textToSpeech } from "@/lib/ai-logic";
import { getHistory, addMessage, clearHistory } from "@/lib/conversation-store";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// In-memory store to track if a user has requested to skip audio
const skipAudioRequests = new Map<number, boolean>();

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
    });
}

async function editTelegramMessage(chatId: number, messageId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: "Markdown",
        }),
    });
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
}

async function sendTelegramVoice(chatId: number, audioBase64: string) {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("voice", blob, "chef_response.wav");
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVoice`, {
        method: "POST",
        body: formData,
    });
}

async function sendTyping(chatId: number) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle inline button presses (skip audio)
        if (body.callback_query) {
            const query = body.callback_query;
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;

            if (query.data === "skip_audio") {
                skipAudioRequests.set(chatId, true);
                await answerCallbackQuery(query.id, "🔇 Voice reply cancelled!");
                await editTelegramMessage(chatId, messageId, query.message.text + "\n\n_🔇 Voice reply skipped._");
            }
            return NextResponse.json({ ok: true });
        }

        const message = body.message;
        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        let userInput = message.text as string;
        let detectedLanguage = "en-IN";

        // Handle /start command
        if (userInput === "/start") {
            clearHistory(chatId);
            await sendTelegramMessage(chatId,
                "👨‍🍳 *Welcome to AI Chef!*\n\nTell me what ingredients you have and I'll suggest authentic Indian recipes.\n\nYou can:\n• Ask for recipes: _\"I have paneer, tomatoes and onions\"_\n• Get details: _\"Tell me more about the first recipe\"_\n• Ask follow-ups: _\"How do I make it spicier?\"_\n• Send a voice note!\n\nUse /clear to start a fresh conversation."
            );
            return NextResponse.json({ ok: true });
        }

        // Handle /clear command — reset conversation
        if (userInput === "/clear" || userInput === "/reset") {
            clearHistory(chatId);
            await sendTelegramMessage(chatId, "🧹 Conversation cleared! Start fresh — what ingredients do you have?");
            return NextResponse.json({ ok: true });
        }

        // Handle /skip command
        if (userInput === "/skip") {
            skipAudioRequests.set(chatId, true);
            await sendTelegramMessage(chatId, "🔇 Got it! I'll skip the voice reply for your next response.");
            return NextResponse.json({ ok: true });
        }

        // Handle Voice Notes — transcribe to text
        if (message.voice) {
            console.log("Processing Telegram Voice Note...");
            const fileId = message.voice.file_id;

            const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            const filePath = fileData.result.file_path;

            const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
            const audioBlob = await downloadRes.blob();

            const sttResult = await transcribeAudio(audioBlob);
            userInput = sttResult.transcript;
            if (sttResult.language_code) detectedLanguage = sttResult.language_code;
            console.log("Transcribed:", userInput, "| Language:", detectedLanguage);
        } else if (userInput) {
            // Detect language from typed text
            const hasDevanagari = /[\u0900-\u097F]/.test(userInput);
            detectedLanguage = hasDevanagari ? "hi-IN" : "en-IN";
        }

        if (!userInput?.trim()) {
            await sendTelegramMessage(chatId, "I didn't catch that. Can you type or send a voice note?");
            return NextResponse.json({ ok: true });
        }

        // Show typing indicator
        await sendTyping(chatId);

        // Load conversation history and add the new user message
        const history = getHistory(chatId);
        addMessage(chatId, "user", userInput);
        const updatedHistory = getHistory(chatId);

        // Generate response with full conversation context
        const replyText = await chatWithHistory(updatedHistory, detectedLanguage);

        // Save assistant reply to history
        addMessage(chatId, "assistant", replyText);

        // Reset skip flag before sending
        skipAudioRequests.delete(chatId);

        // Send text with Skip Voice button
        const skipButton = {
            inline_keyboard: [[
                { text: "🔇 Skip Voice Reply", callback_data: "skip_audio" }
            ]]
        };
        await sendTelegramMessage(chatId, replyText, skipButton);

        // Wait briefly to give user a chance to tap Skip
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (skipAudioRequests.get(chatId)) {
            skipAudioRequests.delete(chatId);
            return NextResponse.json({ ok: true });
        }

        // Send voice reply
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, action: "record_voice" }),
            });

            const audioBase64 = await textToSpeech(replyText, detectedLanguage);

            if (skipAudioRequests.get(chatId)) {
                skipAudioRequests.delete(chatId);
                return NextResponse.json({ ok: true });
            }

            await sendTelegramVoice(chatId, audioBase64);
        } catch (ttsErr) {
            console.error("TTS failed, skipping voice reply:", ttsErr);
        }

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error("Telegram Webhook Error:", error);
        return NextResponse.json({ ok: true });
    }
}
