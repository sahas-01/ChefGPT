
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, generateRecipes } from "@/lib/ai-logic";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
        }),
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body.message;

        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        let userInput = message.text;

        // Handle Voice Notes
        if (message.voice) {
            console.log("Processing Telegram Voice Note...");
            const fileId = message.voice.file_id;
            
            // 1. Get file path from Telegram
            const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            const filePath = fileData.result.file_path;

            // 2. Download the file
            const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
            const audioBlob = await downloadRes.blob();

            // 3. Transcribe
            const sttResult = await transcribeAudio(audioBlob);
            userInput = sttResult.transcript;
        }

        if (!userInput) {
            await sendTelegramMessage(chatId, "I didn't catch that. Can you type or send a voice note?");
            return NextResponse.json({ ok: true });
        }

        // Show "typing" indicator
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action: "typing" }),
        });

        // Generate and Send Response
        const response = await generateRecipes(userInput);
        await sendTelegramMessage(chatId, response);

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error("Telegram Webhook Error:", error);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
