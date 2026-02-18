import { NextRequest, NextResponse } from "next/server";
import { audioStore, cleanupAudioStore } from "@/lib/audio-store";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    cleanupAudioStore();
    const { id } = await params;
    const entry = audioStore.get(id);

    console.log(`Audio GET: id=${id}, found=${!!entry}, storeSize=${audioStore.size}`);

    if (!entry || entry.expiresAt < Date.now()) {
        return new NextResponse("Audio not found or expired", { status: 404 });
    }

    const audioBuffer = Buffer.from(entry.data, "base64");
    return new NextResponse(audioBuffer, {
        headers: {
            "Content-Type": "audio/wav",
            "Content-Length": String(audioBuffer.length),
            "Cache-Control": "no-store",
        },
    });
}
