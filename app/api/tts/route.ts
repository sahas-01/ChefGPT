
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, language = "hi-IN", speaker = "shubh" } = await req.json();

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: language,
        speaker: speaker,
        // pitch, pace, loudness not supported in v3
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v3", // Using v1 as per standard, or v3 if user insisted? User said "bulbul:v3"
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam TTS Error:", errorText);
        return NextResponse.json({ error: `Sarvam API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    // API returns { audios: ["base64string"] }
    const audioBase64 = data.audios[0];

    return NextResponse.json({ audio: audioBase64 });

  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
